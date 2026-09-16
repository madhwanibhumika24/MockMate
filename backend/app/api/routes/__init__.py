from fastapi import APIRouter

from app.api.routes import feedback, health, interview, resume

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(resume.router)
api_router.include_router(interview.router)
api_router.include_router(feedback.router)
