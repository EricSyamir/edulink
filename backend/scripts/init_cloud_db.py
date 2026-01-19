"""
Cloud Database Initialization Script
Run this script once after deploying to initialize the database.
Can be run via Render Shell or Railway console.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, Base, SessionLocal
from app.models import student, teacher, discipline_record, student_points
from app.utils.security import get_password_hash
from loguru import logger

def init_database():
    """Create all tables."""
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("✓ Tables created successfully")

def seed_admin():
    """Create initial admin teacher."""
    db = SessionLocal()
    try:
        from app.models import Teacher
        
        # Check if admin exists
        existing = db.query(Teacher).filter(Teacher.email == "admin@edulink.com").first()
        if existing:
            logger.info("Admin teacher already exists")
            return
        
        # Create admin
        admin = Teacher(
            teacher_id="T000001",
            name="Admin Teacher",
            email="admin@edulink.com",
            password_hash=get_password_hash("admin123")
        )
        
        db.add(admin)
        db.commit()
        
        logger.info("=" * 50)
        logger.info("Admin teacher created!")
        logger.info("Email: admin@edulink.com")
        logger.info("Password: admin123")
        logger.info("⚠️  CHANGE THIS PASSWORD AFTER FIRST LOGIN!")
        logger.info("=" * 50)
        
    except Exception as e:
        logger.error(f"Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Edulink Cloud Database Initialization")
    print("=" * 60)
    
    try:
        init_database()
        seed_admin()
        print("\n✓ Database initialization complete!")
        print("\nYou can now access your application.")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)
