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

# The React dev server (Vite) runs on a different port, so it needs CORS.
allowed_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
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
