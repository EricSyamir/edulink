"""
Application Configuration Module
Loads settings from environment variables with sensible defaults.
"""

from pydantic_settings import BaseSettings
from typing import List
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # Database
    DATABASE_URL: str = "postgresql+psycopg2://postgres:YOUR_PASSWORD@db.stkxcgpvzjpkblihoshz.supabase.co:5432/postgres"
    
    # Session Authentication
    SESSION_SECRET_KEY: str = "your-super-secret-session-key-change-in-production"
    SESSION_COOKIE_NAME: str = "edulink_session"
    SESSION_MAX_AGE: int = 86400  # 24 hours in seconds
    
    # Face Recognition
    FACE_SIMILARITY_THRESHOLD: float = 0.5  # Cosine similarity threshold (0-1)
    FACE_MODEL_NAME: str = "buffalo_sc"  # Smaller model, uses less memory than buffalo_l
    FACE_RECOGNITION_ENABLED: bool = True  # Set to False to disable face recognition (saves memory)
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000  # Will be overridden by PORT env var on cloud platforms
    DEBUG: bool = True
    
    @property
    def port(self) -> int:
        """Get port from environment variable PORT if available (for cloud platforms)."""
        import os
        return int(os.getenv("PORT", self.PORT))
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:5173"
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance for easy imports
settings = get_settings()
