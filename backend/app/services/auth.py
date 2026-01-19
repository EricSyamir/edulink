"""
Authentication Service
Handles teacher authentication and authorization.
"""

from datetime import timedelta
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from loguru import logger

from app.models import Teacher
from app.schemas.auth import TokenResponse, TokenData
from app.utils.security import verify_password, create_access_token, decode_access_token
from app.config import settings
from app.database import get_db

# Bearer token security scheme
security = HTTPBearer()


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
    def create_token_response(teacher: Teacher) -> TokenResponse:
        """
        Create a JWT token response for authenticated teacher.
        
        Args:
            teacher: Authenticated teacher object
        
        Returns:
            TokenResponse with access token and teacher info
        """
        # Token payload
        token_data = {
            "sub": str(teacher.id),
            "email": teacher.email,
            "teacher_id": teacher.teacher_id
        }
        
        # Create access token
        access_token = create_access_token(token_data)
        
        # Calculate expiration in seconds
        expires_in = settings.JWT_EXPIRATION_HOURS * 3600
        
        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            expires_in=expires_in,
            teacher={
                "id": teacher.id,
                "teacher_id": teacher.teacher_id,
                "name": teacher.name,
                "email": teacher.email
            }
        )
    
    @staticmethod
    def get_current_teacher_from_token(token: str, db: Session) -> Teacher:
        """
        Get current teacher from JWT token.
        
        Args:
            token: JWT token string
            db: Database session
        
        Returns:
            Teacher object
        
        Raises:
            HTTPException: If token is invalid or teacher not found
        """
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        payload = decode_access_token(token)
        
        if payload is None:
            raise credentials_exception
        
        teacher_id: str = payload.get("sub")
        
        if teacher_id is None:
            raise credentials_exception
        
        teacher = db.query(Teacher).filter(Teacher.id == int(teacher_id)).first()
        
        if teacher is None:
            raise credentials_exception
        
        return teacher


# Dependency function for protected routes
async def get_current_teacher(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Teacher:
    """
    FastAPI dependency to get current authenticated teacher.
    Use this in route dependencies to protect endpoints.
    
    Usage:
        @router.get("/protected")
        def protected_route(teacher: Teacher = Depends(get_current_teacher)):
            return {"teacher": teacher.name}
    """
    return AuthService.get_current_teacher_from_token(credentials.credentials, db)


# Global service instance
auth_service = AuthService()
