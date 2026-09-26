from typing import List, Optional

from fastapi import APIRouter, Depends

from app.core.security import get_current_user
from app.models.orm import User
from app.models.schemas import GDTopicResponse
from app.services import group_discussion_service

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
