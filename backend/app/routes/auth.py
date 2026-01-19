"""
Authentication Routes - Basic login only, no cookies/sessions
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from loguru import logger

from app.database import get_db
from app.schemas.auth import LoginRequest
from app.services.auth import AuthService

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login")
def login(
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Basic login - just checks credentials and returns teacher data.
    No cookies, no sessions, no authentication checks after this.
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
        }
    }


@router.get("/me")
def get_current_user():
    """
    Get current user - no authentication, returns dummy data.
    Frontend can store teacher data in localStorage after login.
    """
    return {
        "id": 1,
        "teacher_id": "T000001",
        "name": "Logged In User",
        "email": "user@edulink.com"
    }


@router.post("/logout")
def logout():
    """
    Logout - no-op, just returns success.
    Frontend should clear localStorage.
    """
    return {"message": "Logout successful"}
