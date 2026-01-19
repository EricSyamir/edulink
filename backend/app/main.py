"""
Edulink API - Main Application
Face detection and discipline tracking system for schools.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# SessionMiddleware removed - no cookies/sessions
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from loguru import logger
import sys
from typing import Callable

from app.config import settings
from app.database import init_db
from app.routes import auth_router, students_router, teachers_router, discipline_router, setup_router

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
    logger.info(f"Session cookie SameSite: {'none' if not settings.DEBUG else 'lax'}")
    logger.info(f"Session cookie Secure (HTTPS only): {not settings.DEBUG}")
    
    # Warn if DEBUG is True in what looks like production
    if settings.DEBUG and not any("localhost" in origin for origin in settings.cors_origins_list):
        logger.warning("⚠️ DEBUG=True detected but CORS origins suggest production!")
        logger.warning("⚠️ Set DEBUG=False in production for cross-origin cookies to work!")
    
    # Initialize database tables (non-blocking - don't crash if DB unavailable)
    try:
        init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.warning(f"Database initialization failed: {e}")
        logger.warning("App will start anyway. Database will be initialized on first request.")
    
    # Note: Face recognition model is loaded lazily on first use to save memory during startup
    # This prevents OOM errors on platforms with limited memory (e.g., Render free tier)
    
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

# Configure CORS - No cookies needed, simplified
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,  # No cookies needed
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Session middleware removed - no cookies, no sessions, just basic login

# Debug middleware to log cookie headers (runs after SessionMiddleware)
# Middleware executes in reverse order, so this runs AFTER SessionMiddleware
class CookieDebugMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        response = await call_next(request)
        # Log Set-Cookie headers for debugging (especially for login endpoint)
        set_cookie_headers = response.headers.getlist("set-cookie")
        if set_cookie_headers and "/api/auth/login" in str(request.url):
            logger.info(f"🔐 Login response Set-Cookie headers: {set_cookie_headers}")
        return response

# Add debug middleware AFTER SessionMiddleware (so it can see the cookies)
app.add_middleware(CookieDebugMiddleware)

# Include routers
app.include_router(setup_router)  # Setup routes (no auth required)
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
