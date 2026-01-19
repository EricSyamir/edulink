"""
Student Schemas
Pydantic models for student-related request/response validation.
"""

from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime


class StudentBase(BaseModel):
    """Base schema for student data."""
    student_id: str = Field(..., min_length=1, max_length=50, description="Unique school ID")
    name: str = Field(..., min_length=1, max_length=255, description="Student's full name")
    class_name: str = Field(..., min_length=1, max_length=100, description="Class name (e.g., '3 Amanah')")
    standard: int = Field(..., ge=1, le=6, description="Grade level (1-6)")


class StudentCreate(StudentBase):
    """Schema for creating a new student."""
    face_image: Optional[str] = Field(None, description="Base64 encoded face image")
    
    @field_validator("face_image")
    @classmethod
    def validate_face_image(cls, v):
        """Validate that face image is a valid base64 string if provided."""
        if v is not None and len(v) < 100:
            raise ValueError("Face image appears too small to be a valid image")
        return v


class StudentUpdate(BaseModel):
    """Schema for updating an existing student."""
    student_id: Optional[str] = Field(None, min_length=1, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    class_name: Optional[str] = Field(None, min_length=1, max_length=100)
    standard: Optional[int] = Field(None, ge=1, le=6)
    face_image: Optional[str] = Field(None, description="Base64 encoded face image to update")


class StudentResponse(StudentBase):
    """Schema for student response (without embedding)."""
    id: int
    created_at: datetime
    updated_at: datetime
    has_face_embedding: bool = Field(description="Whether student has a registered face")
    
    class Config:
        from_attributes = True


class StudentWithPoints(StudentResponse):
    """Schema for student response with current points."""
    current_points: int = Field(default=100, description="Current Sahsiah points")
    
    class Config:
        from_attributes = True


class StudentIdentifyResponse(BaseModel):
    """Schema for face identification response."""
    matched: bool = Field(description="Whether a matching student was found")
    match_confidence: Optional[float] = Field(None, ge=0, le=1, description="Similarity score (0-1)")
    student: Optional[StudentWithPoints] = Field(None, description="Matched student data")
    message: str = Field(description="Status message")
