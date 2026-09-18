"""SQLAlchemy ORM models.

Schema overview
---------------
users                -- an account: either email/password ("local") or an
                        OAuth account (Google/GitHub). `password_hash` is
                        null for OAuth-only accounts. `onboarding_status`
                        tracks whether the post-signup personal-info step has
                        been completed or explicitly skipped, so it's only
                        shown once.
user_profiles        -- the optional personal/career info collected on the
                        post-signup onboarding step (fresher vs. experienced,
                        current role, education, etc). One row per user, and
                        the row may simply not exist if the user skipped it.
password_reset_codes -- a short-lived 6-digit code (hashed, never stored in
                        the clear) issued to a user's email for the "forgot
                        password" flow. Expires after
                        settings.reset_code_expire_minutes.
interview_sessions   -- one row per practice interview (role, JD, resume
                        text, status). `user_id` is nullable so rows created
                        before auth existed still load fine; new sessions are
                        always created for a logged-in user going forward.
interview_questions  -- the ordered questions asked within a session, each
                        carrying its own answer once submitted.
feedback             -- exactly one row per completed session: the structured,
                        RAG-grounded critique (summary + strengths +
                        improvements [+ optional score]).
reference_documents  -- catalog of source material ingested into the RAG
                        vector store (interview guides, question banks, etc.).
                        The embeddings/chunks themselves live in the vector
                        store (Chroma); this table just tracks what was
                        ingested, from where, and how many chunks it produced.

    users               1───* interview_sessions
    users               1───* password_reset_codes
    users               1───1 user_profiles
    interview_sessions  1───* interview_questions
    interview_sessions  1───1 feedback
    reference_documents  (independent; referenced implicitly via the
                          vector store during retrieval, not by FK)
"""

from datetime import datetime

from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.db.base import Base

# Allowed values for InterviewSession.status. Kept as plain strings (not a
# DB-level enum) so SQLite stays simple and new statuses don't need a migration.
SESSION_STATUSES = ("created", "in_progress", "completed")

# Allowed values for InterviewSession.difficulty.
DIFFICULTY_LEVELS = ("easy", "medium", "hard")

# Allowed values for User.auth_provider.
AUTH_PROVIDERS = ("local", "google", "github")

# Allowed values for User.onboarding_status.
ONBOARDING_STATUSES = ("pending", "completed", "skipped")

# Allowed values for UserProfile.employment_status.
EMPLOYMENT_STATUSES = ("fresher", "experienced")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String(255), nullable=False, unique=True, index=True)
    full_name = Column(String(255), nullable=True)

    # Null for accounts created via Google/GitHub -- they never set a
    # MockMate password.
    password_hash = Column(String(255), nullable=True)

    auth_provider = Column(String(20), default="local", nullable=False)
    google_id = Column(String(255), nullable=True, unique=True, index=True)
    github_id = Column(String(255), nullable=True, unique=True, index=True)

    is_email_verified = Column(Boolean, default=False, nullable=False)

    # "pending" until the user completes or skips the post-signup personal
    # info step -- drives whether the frontend routes them to /onboarding.
    onboarding_status = Column(String(20), default="pending", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    sessions = relationship("InterviewSession", back_populates="user")
    reset_codes = relationship(
        "PasswordResetCode",
        back_populates="user",
        cascade="all, delete-orphan",
    )
    profile = relationship(
        "UserProfile",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan",
    )


class PasswordResetCode(Base):
    __tablename__ = "password_reset_codes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)

    # SHA-256 hex digest of the 6-digit code -- never store the plaintext
    # code, same principle as passwords.
    code_hash = Column(String(64), nullable=False)

    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="reset_codes")


class UserProfile(Base):
    """The personal/career info collected on the post-signup onboarding
    step. Entirely optional -- a user who clicks "Skip" simply never gets a
    row here, while `User.onboarding_status` still moves to "skipped" so the
    step isn't shown again."""

    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True, index=True)

    employment_status = Column(String(20), nullable=True)  # "fresher" | "experienced"

    # Populated when employment_status == "experienced"
    current_role = Column(String(255), nullable=True)
    company = Column(String(255), nullable=True)
    years_experience = Column(Integer, nullable=True)

    # Populated when employment_status == "fresher"
    education_level = Column(String(255), nullable=True)
    field_of_study = Column(String(255), nullable=True)
    graduation_year = Column(Integer, nullable=True)

    # Common to both
    target_role = Column(String(255), nullable=True)

    # Optional reusable resume, uploaded once from the profile menu and
    # reused across sessions -- separate from InterviewSession.resume_text,
    # which stays per-session for backward compatibility.
    resume_text = Column(Text, nullable=True)
    resume_filename = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="profile")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"

    id = Column(Integer, primary_key=True, index=True)

    # Nullable for backward compatibility with any session rows created
    # before auth existed. New sessions are always created for a logged-in
    # user via the API.
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)

    role = Column(String, nullable=False)
    job_description = Column(Text, nullable=True)

    # Resume is captured per-session (not a reusable, standalone entity) --
    # we store the extracted text plus the original filename for display.
    resume_text = Column(Text, nullable=True)
    resume_filename = Column(String, nullable=True)

    # Drives both question difficulty and the fixed stage structure (intro ->
    # resume walkthrough -> fundamentals -> OOP -> problem solving) -- see
    # app/services/interview_service.py.
    difficulty = Column(String(20), default="medium", nullable=False)

    status = Column(String, default="created", nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="sessions")
    questions = relationship(
        "InterviewQuestion",
        back_populates="session",
        order_by="InterviewQuestion.order_index",
        cascade="all, delete-orphan",
    )
    feedback = relationship(
        "Feedback",
        back_populates="session",
        uselist=False,
        cascade="all, delete-orphan",
    )


class InterviewQuestion(Base):
    __tablename__ = "interview_questions"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False, index=True)

    order_index = Column(Integer, nullable=False, default=0)
    question_text = Column(Text, nullable=False)
    answer_text = Column(Text, nullable=True)

    asked_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    answered_at = Column(DateTime, nullable=True)

    session = relationship("InterviewSession", back_populates="questions")


class Feedback(Base):
    __tablename__ = "feedback"

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(
        Integer,
        ForeignKey("interview_sessions.id"),
        nullable=False,
        unique=True,  # one feedback record per session
        index=True,
    )

    summary = Column(Text, nullable=False)
    strengths = Column(JSON, default=list, nullable=False)
    improvements = Column(JSON, default=list, nullable=False)
    score = Column(Float, nullable=True)  # e.g. 0-100, optional overall rating

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    session = relationship("InterviewSession", back_populates="feedback")


class ReferenceDocument(Base):
    """Tracks a source document ingested into the RAG vector store.

    The chunk text + embeddings live in the vector store itself; this row is
    just the relational record of what was ingested, so the corpus can be
    listed/managed/re-ingested without inspecting the vector store directly.
    """

    __tablename__ = "reference_documents"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)
    category = Column(String, nullable=True)  # e.g. "behavioral", "system-design"
    source_path = Column(String, nullable=True)  # path under backend/data/raw

    chunk_count = Column(Integer, nullable=True)
    ingested_at = Column(DateTime, nullable=True)  # null until actually embedded
