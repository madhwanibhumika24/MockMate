"""Password hashing, JWT session tokens, and the auth cookie the frontend
picks up automatically on every request (no manual header wiring needed).

Kept dependency-light on purpose: bcrypt directly (no passlib, which has had
version-compat headaches with newer bcrypt releases) and PyJWT (pure Python,
no native build step -- this project already hit a native-module wall once
with tiktoken on Windows, see requirements.txt).
"""

from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Cookie, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.orm import User

settings = get_settings()

ACCESS_TOKEN_COOKIE_NAME = "mockmate_access_token"
JWT_ALGORITHM = "HS256"


# ---------- Passwords ----------


def hash_password(plain_password: str) -> str:
    return bcrypt.hashpw(plain_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, password_hash: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        # Malformed/empty hash (e.g. an OAuth-only account) -- never a match.
        return False


# ---------- JWT session tokens ----------


def create_access_token(user_id: int) -> str:
    if not settings.jwt_secret_key:
        raise RuntimeError(
            "JWT_SECRET_KEY is not set. Generate one with "
            "`python -c \"import secrets; print(secrets.token_urlsafe(64))\"` and put it in backend/.env."
        )
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    payload = {"sub": str(user_id), "exp": expires_at}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> int:
    """Returns the user id encoded in the token, or raises jwt.PyJWTError."""
    payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[JWT_ALGORITHM])
    return int(payload["sub"])


def set_auth_cookie(response, token: str) -> None:
    # SameSite=None is required for the cookie to be sent on cross-site
    # requests (e.g. Vercel frontend -> Railway backend in production).
    # Browsers require Secure=True whenever SameSite=None is used, which is
    # already the case outside of local development.
    cross_site = settings.environment != "development"
    response.set_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=cross_site,
        samesite="none" if cross_site else "lax",
        max_age=settings.jwt_access_token_expire_minutes * 60,
        path="/",
    )


def clear_auth_cookie(response) -> None:
    cross_site = settings.environment != "development"
    response.delete_cookie(
        key=ACCESS_TOKEN_COOKIE_NAME,
        path="/",
        secure=cross_site,
        samesite="none" if cross_site else "lax",
    )


# ---------- FastAPI dependencies ----------


def get_current_user(
    mockmate_access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not logged in.")
    if not mockmate_access_token:
        raise unauthorized
    try:
        user_id = decode_access_token(mockmate_access_token)
    except jwt.PyJWTError:
        raise unauthorized
    user = db.get(User, user_id)
    if user is None:
        raise unauthorized
    return user


def get_current_user_optional(
    mockmate_access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User | None:
    if not mockmate_access_token:
        return None
    try:
        user_id = decode_access_token(mockmate_access_token)
    except jwt.PyJWTError:
        return None
    return db.get(User, user_id)
