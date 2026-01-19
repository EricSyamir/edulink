"""
Teacher Model
Represents a teacher who can log in and manage discipline records.
"""

from sqlalchemy import Column, Integer, String, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Teacher(Base):
    """
    Teacher table storing teacher credentials and information.
    
    Attributes:
        id: Primary key, auto-incremented
        teacher_id: Unique teacher ID (e.g., "T2024001")
        name: Teacher's full name
        email: Unique email for authentication
        password_hash: Bcrypt hashed password
        created_at: Timestamp when record was created
        updated_at: Timestamp when record was last updated
    """
    
    __tablename__ = "teachers"
    
    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    teacher_id = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    discipline_records = relationship("DisciplineRecord", back_populates="teacher")
    
    # Indexes
    __table_args__ = (
        Index("idx_teacher_name", "name"),
    )
    
    def __repr__(self):
        return f"<Teacher(id={self.id}, teacher_id='{self.teacher_id}', name='{self.name}')>"
