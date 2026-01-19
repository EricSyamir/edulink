"""
Services Package
Business logic and external service integrations.
"""

from app.services.face_recognition import FaceRecognitionService
from app.services.auth import AuthService
from app.services.discipline import DisciplineService

__all__ = ["FaceRecognitionService", "AuthService", "DisciplineService"]
