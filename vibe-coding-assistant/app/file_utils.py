"""Helpers for turning an uploaded file into plain text.

Supported formats: PDF, DOCX, TXT, PY. Files are read directly into memory
and never written to disk, matching the project's in-memory-only storage rule.
"""
import io

from fastapi import HTTPException, UploadFile
from pypdf import PdfReader
from docx import Document

from app.config import ALLOWED_UPLOAD_EXTENSIONS


def _extension_of(filename: str) -> str:
    """Return the lowercase extension of a filename, including the dot."""
    return "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


async def extract_text(upload: UploadFile) -> str:
    """Read an UploadFile and return its plain-text content, based on extension."""
    ext = _extension_of(upload.filename or "")
    if ext not in ALLOWED_UPLOAD_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_UPLOAD_EXTENSIONS))}",
        )

    raw = await upload.read()

    if ext == ".pdf":
        reader = PdfReader(io.BytesIO(raw))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if ext == ".docx":
        document = Document(io.BytesIO(raw))
        return "\n".join(paragraph.text for paragraph in document.paragraphs)

    # .txt and .py are already plain text
    return raw.decode("utf-8", errors="ignore")
