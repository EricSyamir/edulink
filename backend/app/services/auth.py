"""
Authentication Service
Handles teacher authentication and authorization using sessions.
"""

from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends, Request
from loguru import logger

from app.models import Teacher
from app.utils.security import verify_password
from app.database import get_db

# Session key for storing teacher ID
SESSION_KEY_TEACHER_ID = "teacher_id"


class AuthService:
    """Service for handling authentication operations."""
    
    @staticmethod
    def authenticate_teacher(db: Session, email: str, password: str) -> Optional[Teacher]:
        """
        Authenticate a teacher by email and password.
        
        Args:
            db: Database session
            email: Teacher's email
            password: Plain text password
        
        Returns:
            Teacher object if authenticated, None otherwise
        """
        teacher = db.query(Teacher).filter(Teacher.email == email).first()
        
        if not teacher:
            logger.warning(f"Login attempt for non-existent email: {email}")
            return None
        
        if not verify_password(password, teacher.password_hash):
            logger.warning(f"Invalid password attempt for email: {email}")
            return None
        
        logger.info(f"Teacher authenticated: {email}")
        return teacher
    
    @staticmethod
    def set_session(request: Request, teacher_id: int):
        """
        Set teacher ID in session.
        
        Args:
            request: FastAPI request object
            teacher_id: Teacher's database ID
        """
        request.session[SESSION_KEY_TEACHER_ID] = teacher_id
        logger.debug(f"Session set for teacher_id: {teacher_id}")
    
    @staticmethod
    def clear_session(request: Request):
        """
        Clear session data.
        
        Args:
            request: FastAPI request object
        """
        request.session.clear()
        logger.debug("Session cleared")
    
    @staticmethod
    def get_current_teacher_from_session(request: Request, db: Session) -> Teacher:
        """
        Get current teacher from session.
        
        Args:
            request: FastAPI request object
            db: Database session
        
        Returns:
            Teacher object
        
        Raises:
            HTTPException: If session is invalid or teacher not found
        """
        teacher_id = request.session.get(SESSION_KEY_TEACHER_ID)
        
        if teacher_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
        
        teacher = db.query(Teacher).filter(Teacher.id == int(teacher_id)).first()
        
        if teacher is None:
            # Invalid session, clear it
            AuthService.clear_session(request)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid session",
            )
        
        return teacher


# Dependency function for protected routes
async def get_current_teacher(
    request: Request,
    db: Session = Depends(get_db)
) -> Teacher:
    """
    FastAPI dependency to get current authenticated teacher from session.
    Use this in route dependencies to protect endpoints.
    
    Usage:
        @router.get("/protected")
        def protected_route(teacher: Teacher = Depends(get_current_teacher)):
            return {"teacher": teacher.name}
    """
    return AuthService.get_current_teacher_from_session(request, db)


# Global service instance
auth_service = AuthService()
