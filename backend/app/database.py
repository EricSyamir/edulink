"""
Database Configuration Module
Sets up SQLAlchemy engine, session, and base model.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
from loguru import logger

from app.config import settings

# Create SQLAlchemy engine with connection pooling
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Enable connection health checks
    pool_recycle=3600,   # Recycle connections after 1 hour
    echo=settings.DEBUG  # Log SQL queries in debug mode
)

# Session factory for creating database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for all ORM models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function that yields a database session.
    Ensures proper cleanup after request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def run_auto_migration():
    """
    Automatically migrate database schema on startup.
    Checks if columns exist and migrates if needed.
    """
    logger.info("Checking if database migration is needed...")
    
    db = SessionLocal()
    try:
        # Check if is_admin column exists
        result = db.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = 'teachers' AND column_name = 'is_admin'
        """))
        has_is_admin = result.scalar() > 0
        
        # Check if form column exists (or if standard exists)
        result = db.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = 'students' AND column_name = 'form'
        """))
        has_form = result.scalar() > 0
        
        result = db.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = 'students' AND column_name = 'standard'
        """))
        has_standard = result.scalar() > 0
        
        # Check if severity column exists
        result = db.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.columns 
            WHERE table_name = 'discipline_records' AND column_name = 'severity'
        """))
        has_severity = result.scalar() > 0
        
        # Check if severity column is currently an enum type (needs conversion to varchar)
        result = db.execute(text("""
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name = 'discipline_records' AND column_name = 'severity'
        """))
        severity_type_row = result.fetchone()
        severity_is_enum = severity_type_row and severity_type_row[0] == 'USER-DEFINED'
        
        # If everything is already migrated and severity is varchar, skip
        if has_is_admin and has_form and has_severity and not severity_is_enum:
            logger.info("Database schema is up to date - no migration needed")
            return
        
        # If severity is enum, convert to varchar
        if has_severity and severity_is_enum:
            logger.info("Converting severity column from enum to varchar...")
            db.execute(text("ALTER TABLE discipline_records ALTER COLUMN severity TYPE VARCHAR(20) USING severity::text"))
            db.commit()
            logger.info("✓ Converted severity to varchar")
        
        logger.warning("Database schema needs migration - running auto-migration...")
        
        # 1. Add is_admin to teachers
        if not has_is_admin:
            logger.info("Adding is_admin column to teachers table...")
            db.execute(text("ALTER TABLE teachers ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL"))
            db.execute(text("UPDATE teachers SET is_admin = TRUE WHERE email IN ('admin@edulink.com', 'admin2@edulink.com')"))
            db.commit()
            logger.info("✓ Added is_admin column")
        
        # 2. Rename standard to form
        if has_standard and not has_form:
            logger.info("Renaming standard to form in students table...")
            db.execute(text("UPDATE students SET standard = 5 WHERE standard > 5"))
            db.execute(text("ALTER TABLE students RENAME COLUMN standard TO form"))
            db.execute(text("ALTER TABLE students DROP CONSTRAINT IF EXISTS students_form_check"))
            db.execute(text("ALTER TABLE students ADD CONSTRAINT students_form_check CHECK (form >= 1 AND form <= 5)"))
            db.commit()
            logger.info("✓ Renamed standard to form")
        
        # 3. Update discipline_records
        if not has_severity:
            logger.info("Updating discipline_records table...")
            
            # Check if type column exists (old schema)
            result = db.execute(text("""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'discipline_records' AND column_name = 'type'
            """))
            has_type = result.scalar() > 0
            
            # Add severity column
            db.execute(text("ALTER TABLE discipline_records ADD COLUMN severity VARCHAR(20)"))
            
            if has_type:
                # Migrate existing data
                db.execute(text("UPDATE discipline_records SET severity = 'light' WHERE type::text = 'reward'"))
                db.execute(text("UPDATE discipline_records SET severity = 'medium' WHERE type::text = 'punishment'"))
            
            db.execute(text("ALTER TABLE discipline_records ALTER COLUMN severity SET NOT NULL"))
            # Keep as VARCHAR - no enum conversion needed
            
            # Add misconduct_type
            db.execute(text("ALTER TABLE discipline_records ADD COLUMN misconduct_type VARCHAR(100)"))
            db.execute(text("""
                UPDATE discipline_records SET misconduct_type = 
                    CASE 
                        WHEN severity::text = 'light' THEN 'Late to Class'
                        WHEN severity::text = 'medium' THEN 'Skipping Class'
                        ELSE 'Late to Class'
                    END
            """))
            db.execute(text("ALTER TABLE discipline_records ALTER COLUMN misconduct_type SET NOT NULL"))
            
            # Rename reason to notes
            result = db.execute(text("""
                SELECT COUNT(*) 
                FROM information_schema.columns 
                WHERE table_name = 'discipline_records' AND column_name = 'reason'
            """))
            has_reason = result.scalar() > 0
            
            if has_reason:
                db.execute(text("ALTER TABLE discipline_records RENAME COLUMN reason TO notes"))
            
            # Drop old columns
            db.execute(text("ALTER TABLE discipline_records DROP COLUMN IF EXISTS type"))
            db.execute(text("ALTER TABLE discipline_records DROP COLUMN IF EXISTS points_change"))
            
            db.commit()
            logger.info("✓ Updated discipline_records table")
        
        # 4. Drop student_points table
        result = db.execute(text("""
            SELECT COUNT(*) 
            FROM information_schema.tables 
            WHERE table_name = 'student_points'
        """))
        has_student_points = result.scalar() > 0
        
        if has_student_points:
            logger.info("Dropping student_points table...")
            db.execute(text("DROP TABLE IF EXISTS student_points CASCADE"))
            db.commit()
            logger.info("✓ Dropped student_points table")
        
        # 5. Create indexes
        logger.info("Creating indexes...")
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_student_form ON students(form)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_discipline_severity ON discipline_records(severity)"))
        db.execute(text("CREATE INDEX IF NOT EXISTS idx_discipline_misconduct_type ON discipline_records(misconduct_type)"))
        db.commit()
        
        logger.info("=" * 60)
        logger.info("✅ Database migration completed successfully!")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


def init_db():
    """
    Initialize database by creating all tables.
    Called on application startup.
    """
    # Import all models to ensure they're registered with Base
    from app.models import Student, Teacher, DisciplineRecord
    
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    # Run automatic migration
    try:
        run_auto_migration()
    except Exception as e:
        logger.warning(f"Auto-migration failed (non-critical): {e}")
        logger.warning("You may need to run the migration script manually")