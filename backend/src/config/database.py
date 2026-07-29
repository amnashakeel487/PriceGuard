import os
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from src.config.settings import settings
from src.utils.logger import get_logger

logger = get_logger(__name__)

# Fetch database configuration from setting module
DATABASE_URL = settings.DATABASE_URL

# Connect arguments (specifically check_same_thread for SQLite)
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False
    logger.debug("SQLAlchemy configured for SQLite connection pooling bypass.")

try:
    # Initialize Engine
    engine = create_engine(
        DATABASE_URL,
        connect_args=connect_args,
        echo=settings.ENVIRONMENT == "dev"
    )
    
    # Initialize SessionLocal
    SessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine
    )
    
    logger.info("SQLAlchemy database engine initialized successfully.")
except Exception as e:
    logger.critical(f"SQLAlchemy initialization failure for URI '{DATABASE_URL}': {e}")
    raise e

# Core declarative Base model
Base = declarative_base()


def get_db() -> Generator:
    """FastAPI database dependency utility.
    
    Yields:
        Generator: SQLAlchemy session local instances.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
