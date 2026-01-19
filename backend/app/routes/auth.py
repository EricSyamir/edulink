"""
Authentication Routes
Handles teacher login and session management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from loguru import logger

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
    
    # Set session (Starlette SessionMiddleware will automatically set cookie in response)
    AuthService.set_session(request, teacher.id)
    
    # Log session details for debugging
    logger.info(f"Session set for teacher_id: {teacher.id}, session keys: {list(request.session.keys())}")
    
    # Ensure session is saved by accessing it (forces Starlette to serialize)
    # This ensures the cookie is set in the response
    session_data = dict(request.session)
    logger.debug(f"Session data to be serialized: {session_data}")
    
    # Return JSON response - SessionMiddleware will add the cookie header
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "Login successful",
            "teacher": {
                "id": teacher.id,
                "teacher_id": teacher.teacher_id,
                "name": teacher.name,
                "email": teacher.email
            }
        }
    )


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
