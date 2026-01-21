"""
Discipline Service
Handles discipline record creation and misconduct statistics.
"""

from typing import Optional, List, Dict
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, cast, String
from loguru import logger

from app.models import Student, DisciplineRecord
from app.models.discipline_record import MisconductSeverity
from app.schemas.student import MisconductStats


class DisciplineService:
    """Service for managing discipline records and misconduct statistics."""
    
    @staticmethod
    def create_discipline_record(
        db: Session,
        student_id: int,
        teacher_id: int,
        severity: str,
        misconduct_type: str,
        notes: Optional[str] = None
    ) -> DisciplineRecord:
        """
        Create a new discipline record (misconduct).
        
        Args:
            db: Database session
            student_id: Student's database ID
            teacher_id: Teacher's database ID (who created the record)
            severity: "light" or "medium"
            misconduct_type: The specific type of misconduct
            notes: Optional notes about the incident
        
        Returns:
            Created DisciplineRecord object
        
        Raises:
            ValueError: If student not found
        """
        # Verify student exists
        student = db.query(Student).filter(Student.id == student_id).first()
        if not student:
            raise ValueError(f"Student with id {student_id} not found")
        
        # Create discipline record - ensure lowercase
        severity_lower = severity.lower()
        # Get the enum member - TypeDecorator will handle converting to value
        severity_enum = MisconductSeverity(severity_lower)
        
        discipline_record = DisciplineRecord(
            student_id=student_id,
            teacher_id=teacher_id,
            severity=severity_enum,  # TypeDecorator will convert to value
            misconduct_type=misconduct_type,
            notes=notes
        )
        
        db.add(discipline_record)
        db.commit()
        db.refresh(discipline_record)
        
        logger.info(
            f"Misconduct recorded: student_id={student_id}, "
            f"severity={severity}, type={misconduct_type}"
        )
        
        return discipline_record
    
    @staticmethod
    def get_student_misconduct_stats(db: Session, student_id: int) -> MisconductStats:
        """
        Get misconduct statistics for a student.
        
        Args:
            db: Database session
            student_id: Student's database ID
        
        Returns:
            MisconductStats object with counts
        """
        # Get start of current month
        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)
        
        # Query all records for student - cast enum column to string for comparison
        light_total = db.query(func.count(DisciplineRecord.id)).filter(
            and_(
                DisciplineRecord.student_id == student_id,
                cast(DisciplineRecord.severity, String) == "light"
            )
        ).scalar() or 0
        
        medium_total = db.query(func.count(DisciplineRecord.id)).filter(
            and_(
                DisciplineRecord.student_id == student_id,
                cast(DisciplineRecord.severity, String) == "medium"
            )
        ).scalar() or 0
        
        # Monthly counts
        light_monthly = db.query(func.count(DisciplineRecord.id)).filter(
            and_(
                DisciplineRecord.student_id == student_id,
                cast(DisciplineRecord.severity, String) == "light",
                DisciplineRecord.created_at >= month_start
            )
        ).scalar() or 0
        
        medium_monthly = db.query(func.count(DisciplineRecord.id)).filter(
            and_(
                DisciplineRecord.student_id == student_id,
                cast(DisciplineRecord.severity, String) == "medium",
                DisciplineRecord.created_at >= month_start
            )
        ).scalar() or 0
        
        return MisconductStats(
            light_total=light_total,
            light_monthly=light_monthly,
            medium_total=medium_total,
            medium_monthly=medium_monthly
        )
    
    @staticmethod
    def get_form_statistics(db: Session, form: int) -> Dict:
        """
        Get misconduct statistics for a specific form.
        
        Args:
            db: Database session
            form: Form number (1-5)
        
        Returns:
            Dictionary with form statistics
        """
        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)
        
        # Get students in this form
        students = db.query(Student).filter(Student.form == form).all()
        student_ids = [s.id for s in students]
        
        if not student_ids:
            return {
                "form": form,
                "total_students": 0,
                "light_misconducts": 0,
                "medium_misconducts": 0,
                "light_monthly": 0,
                "medium_monthly": 0
            }
        
        # Total counts - cast enum column to string for comparison
        light_total = db.query(func.count(DisciplineRecord.id)).filter(
            and_(
                DisciplineRecord.student_id.in_(student_ids),
                cast(DisciplineRecord.severity, String) == "light"
            )
        ).scalar() or 0
        
        medium_total = db.query(func.count(DisciplineRecord.id)).filter(
            and_(
                DisciplineRecord.student_id.in_(student_ids),
                cast(DisciplineRecord.severity, String) == "medium"
            )
        ).scalar() or 0
        
        # Monthly counts
        light_monthly = db.query(func.count(DisciplineRecord.id)).filter(
            and_(
                DisciplineRecord.student_id.in_(student_ids),
                cast(DisciplineRecord.severity, String) == "light",
                DisciplineRecord.created_at >= month_start
            )
        ).scalar() or 0
        
        medium_monthly = db.query(func.count(DisciplineRecord.id)).filter(
            and_(
                DisciplineRecord.student_id.in_(student_ids),
                cast(DisciplineRecord.severity, String) == "medium",
                DisciplineRecord.created_at >= month_start
            )
        ).scalar() or 0
        
        return {
            "form": form,
            "total_students": len(students),
            "light_misconducts": light_total,
            "medium_misconducts": medium_total,
            "light_monthly": light_monthly,
            "medium_monthly": medium_monthly
        }
    
    @staticmethod
    def get_class_statistics(db: Session, class_name: str) -> Dict:
        """
        Get misconduct statistics for a specific class.
        
        Args:
            db: Database session
            class_name: Class name
        
        Returns:
            Dictionary with class statistics
        """
        now = datetime.utcnow()
        month_start = datetime(now.year, now.month, 1)
        
        # Get students in this class
        students = db.query(Student).filter(Student.class_name == class_name).all()
        student_ids = [s.id for s in students]
        
        if not student_ids:
            return {
                "class_name": class_name,
                "form": 0,
                "total_students": 0,
                "light_misconducts": 0,
                "medium_misconducts": 0,
                "light_monthly": 0,
                "medium_monthly": 0
            }
        
        # Get form from first student
        form = students[0].form if students else 0
        
        # Total counts - cast enum column to string for comparison
        light_total = db.query(func.count(DisciplineRecord.id)).filter(
            and_(
                DisciplineRecord.student_id.in_(student_ids),
                cast(DisciplineRecord.severity, String) == "light"
            )
        ).scalar() or 0
        
        medium_total = db.query(func.count(DisciplineRecord.id)).filter(
            and_(
                DisciplineRecord.student_id.in_(student_ids),
                cast(DisciplineRecord.severity, String) == "medium"
            )
        ).scalar() or 0
        
        # Monthly counts
        light_monthly = db.query(func.count(DisciplineRecord.id)).filter(
            and_(
                DisciplineRecord.student_id.in_(student_ids),
                cast(DisciplineRecord.severity, String) == "light",
                DisciplineRecord.created_at >= month_start
            )
        ).scalar() or 0
        
        medium_monthly = db.query(func.count(DisciplineRecord.id)).filter(
            and_(
                DisciplineRecord.student_id.in_(student_ids),
                cast(DisciplineRecord.severity, String) == "medium",
                DisciplineRecord.created_at >= month_start
            )
        ).scalar() or 0
        
        return {
            "class_name": class_name,
            "form": form,
            "total_students": len(students),
            "light_misconducts": light_total,
            "medium_misconducts": medium_total,
            "light_monthly": light_monthly,
            "medium_monthly": medium_monthly
        }
    
    @staticmethod
    def get_analytics_trends(db: Session, days: int = 30) -> List[Dict]:
        """
        Get daily misconduct trends for the past N days.
        
        Args:
            db: Database session
            days: Number of days to look back
        
        Returns:
            List of daily trend data
        """
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        trends = []
        current_date = start_date
        
        while current_date <= end_date:
            day_start = datetime(current_date.year, current_date.month, current_date.day)
            day_end = day_start + timedelta(days=1)
            
            light_count = db.query(func.count(DisciplineRecord.id)).filter(
                and_(
                    cast(DisciplineRecord.severity, String) == "light",
                    DisciplineRecord.created_at >= day_start,
                    DisciplineRecord.created_at < day_end
                )
            ).scalar() or 0
            
            medium_count = db.query(func.count(DisciplineRecord.id)).filter(
                and_(
                    cast(DisciplineRecord.severity, String) == "medium",
                    DisciplineRecord.created_at >= day_start,
                    DisciplineRecord.created_at < day_end
                )
            ).scalar() or 0
            
            trends.append({
                "date": current_date.strftime("%Y-%m-%d"),
                "light_count": light_count,
                "medium_count": medium_count
            })
            
            current_date += timedelta(days=1)
        
        return trends
    
    @staticmethod
    def get_top_offenders(db: Session, limit: int = 10) -> List[Dict]:
        """
        Get students with the most misconducts.
        
        Args:
            db: Database session
            limit: Maximum number of students to return
        
        Returns:
            List of students with misconduct counts
        """
        # Query students with misconduct counts
        results = db.query(
            Student.id,
            Student.name,
            Student.student_id,
            Student.class_name,
            Student.form,
            func.count(DisciplineRecord.id).label('total_misconducts')
        ).join(
            DisciplineRecord, Student.id == DisciplineRecord.student_id
        ).group_by(
            Student.id
        ).order_by(
            func.count(DisciplineRecord.id).desc()
        ).limit(limit).all()
        
        return [
            {
                "id": r.id,
                "name": r.name,
                "student_id": r.student_id,
                "class_name": r.class_name,
                "form": r.form,
                "total_misconducts": r.total_misconducts
            }
            for r in results
        ]
    
    @staticmethod
    def promote_form(db: Session, from_form: int, to_form: int) -> int:
        """
        Promote all students from one form to another.
        
        Args:
            db: Database session
            from_form: Current form level
            to_form: New form level
        
        Returns:
            Number of students promoted
        """
        if to_form > 5:
            raise ValueError("Cannot promote beyond Form 5")
        
        count = db.query(Student).filter(Student.form == from_form).update(
            {"form": to_form}
        )
        db.commit()
        
        logger.info(f"Promoted {count} students from Form {from_form} to Form {to_form}")
        
        return count


# Global service instance
discipline_service = DisciplineService()
