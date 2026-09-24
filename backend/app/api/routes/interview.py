from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.db.session import get_db
from app.models.orm import (
    DIFFICULTY_LEVELS,
    INTERVIEW_TYPES,
    SESSION_MODES,
    InterviewQuestion,
    InterviewSession,
    User,
    UserProfile,
)
from app.models.schemas import (
    AnswerSubmission,
    InterviewSessionCreate,
    InterviewSessionResponse,
    InterviewSessionSummary,
    QuestionResponse,
)
from app.services.interview_service import generate_question
from app.services.resume_analyzer_service import analyze_resume
from datetime import datetime

router = APIRouter(prefix="/interview", tags=["interview"])

# How many questions make up one interview session. Simple fixed count for
# now; could become configurable per-session later.
MAX_QUESTIONS_PER_SESSION = 5


def _qa_history(session: InterviewSession) -> List[tuple]:
    return [(q.question_text, q.answer_text) for q in session.questions if q.answer_text]


def _get_owned_session(session_id: int, current_user: User, db: Session) -> InterviewSession:
    """Fetches a session, 404ing if it doesn't exist OR belongs to someone
    else -- deliberately the same error either way so session ids can't be
    used to probe for other people's sessions."""
    session = db.get(InterviewSession, session_id)
    if session is None or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Interview session not found")
    return session


@router.post("/sessions", response_model=InterviewSessionResponse)
def create_session(
    payload: InterviewSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Creates a new interview session (for the logged-in user) and generates
    its first question."""
    difficulty = payload.difficulty if payload.difficulty in DIFFICULTY_LEVELS else "medium"
    topic = payload.topic.strip() if payload.topic and payload.topic.strip() else None
    mode = payload.mode if payload.mode in SESSION_MODES else "role"
    interview_type = payload.interview_type if payload.interview_type in INTERVIEW_TYPES else "technical"

    # Reuse the profile's cached resume analysis when this session's resume
    # text is exactly the saved profile resume (the common case -- no
    # override upload) to avoid a redundant Gemini call; otherwise analyze
    # this session's resume text fresh. Best-effort: analyze_resume() never
    # raises, just returns None on failure.
    resume_analysis = None
    if payload.resume_text:
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).one_or_none()
        if profile and profile.resume_text == payload.resume_text and profile.resume_analysis:
            resume_analysis = profile.resume_analysis
        else:
            resume_analysis = analyze_resume(payload.resume_text)

    session = InterviewSession(
        user_id=current_user.id,
        role=payload.role,
        job_description=payload.job_description,
        resume_text=payload.resume_text,
        resume_filename=payload.resume_filename,
        difficulty=difficulty,
        topic=topic,
        mode=mode,
        interview_type=interview_type,
        resume_analysis=resume_analysis,
        status="created",
    )
    db.add(session)
    db.flush()  # assigns session.id without committing yet

    first_question_text = generate_question(
        role=session.role,
        job_description=session.job_description,
        resume_text=session.resume_text,
        difficulty=session.difficulty,
        topic=session.topic,
        mode=session.mode,
        interview_type=session.interview_type,
        resume_analysis=session.resume_analysis,
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


@router.get("/sessions", response_model=List[InterviewSessionSummary])
def list_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists the logged-in user's interview sessions, most recent first, for
    the dashboard's history view."""
    sessions = (
        db.query(InterviewSession)
        .filter(InterviewSession.user_id == current_user.id)
        .order_by(InterviewSession.created_at.desc())
        .all()
    )
    return [
        InterviewSessionSummary(
            id=s.id,
            role=s.role,
            difficulty=s.difficulty,
            topic=s.topic,
            mode=s.mode,
            interview_type=s.interview_type,
            status=s.status,
            created_at=s.created_at,
            completed_at=s.completed_at,
            score=s.feedback.score if s.feedback else None,
        )
        for s in sessions
    ]


@router.get("/sessions/{session_id}", response_model=InterviewSessionResponse)
def get_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Fetches a session by id (must belong to the logged-in user)."""
    return _get_owned_session(session_id, current_user, db)


@router.post("/sessions/{session_id}/end", response_model=InterviewSessionResponse)
def end_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Ends a session early -- e.g. when the interview timer runs out --
    without requiring all MAX_QUESTIONS_PER_SESSION questions to be
    answered first. Idempotent: calling it again on an already-completed
    session is a no-op that just returns the current row."""
    session = _get_owned_session(session_id, current_user, db)

    if session.status != "completed":
        session.status = "completed"
        session.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(session)

    return session


@router.get("/sessions/{session_id}/questions", response_model=List[QuestionResponse])
def list_questions(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists all questions (and answers, where submitted) for a session, in order."""
    session = _get_owned_session(session_id, current_user, db)
    return session.questions


class AnswerResult(BaseModel):
    session_id: int
    status: str
    next_question: Optional[QuestionResponse] = None


@router.post("/sessions/{session_id}/answer", response_model=AnswerResult)
def submit_answer(
    session_id: int,
    payload: AnswerSubmission,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Records an answer. Generates the next question, or marks the session
    completed once MAX_QUESTIONS_PER_SESSION have been answered."""
    session = _get_owned_session(session_id, current_user, db)

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
            difficulty=session.difficulty,
            topic=session.topic,
            mode=session.mode,
            interview_type=session.interview_type,
            resume_analysis=session.resume_analysis,
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
