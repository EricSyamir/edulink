"""
Discipline Routes
Endpoints for creating and viewing discipline records.
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from loguru import logger

from app.database import get_db
from app.models import Student, Teacher, DisciplineRecord
from app.schemas.discipline import (
    DisciplineRecordCreate,
    DisciplineRecordResponse,
    DisciplineRecordWithDetails,
)
# Authentication removed - no get_current_teacher needed
from app.services.discipline import discipline_service

router = APIRouter(prefix="/api/discipline-records", tags=["Discipline"])


def record_to_detailed_response(record: DisciplineRecord) -> DisciplineRecordWithDetails:
    """Convert DisciplineRecord to detailed response with names."""
    return DisciplineRecordWithDetails(
        id=record.id,
        student_id=record.student_id,
        teacher_id=record.teacher_id,
        type=record.type.value if hasattr(record.type, 'value') else record.type,
        points_change=record.points_change,
        reason=record.reason,
        created_at=record.created_at,
        student_name=record.student.name if record.student else "Unknown",
        student_school_id=record.student.student_id if record.student else "Unknown",
        teacher_name=record.teacher.name if record.teacher else "Unknown"
    )


@router.get("", response_model=List[DisciplineRecordWithDetails])
def list_discipline_records(
    student_id: Optional[int] = Query(None, description="Filter by student ID"),
    record_type: Optional[str] = Query(None, description="Filter by type: reward or punishment"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records to return"),
    db: Session = Depends(get_db),
):
    """
    List discipline records with optional filtering.
    
    - **student_id**: Filter records for a specific student
    - **record_type**: Filter by "reward" or "punishment"
    - **skip**: Pagination offset
    - **limit**: Maximum results (1-100)
    
    Returns records sorted by most recent first.
    """
    query = db.query(DisciplineRecord)
    
    if student_id:
        query = query.filter(DisciplineRecord.student_id == student_id)
    
    if record_type:
        if record_type not in ["reward", "punishment"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="record_type must be 'reward' or 'punishment'"
            )
        query = query.filter(DisciplineRecord.type == record_type)
    
    records = query.order_by(desc(DisciplineRecord.created_at)).offset(skip).limit(limit).all()
    
    return [record_to_detailed_response(r) for r in records]


@router.get("/student/{student_id}", response_model=List[DisciplineRecordWithDetails])
def get_student_discipline_history(
    student_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
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


@router.get("/{record_id}", response_model=DisciplineRecordWithDetails)
def get_discipline_record(
    record_id: int,
    db: Session = Depends(get_db),
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
):
    """
    Create a new discipline record (reward or punishment).
    
    - **student_id**: Student's database ID
    - **type**: "reward" or "punishment"
    - **points_change**: Optional custom points value (uses default ±10 if not provided)
    - **reason**: Optional reason for the record
    
    Automatically updates the student's current points.
    """
    # Validate type
    if record_data.type not in ["reward", "punishment"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="type must be 'reward' or 'punishment'"
        )
    
    try:
        record = discipline_service.create_discipline_record(
            db=db,
            student_id=record_data.student_id,
            teacher_id=teacher.id,
            record_type=record_data.type,
            points_change=record_data.points_change,
            reason=record_data.reason
        )
        
        # Refresh to get relationships
        db.refresh(record)
        
        logger.info(
            f"Discipline record created by {teacher.name}: "
            f"student_id={record_data.student_id}, type={record_data.type}, "
            f"points={record.points_change}"
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
):
    """
    Delete a discipline record.
    
    Note: This will NOT automatically adjust the student's points.
    Use with caution - typically records should not be deleted.
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
        f"type={record.type}, points={record.points_change}"
    )
    
    db.delete(record)
    db.commit()
    
    return None
