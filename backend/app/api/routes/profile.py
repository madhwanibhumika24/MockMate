from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.orm import EMPLOYMENT_STATUSES, User, UserProfile
from app.models.schemas import ProfileResponse, ProfileUpdate, ResumeUpdate
from app.services.resume_analyzer_service import analyze_resume

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("/me", response_model=ProfileResponse)
def get_my_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Returns the current user's onboarding profile. If they skipped
    onboarding (or haven't gotten there yet), every field just comes back
    null -- there's no separate "not found" case to handle on the frontend.
    """
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).one_or_none()
    if profile is None:
        return ProfileResponse()
    return profile


@router.put("/me", response_model=ProfileResponse)
def upsert_my_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Creates or updates the current user's onboarding profile, and marks
    onboarding as completed."""
    if payload.employment_status not in EMPLOYMENT_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"employment_status must be one of {EMPLOYMENT_STATUSES}",
        )

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).one_or_none()
    if profile is None:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    for field, value in payload.model_dump().items():
        setattr(profile, field, value)

    current_user.onboarding_status = "completed"

    db.commit()
    db.refresh(profile)
    return profile


@router.post("/skip", response_model=ProfileResponse)
def skip_onboarding(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Marks onboarding as skipped without saving any profile info -- so the
    step is never shown again for this user, and they can still fill it in
    later from their profile menu if they change their mind."""
    current_user.onboarding_status = "skipped"
    db.commit()

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).one_or_none()
    return profile if profile is not None else ProfileResponse()


@router.put("/resume", response_model=ProfileResponse)
def update_my_resume(
    payload: ResumeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Stores a reusable resume on the current user's profile (parsed
    beforehand via POST /resume/upload), so it doesn't need to be re-uploaded
    for every interview session. Creates a bare profile row if the user
    skipped onboarding and has none yet."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).one_or_none()
    if profile is None:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)

    profile.resume_text = payload.resume_text
    profile.resume_filename = payload.resume_filename
    # Best-effort: analyze_resume() never raises, just returns None on
    # failure, so a resume upload is never blocked by extraction issues.
    profile.resume_analysis = analyze_resume(payload.resume_text)

    db.commit()
    db.refresh(profile)
    return profile


@router.delete("/resume", response_model=ProfileResponse)
def delete_my_resume(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Removes the stored resume from the current user's profile."""
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).one_or_none()
    if profile is None:
        return ProfileResponse()

    profile.resume_text = None
    profile.resume_filename = None
    profile.resume_analysis = None
    db.commit()
    db.refresh(profile)
    return profile
