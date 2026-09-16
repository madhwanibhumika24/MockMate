from fastapi import APIRouter, File, UploadFile

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Accepts a resume file (PDF/DOCX) and extracts text for use in interview generation."""
    # TODO: parse file via app.services.resume_service.parse_resume
    return {"filename": file.filename, "status": "received"}
