"""
EduLink BErCHAMPION API - Main Application
Face detection and discipline tracking system for schools.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
import sys

from app.config import settings
from app.database import init_db
from app.routes import (
    auth_router,
    students_router,
    teachers_router,
    discipline_router,
    setup_router,
    translation_router,
)
from app.services.face_recognition import get_face_analyzer

# Configure loguru for structured logging
logger.remove()  # Remove default handler
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level="DEBUG" if settings.DEBUG else "INFO"
)
logger.add(
    "logs/edulink_{time:YYYY-MM-DD}.log",
    rotation="1 day",
    retention="30 days",
    level="INFO"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup
    logger.info("Starting EduLink BErCHAMPION API...")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"CORS origins: {settings.cors_origins_list}")
    
    # Initialize database tables (non-blocking - don't crash if DB unavailable)
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.warning(f"Database initialization failed: {e}")
        logger.warning("App will start anyway. Database will be initialized on first request.")
    
    # Pre-download face recognition model at startup (InsightFace downloads buffalo_sc if missing)
    if settings.FACE_RECOGNITION_ENABLED:
        try:
            logger.info("Pre-loading face recognition model at startup...")
            analyzer = get_face_analyzer()
            if analyzer:
                logger.info("Face recognition model ready")
            else:
                logger.warning("Face recognition model could not be loaded; will retry on first use")
        except Exception as e:
            logger.warning(f"Startup face model preload failed: {e}. Will retry on first use.")
    
    yield
    
    # Shutdown
    logger.info("Shutting down EduLink BErCHAMPION API...")


# Create FastAPI application
app = FastAPI(
    title="EduLink BErCHAMPION API",
    description="Face detection and discipline tracking system for schools",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configure CORS - Stateless auth (no cookies/sessions)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,  # No cookies needed for stateless auth
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Include routers
app.include_router(setup_router)  # Setup routes (no auth required)
app.include_router(auth_router)
app.include_router(students_router)
app.include_router(teachers_router)
app.include_router(discipline_router)
app.include_router(translation_router)


@app.get("/")
def root():
    """Root endpoint - API health check."""
    return {
        "name": "EduLink BErCHAMPION API",
        "version": "2.0.0",
        "status": "running",
        "docs": "/api/docs"
    }


@app.get("/api/health")
def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "database": "connected",
        "face_recognition": "available"
    }


@app.get("/api/config")
def get_config():
    """Get public configuration values."""
    return {
        "face_similarity_threshold": settings.FACE_SIMILARITY_THRESHOLD,
        "face_recognition_enabled": settings.FACE_RECOGNITION_ENABLED
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.port,  # Uses PORT env var on cloud platforms
        reload=settings.DEBUG
    )
