from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class HealthResponse(BaseModel):
    status: str


# ---------- Interview sessions ----------


class InterviewSessionCreate(BaseModel):
    role: str
    job_description: Optional[str] = None
    resume_text: Optional[str] = None
    resume_filename: Optional[str] = None


class InterviewSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    role: str
    job_description: Optional[str] = None
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None


class InterviewSessionSummary(BaseModel):
    """Lightweight row for the dashboard's interview history list -- no
    job description/resume text, but includes the score (pulled from the
    linked feedback row, since a session has no score column of its own)."""

    id: int
    role: str
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None
    score: Optional[float] = None


# ---------- Questions & answers ----------


class QuestionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    session_id: int
    order_index: int
    question_text: str
    answer_text: Optional[str] = None
    asked_at: datetime
    answered_at: Optional[datetime] = None


class AnswerSubmission(BaseModel):
    session_id: int
    question_id: int
    answer_text: str


# ---------- Feedback ----------


class FeedbackResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    session_id: int
    summary: str
    strengths: list[str] = []
    improvements: list[str] = []
    score: Optional[float] = None
    created_at: Optional[datetime] = None


# ---------- Reference documents (RAG corpus) ----------


class ReferenceDocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    category: Optional[str] = None
    chunk_count: Optional[int] = None
    ingested_at: Optional[datetime] = None


# ---------- Auth ----------


class UserCreate(BaseModel):
    email: str
    password: str
    full_name: str


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str
    full_name: Optional[str] = None
    auth_provider: str
    onboarding_status: str
    created_at: datetime


class MessageResponse(BaseModel):
    message: str


class ResetRequest(BaseModel):
    email: str


class ResetVerify(BaseModel):
    email: str
    code: str


class ResetConfirm(BaseModel):
    email: str
    code: str
    new_password: str


# ---------- Onboarding / profile ----------


class ProfileUpdate(BaseModel):
    employment_status: str  # "fresher" | "experienced"

    current_role: Optional[str] = None
    company: Optional[str] = None
    years_experience: Optional[int] = None

    education_level: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_year: Optional[int] = None

    target_role: Optional[str] = None


class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    employment_status: Optional[str] = None
    current_role: Optional[str] = None
    company: Optional[str] = None
    years_experience: Optional[int] = None
    education_level: Optional[str] = None
    field_of_study: Optional[str] = None
    graduation_year: Optional[int] = None
    target_role: Optional[str] = None
    resume_text: Optional[str] = None
    resume_filename: Optional[str] = None


class ResumeUpdate(BaseModel):
    resume_text: str
    resume_filename: Optional[str] = None
