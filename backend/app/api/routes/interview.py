from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.orm import InterviewSession
from app.models.schemas import AnswerSubmission, InterviewSessionCreate, InterviewSessionResponse

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/sessions", response_model=InterviewSessionResponse)
def create_session(payload: InterviewSessionCreate, db: Session = Depends(get_db)):
    """Creates a new interview session and persists it.

    Question generation (via app.services.interview_service) isn't wired up
    yet -- this just creates the session row so the rest of the flow
    (lookup, answering, feedback) has something real to work against.
    """
    session = InterviewSession(
        role=payload.role,
        job_description=payload.job_description,
        resume_text=payload.resume_text,
        resume_filename=payload.resume_filename,
        status="created",
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions/{session_id}", response_model=InterviewSessionResponse)
def get_session(session_id: int, db: Session = Depends(get_db)):
    """Fetches a session by id."""
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


@router.post("/sessions/{session_id}/answer")
def submit_answer(session_id: int, payload: AnswerSubmission, db: Session = Depends(get_db)):
    """Records an answer and returns the next question."""
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found")
    # TODO: wire up app.services.interview_service to generate the next question
    return {"session_id": session_id, "next_question": None}
