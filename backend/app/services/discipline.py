"""
Discipline Service
Handles discipline record creation and student points management.
"""

from typing import Optional
from sqlalchemy.orm import Session
from loguru import logger

from app.models import Student, DisciplineRecord, StudentPoints
from app.models.discipline_record import DisciplineType
from app.config import settings


class DisciplineService:
    """Service for managing discipline records and student points."""
    
    @staticmethod
    def get_points_change(record_type: str, custom_points: Optional[int] = None) -> int:
        """
        Get the points change for a discipline record.
        
        Args:
            record_type: "reward" or "punishment"
            custom_points: Optional custom points value
        
        Returns:
            Points change value (positive for reward, negative for punishment)
        """
        if custom_points is not None:
            return custom_points
        
        if record_type == "reward":
            return settings.DEFAULT_REWARD_POINTS
        else:
            return settings.DEFAULT_PUNISHMENT_POINTS
    
    @staticmethod
    def create_discipline_record(
        db: Session,
        student_id: int,
        teacher_id: int,
        record_type: str,
        points_change: Optional[int] = None,
        reason: Optional[str] = None
    ) -> DisciplineRecord:
        """
        Create a new discipline record and update student points.
        
        Args:
            db: Database session
            student_id: Student's database ID
            teacher_id: Teacher's database ID (who created the record)
            record_type: "reward" or "punishment"
            points_change: Custom points value (uses default if None)
            reason: Optional reason for the record
        
        Returns:
            Created DisciplineRecord object
        
        Raises:
            ValueError: If student not found
        """
        # Verify student exists
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student with id {student_id} not found")
        
        # Calculate points change
        final_points_change = DisciplineService.get_points_change(record_type, points_change)
        
        # Ensure punishment is negative and reward is positive
        if record_type == "punishment" and final_points_change > 0:
            final_points_change = -final_points_change
        elif record_type == "reward" and final_points_change < 0:
            final_points_change = -final_points_change
        
        # Create discipline record
        discipline_record = DisciplineRecord(
            student_id=student_id,
            teacher_id=teacher_id,
            type=DisciplineType(record_type),
            points_change=final_points_change,
            reason=reason
        )
        
        db.add(discipline_record)
        
        # Update student points
        student_points = db.query(StudentPoints).filter(
            StudentPoints.student_id == student_id
        ).first()
        
        if student_points:
            student_points.current_points += final_points_change
        else:
            # Create points record if it doesn't exist
            student_points = StudentPoints(
                student_id=student_id,
                current_points=settings.INITIAL_STUDENT_POINTS + final_points_change
            )
            db.add(student_points)
        
        db.commit()
        db.refresh(discipline_record)
        
        logger.info(
            f"Discipline record created: student_id={student_id}, "
            f"type={record_type}, points_change={final_points_change}, "
            f"new_total={student_points.current_points}"
        )
        
        return discipline_record
    
    @staticmethod
    def get_student_points(db: Session, student_id: int) -> int:
        """
        Get current points for a student.
        
        Args:
            db: Database session
            student_id: Student's database ID
        
        Returns:
            Current points value
        """
        student_points = db.query(StudentPoints).filter(
            StudentPoints.student_id == student_id
        ).first()
        
        if student_points:
            return student_points.current_points
        
        # Return default if no record exists
        return settings.INITIAL_STUDENT_POINTS
    
    @staticmethod
    def initialize_student_points(db: Session, student_id: int) -> StudentPoints:
        """
        Initialize points record for a new student.
        
        Args:
            db: Database session
            student_id: Student's database ID
        
        Returns:
            Created StudentPoints object
        """
        existing = db.query(StudentPoints).filter(
            StudentPoints.student_id == student_id
        ).first()
        
        if existing:
            return existing
        
        student_points = StudentPoints(
            student_id=student_id,
            current_points=settings.INITIAL_STUDENT_POINTS
        )
        
        db.add(student_points)
        db.commit()
        db.refresh(student_points)
        
        return student_points


# Global service instance
discipline_service = DisciplineService()
