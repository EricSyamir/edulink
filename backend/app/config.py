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
    DATABASE_URL: str = "mysql+pymysql://root:@localhost:3306/edulink_db"
    
    # JWT Authentication
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 24
    
    # Face Recognition
    FACE_SIMILARITY_THRESHOLD: float = 0.5  # Cosine similarity threshold (0-1)
    FACE_MODEL_NAME: str = "buffalo_l"
    
    # Discipline Points
    DEFAULT_REWARD_POINTS: int = 10
    DEFAULT_PUNISHMENT_POINTS: int = -10
    INITIAL_STUDENT_POINTS: int = 100
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
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
