from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user
from app.models.orm import User
from app.models.schemas import (
    GDCustomTopicRequest,
    GDDiscussRequest,
    GDDiscussResponse,
    GDTopicBriefResponse,
    GDTopicResponse,
)
from app.services import gd_chat_service, gd_content_service, group_discussion_service

router = APIRouter(prefix="/group-discussion", tags=["group-discussion"])


@router.get("/categories", response_model=List[str])
def list_categories(current_user: User = Depends(get_current_user)):
    return group_discussion_service.list_categories()


@router.get("/topics", response_model=List[GDTopicResponse])
def list_topics(
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
):
    """Returns the curated GD topic bank, optionally filtered to one category.

    This is feature 1 of the Group Discussion module: browsing real topics
    to prepare with. It's a static list, not an AI call -- the live,
    AI-simulated discussion itself (multiple AI participants, not an actual
    group) is separate, later work.
    """
    return group_discussion_service.list_topics(category)


@router.post("/topics/{topic_id}/brief", response_model=GDTopicBriefResponse)
def generate_topic_brief(
    topic_id: str,
    current_user: User = Depends(get_current_user),
):
    """Feature 2: AI-researched prep content for one topic -- an intro,
    points for/against with examples, and a closing line. Stateless and
    one-shot (like Ask AI): nothing is persisted, and calling this again
    regenerates fresh content rather than returning a cached copy."""
    topic = group_discussion_service.get_topic(topic_id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Unknown topic.")

    try:
        return gd_content_service.generate_topic_brief(topic["title"], topic["prompt"])
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/custom-topic/brief", response_model=GDTopicBriefResponse)
def generate_custom_topic_brief(
    payload: GDCustomTopicRequest,
    current_user: User = Depends(get_current_user),
):
    """Feature 3: "Search topics with AI" -- researches any topic the
    candidate types in, not just the curated bank. Uses the exact same
    generation logic as the curated-topic brief above; the only difference
    is where the topic text comes from."""
    topic_text = payload.topic.strip()
    if not topic_text:
        raise HTTPException(status_code=400, detail="Please enter a topic to search.")
    if len(topic_text) > 200:
        raise HTTPException(status_code=400, detail="Please keep the topic under 200 characters.")

    try:
        return gd_content_service.generate_topic_brief(topic_text, "")
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc


@router.post("/discuss", response_model=GDDiscussResponse)
def discuss_topic(
    payload: GDDiscussRequest,
    current_user: User = Depends(get_current_user),
):
    """Feature 4: "Discuss with AI" -- a free-form follow-up chat about a
    topic, on top of its research brief. Stateless: the frontend holds and
    resends the conversation history with each message; nothing is
    persisted here."""
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="Please type a message.")
    if len(message) > 800:
        raise HTTPException(status_code=400, detail="Please keep messages under 800 characters.")

    history = [turn.model_dump() for turn in payload.history]

    try:
        reply = gd_chat_service.discuss_topic(payload.topic_title, payload.topic_prompt, message, history)
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {"reply": reply}
