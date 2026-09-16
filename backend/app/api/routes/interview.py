from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.orm import InterviewQuestion, InterviewSession
from app.models.schemas import (
    AnswerSubmission,
    InterviewSessionCreate,
    InterviewSessionResponse,
    QuestionResponse,
)
from app.services.interview_service import generate_question
from datetime import datetime

router = APIRouter(prefix="/interview", tags=["interview"])

# How many questions make up one interview session. Simple fixed count for
# now; could become configurable per-session later.
MAX_QUESTIONS_PER_SESSION = 5


def _qa_history(session: InterviewSession) -> List[tuple]:
    return [(q.question_text, q.answer_text) for q in session.questions if q.answer_text]


@router.post("/sessions", response_model=InterviewSessionResponse)
def create_session(payload: InterviewSessionCreate, db: Session = Depends(get_db)):
    """Creates a new interview session and generates its first question."""
    session = InterviewSession(
        role=payload.role,
        job_description=payload.job_description,
        resume_text=payload.resume_text,
        resume_filename=payload.resume_filename,
        status="created",
    )
    db.add(session)
    db.flush()  # assigns session.id without committing yet

    first_question_text = generate_question(
        role=session.role,
        job_description=session.job_description,
        resume_text=session.resume_text,
    )
    first_question = InterviewQuestion(
        session_id=session.id,
        order_index=0,
        question_text=first_question_text,
    )
    db.add(first_question)

    session.status = "in_progress"
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


@router.get("/sessions/{session_id}/questions", response_model=List[QuestionResponse])
def list_questions(session_id: int, db: Session = Depends(get_db)):
    """Lists all questions (and answers, where submitted) for a session, in order."""
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session.questions


class AnswerResult(BaseModel):
    session_id: int
    status: str
    next_question: Optional[QuestionResponse] = None


@router.post("/sessions/{session_id}/answer", response_model=AnswerResult)
def submit_answer(session_id: int, payload: AnswerSubmission, db: Session = Depends(get_db)):
    """Records an answer. Generates the next question, or marks the session
    completed once MAX_QUESTIONS_PER_SESSION have been answered."""
    session = db.get(InterviewSession, session_id)
    if session is None:
        raise HTTPException(status_code=404, detail="Interview session not found")

    question = db.get(InterviewQuestion, payload.question_id)
    if question is None or question.session_id != session_id:
        raise HTTPException(status_code=404, detail="Question not found for this session")

    question.answer_text = payload.answer_text
    question.answered_at = datetime.utcnow()

    answered_count = sum(1 for q in session.questions if q.answer_text)

    next_question_row = None
    if answered_count >= MAX_QUESTIONS_PER_SESSION:
        session.status = "completed"
        session.completed_at = datetime.utcnow()
    else:
        next_question_text = generate_question(
            role=session.role,
            job_description=session.job_description,
            resume_text=session.resume_text,
            previous_qa=_qa_history(session),
        )
        next_question_row = InterviewQuestion(
            session_id=session.id,
            order_index=answered_count,
            question_text=next_question_text,
        )
        db.add(next_question_row)

    db.commit()
    if next_question_row is not None:
        db.refresh(next_question_row)

    return AnswerResult(
        session_id=session_id,
        status=session.status,
        next_question=next_question_row,
    )
