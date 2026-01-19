"""
Authentication Service - Simple header-based auth (no cookies/sessions)
"""

from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends, Request, Header
from loguru import logger

from app.models import Teacher
from app.utils.security import verify_password
from app.database import get_db


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
    def get_teacher_from_token(teacher_id: str, db: Session) -> Teacher:
        """
        Get teacher from teacher ID token (simple header-based auth).
        
        Args:
            teacher_id: Teacher ID from Authorization header
            db: Database session
        
        Returns:
            Teacher object
        
        Raises:
            HTTPException: If teacher not found
        """
        try:
            teacher_id_int = int(teacher_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )
        
        teacher = db.query(Teacher).filter(Teacher.id == teacher_id_int).first()
        
        if teacher is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
            )
        
        return teacher


# Dependency function for protected routes - reads teacher ID from Authorization header
async def get_current_teacher(
    authorization: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
) -> Teacher:
    """
    FastAPI dependency to get current authenticated teacher from Authorization header.
    Simple header-based auth: send "Authorization: <teacher_id>" header.
    
    Usage:
        @router.get("/protected")
        def protected_route(teacher: Teacher = Depends(get_current_teacher)):
            return {"teacher": teacher.name}
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated - Authorization header required",
        )
    
    # Remove "Bearer " prefix if present, otherwise use as-is
    teacher_id = authorization.replace("Bearer ", "").strip()
    
    return AuthService.get_teacher_from_token(teacher_id, db)


# Global service instance
auth_service = AuthService()
