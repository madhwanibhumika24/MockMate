from typing import Optional

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str


class InterviewSessionCreate(BaseModel):
    role: str
    job_description: Optional[str] = None


class InterviewSessionResponse(BaseModel):
    id: int
    role: str
    status: str


class AnswerSubmission(BaseModel):
    session_id: int
    question_id: int
    answer_text: str


class FeedbackResponse(BaseModel):
    session_id: int
    summary: str
    strengths: list[str] = []
    improvements: list[str] = []
