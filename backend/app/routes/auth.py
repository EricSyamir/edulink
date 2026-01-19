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
from app.services.auth import AuthService
# Authentication disabled - get_current_teacher removed
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
    # Each browser/device gets its own unique session cookie, allowing multiple concurrent logins
    # Previous sessions from other browsers/devices remain valid and are not invalidated
    AuthService.set_session(request, teacher.id)
    
    # Log session details for debugging
    logger.info(f"Session created for teacher_id: {teacher.id} (allows concurrent logins from other browsers)")
    
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
def get_current_user():
    """
    Get current user info - authentication disabled, returns dummy data.
    """
    return {
        "id": 1,
        "teacher_id": "T000001",
        "name": "Public User",
        "email": "public@edulink.com"
    }


@router.post("/logout")
def logout(request: Request):
    """
    Logout endpoint - authentication disabled, no-op.
    """
    return {"message": "Logout successful (authentication disabled)"}
