"""
PriceGuard API — the web equivalent of main.py's CLI menu.

Run with:  uvicorn app.main:app --reload --port 8000
Docs at:   http://localhost:8000/docs
"""

from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from .routers import alerts, auth, monitor, products, stats  # noqa: E402 (needs load_dotenv first)

app = FastAPI(
    title="PriceGuard API",
    description="Automated E-Commerce Price Tracker & Alert System",
    version="1.0.0",
)

# Build allowed origins list — strip spaces and trailing slashes
cors_origins_env = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
allowed_origins = [o.strip().rstrip("/") for o in cors_origins_env.split(",") if o.strip()]

# Always include localhost for local dev
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

app.include_router(auth.router)
app.include_router(products.router)
app.include_router(monitor.router)
app.include_router(stats.router)
app.include_router(alerts.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "PriceGuard API"}
