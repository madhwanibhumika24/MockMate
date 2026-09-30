from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.models.orm import User
from app.models.schemas import (
    AptitudeCustomFormulaSheetRequest,
    AptitudeCustomQuizRequest,
    AptitudeFormulaSheetResponse,
    AptitudeQuizResponse,
    AptitudeSubmitRequest,
    AptitudeSubmitResponse,
    AptitudeTopicResponse,
)
from app.services import aptitude_formula_service, aptitude_quiz_service, aptitude_service

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
    encrypted "token" and only recovered by /aptitude/submit below.

    Also grounds generation in the same verified formulas used by the
    Formula Sheet feature, when available, so questions are generated from
    checked reference material rather than the model's memory alone -- see
    aptitude_quiz_service.generate_quiz's `reference` parameter. This is
    best-effort: a lookup failure here (e.g. the knowledge base hasn't been
    built yet) just falls back to ungrounded generation rather than
    breaking quiz generation entirely."""
    topic = aptitude_service.get_topic(topic_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Unknown topic.")

    try:
        sheet = aptitude_formula_service.get_formula_sheet(topic["title"])
    except Exception:
        sheet = None
    reference = None
    if sheet:
        reference = "\n".join(sheet["formulas"])
        if sheet.get("example"):
            reference += f"\nExample: {sheet['example']}"

    try:
        return aptitude_quiz_service.generate_quiz(topic["title"], difficulty, count, reference=reference)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.get("/topics/{topic_id}/formula-sheet", response_model=AptitudeFormulaSheetResponse)
def get_formula_sheet(
    topic_id: str,
    current_user: User = Depends(get_current_user),
):
    """Feature 2: a quick-reference formula sheet for one topic, retrieved
    from the aptitude knowledge base via the RAG pipeline -- no LLM call,
    retrieval only. 404 if the topic itself is unknown, and 404 if there's
    no indexed reference content for it yet (e.g. the knowledge base hasn't
    been built -- see app/rag/build_index.py)."""
    topic = aptitude_service.get_topic(topic_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Unknown topic.")

    sheet = aptitude_formula_service.get_formula_sheet(topic["title"])
    if sheet is None:
        raise HTTPException(status_code=404, detail="No formula sheet available for this topic yet.")

    return sheet


@router.post("/custom-topic/quiz", response_model=AptitudeQuizResponse)
def generate_custom_quiz(
    payload: AptitudeCustomQuizRequest,
    current_user: User = Depends(get_current_user),
):
    """Ask AI: generates a quiz for any topic the candidate types in, not
    just the curated bank, for when a topic they want to practice isn't
    listed. Uses the exact same generation logic as the curated-topic quiz
    above; the only difference is where the topic text comes from."""
    topic_text = payload.topic.strip()
    if not topic_text:
        raise HTTPException(status_code=400, detail="Please enter a topic to practice.")
    if len(topic_text) > 100:
        raise HTTPException(status_code=400, detail="Please keep the topic under 100 characters.")

    try:
        return aptitude_quiz_service.generate_quiz(topic_text, payload.difficulty, payload.count)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/custom-topic/formula-sheet", response_model=AptitudeFormulaSheetResponse)
def generate_custom_formula_sheet(
    payload: AptitudeCustomFormulaSheetRequest,
    current_user: User = Depends(get_current_user),
):
    """Ask AI: a formula sheet for a topic outside the curated 15, which
    has no matching entry in the aptitude knowledge base to retrieve.
    Falls back to generating one with Gemini instead -- the response comes
    back marked "source": "ai_generated" so the frontend can flag it as
    unverified, unlike the curated, retrieval-grounded sheets above."""
    topic_text = payload.topic.strip()
    if not topic_text:
        raise HTTPException(status_code=400, detail="Please enter a topic.")
    if len(topic_text) > 100:
        raise HTTPException(status_code=400, detail="Please keep the topic under 100 characters.")

    try:
        return aptitude_formula_service.generate_ai_formula_sheet(topic_text)
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
