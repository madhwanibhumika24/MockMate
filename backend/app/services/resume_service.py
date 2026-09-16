"""Resume parsing and extraction logic."""

import io
import os

from docx import Document
from pypdf import PdfReader

SUPPORTED_EXTENSIONS = (".pdf", ".docx", ".txt")


def parse_resume(file_bytes: bytes, filename: str) -> str:
    """Extracts plain text from an uploaded resume file.

    Supports PDF, DOCX, and plain text. Raises ValueError for anything else
    or for a file that parses but yields no extractable text (e.g. a
    scanned/image-only PDF with no text layer).
    """
    extension = os.path.splitext(filename)[1].lower()

    if extension == ".pdf":
        text = _parse_pdf(file_bytes)
    elif extension == ".docx":
        text = _parse_docx(file_bytes)
    elif extension == ".txt":
        text = file_bytes.decode("utf-8", errors="ignore")
    else:
        raise ValueError(
            f"Unsupported file type '{extension}'. Supported types: {', '.join(SUPPORTED_EXTENSIONS)}"
        )

    text = text.strip()
    if not text:
        raise ValueError(
            "No text could be extracted from this file -- it may be a scanned/image-only "
            "document with no selectable text."
        )
    return text


def _parse_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    pages = [page.extract_text() or "" for page in reader.pages]
    return "\n\n".join(pages)


def _parse_docx(file_bytes: bytes) -> str:
    document = Document(io.BytesIO(file_bytes))
    paragraphs = [p.text for p in document.paragraphs]
    return "\n".join(paragraphs)
