"""
Discipline Record Schemas
Pydantic models for discipline record request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class DisciplineRecordCreate(BaseModel):
    """Schema for creating a new discipline record."""
    student_id: int = Field(..., description="Student's database ID")
    type: Literal["reward", "punishment"] = Field(..., description="Record type")
    points_change: Optional[int] = Field(None, description="Points change (uses default if not provided)")
    reason: Optional[str] = Field(None, max_length=1000, description="Optional reason for the record")


class DisciplineRecordResponse(BaseModel):
    """Schema for discipline record response."""
    id: int
    student_id: int
    teacher_id: Optional[int]
    type: str
    points_change: int
    reason: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


class DisciplineRecordWithDetails(DisciplineRecordResponse):
    """Schema for discipline record with student and teacher details."""
    student_name: str = Field(description="Name of the student")
    student_school_id: str = Field(description="Student's school ID")
    teacher_name: Optional[str] = Field(None, description="Name of the teacher who created the record")
    
    class Config:
        from_attributes = True


class StudentDisciplineHistory(BaseModel):
    """Schema for student's discipline history."""
    student_id: int
    student_name: str
    current_points: int
    total_rewards: int
    total_punishments: int
    records: list[DisciplineRecordWithDetails]
