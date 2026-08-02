"""
PriceGuard API — the web equivalent of main.py's CLI menu.

Run with:  uvicorn app.main:app --reload --port 8000
Docs at:   http://localhost:8000/docs
"""

from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI, Request as FastAPIRequest
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response

load_dotenv()

from .routers import alerts, auth, monitor, products, stats  # noqa: E402

app = FastAPI(
    title="PriceGuard API",
    description="Automated E-Commerce Price Tracker & Alert System",
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
# Base list from env var (for explicit production origins)
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
allowed_origins = [o.strip().rstrip("/") for o in cors_origins_env.split(",") if o.strip()]
for local in ["http://localhost:5173", "http://127.0.0.1:5173"]:
    if local not in allowed_origins:
        allowed_origins.append(local)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _is_allowed_origin(origin: str) -> bool:
    """Dynamically allow any vercel.app preview URL + localhost."""
    if not origin:
        return False
    if origin.endswith(".vercel.app"):
        return True
    if origin.startswith("http://localhost") or origin.startswith("http://127.0.0.1"):
        return True
    return origin.rstrip("/") in allowed_origins


@app.middleware("http")
async def dynamic_cors_middleware(request: FastAPIRequest, call_next):
    """Inject CORS headers for any vercel.app origin not in the static list."""
    origin = request.headers.get("origin", "")

    # Handle preflight directly
    if request.method == "OPTIONS" and _is_allowed_origin(origin):
        response = Response(status_code=200)
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Cookie, Set-Cookie"
        response.headers["Access-Control-Max-Age"] = "86400"
        return response

    response = await call_next(request)

    if _is_allowed_origin(origin):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Vary"] = "Origin"

    return response


app.include_router(auth.router)
app.include_router(products.router)
app.include_router(monitor.router)
app.include_router(stats.router)
app.include_router(alerts.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "PriceGuard API"}
