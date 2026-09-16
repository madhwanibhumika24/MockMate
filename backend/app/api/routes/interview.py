from fastapi import APIRouter

from app.models.schemas import AnswerSubmission, InterviewSessionCreate, InterviewSessionResponse

router = APIRouter(prefix="/interview", tags=["interview"])


@router.post("/sessions", response_model=InterviewSessionResponse)
def create_session(payload: InterviewSessionCreate):
    """Creates a new interview session and generates the first question."""
    # TODO: wire up app.services.interview_service
    return InterviewSessionResponse(id=1, role=payload.role, status="created")


@router.post("/sessions/{session_id}/answer")
def submit_answer(session_id: int, payload: AnswerSubmission):
    """Records an answer and returns the next question."""
    # TODO: wire up app.services.interview_service
    return {"session_id": session_id, "next_question": None}
