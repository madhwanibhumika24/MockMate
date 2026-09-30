from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    environment: str = "development"
    # Gemini API key (ai.google.dev) used for interview question/feedback
    # generation -- distinct from google_client_id/secret below, which are
    # for "Sign in with Google" OAuth, a completely separate credential.
    google_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash-lite"
    # Not used anywhere -- interview_service/feedback_service use Gemini, and
    # the RAG pipeline (app/rag/embeddings.py) now embeds via Gemini too.
    # Kept only so an old .env with this key set doesn't fail to load.
    openai_api_key: str = ""
    database_url: str = "sqlite:///./data/mockmate.db"
    # "simple" = app/rag/vector_store.py's dependency-free JSON store (see
    # that file for why Chroma isn't used).
    vector_store_backend: str = "simple"
    vector_store_path: str = "./data/vector_store"
    cors_origins: str = "http://localhost:5173"

    # --- Auth ---------------------------------------------------------
    jwt_secret_key: str = ""
    jwt_access_token_expire_minutes: int = 60
    reset_code_expire_minutes: int = 5
    frontend_url: str = "http://localhost:5173"

    # --- Email (SMTP) ---------------------------------------------------
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    smtp_from_email: str = ""
    smtp_from_name: str = "MockMate"

    # --- Google OAuth -----------------------------------------------------
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_uri: str = "http://localhost:8000/api/auth/google/callback"

    # --- GitHub OAuth -----------------------------------------------------
    github_client_id: str = ""
    github_client_secret: str = ""
    github_redirect_uri: str = "http://localhost:8000/api/auth/github/callback"

    @property
    def cors_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
