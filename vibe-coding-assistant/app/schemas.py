"""Pydantic request models for the JSON-only endpoints.

Endpoints that accept file uploads (voice guide, code review) use FastAPI
Form(...)/File(...) parameters directly in app/routers.py instead of a model here.
"""
from typing import Optional

from pydantic import BaseModel


class StyleRequest(BaseModel):
    text: str
    audience: str  # "professional" | "casual" | "academic" | "children"


class BrainstormRequest(BaseModel):
    topic: str
    count: int = 5


class SimplifyRequest(BaseModel):
    term: str
    level: str  # "beginner" | "intermediate" | "expert"


class ExamPrepRequest(BaseModel):
    subject: str


class CodeExplainRequest(BaseModel):
    concept: str
    language: str


class CaseStudyRequest(BaseModel):
    data: str


class FundingRequest(BaseModel):
    idea: str
    budget: str


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
