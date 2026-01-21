"""
Discipline Record Model
Tracks light and medium misconducts for students.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Index, TypeDecorator
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class MisconductSeverity(str, enum.Enum):
    """Enum for misconduct severity levels."""
    LIGHT = "light"
    MEDIUM = "medium"


class MisconductSeverityEnum(TypeDecorator):
    """Type decorator to ensure enum values are used, not names."""
    impl = Enum(MisconductSeverity, native_enum=True, create_type=False)
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        """Convert enum to its value when binding to database."""
        if value is None:
            return None
        if isinstance(value, MisconductSeverity):
            return value.value  # Return the enum value, not the name
        return value
    
    def process_result_value(self, value, dialect):
        """Convert database value back to enum."""
        if value is None:
            return None
        if isinstance(value, str):
            return MisconductSeverity(value)
        return value


class LightMisconductType(str, enum.Enum):
    """Types of light misconducts."""
    LATE_TO_CLASS = "Late to Class"
    IMPROPER_UNIFORM = "Improper Uniform"
    LITTERING = "Littering"
    NOISE_MAKING = "Noise Making"
    INCOMPLETE_HOMEWORK = "Incomplete Homework"


class MediumMisconductType(str, enum.Enum):
    """Types of medium misconducts."""
    SKIPPING_CLASS = "Skipping Class"
    VANDALISM = "Vandalism"
    BULLYING = "Bullying"
    CHEATING = "Cheating"
    DISRESPECT_TO_TEACHER = "Disrespect to Teacher"


class DisciplineRecord(Base):
    """
    Discipline records tracking student misconducts.
    
    Attributes:
        id: Primary key, auto-incremented
        student_id: Foreign key to students table
        teacher_id: Foreign key to teachers table (who created the record)
        severity: Either "light" or "medium"
        misconduct_type: The specific type of misconduct
        notes: Optional additional notes about the incident
        created_at: Timestamp when record was created
    """
    
    __tablename__ = "discipline_records"
    
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True, index=True)
    severity = Column(MisconductSeverityEnum, nullable=False)
    misconduct_type = Column(String(100), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    student = relationship("Student", back_populates="discipline_records")
    teacher = relationship("Teacher", back_populates="discipline_records")
    
    # Indexes for common queries
    __table_args__ = (
        Index("idx_discipline_student_created", "student_id", "created_at"),
        Index("idx_discipline_severity", "severity"),
        Index("idx_discipline_misconduct_type", "misconduct_type"),
    )
    
    def __repr__(self):
        return f"<DisciplineRecord(id={self.id}, student_id={self.student_id}, severity='{self.severity}', type='{self.misconduct_type}')>"
