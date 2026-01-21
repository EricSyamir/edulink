"""
Database Models
"""

from app.models.student import Student
from app.models.teacher import Teacher
from app.models.discipline_record import (
    DisciplineRecord, 
    MisconductSeverity, 
    LightMisconductType, 
    MediumMisconductType
)

__all__ = [
    "Student",
    "Teacher", 
    "DisciplineRecord",
    "MisconductSeverity",
    "LightMisconductType",
    "MediumMisconductType"
]
