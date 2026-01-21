"""
Teacher Schemas
Pydantic models for teacher-related request/response validation.
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime


class TeacherBase(BaseModel):
    """Base schema for teacher data."""
    teacher_id: str = Field(..., min_length=1, max_length=50, description="Unique teacher ID")
    name: str = Field(..., min_length=1, max_length=255, description="Teacher's full name")
    email: EmailStr = Field(..., description="Email for login")


class TeacherCreate(TeacherBase):
    """Schema for creating a new teacher."""
    password: str = Field(..., min_length=6, max_length=100, description="Password (min 6 characters)")
    is_admin: bool = Field(default=False, description="Whether teacher has admin privileges")


class TeacherUpdate(BaseModel):
    """Schema for updating an existing teacher."""
    teacher_id: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    email: Optional[EmailStr] = None
    password: Optional[str] = Field(None, min_length=6, max_length=100)
    is_admin: Optional[bool] = None


class TeacherResponse(TeacherBase):
    """Schema for teacher response (excludes password)."""
    id: int
    is_admin: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
