"""
Pydantic Schemas Package
Exports all request/response schemas for API validation.
"""

from app.schemas.student import (
    StudentBase,
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    StudentWithMisconducts,
    StudentIdentifyResponse,
    MisconductStats,
    BulkFormUpdate,
)
from app.schemas.teacher import (
    TeacherBase,
    TeacherCreate,
    TeacherUpdate,
    TeacherResponse,
)
from app.schemas.discipline import (
    DisciplineRecordCreate,
    DisciplineRecordResponse,
    DisciplineRecordWithDetails,
    MisconductTypeList,
    FormStatistics,
    ClassStatistics,
    DashboardAnalytics,
)
from app.schemas.auth import (
    LoginRequest,
)

__all__ = [
    # Student schemas
    "StudentBase",
    "StudentCreate",
    "StudentUpdate",
    "StudentResponse",
    "StudentWithMisconducts",
    "StudentIdentifyResponse",
    "MisconductStats",
    "BulkFormUpdate",
    # Teacher schemas
    "TeacherBase",
    "TeacherCreate",
    "TeacherUpdate",
    "TeacherResponse",
    # Discipline schemas
    "DisciplineRecordCreate",
    "DisciplineRecordResponse",
    "DisciplineRecordWithDetails",
    "MisconductTypeList",
    "FormStatistics",
    "ClassStatistics",
    "DashboardAnalytics",
    # Auth schemas
    "LoginRequest",
]
