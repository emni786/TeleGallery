"""ASGI entrypoint — wraps the Flask app in FastAPI so it can run under uvicorn.

The actual REST API is implemented in :mod:`flask_api` (Flask). This module
exists so the project exposes a single FastAPI ``app`` symbol at
``app:app`` — usable by ``uvicorn app:app`` and Devin's Fly.io deploy tool.

For local dev with gunicorn (Flask WSGI), the Flask app is still available as
``flask_api.app`` via the ``Procfile``.
"""

from __future__ import annotations

from a2wsgi import WSGIMiddleware
from fastapi import FastAPI

from flask_api import app as flask_app

app = FastAPI(title="TeleGallery API", docs_url=None, redoc_url=None)
app.mount("/", WSGIMiddleware(flask_app))
