from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.models.orm import User
from app.models.schemas import (
    AptitudeQuizResponse,
    AptitudeSubmitRequest,
    AptitudeSubmitResponse,
    AptitudeTopicResponse,
)
from app.services import aptitude_quiz_service, aptitude_service

router = APIRouter(prefix="/aptitude", tags=["aptitude"])


@router.get("/categories", response_model=List[str])
def list_categories(current_user: User = Depends(get_current_user)):
    return aptitude_service.list_categories()


@router.get("/topics", response_model=List[AptitudeTopicResponse])
def list_topics(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """Returns the curated aptitude topic bank, optionally filtered to one
    category (Quantitative Aptitude / Logical Reasoning / Verbal Ability).
    Static list, no AI call -- mirrors group_discussion's topic browsing."""
    return aptitude_service.list_topics(category)


@router.post("/topics/{topic_id}/quiz", response_model=AptitudeQuizResponse)
def generate_quiz(
    topic_id: str,
    difficulty: str = "medium",
    count: int = 5,
    current_user: User = Depends(get_current_user),
):
    """Feature 1: generates an MCQ quiz for one topic. Stateless -- nothing
    is persisted here. The correct answer and explanation for each question
    never appear in this response; they're sealed inside that question's
    encrypted "token" and only recovered by /aptitude/submit below."""
    topic = aptitude_service.get_topic(topic_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Unknown topic.")

    try:
        return aptitude_quiz_service.generate_quiz(topic["title"], difficulty, count)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/submit", response_model=AptitudeSubmitResponse)
def submit_quiz(
    payload: AptitudeSubmitRequest,
    current_user: User = Depends(get_current_user),
):
    """Grades a submitted quiz by decrypting each answer's token -- the
    candidate's chosen option is never checked against anything client-
    supplied except that sealed token. Nothing is persisted here either."""
    if not payload.answers:
        raise HTTPException(status_code=400, detail="No answers submitted.")

    answers = [answer.model_dump() for answer in payload.answers]

    try:
        return aptitude_quiz_service.grade_quiz(answers)
    except RuntimeError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
