"""
Student Routes
CRUD operations for students and face identification.
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import or_
from loguru import logger
import csv
import io

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


@router.post("/import", status_code=status.HTTP_200_OK)
def import_students_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    teacher: Teacher = Depends(require_admin)
):
    """
    Import students from CSV file (Admin only).
    
    CSV format (with or without headers):
    - Bil. (serial number, optional - first column if present)
    - StudentID
    - StudentName
    - StudentForm
    - StudentClass
    
    If headers are present, they should match the column names above (case-insensitive).
    If no headers, the format should be: Bil.,StudentID,StudentName,StudentForm,StudentClass
    or: StudentID,StudentName,StudentForm,StudentClass (without Bil.)
    
    Returns summary of import results.
    """
    # Check file type
    if not file.filename or not file.filename.endswith('.csv'):
        logger.warning(f"Invalid file type: {file.filename}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are accepted"
        )
    
    logger.info(f"Processing CSV import from file: {file.filename}")
    
    try:
        # Read CSV content
        contents = file.file.read()
        if not contents:
            logger.warning("CSV file is empty")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV file is empty"
            )
        file.file.seek(0)  # Reset file pointer
        
        # Decode content
        try:
            content_str = contents.decode('utf-8')
        except UnicodeDecodeError:
            # Try with different encoding
            content_str = contents.decode('utf-8-sig')  # Handle BOM
        
        # Parse CSV - try to detect if headers exist
        csv_lines = content_str.strip().split('\n')
        if not csv_lines:
            logger.warning("CSV file has no lines after parsing")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV file is empty"
            )
        
        logger.info(f"CSV file has {len(csv_lines)} lines")
        
        # Check if first row looks like headers (contains expected column names)
        first_row = csv_lines[0].strip()
        csv_reader = csv.reader(io.StringIO(content_str))
        try:
            first_row_values = next(csv_reader)
        except StopIteration:
            logger.warning("CSV file has no rows")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV file has no data rows"
            )
        
        logger.info(f"First row values: {first_row_values}")
        
        # Expected column names (case-insensitive)
        expected_headers = ['bil', 'studentid', 'studentname', 'studentform', 'studentclass']
        first_row_lower = [col.lower().strip().replace('.', '').replace(' ', '') for col in first_row_values]
        
        # Check if first row contains expected headers
        has_headers = any(
            any(expected in col for expected in expected_headers) 
            for col in first_row_lower
        )
        
        logger.info(f"Headers detected: {has_headers}, first_row_lower: {first_row_lower}")
        
        # If headers detected, use DictReader; otherwise use positional mapping
        if has_headers:
            # Reset and use DictReader
            csv_reader = csv.DictReader(io.StringIO(content_str))
            use_dict_mode = True
            start_row = 2  # Skip header row
        else:
            # No headers, use positional mapping
            # Format: Bil., StudentID, StudentName, StudentForm, StudentClass
            # Or: StudentID, StudentName, StudentForm, StudentClass (no Bil.)
            csv_reader = csv.reader(io.StringIO(content_str))
            use_dict_mode = False
            start_row = 1  # No header to skip
        
        # Process rows
        created_count = 0
        updated_count = 0
        skipped_count = 0
        errors = []
        
        for row_num, row in enumerate(csv_reader, start=start_row):
            try:
                # Get values based on mode
                if use_dict_mode:
                    # Dictionary mode (with headers)
                    student_id = None
                    student_name = None
                    student_form = None
                    student_class = None
                    
                    for key, value in row.items():
                        key_lower = key.lower().strip().replace('.', '').replace(' ', '')
                        if 'studentid' in key_lower or key_lower == 'studentid':
                            student_id = value.strip() if value else None
                        elif 'studentname' in key_lower or key_lower == 'studentname':
                            student_name = value.strip() if value else None
                        elif 'studentform' in key_lower or key_lower == 'studentform':
                            student_form = value.strip() if value else None
                        elif 'studentclass' in key_lower or key_lower == 'studentclass':
                            student_class = value.strip() if value else None
                else:
                    # Positional mode (no headers)
                    # Expected format: [Bil.], StudentID, StudentName, StudentForm, StudentClass
                    # Or: StudentID, StudentName, StudentForm, StudentClass
                    if len(row) < 4:
                        errors.append(f"Row {row_num}: Insufficient columns (expected at least 4, got {len(row)})")
                        skipped_count += 1
                        continue
                    
                    # Try to detect if first column is Bil. (usually a number)
                    # If first column looks like a number and we have 5 columns, skip it
                    if len(row) >= 5:
                        # Check if first column is numeric (Bil. column)
                        try:
                            int(str(row[0]).strip())
                            # First column is Bil., skip it
                            student_id = str(row[1]).strip() if len(row) > 1 and row[1] else None
                            student_name = str(row[2]).strip() if len(row) > 2 and row[2] else None
                            student_form = str(row[3]).strip() if len(row) > 3 and row[3] else None
                            student_class = str(row[4]).strip() if len(row) > 4 and row[4] else None
                        except (ValueError, IndexError):
                            # First column is not numeric, treat as StudentID
                            student_id = str(row[0]).strip() if row[0] else None
                            student_name = str(row[1]).strip() if len(row) > 1 and row[1] else None
                            student_form = str(row[2]).strip() if len(row) > 2 and row[2] else None
                            student_class = str(row[3]).strip() if len(row) > 3 and row[3] else None
                    else:
                        # 4 columns: StudentID, StudentName, StudentForm, StudentClass
                        student_id = str(row[0]).strip() if row[0] else None
                        student_name = str(row[1]).strip() if len(row) > 1 and row[1] else None
                        student_form = str(row[2]).strip() if len(row) > 2 and row[2] else None
                        student_class = str(row[3]).strip() if len(row) > 3 and row[3] else None
                
                # Strip and validate required fields (check for empty strings after stripping)
                student_id = student_id.strip() if student_id else ""
                student_name = student_name.strip() if student_name else ""
                student_form = student_form.strip() if student_form else ""
                student_class = student_class.strip() if student_class else ""
                
                # Validate required fields are not empty
                if not student_id:
                    errors.append(f"Row {row_num}: StudentID is required but was empty")
                    skipped_count += 1
                    continue
                if not student_name:
                    errors.append(f"Row {row_num}: StudentName is required but was empty")
                    skipped_count += 1
                    continue
                if not student_form:
                    errors.append(f"Row {row_num}: StudentForm is required but was empty")
                    skipped_count += 1
                    continue
                if not student_class:
                    errors.append(f"Row {row_num}: StudentClass is required but was empty")
                    skipped_count += 1
                    continue
                
                # Validate field lengths (database constraints)
                if len(student_id) > 50:
                    errors.append(f"Row {row_num}: StudentID too long (max 50 characters, got {len(student_id)})")
                    skipped_count += 1
                    continue
                if len(student_name) > 255:
                    errors.append(f"Row {row_num}: StudentName too long (max 255 characters, got {len(student_name)})")
                    skipped_count += 1
                    continue
                if len(student_class) > 100:
                    errors.append(f"Row {row_num}: StudentClass too long (max 100 characters, got {len(student_class)})")
                    skipped_count += 1
                    continue
                
                # Convert form to integer
                try:
                    form = int(student_form)
                    if form < 1 or form > 5:
                        errors.append(f"Row {row_num}: Form must be between 1 and 5, got {form}")
                        skipped_count += 1
                        continue
                except ValueError:
                    errors.append(f"Row {row_num}: Invalid form value '{student_form}' (must be a number between 1-5)")
                    skipped_count += 1
                    continue
                
                # Check if student already exists
                existing = db.query(Student).filter(Student.student_id == student_id).first()
                
                if existing:
                    # Update existing student
                    existing.name = student_name
                    existing.class_name = student_class
                    existing.form = form
                    updated_count += 1
                    logger.debug(f"Row {row_num}: Updated student {student_id} - {student_name}")
                else:
                    # Create new student
                    try:
                        new_student = Student(
                            student_id=student_id,
                            name=student_name,
                            class_name=student_class,
                            form=form
                        )
                        db.add(new_student)
                        created_count += 1
                        logger.debug(f"Row {row_num}: Created student {student_id} - {student_name}")
                    except Exception as db_error:
                        errors.append(f"Row {row_num}: Database error creating student {student_id}: {str(db_error)}")
                        skipped_count += 1
                        logger.error(f"Database error on row {row_num}: {db_error}", exc_info=True)
                        continue
                
            except Exception as e:
                errors.append(f"Row {row_num}: {str(e)}")
                skipped_count += 1
                logger.error(f"Error processing CSV row {row_num}: {e}")
        
        # Check if any rows were processed
        total_processed = created_count + updated_count + skipped_count
        if total_processed == 0:
            logger.warning("No rows were processed from CSV file")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid rows found in CSV file. Please check the format."
            )
        
        # Commit all changes
        db.commit()
        
        logger.info(f"CSV import completed: {created_count} created, {updated_count} updated, {skipped_count} skipped")
        
        return {
            "message": "CSV import completed",
            "created": created_count,
            "updated": updated_count,
            "skipped": skipped_count,
            "errors": errors[:10] if errors else [],  # Return first 10 errors
            "total_errors": len(errors)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"CSV import failed: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to import CSV: {str(e)}"
        )
