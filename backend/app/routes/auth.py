"""
Authentication Routes
Handles teacher login and session management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import LoginRequest
from app.services.auth import AuthService, get_current_teacher
from app.models import Teacher
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login")
def login(
    request: Request,
    response: Response,
    login_data: LoginRequest,
    db: Session = Depends(get_db)
):
    """
    Authenticate a teacher and create a session.
    
    - **email**: Teacher's registered email
    - **password**: Teacher's password
    
    Creates a secure session cookie on successful authentication.
    """
    teacher = AuthService.authenticate_teacher(db, login_data.email, login_data.password)
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Set session
    AuthService.set_session(request, teacher.id)
    
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
def get_current_user(teacher: Teacher = Depends(get_current_teacher)):
    """
    Get current authenticated teacher's information.
    
    Requires valid session cookie.
    """
    return {
        "id": teacher.id,
        "teacher_id": teacher.teacher_id,
        "name": teacher.name,
        "email": teacher.email
    }


@router.post("/logout")
def logout(request: Request, teacher: Teacher = Depends(get_current_teacher)):
    """
    Logout endpoint - clears session.
    """
    AuthService.clear_session(request)
    return {"message": "Successfully logged out", "teacher_id": teacher.teacher_id}
