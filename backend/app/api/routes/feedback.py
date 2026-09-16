from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.orm import Feedback, InterviewSession
from app.models.schemas import FeedbackResponse

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.get("/{session_id}", response_model=FeedbackResponse)
def get_feedback(session_id: int, db: Session = Depends(get_db)):
    """Returns structured, RAG-grounded feedback for a completed session.

    404s distinguish between "no such session" and "session exists but
    feedback hasn't been generated yet" -- the latter is expected right up
    until app.services.feedback_service is wired up to actually generate it.
    """
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
