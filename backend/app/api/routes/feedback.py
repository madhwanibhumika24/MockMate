from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.orm import Feedback, InterviewSession
from app.models.schemas import FeedbackResponse
from app.services.feedback_service import generate_feedback

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.get("/{session_id}", response_model=FeedbackResponse)
def get_feedback(session_id: int, db: Session = Depends(get_db)):
    """Returns structured feedback for a completed session."""
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found")

    feedback = db.query(Feedback).filter(Feedback.session_id == session_id).one_or_none()
    if feedback is None:
        raise HTTPException(
            status_code=404,
            detail="Feedback hasn't been generated for this session yet",
        )

    return feedback


@router.post("/{session_id}/generate", response_model=FeedbackResponse)
def create_feedback(session_id: int, db: Session = Depends(get_db)):
    """Generates (or returns existing) feedback for a completed session.

    Idempotent: if feedback already exists for this session, it's returned
    as-is rather than regenerated -- call this once the session's status is
    "completed" (i.e. after the last answer has been submitted).
    """
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found")

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
        result = generate_feedback(session.role, session.job_description, qa_pairs)
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
