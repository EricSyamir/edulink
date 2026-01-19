"""
Authentication Routes - Basic login only, no cookies/sessions
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from loguru import logger

from app.database import get_db
from app.schemas.auth import LoginRequest
from app.services.auth import AuthService, get_current_teacher
from app.models import Teacher

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login")
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Basic login - checks credentials and returns teacher data + teacher ID for auth header.
    Frontend should send teacher ID in Authorization header for protected routes.
    """
    teacher = AuthService.authenticate_teacher(db, login_data.email, login_data.password)
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    logger.info(f"Login successful for teacher_id: {teacher.id}")
    
    return {
        "message": "Login successful",
        "teacher": {
            "id": teacher.id,
            "teacher_id": teacher.teacher_id,
            "name": teacher.name,
            "email": teacher.email
        },
        "token": str(teacher.id)  # Simple token = teacher ID (send in Authorization header)
    }


@router.get("/me")
def get_current_user(teacher: Teacher = Depends(get_current_teacher)):
    """
    Get current authenticated teacher's information.
    Requires Authorization header with teacher ID.
    """
    return {
        "id": teacher.id,
        "teacher_id": teacher.teacher_id,
        "name": teacher.name,
        "email": teacher.email
    }


@router.post("/logout")
def logout():
    """
    Logout - no-op, just returns success.
    Frontend should clear localStorage.
    """
    return {"message": "Logout successful"}
