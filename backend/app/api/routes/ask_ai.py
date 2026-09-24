from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.models.orm import User
from app.models.schemas import AskAIRequest, AskAIResponse
from app.services.ask_ai_service import generate_practice_set

router = APIRouter(prefix="/ask-ai", tags=["ask-ai"])


@router.post("/generate", response_model=AskAIResponse)
def generate(
    payload: AskAIRequest,
    current_user: User = Depends(get_current_user),
):
    """Generates a tailored, one-off practice question set from a free-text
    request (e.g. "5 hard Python OOP questions"). Stateless -- no session is
    created and no answers/feedback are collected, unlike a full mock
    interview."""
    prompt = payload.prompt.strip()
    if not prompt:
        raise HTTPException(status_code=400, detail="Please describe what you'd like to practice.")

    try:
        result = generate_practice_set(prompt)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return result
