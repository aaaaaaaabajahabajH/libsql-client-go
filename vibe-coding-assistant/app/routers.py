"""REST endpoints for all 10 assistant features, mounted under /api by main.py.

Every "AI" call currently goes through app/mock_responses.py.
  # >>> REPLACE-WITH-REAL-API: swap the mock_responses.xxx(...) call in the
  # matching endpoint below for a real Anthropic client call. See
  # app/config.py for the exact setup steps. <<<
"""
from typing import List, Optional

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import JSONResponse

from app import mock_responses, session_store
from app.file_utils import extract_text
from app.schemas import (
    BrainstormRequest,
    CaseStudyRequest,
    ChatRequest,
    CodeExplainRequest,
    ExamPrepRequest,
    FundingRequest,
    SimplifyRequest,
    StyleRequest,
)

router = APIRouter()


@router.get("/session/new")
def new_session():
    """The frontend calls this once on page load to get a session id."""
    return {"session_id": session_store.create_session()}


@router.post("/style/improve")
def improve_style(payload: StyleRequest):
    """Feature 1: improve writing for a target audience."""
    return mock_responses.improve_style(payload.text, payload.audience)  # MOCK CALL


@router.post("/voice/build-guide")
async def build_voice_guide(
    files: List[UploadFile] = File(default=[]),
    raw_text: str = Form(default=""),
):
    """Feature 2: derive a style guide from uploaded/pasted writing samples."""
    combined = raw_text
    for uploaded in files:
        combined += "\n" + await extract_text(uploaded)
    return mock_responses.build_voice_guide(combined)  # MOCK CALL


@router.post("/brainstorm")
def brainstorm(payload: BrainstormRequest):
    """Feature 3: brainstorm a ranked list of ideas for a topic."""
    return mock_responses.brainstorm_ideas(payload.topic, max(1, payload.count))  # MOCK CALL


@router.post("/simplify")
def simplify(payload: SimplifyRequest):
    """Feature 4: explain a term with a metaphor + examples for a knowledge level."""
    return mock_responses.simplify_concept(payload.term, payload.level)  # MOCK CALL


@router.post("/exam-prep")
def exam_prep(payload: ExamPrepRequest):
    """Feature 5: build a study plan and practice questions."""
    return mock_responses.build_exam_plan(payload.subject)  # MOCK CALL


@router.post("/code/explain")
def explain_code(payload: CodeExplainRequest):
    """Feature 6: explain a programming concept with runnable code."""
    return mock_responses.explain_code_concept(payload.concept, payload.language)  # MOCK CALL


@router.post("/code/review")
async def review_code(
    code: str = Form(default=""),
    file: Optional[UploadFile] = File(default=None),
):
    """Feature 7: review code (typed or uploaded .py) and suggest fixes."""
    source = code
    if file is not None:
        source = await extract_text(file)
    return mock_responses.review_code(source)  # MOCK CALL


@router.post("/case-study")
def case_study(payload: CaseStudyRequest):
    """Feature 8: turn raw notes about an event into a structured case study."""
    return mock_responses.write_case_study(payload.data)  # MOCK CALL


@router.post("/funding")
def funding(payload: FundingRequest):
    """Feature 9: draft a formal funding request."""
    return mock_responses.write_funding_request(payload.idea, payload.budget)  # MOCK CALL


@router.post("/chat")
def chat(payload: ChatRequest):
    """Feature 10: one turn of the interactive pair-programming chat."""
    session_id = payload.session_id or session_store.create_session()
    history = session_store.append_chat(session_id, "user", payload.message)
    result = mock_responses.pair_programming_reply(payload.message, history)  # MOCK CALL
    session_store.append_chat(session_id, "assistant", result["reply"])
    return JSONResponse({"session_id": session_id, **result})
