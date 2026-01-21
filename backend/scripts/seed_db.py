"""
Database Seed Script
Creates initial admin teacher accounts for testing.
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
            # Check if admin teacher exists
            existing_admin = db.query(Teacher).filter(
                Teacher.email == admin["email"]
            ).first()
            
            if existing_admin:
                print(f"Admin '{admin['name']}' already exists.")
                continue
            
            # Create admin teacher
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
            print("=" * 50)
            print(f"{created_count} admin teacher(s) created successfully!")
            print("=" * 50)
            print("\nAdmin Accounts:")
            for admin in admin_accounts:
                print(f"\n  Name: {admin['name']}")
                print(f"  Email: {admin['email']}")
                print(f"  Password: {admin['password']}")
                print(f"  Teacher ID: {admin['teacher_id']}")
            print("\n" + "=" * 50)
            print("IMPORTANT: Change the passwords after first login!")
            print("=" * 50)
        else:
            print("No new admin accounts were created (all already exist).")
        
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
