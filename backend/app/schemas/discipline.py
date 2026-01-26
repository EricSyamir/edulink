"""
Discipline Record Schemas
Pydantic models for discipline record request/response validation.
"""

from pydantic import BaseModel, Field
from typing import Optional, Literal, List
from datetime import datetime


# Light misconduct types
LIGHT_MISCONDUCT_TYPES = [
    "Defacing school area",
    "Stepping on grass in prohibited areas",
    "Not disposing of trash properly",
    "Late to school/class",
    "Making noise in class",
    "Not bringing books/completing homework/assignments",
    "Not paying attention during teacher's lesson",
    "Being in canteen or other places during school hours (except recess)",
    "Not following laboratory/workshop/special room rules",
    "Late moving to assembly/workshop/laboratory",
    "Leaving class without permission",
    "Late to prayer room",
    "Keeping mustache, beard and sideburns",
    "Long hair or resembling certain groups",
    "Wearing jewelry/ornaments/makeup",
    "Not wearing school uniform neatly/complete",
    "Dyeing hair",
    "Playing in class, corridor or prohibited areas",
    "Using and taking out school equipment without permission",
    "Storing or using school gaming equipment without permission",
    "Using school entertainment or electronic devices without permission",
    "Eating or drinking in class/special rooms",
    "Wandering during school hours",
    "Bringing and using mobile phones, MP3 and MP4",
    "Riding or driving motorized vehicles in school area",
    "Bringing walkman/discman to class",
    "Disturbing public order",
    "Entering special rooms without permission",
    "Ordering and buying food from outside without permission",
    "Other offenses interpreted by principal (light category)"
]

# Medium misconduct types
MEDIUM_MISCONDUCT_TYPES = [
    "Third occurrence of any light offense",
    "Misusing school electrical equipment/power sources without permission",
    "Dishonesty, cheating, lying and copying during tests/examinations",
    "Absenteeism from any official school event",
    "Not respecting school/state/national anthems/flags/emblems",
    "Excessive ear piercing/multiple earrings on one ear/excessive jewelry (fashion)",
    "Vandalizing school property",
    "Extreme hairstyles like punk/skinhead or colored",
    "Disturbing teacher during lesson",
    "Other offenses interpreted by principal (medium category)"
]


class DisciplineRecordCreate(BaseModel):
    """Schema for creating a new discipline record."""
    student_id: int = Field(..., description="Student's database ID")
    severity: Literal["light", "medium"] = Field(..., description="Misconduct severity")
    misconduct_type: str = Field(..., max_length=100, description="Type of misconduct")
    notes: Optional[str] = Field(None, max_length=1000, description="Optional notes about the incident")


class DisciplineRecordResponse(BaseModel):
    """Schema for discipline record response."""
    id: int
    student_id: int
    teacher_id: Optional[int]
    severity: str
    misconduct_type: str
    notes: Optional[str]
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


class MisconductTypeList(BaseModel):
    """Schema for listing misconduct types."""
    light: List[str] = Field(default=LIGHT_MISCONDUCT_TYPES)
    medium: List[str] = Field(default=MEDIUM_MISCONDUCT_TYPES)


class StudentDisciplineHistory(BaseModel):
    """Schema for student's discipline history."""
    student_id: int
    student_name: str
    light_total: int
    light_monthly: int
    medium_total: int
    medium_monthly: int
    records: List[DisciplineRecordWithDetails]


class FormStatistics(BaseModel):
    """Statistics for a single form."""
    form: int
    total_students: int
    light_misconducts: int
    medium_misconducts: int
    light_monthly: int
    medium_monthly: int


class ClassStatistics(BaseModel):
    """Statistics for a single class."""
    class_name: str
    form: int
    total_students: int
    light_misconducts: int
    medium_misconducts: int
    light_monthly: int
    medium_monthly: int


class AnalyticsTrend(BaseModel):
    """Trend data for analytics."""
    date: str
    light_count: int
    medium_count: int


class DashboardAnalytics(BaseModel):
    """Schema for dashboard analytics."""
    total_students: int
    total_light_misconducts: int
    total_medium_misconducts: int
    monthly_light_misconducts: int
    monthly_medium_misconducts: int
    trends: List[AnalyticsTrend]
    top_offenders: List[dict]
    misconduct_type_breakdown: dict = Field(default_factory=dict, description="Breakdown by misconduct type")