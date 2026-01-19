"""
Database Seed Script
Creates an initial admin teacher account for testing.
"""

import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, init_db
from app.models import Teacher
from app.utils.security import get_password_hash


def seed_database():
    """Seed the database with initial data."""
    
    # Initialize database tables
    print("Initializing database tables...")
    init_db()
    
    db = SessionLocal()
    
    try:
        # Check if admin teacher exists
        existing_admin = db.query(Teacher).filter(
            Teacher.email == "admin@edulink.com"
        ).first()
        
        if existing_admin:
            print("Admin teacher already exists.")
            print(f"  Email: {existing_admin.email}")
            print(f"  Teacher ID: {existing_admin.teacher_id}")
            return
        
        # Create admin teacher
        admin_teacher = Teacher(
            teacher_id="T000001",
            name="Admin Teacher",
            email="admin@edulink.com",
            password_hash=get_password_hash("admin123")
        )
        
        db.add(admin_teacher)
        db.commit()
        
        print("=" * 50)
        print("Admin teacher created successfully!")
        print("=" * 50)
        print(f"  Teacher ID: T000001")
        print(f"  Email: admin@edulink.com")
        print(f"  Password: admin123")
        print("=" * 50)
        print("IMPORTANT: Change the password after first login!")
        print("=" * 50)
        
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
