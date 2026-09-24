from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.orm import Feedback, InterviewSession, User
from app.models.schemas import FeedbackResponse
from app.services.feedback_service import generate_feedback

router = APIRouter(prefix="/feedback", tags=["feedback"])


def _get_owned_session(session_id: int, current_user: User, db: Session) -> InterviewSession:
    session = db.get(InterviewSession, session_id)
    if session is None or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


@router.get("/{session_id}", response_model=FeedbackResponse)
def get_feedback(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Returns structured feedback for a completed session."""
    _get_owned_session(session_id, current_user, db)

    feedback = db.query(Feedback).filter(Feedback.session_id == session_id).one_or_none()
    if feedback is None:
        raise HTTPException(
            status_code=404,
            detail="Feedback hasn't been generated for this session yet",
        )

    return feedback


@router.post("/{session_id}/generate", response_model=FeedbackResponse)
def create_feedback(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generates (or returns existing) feedback for a completed session.

    Idempotent: if feedback already exists for this session, it's returned
    as-is rather than regenerated -- call this once the session's status is
    "completed" (i.e. after the last answer has been submitted).
    """
    session = _get_owned_session(session_id, current_user, db)

    existing = db.query(Feedback).filter(Feedback.session_id == session_id).one_or_none()
    if existing is not None:
        return existing

    if session.status != "completed":
        raise HTTPException(
            status_code=400,
            detail=f"Session must be completed before generating feedback (current status: {session.status})",
        )

    qa_pairs = [(q.question_text, q.answer_text) for q in session.questions if q.answer_text]

    try:
        result = generate_feedback(
            session.role,
            session.job_description,
            qa_pairs,
            interview_type=session.interview_type,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    feedback = Feedback(
        session_id=session.id,
        summary=result["summary"],
        strengths=result["strengths"],
        improvements=result["improvements"],
        score=result["score"],
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
