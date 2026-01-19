"""
Discipline Record Model
Tracks rewards and punishments for students.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.database import Base


class DisciplineType(str, enum.Enum):
    """Enum for discipline record types."""
    REWARD = "reward"
    PUNISHMENT = "punishment"


class DisciplineRecord(Base):
    """
    Discipline records tracking student rewards and punishments.
    
    Attributes:
        id: Primary key, auto-incremented
        student_id: Foreign key to students table
        teacher_id: Foreign key to teachers table (who created the record)
        type: Either "reward" or "punishment"
        points_change: Points added/subtracted (typically +10 or -10)
        reason: Optional description of why the record was created
        created_at: Timestamp when record was created
    """
    
    __tablename__ = "discipline_records"
    
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id", ondelete="SET NULL"), nullable=True, index=True)
    type = Column(Enum(DisciplineType), nullable=False)
    points_change = Column(Integer, nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    
    # Relationships
    student = relationship("Student", back_populates="discipline_records")
    teacher = relationship("Teacher", back_populates="discipline_records")
    
    # Indexes for common queries
    __table_args__ = (
        Index("idx_discipline_student_created", "student_id", "created_at"),
        Index("idx_discipline_type", "type"),
    )
    
    def __repr__(self):
        return f"<DisciplineRecord(id={self.id}, student_id={self.student_id}, type='{self.type}', points={self.points_change})>"
