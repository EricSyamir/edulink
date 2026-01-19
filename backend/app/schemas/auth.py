"""
Authentication Schemas
Pydantic models for authentication request/response validation.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    """Schema for login request."""
    email: EmailStr = Field(..., description="Teacher's email")
    password: str = Field(..., min_length=1, description="Password")


class TokenResponse(BaseModel):
    """Schema for JWT token response."""
    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(description="Token expiration time in seconds")
    teacher: dict = Field(description="Teacher information")


class TokenData(BaseModel):
    """Schema for decoded JWT token data."""
    teacher_id: Optional[int] = None
    email: Optional[str] = None
