from fastapi import APIRouter, File, HTTPException, UploadFile

from app.services.resume_service import parse_resume

router = APIRouter(prefix="/resume", tags=["resume"])


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    """Accepts a resume file (PDF/DOCX/TXT) and returns its extracted text.

    The frontend is expected to hold onto this text and send it along when
    creating an interview session (InterviewSessionCreate.resume_text) --
    resumes aren't stored as their own entity, per the current DB design.
    """
    file_bytes = await file.read()

    try:
        resume_text = parse_resume(file_bytes, file.filename or "")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {
        "filename": file.filename,
        "status": "parsed",
        "resume_text": resume_text,
    }
