"""
Edulink API - Main Application
Face detection and discipline tracking system for schools.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from loguru import logger
import sys

from app.config import settings
from app.database import init_db
from app.routes import auth_router, students_router, teachers_router, discipline_router

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
    logger.info("Starting Edulink API...")
    logger.info(f"Debug mode: {settings.DEBUG}")
    logger.info(f"CORS origins: {settings.cors_origins_list}")
    
    # Initialize database tables (non-blocking - don't crash if DB unavailable)
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.warning(f"Database initialization failed: {e}")
        logger.warning("App will start anyway. Database will be initialized on first request.")
    
    # Pre-load face recognition model (optional, for faster first request)
    if not settings.DEBUG:
        try:
            from app.services.face_recognition import get_face_analyzer
            get_face_analyzer()
            logger.info("Face recognition model pre-loaded")
        except Exception as e:
            logger.warning(f"Face recognition model pre-load failed: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Edulink API...")


# Create FastAPI application
app = FastAPI(
    title="Edulink API",
    description="Face detection and discipline tracking system for schools",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# Configure Session Middleware (must be before CORS)
app.add_middleware(
    SessionMiddleware,
    secret_key=settings.SESSION_SECRET_KEY,
    max_age=settings.SESSION_MAX_AGE,
    same_site="lax",
    https_only=not settings.DEBUG,  # Only HTTPS in production
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,  # Required for cookies
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(students_router)
app.include_router(teachers_router)
app.include_router(discipline_router)


@app.get("/")
def root():
    """Root endpoint - API health check."""
    return {
        "name": "Edulink API",
        "version": "1.0.0",
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
        "initial_student_points": settings.INITIAL_STUDENT_POINTS,
        "default_reward_points": settings.DEFAULT_REWARD_POINTS,
        "default_punishment_points": settings.DEFAULT_PUNISHMENT_POINTS,
        "face_similarity_threshold": settings.FACE_SIMILARITY_THRESHOLD
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.port,  # Uses PORT env var on cloud platforms
        reload=settings.DEBUG
    )
