"""
Authentication Routes
Handles teacher login and token management.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import LoginRequest, TokenResponse
from app.services.auth import AuthService, get_current_teacher
from app.models import Teacher

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate a teacher and return JWT token.
    
    - **email**: Teacher's registered email
    - **password**: Teacher's password
    
    Returns JWT token on successful authentication.
    """
    teacher = AuthService.authenticate_teacher(db, request.email, request.password)
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return AuthService.create_token_response(teacher)


@router.get("/me")
def get_current_user(teacher: Teacher = Depends(get_current_teacher)):
    """
    Get current authenticated teacher's information.
    
    Requires valid JWT token in Authorization header.
    """
    return {
        "id": teacher.id,
        "teacher_id": teacher.teacher_id,
        "name": teacher.name,
        "email": teacher.email
    }


@router.post("/logout")
def logout(teacher: Teacher = Depends(get_current_teacher)):
    """
    Logout endpoint (client-side token removal).
    
    Note: JWT tokens are stateless, so actual logout is handled client-side
    by removing the token. This endpoint just confirms the token was valid.
    """
    return {"message": "Successfully logged out", "teacher_id": teacher.teacher_id}
