from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config.settings import settings
from src.utils.logger import get_logger
from src.infrastructure.scheduler.manager import start_scheduler, shutdown_scheduler

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Handles application startup and shutdown lifecycles.
    """
    logger.info("Initializing PriceGuard Application...")
    
    # Start the background task scheduler
    start_scheduler()
    
    yield
    
    logger.info("Shutting down PriceGuard Application...")
    
    # Shutdown the background task scheduler
    shutdown_scheduler()


# Create FastAPI application instance
app = FastAPI(
    title="PriceGuard API",
    description="Automated E-Commerce Price Tracker & Alert System API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
origins = []
if isinstance(settings.CORS_ORIGINS, list):
    origins = settings.CORS_ORIGINS
else:
    origins = [settings.CORS_ORIGINS]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global health check endpoints
@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": app.version
    }


# Import and include routers
from src.presentation.api.v1 import api_router

app.include_router(api_router, prefix="/api/v1")
