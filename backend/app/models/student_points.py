"""
Student Points Model
Tracks current Sahsiah points for each student.
"""

from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.database import Base
from app.config import settings


class StudentPoints(Base):
    """
    Student points table tracking current Sahsiah points.
    
    One-to-one relationship with students table.
    Points can go below 0 (many punishments) or above 100 (many rewards).
    
    Attributes:
        student_id: Primary key and foreign key to students table
        current_points: Current point balance (default: 100)
    """
    
    __tablename__ = "student_points"
    
    student_id = Column(
        Integer, 
        ForeignKey("students.id", ondelete="CASCADE"), 
        primary_key=True
    )
    current_points = Column(
        Integer, 
        nullable=False, 
        default=settings.INITIAL_STUDENT_POINTS
    )
    
    # Relationship back to student
    student = relationship("Student", back_populates="points")
    
    def __repr__(self):
        return f"<StudentPoints(student_id={self.student_id}, current_points={self.current_points})>"
