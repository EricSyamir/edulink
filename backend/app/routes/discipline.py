"""
Discipline Routes
Endpoints for creating and viewing discipline records (misconducts).
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from loguru import logger
from datetime import datetime

from app.database import get_db
from app.models import Student, Teacher, DisciplineRecord
from app.schemas.discipline import (
    DisciplineRecordCreate,
    DisciplineRecordResponse,
    DisciplineRecordWithDetails,
    MisconductTypeList,
    FormStatistics,
    ClassStatistics,
    DashboardAnalytics,
    LIGHT_MISCONDUCT_TYPES,
    MEDIUM_MISCONDUCT_TYPES,
)
from app.services.auth import get_current_teacher
from app.services.discipline import discipline_service

router = APIRouter(prefix="/api/discipline-records", tags=["Discipline"])


def record_to_detailed_response(record: DisciplineRecord) -> DisciplineRecordWithDetails:
    """Convert DisciplineRecord to detailed response with names."""
    return DisciplineRecordWithDetails(
        id=record.id,
        student_id=record.student_id,
        teacher_id=record.teacher_id,
        severity=record.severity.value if hasattr(record.severity, 'value') else record.severity,
        misconduct_type=record.misconduct_type,
        notes=record.notes,
        created_at=record.created_at,
        student_name=record.student.name if record.student else "Unknown",
        student_school_id=record.student.student_id if record.student else "Unknown",
        teacher_name=record.teacher.name if record.teacher else "Unknown"
    )


@router.get("/types", response_model=MisconductTypeList)
def get_misconduct_types(
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get available misconduct types.
    
    Returns lists of light and medium misconduct types.
    """
    return MisconductTypeList(
        light=LIGHT_MISCONDUCT_TYPES,
        medium=MEDIUM_MISCONDUCT_TYPES
    )


@router.get("", response_model=List[DisciplineRecordWithDetails])
def list_discipline_records(
    student_id: Optional[int] = Query(None, description="Filter by student ID"),
    severity: Optional[str] = Query(None, description="Filter by severity: light or medium"),
    form: Optional[int] = Query(None, ge=1, le=5, description="Filter by form"),
    class_name: Optional[str] = Query(None, description="Filter by class name"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records to return"),
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    List discipline records with optional filtering.
    
    - **student_id**: Filter records for a specific student
    - **severity**: Filter by "light" or "medium"
    - **form**: Filter by form level (1-5)
    - **class_name**: Filter by class name
    - **skip**: Pagination offset
    - **limit**: Maximum results (1-100)
    
    Returns records sorted by most recent first.
    """
    query = db.query(DisciplineRecord).join(Student)
    
    if student_id:
        query = query.filter(DisciplineRecord.student_id == student_id)
    
    if severity:
        if severity not in ["light", "medium"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="severity must be 'light' or 'medium'"
            )
        query = query.filter(DisciplineRecord.severity == severity)
    
    if form:
        query = query.filter(Student.form == form)
    
    if class_name:
        query = query.filter(Student.class_name == class_name)
    
    records = query.order_by(desc(DisciplineRecord.created_at)).offset(skip).limit(limit).all()
    
    return [record_to_detailed_response(r) for r in records]


@router.get("/student/{student_id}", response_model=List[DisciplineRecordWithDetails])
def get_student_discipline_history(
    student_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get discipline history for a specific student.
    
    Returns all discipline records for the student, sorted by most recent first.
    """
    # Verify student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id {student_id} not found"
        )
    
    records = db.query(DisciplineRecord).filter(
        DisciplineRecord.student_id == student_id
    ).order_by(desc(DisciplineRecord.created_at)).offset(skip).limit(limit).all()
    
    return [record_to_detailed_response(r) for r in records]


@router.get("/forms/stats", response_model=List[FormStatistics])
def get_form_statistics(
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get misconduct statistics for all forms.
    
    Returns statistics for Forms 1-5.
    """
    stats = []
    for form in range(1, 6):
        form_stats = discipline_service.get_form_statistics(db, form)
        stats.append(FormStatistics(**form_stats))
    
    return stats


@router.get("/forms/{form}/stats", response_model=FormStatistics)
def get_single_form_statistics(
    form: int,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get misconduct statistics for a specific form.
    """
    if form < 1 or form > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Form must be between 1 and 5"
        )
    
    form_stats = discipline_service.get_form_statistics(db, form)
    return FormStatistics(**form_stats)


@router.get("/classes/stats", response_model=List[ClassStatistics])
def get_all_classes_statistics(
    form: Optional[int] = Query(None, ge=1, le=5, description="Filter by form"),
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get misconduct statistics for all classes.
    """
    # Get unique classes
    query = db.query(Student.class_name).distinct()
    if form:
        query = query.filter(Student.form == form)
    
    classes = query.order_by(Student.class_name).all()
    
    stats = []
    for (class_name,) in classes:
        class_stats = discipline_service.get_class_statistics(db, class_name)
        stats.append(ClassStatistics(**class_stats))
    
    return stats


@router.get("/classes/{class_name}/stats", response_model=ClassStatistics)
def get_single_class_statistics(
    class_name: str,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get misconduct statistics for a specific class.
    """
    class_stats = discipline_service.get_class_statistics(db, class_name)
    return ClassStatistics(**class_stats)


@router.get("/analytics", response_model=DashboardAnalytics)
def get_analytics(
    days: int = Query(30, ge=7, le=90, description="Number of days for trend data"),
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get dashboard analytics including trends and top offenders.
    """
    # Get total students
    total_students = db.query(Student).count()
    
    # Get total misconducts
    from app.models.discipline_record import MisconductSeverity
    from sqlalchemy import func
    
    total_light = db.query(func.count(DisciplineRecord.id)).filter(
        DisciplineRecord.severity == MisconductSeverity.LIGHT
    ).scalar() or 0
    
    total_medium = db.query(func.count(DisciplineRecord.id)).filter(
        DisciplineRecord.severity == MisconductSeverity.MEDIUM
    ).scalar() or 0
    
    # Get monthly misconducts
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)
    
    monthly_light = db.query(func.count(DisciplineRecord.id)).filter(
        DisciplineRecord.severity == MisconductSeverity.LIGHT,
        DisciplineRecord.created_at >= month_start
    ).scalar() or 0
    
    monthly_medium = db.query(func.count(DisciplineRecord.id)).filter(
        DisciplineRecord.severity == MisconductSeverity.MEDIUM,
        DisciplineRecord.created_at >= month_start
    ).scalar() or 0
    
    # Get trends
    trends = discipline_service.get_analytics_trends(db, days)
    
    # Get top offenders
    top_offenders = discipline_service.get_top_offenders(db, 10)
    
    return DashboardAnalytics(
        total_students=total_students,
        total_light_misconducts=total_light,
        total_medium_misconducts=total_medium,
        monthly_light_misconducts=monthly_light,
        monthly_medium_misconducts=monthly_medium,
        trends=trends,
        top_offenders=top_offenders
    )


@router.get("/{record_id}", response_model=DisciplineRecordWithDetails)
def get_discipline_record(
    record_id: int,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get a specific discipline record by ID.
    """
    record = db.query(DisciplineRecord).filter(DisciplineRecord.id == record_id).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discipline record with id {record_id} not found"
        )
    
    return record_to_detailed_response(record)


@router.post("", response_model=DisciplineRecordWithDetails, status_code=status.HTTP_201_CREATED)
def create_discipline_record(
    record_data: DisciplineRecordCreate,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Create a new discipline record (misconduct).
    
    - **student_id**: Student's database ID
    - **severity**: "light" or "medium"
    - **misconduct_type**: Type of misconduct (from available types)
    - **notes**: Optional notes about the incident
    """
    # Validate severity
    if record_data.severity not in ["light", "medium"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="severity must be 'light' or 'medium'"
        )
    
    # Validate misconduct type
    valid_types = LIGHT_MISCONDUCT_TYPES if record_data.severity == "light" else MEDIUM_MISCONDUCT_TYPES
    if record_data.misconduct_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid misconduct type for {record_data.severity} severity. Valid types: {valid_types}"
        )
    
    try:
        record = discipline_service.create_discipline_record(
            db=db,
            student_id=record_data.student_id,
            teacher_id=teacher.id,
            severity=record_data.severity,
            misconduct_type=record_data.misconduct_type,
            notes=record_data.notes
        )
        
        # Refresh to get relationships
        db.refresh(record)
        
        logger.info(
            f"Misconduct recorded by {teacher.name}: "
            f"student_id={record_data.student_id}, severity={record_data.severity}, "
            f"type={record_data.misconduct_type}"
        )
        
        return record_to_detailed_response(record)
        
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_discipline_record(
    record_id: int,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Delete a discipline record.
    """
    record = db.query(DisciplineRecord).filter(DisciplineRecord.id == record_id).first()
    
    if not record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Discipline record with id {record_id} not found"
        )
    
    logger.warning(
        f"Discipline record deleted by {teacher.name}: "
        f"id={record_id}, student_id={record.student_id}, "
        f"severity={record.severity}, type={record.misconduct_type}"
    )
    
    db.delete(record)
    db.commit()
    
    return None
