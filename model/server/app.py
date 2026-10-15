"""Unfilterd Vibe v1 HTTP endpoint.

POST /analyze {"text": "..."} -> VibeAnalysis JSON;  GET /health.
Logs only method, path, status and latency. Post text is never logged or stored.
"""
from __future__ import annotations

import logging
import os
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, StrictStr

from infer import VibeAnalyzer

logger = logging.getLogger("vibe")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")

ALLOWED_ORIGINS = [o.strip() for o in os.environ.get(
    "VIBE_ALLOWED_ORIGINS", "https://unfilterd.vercel.app,http://localhost:5173").split(",") if o.strip()]

app = FastAPI(title="Unfilterd Vibe v1", docs_url=None, redoc_url=None, openapi_url=None)
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=["GET", "POST"],
                   allow_headers=["content-type"], max_age=86400)
analyzer = VibeAnalyzer()


class AnalyzeRequest(BaseModel):
    text: StrictStr = Field(max_length=20000)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    logger.info("%s %s %s %.0fms", request.method, request.url.path, response.status_code,
                (time.perf_counter() - start) * 1000)
    return response


@app.get("/health")
def health() -> dict:
    return {"ok": True, "model": "vibe-v1"}


@app.post("/analyze")
def analyze(body: AnalyzeRequest) -> dict:
    return analyzer.analyze(body.text)
