from fastapi import APIRouter

from app.models.schemas import FeedbackResponse

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.get("/{session_id}", response_model=FeedbackResponse)
def get_feedback(session_id: int):
    """Returns structured, RAG-grounded feedback for a completed session."""
    # TODO: wire up app.services.feedback_service
    return FeedbackResponse(session_id=session_id, summary="Not yet generated.")
