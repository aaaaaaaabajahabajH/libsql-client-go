"""In-memory session storage.

Sessions live only as long as this process is running: everything is lost on
restart. That is intentional (see project requirements) so no database setup
is needed to try the app out.
"""
import uuid
from typing import Any, Dict, List

# session_id -> per-session data (currently just chat history for feature 10)
_sessions: Dict[str, Dict[str, Any]] = {}


def create_session() -> str:
    """Create a new empty session and return its id."""
    session_id = str(uuid.uuid4())
    _sessions[session_id] = {"chat_history": []}
    return session_id


def get_session(session_id: str) -> Dict[str, Any]:
    """Return a session dict, creating it on the fly if the id is unknown."""
    if session_id not in _sessions:
        _sessions[session_id] = {"chat_history": []}
    return _sessions[session_id]


def append_chat(session_id: str, role: str, content: str) -> List[dict]:
    """Add one message to a session's chat history and return the full history."""
    session = get_session(session_id)
    session["chat_history"].append({"role": role, "content": content})
    return session["chat_history"]
