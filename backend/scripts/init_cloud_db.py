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
from app.models import Student, Teacher, DisciplineRecord
from app.utils.security import get_password_hash
from loguru import logger

def init_database():
    """Create all tables."""
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("✓ Tables created successfully")

def seed_admin():
    """Create initial admin teachers."""
    db = SessionLocal()
    try:
        # Admin accounts to create
        admin_accounts = [
            {
                "teacher_id": "T000001",
                "name": "Admin 1",
                "email": "admin@edulink.com",
                "password": "admin123",
                "is_admin": True
            },
            {
                "teacher_id": "T000002",
                "name": "Admin 2",
                "email": "admin2@edulink.com",
                "password": "admin123",
                "is_admin": True
            }
        ]
        
        created_count = 0
        
        for admin in admin_accounts:
            # Check if admin exists
            existing = db.query(Teacher).filter(Teacher.email == admin["email"]).first()
            if existing:
                logger.info(f"Admin '{admin['name']}' already exists")
                continue
            
            # Create admin
            admin_teacher = Teacher(
                teacher_id=admin["teacher_id"],
                name=admin["name"],
                email=admin["email"],
                password_hash=get_password_hash(admin["password"]),
                is_admin=admin["is_admin"]
            )
            
            db.add(admin_teacher)
            created_count += 1
        
        db.commit()
        
        if created_count > 0:
            logger.info("=" * 50)
            logger.info(f"{created_count} admin teacher(s) created!")
            logger.info("=" * 50)
            for admin in admin_accounts:
                logger.info(f"\n  Name: {admin['name']}")
                logger.info(f"  Email: {admin['email']}")
                logger.info(f"  Password: {admin['password']}")
            logger.info("\n⚠️  CHANGE PASSWORDS AFTER FIRST LOGIN!")
            logger.info("=" * 50)
        else:
            logger.info("No new admin accounts created (all already exist)")
        
    except Exception as e:
        logger.error(f"Error creating admin: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("EduLink BErCHAMPION Cloud Database Initialization")
    print("=" * 60)
    
    try:
        init_database()
        seed_admin()
        print("\n✓ Database initialization complete!")
        print("\nYou can now access your application.")
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)
