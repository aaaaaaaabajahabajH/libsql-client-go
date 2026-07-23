"""Central place for environment-driven configuration.

NOTE: ANTHROPIC_API_KEY / CLAUDE_MODEL are not used anywhere yet.
All "AI" replies currently come from app/mock_responses.py.

--- HOW TO SWITCH TO THE REAL CLAUDE API ---
1. pip install anthropic
2. export ANTHROPIC_API_KEY=sk-ant-...   (or put it in a .env file and load it)
3. In app/routers.py, replace each `mock_responses.xxx(...)` call with a real
   call such as:
       import anthropic
       client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)
       client.messages.create(model=config.CLAUDE_MODEL, max_tokens=1024, messages=[...])
"""
import os

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
CLAUDE_MODEL = os.getenv("CLAUDE_MODEL", "claude-sonnet-5")

# Upload constraints used by app/file_utils.py
ALLOWED_UPLOAD_EXTENSIONS = {".pdf", ".docx", ".txt", ".py"}
MAX_UPLOAD_SIZE_MB = 10
