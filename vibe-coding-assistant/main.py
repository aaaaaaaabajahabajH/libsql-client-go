"""Entry point for the Vibe Coding Assistant.

Run with:  python main.py
This starts the FastAPI server AND serves the frontend, so opening
http://127.0.0.1:8000 in a browser is enough to use the whole app.
"""
import threading
import webbrowser

import uvicorn
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.routers import router as api_router

app = FastAPI(title="Vibe Coding Assistant / المساعد الذكي متعدد الوظائف")

# CSS/JS for the frontend live under /static
app.mount("/static", StaticFiles(directory="static"), name="static")

# All 10 features are exposed as JSON endpoints under /api/*
app.include_router(api_router, prefix="/api")


@app.get("/")
def serve_index():
    """Serve the single-page frontend."""
    return FileResponse("static/index.html")


def _open_browser() -> None:
    """Open the app in the default browser once the server has had time to start."""
    webbrowser.open("http://127.0.0.1:8000")


if __name__ == "__main__":
    threading.Timer(1.5, _open_browser).start()
    uvicorn.run(app, host="127.0.0.1", port=8000)
