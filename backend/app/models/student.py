"""
Student Model
Represents a student with face embedding for recognition.
"""

from sqlalchemy import Column, Integer, String, Text, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Student(Base):
    """
    Student table storing student information and face embedding.
    
    Attributes:
        id: Primary key, auto-incremented
        student_id: Unique school ID (e.g., "2024001")
        name: Student's full name
        class_name: Class name (e.g., "3 Amanah")
        standard: Grade level (1-6)
        face_embedding: JSON string storing buffalo_l embedding vector (512-dim)
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """
    
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    student_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    class_name = Column(String(100), nullable=False)  # 'class' is reserved in Python
    standard = Column(Integer, nullable=False)
    face_embedding = Column(Text, nullable=True)  # JSON array of 512 floats
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    discipline_records = relationship("DisciplineRecord", back_populates="student", cascade="all, delete-orphan")
    points = relationship("StudentPoints", back_populates="student", uselist=False, cascade="all, delete-orphan")
    
    # Indexes for common queries
    __table_args__ = (
        Index("idx_student_class", "class_name"),
        Index("idx_student_standard", "standard"),
    )
    
    def __repr__(self):
        return f"<Student(id={self.id}, student_id='{self.student_id}', name='{self.name}')>"
