"""
Teacher Routes
CRUD operations for teachers (admin functionality).
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from loguru import logger

from app.database import get_db
from app.models import Teacher
from app.schemas.teacher import TeacherCreate, TeacherUpdate, TeacherResponse
from app.services.auth import get_current_teacher, require_admin
from app.utils.security import get_password_hash

router = APIRouter(prefix="/api/teachers", tags=["Teachers"])


@router.get("", response_model=List[TeacherResponse])
def list_teachers(
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records to return"),
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    List all teachers.
    
    Only authenticated teachers can view this list.
    """
    teachers = db.query(Teacher).order_by(Teacher.name).offset(skip).limit(limit).all()
    return teachers


@router.get("/me", response_model=TeacherResponse)
def get_current_teacher_info(
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get current authenticated teacher's information.
    """
    return current_teacher


@router.put("/me", response_model=TeacherResponse)
def update_current_teacher_profile(
    teacher_data: TeacherUpdate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Update current teacher's own profile.
    
    Teachers can update:
    - Name
    - Password
    
    Cannot update:
    - Email (contact admin)
    - Teacher ID (contact admin)
    - Admin status (admin only)
    """
    # Only allow updating name and password for own profile
    if teacher_data.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change email. Contact administrator."
        )
    
    if teacher_data.teacher_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change teacher ID. Contact administrator."
        )
    
    if teacher_data.is_admin is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change admin status. Contact administrator."
        )
    
    # Update allowed fields
    if teacher_data.name:
        current_teacher.name = teacher_data.name
    
    if teacher_data.password:
        current_teacher.password_hash = get_password_hash(teacher_data.password)
    
    db.commit()
    db.refresh(current_teacher)
    
    logger.info(f"Teacher {current_teacher.teacher_id} updated their profile")
    
    return current_teacher


@router.get("/{teacher_id}", response_model=TeacherResponse)
def get_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get a specific teacher by database ID.
    """
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Teacher with id {teacher_id} not found"
        )
    
    return teacher


@router.post("", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
def create_teacher(
    teacher_data: TeacherCreate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(require_admin)
):
    """
    Create a new teacher account (Admin only).
    
    - **teacher_id**: Unique teacher ID (e.g., "T2024001")
    - **name**: Teacher's full name
    - **email**: Email for login (must be unique)
    - **password**: Password (will be hashed)
    - **is_admin**: Whether teacher has admin privileges
    """
    # Check for duplicate teacher_id
    existing_id = db.query(Teacher).filter(
        Teacher.teacher_id == teacher_data.teacher_id
    ).first()
    if existing_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Teacher with ID {teacher_data.teacher_id} already exists"
        )
    
    # Check for duplicate email
    existing_email = db.query(Teacher).filter(
        Teacher.email == teacher_data.email
    ).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Email {teacher_data.email} is already registered"
        )
    
    # Create teacher with hashed password
    teacher = Teacher(
        teacher_id=teacher_data.teacher_id,
        name=teacher_data.name,
        email=teacher_data.email,
        password_hash=get_password_hash(teacher_data.password),
        is_admin=teacher_data.is_admin
    )
    
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    
    logger.info(f"Teacher created by {current_teacher.name}: {teacher.teacher_id} - {teacher.name}")
    
    return teacher


@router.put("/{teacher_id}", response_model=TeacherResponse)
def update_teacher(
    teacher_id: int,
    teacher_data: TeacherUpdate,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(require_admin)
):
    """
    Update an existing teacher (Admin only).
    
    Can update basic info and/or password.
    """
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Teacher with id {teacher_id} not found"
        )
    
    # Check for duplicate teacher_id if being changed
    if teacher_data.teacher_id and teacher_data.teacher_id != teacher.teacher_id:
        existing = db.query(Teacher).filter(
            Teacher.teacher_id == teacher_data.teacher_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Teacher with ID {teacher_data.teacher_id} already exists"
            )
    
    # Check for duplicate email if being changed
    if teacher_data.email and teacher_data.email != teacher.email:
        existing = db.query(Teacher).filter(
            Teacher.email == teacher_data.email
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Email {teacher_data.email} is already registered"
            )
    
    # Update fields
    if teacher_data.teacher_id:
        teacher.teacher_id = teacher_data.teacher_id
    if teacher_data.name:
        teacher.name = teacher_data.name
    if teacher_data.email:
        teacher.email = teacher_data.email
    if teacher_data.password:
        teacher.password_hash = get_password_hash(teacher_data.password)
    if teacher_data.is_admin is not None:
        teacher.is_admin = teacher_data.is_admin
    
    db.commit()
    db.refresh(teacher)
    
    logger.info(f"Teacher updated by {current_teacher.name}: {teacher.teacher_id}")
    
    return teacher


@router.delete("/{teacher_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    current_teacher: Teacher = Depends(require_admin)
):
    """
    Delete a teacher account (Admin only).
    
    Note: Cannot delete yourself.
    """
    if teacher_id == current_teacher.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )
    
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Teacher with id {teacher_id} not found"
        )
    
    logger.info(f"Teacher deleted by {current_teacher.name}: {teacher.teacher_id} - {teacher.name}")
    
    db.delete(teacher)
    db.commit()
    
    return None
