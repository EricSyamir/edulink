"""
Setup Routes
One-time initialization endpoints for database setup.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from loguru import logger

from app.database import get_db, init_db
from app.models import Teacher
from app.utils.security import get_password_hash

router = APIRouter(prefix="/api/setup", tags=["Setup"])


@router.post("/init-database")
def initialize_database(db: Session = Depends(get_db)):
    """
    Initialize database tables and create admin account.
    
    This endpoint:
    1. Creates all database tables
    2. Creates admin teacher account (if it doesn't exist)
    
    **WARNING**: Only run this once! Safe to run multiple times (idempotent).
    """
    try:
        # Initialize database tables
        logger.info("Initializing database tables...")
        init_db()
        logger.info("✓ Database tables created")
        
        # Create admin teacher if it doesn't exist
        existing_admin = db.query(Teacher).filter(
            Teacher.email == "admin@edulink.com"
        ).first()
        
        if existing_admin:
            logger.info("Admin teacher already exists")
            return {
                "message": "Database already initialized",
                "admin_exists": True,
                "admin_email": "admin@edulink.com"
            }
        
        # Create admin teacher
        admin_teacher = Teacher(
            teacher_id="T000001",
            name="Admin Teacher",
            email="admin@edulink.com",
            password_hash=get_password_hash("admin123")
        )
        
        db.add(admin_teacher)
        db.commit()
        db.refresh(admin_teacher)
        
        logger.info("✓ Admin teacher created successfully")
        
        return {
            "message": "Database initialized successfully",
            "admin_created": True,
            "admin_email": "admin@edulink.com",
            "admin_password": "admin123",
            "warning": "⚠️ CHANGE THE ADMIN PASSWORD AFTER FIRST LOGIN!"
        }
        
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database initialization failed: {str(e)}"
        )
