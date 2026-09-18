from fastapi import APIRouter

from app.api.routes import auth, feedback, health, interview, profile, resume

api_router = APIRouter()
api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(profile.router)
api_router.include_router(resume.router)
api_router.include_router(interview.router)
api_router.include_router(feedback.router)
