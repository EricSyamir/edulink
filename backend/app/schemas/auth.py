"""
Authentication Schemas
Pydantic models for authentication request/response validation.
"""

from pydantic import BaseModel, Field, EmailStr


class LoginRequest(BaseModel):
    """Schema for login request."""
    email: EmailStr = Field(..., description="Teacher's email")
    password: str = Field(..., min_length=1, description="Password")
