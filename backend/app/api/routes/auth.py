import hashlib
import secrets
from datetime import datetime, timedelta

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import (
    clear_auth_cookie,
    create_access_token,
    get_current_user,
    hash_password,
    set_auth_cookie,
    verify_password,
)
from app.db.session import get_db
from app.models.orm import PasswordResetCode, User
from app.models.schemas import (
    MessageResponse,
    ResetConfirm,
    ResetRequest,
    ResetVerify,
    UserCreate,
    UserLogin,
    UserResponse,
)
from app.services.email_service import EmailSendError, send_reset_code_email
from app.services.oauth_service import (
    OAuthError,
    build_github_auth_url,
    build_google_auth_url,
    fetch_github_profile,
    fetch_google_profile,
)

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()

OAUTH_STATE_COOKIE = "mockmate_oauth_state"

# Generic response for /reset/request regardless of whether the email is on
# file -- never reveal which emails have MockMate accounts.
RESET_REQUEST_ACK = MessageResponse(
    message="If an account exists for that email, a reset code is on its way."
)


def _hash_code(code: str) -> str:
    return hashlib.sha256(code.encode("utf-8")).hexdigest()


def _generate_code() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _latest_valid_code(db: Session, user: User) -> PasswordResetCode | None:
    """The user's most recent, unused, unexpired reset code, if any."""
    return (
        db.query(PasswordResetCode)
        .filter(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.used_at.is_(None),
            PasswordResetCode.expires_at > datetime.utcnow(),
        )
        .order_by(PasswordResetCode.created_at.desc())
        .first()
    )


# ---------- Email + password ----------


@router.post("/signup", response_model=UserResponse)
def signup(payload: UserCreate, response: Response, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    existing = db.query(User).filter(User.email == email).first()
    if existing is not None:
        raise HTTPException(status_code=409, detail="An account with that email already exists.")

    user = User(
        email=email,
        full_name=payload.full_name.strip(),
        password_hash=hash_password(payload.password),
        auth_provider="local",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    set_auth_cookie(response, create_access_token(user.id))
    return user


@router.post("/login", response_model=UserResponse)
def login(payload: UserLogin, response: Response, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    invalid = HTTPException(status_code=401, detail="Incorrect email or password.")
    if user is None:
        raise invalid
    if user.password_hash is None:
        raise HTTPException(
            status_code=400,
            detail=f"This account signs in with {user.auth_provider.title()}. Use that button instead.",
        )
    if not verify_password(payload.password, user.password_hash):
        raise invalid

    set_auth_cookie(response, create_access_token(user.id))
    return user


@router.post("/logout", response_model=MessageResponse)
def logout(response: Response):
    clear_auth_cookie(response)
    return MessageResponse(message="Logged out.")


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ---------- Password reset (6-digit code) ----------


@router.post("/reset/request", response_model=MessageResponse)
def request_reset(payload: ResetRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    # Don't reveal whether the account exists -- but only actually send an
    # email, and only invalidate old codes, when it does.
    if user is not None and user.password_hash is not None:
        code = _generate_code()
        db.query(PasswordResetCode).filter(
            PasswordResetCode.user_id == user.id,
            PasswordResetCode.used_at.is_(None),
        ).update({"used_at": datetime.utcnow()})

        reset_code = PasswordResetCode(
            user_id=user.id,
            code_hash=_hash_code(code),
            expires_at=datetime.utcnow() + timedelta(minutes=settings.reset_code_expire_minutes),
        )
        db.add(reset_code)
        db.commit()

        try:
            send_reset_code_email(user.email, code, settings.reset_code_expire_minutes)
        except EmailSendError as exc:
            raise HTTPException(status_code=502, detail=str(exc)) from exc

    return RESET_REQUEST_ACK


@router.post("/reset/verify", response_model=MessageResponse)
def verify_reset(payload: ResetVerify, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired code.")

    reset_code = _latest_valid_code(db, user)
    if reset_code is None or reset_code.code_hash != _hash_code(payload.code):
        raise HTTPException(status_code=400, detail="Invalid or expired code.")

    return MessageResponse(message="Code verified.")


@router.post("/reset/confirm", response_model=MessageResponse)
def confirm_reset(payload: ResetConfirm, db: Session = Depends(get_db)):
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=400, detail="Invalid or expired code.")

    reset_code = _latest_valid_code(db, user)
    if reset_code is None or reset_code.code_hash != _hash_code(payload.code):
        raise HTTPException(status_code=400, detail="Invalid or expired code.")

    user.password_hash = hash_password(payload.new_password)
    reset_code.used_at = datetime.utcnow()
    db.commit()

    return MessageResponse(message="Password has been reset.")


# ---------- Google OAuth ----------


def _find_or_create_oauth_user(db: Session, provider: str, profile: dict) -> User:
    id_column = User.google_id if provider == "google" else User.github_id
    user = db.query(User).filter(id_column == profile["provider_id"]).first()
    if user is not None:
        return user

    # Same email already registered a different way (e.g. signed up with a
    # password first) -- link this provider to that existing account instead
    # of creating a duplicate.
    user = db.query(User).filter(User.email == profile["email"]).first()
    if user is not None:
        setattr(user, f"{provider}_id", profile["provider_id"])
        db.commit()
        db.refresh(user)
        return user

    user = User(
        email=profile["email"],
        full_name=profile["name"],
        auth_provider=provider,
        is_email_verified=True,
        **{f"{provider}_id": profile["provider_id"]},
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/google/login")
def google_login(response: Response):
    state = secrets.token_urlsafe(24)
    redirect = RedirectResponse(url=build_google_auth_url(state))
    # SameSite=None is required so this cookie survives the redirect back
    # from Google/GitHub in production, where the frontend and backend are
    # on different domains. Secure=True is required whenever SameSite=None
    # is used, which is already the case outside local development.
    cross_site = settings.environment != "development"
    redirect.set_cookie(
        key=OAUTH_STATE_COOKIE,
        value=state,
        httponly=True,
        secure=cross_site,
        samesite="none" if cross_site else "lax",
        max_age=600,
        path="/",
    )
    return redirect


@router.get("/google/callback")
def google_callback(
    code: str | None = None,
    state: str | None = None,
    mockmate_oauth_state: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    return _oauth_callback(
        provider="google",
        code=code,
        state=state,
        expected_state=mockmate_oauth_state,
        fetch_profile=fetch_google_profile,
        db=db,
    )


@router.get("/github/login")
def github_login(response: Response):
    state = secrets.token_urlsafe(24)
    redirect = RedirectResponse(url=build_github_auth_url(state))
    # SameSite=None is required so this cookie survives the redirect back
    # from Google/GitHub in production, where the frontend and backend are
    # on different domains. Secure=True is required whenever SameSite=None
    # is used, which is already the case outside local development.
    cross_site = settings.environment != "development"
    redirect.set_cookie(
        key=OAUTH_STATE_COOKIE,
        value=state,
        httponly=True,
        secure=cross_site,
        samesite="none" if cross_site else "lax",
        max_age=600,
        path="/",
    )
    return redirect


@router.get("/github/callback")
def github_callback(
    code: str | None = None,
    state: str | None = None,
    mockmate_oauth_state: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
):
    return _oauth_callback(
        provider="github",
        code=code,
        state=state,
        expected_state=mockmate_oauth_state,
        fetch_profile=fetch_github_profile,
        db=db,
    )


def _oauth_callback(*, provider, code, state, expected_state, fetch_profile, db: Session):
    failure_redirect = RedirectResponse(
        url=f"{settings.frontend_url}/login?error={provider}_failed",
        status_code=status.HTTP_302_FOUND,
    )

    if not code or not state or not expected_state or state != expected_state:
        return failure_redirect

    try:
        profile = fetch_profile(code)
    except OAuthError:
        return failure_redirect

    user = _find_or_create_oauth_user(db, provider, profile)

    redirect = RedirectResponse(url=f"{settings.frontend_url}/dashboard", status_code=status.HTTP_302_FOUND)
    set_auth_cookie(redirect, create_access_token(user.id))
    redirect.delete_cookie(key=OAUTH_STATE_COOKIE, path="/")
    return redirect
