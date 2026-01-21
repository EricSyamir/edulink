"""
EduLink BErCHAMPION API - Main Application
Face detection and discipline tracking system for schools.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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
    
    # Note: Face recognition model is loaded lazily on first use to save memory during startup
    # This prevents OOM errors on platforms with limited memory (e.g., Render free tier)
    
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

# Configure CORS - No cookies needed, simplified
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=False,  # No cookies needed
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Debug middleware to log cookie headers
class CookieDebugMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable):
        response = await call_next(request)
        # Log Set-Cookie headers for debugging (especially for login endpoint)
        set_cookie_headers = response.headers.getlist("set-cookie")
        if set_cookie_headers and "/api/auth/login" in str(request.url):
            logger.info(f"🔐 Login response Set-Cookie headers: {set_cookie_headers}")
        return response

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
