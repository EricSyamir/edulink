"""
Student Routes
CRUD operations for students and face identification.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from loguru import logger

from app.database import get_db
from app.models import Student, Teacher
from app.schemas.student import (
    StudentCreate,
    StudentUpdate,
    StudentResponse,
    StudentWithMisconducts,
    StudentIdentifyResponse,
    BulkFormUpdate,
)
from app.services.auth import get_current_teacher, require_admin
from app.services.face_recognition import face_recognition_service
from app.services.discipline import discipline_service
from app.config import settings
from pydantic import BaseModel

router = APIRouter(prefix="/api/students", tags=["Students"])


class FaceImageRequest(BaseModel):
    """Request body for face identification."""
    face_image: str


def student_to_response(student: Student) -> StudentResponse:
    """Convert Student model to response schema."""
    return StudentResponse(
        id=student.id,
        student_id=student.student_id,
        name=student.name,
        class_name=student.class_name,
        form=student.form,
        created_at=student.created_at,
        updated_at=student.updated_at,
        has_face_embedding=student.face_embedding is not None
    )


def student_to_with_misconducts(student: Student, db: Session) -> StudentWithMisconducts:
    """Convert Student model to response with misconduct stats."""
    stats = discipline_service.get_student_misconduct_stats(db, student.id)
    
    return StudentWithMisconducts(
        id=student.id,
        student_id=student.student_id,
        name=student.name,
        class_name=student.class_name,
        form=student.form,
        created_at=student.created_at,
        updated_at=student.updated_at,
        has_face_embedding=student.face_embedding is not None,
        misconduct_stats=stats
    )


@router.get("", response_model=List[StudentWithMisconducts])
def list_students(
    search: Optional[str] = Query(None, description="Search by name or student_id"),
    class_name: Optional[str] = Query(None, description="Filter by class"),
    form: Optional[int] = Query(None, ge=1, le=5, description="Filter by form (1-5)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(50, ge=1, le=100, description="Maximum records to return"),
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    List all students with optional filtering.
    
    - **search**: Search in name and student_id
    - **class_name**: Filter by class name
    - **form**: Filter by form level (1-5)
    - **skip**: Pagination offset
    - **limit**: Maximum results (1-100)
    """
    query = db.query(Student)
    
    # Apply search filter
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                Student.name.ilike(search_term),
                Student.student_id.ilike(search_term)
            )
        )
    
    # Apply class filter
    if class_name:
        query = query.filter(Student.class_name == class_name)
    
    # Apply form filter
    if form:
        query = query.filter(Student.form == form)
    
    # Order by name and apply pagination
    students = query.order_by(Student.name).offset(skip).limit(limit).all()
    
    return [student_to_with_misconducts(s, db) for s in students]


@router.get("/classes", response_model=List[str])
def list_classes(
    form: Optional[int] = Query(None, ge=1, le=5, description="Filter by form"),
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get list of all unique class names.
    """
    query = db.query(Student.class_name).distinct()
    
    if form:
        query = query.filter(Student.form == form)
    
    classes = query.order_by(Student.class_name).all()
    return [c[0] for c in classes]


@router.get("/{student_id}", response_model=StudentWithMisconducts)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Get a specific student by database ID.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id {student_id} not found"
        )
    
    return student_to_with_misconducts(student, db)


@router.post("", response_model=StudentWithMisconducts, status_code=status.HTTP_201_CREATED)
def create_student(
    student_data: StudentCreate,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Create a new student with optional face image.
    
    - **student_id**: Unique school ID (e.g., "2024001")
    - **name**: Student's full name
    - **class_name**: Class name (e.g., "1 Amanah")
    - **form**: Form level (1-5)
    - **face_image**: Optional base64 encoded face image
    """
    # Check for duplicate student_id
    existing = db.query(Student).filter(Student.student_id == student_data.student_id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Student with ID {student_data.student_id} already exists"
        )
    
    # Process face image if provided
    face_embedding_json = None
    if student_data.face_image:
        success, embedding, message = face_recognition_service.detect_and_extract_embedding(
            student_data.face_image
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        face_embedding_json = face_recognition_service.embedding_to_json(embedding)
        logger.info(f"Face embedding generated for new student: {student_data.student_id}")
    
    # Create student
    student = Student(
        student_id=student_data.student_id,
        name=student_data.name,
        class_name=student_data.class_name,
        form=student_data.form,
        face_embedding=face_embedding_json
    )
    
    db.add(student)
    db.commit()
    db.refresh(student)
    
    logger.info(f"Student created: {student.student_id} - {student.name}")
    
    return student_to_with_misconducts(student, db)


@router.put("/{student_id}", response_model=StudentWithMisconducts)
def update_student(
    student_id: int,
    student_data: StudentUpdate,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Update an existing student.
    
    Can update basic info and/or face image.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id {student_id} not found"
        )
    
    # Check for duplicate student_id if being changed
    if student_data.student_id and student_data.student_id != student.student_id:
        existing = db.query(Student).filter(
            Student.student_id == student_data.student_id
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Student with ID {student_data.student_id} already exists"
            )
    
    # Update basic fields
    if student_data.student_id:
        student.student_id = student_data.student_id
    if student_data.name:
        student.name = student_data.name
    if student_data.class_name:
        student.class_name = student_data.class_name
    if student_data.form is not None:
        student.form = student_data.form
    
    # Update face embedding if new image provided
    if student_data.face_image:
        success, embedding, message = face_recognition_service.detect_and_extract_embedding(
            student_data.face_image
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=message
            )
        
        student.face_embedding = face_recognition_service.embedding_to_json(embedding)
        logger.info(f"Face embedding updated for student: {student.student_id}")
    
    db.commit()
    db.refresh(student)
    
    logger.info(f"Student updated: {student.student_id}")
    
    return student_to_with_misconducts(student, db)


@router.delete("/{student_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Delete a student and all related records.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student with id {student_id} not found"
        )
    
    logger.info(f"Deleting student: {student.student_id} - {student.name}")
    
    db.delete(student)
    db.commit()
    
    return None


@router.post("/identify", response_model=StudentIdentifyResponse)
def identify_student(
    request: FaceImageRequest,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(get_current_teacher)
):
    """
    Identify a student by face image.
    
    - **face_image**: Base64 encoded face image from camera
    
    Returns matched student data with confidence score.
    """
    # Extract face embedding from image
    success, query_embedding, message = face_recognition_service.detect_and_extract_embedding(
        request.face_image
    )
    
    if not success:
        logger.warning(f"Face identification failed: {message}")
        return StudentIdentifyResponse(
            matched=False,
            match_confidence=None,
            student=None,
            message=message
        )
    
    # Get all students with face embeddings
    students_with_faces = db.query(Student.id, Student.face_embedding).filter(
        Student.face_embedding.isnot(None)
    ).all()
    
    if not students_with_faces:
        return StudentIdentifyResponse(
            matched=False,
            match_confidence=None,
            student=None,
            message="No students with registered faces in the database"
        )
    
    # Find best match
    best_match_id, similarity = face_recognition_service.find_best_match(
        query_embedding,
        [(s.id, s.face_embedding) for s in students_with_faces]
    )
    
    if best_match_id is None:
        logger.info(f"Face identification: no match above threshold (best similarity: {similarity:.4f})")
        return StudentIdentifyResponse(
            matched=False,
            match_confidence=similarity,
            student=None,
            message=f"No matching student found (best similarity: {similarity:.2%}, threshold: {settings.FACE_SIMILARITY_THRESHOLD:.2%})"
        )
    
    # Get matched student details
    matched_student = db.query(Student).filter(Student.id == best_match_id).first()
    student_with_misconducts = student_to_with_misconducts(matched_student, db)
    
    logger.info(
        f"Face identification successful: {matched_student.student_id} - {matched_student.name} "
        f"(similarity: {similarity:.4f})"
    )
    
    return StudentIdentifyResponse(
        matched=True,
        match_confidence=similarity,
        student=student_with_misconducts,
        message=f"Student identified: {matched_student.name}"
    )


@router.post("/promote", status_code=status.HTTP_200_OK)
def promote_students(
    data: BulkFormUpdate,
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(require_admin)
):
    """
    Promote all students from one form to another (Admin only).
    
    - **from_form**: Current form level
    - **to_form**: New form level
    """
    if data.to_form > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot promote beyond Form 5"
        )
    
    try:
        count = discipline_service.promote_form(db, data.from_form, data.to_form)
        return {
            "message": f"Successfully promoted {count} students from Form {data.from_form} to Form {data.to_form}",
            "count": count
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
