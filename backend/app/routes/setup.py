"""
Setup Routes
One-time initialization endpoints for database setup.
"""

from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from loguru import logger
import sys
import os
import re

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
        
        # Check if admin teacher exists
        existing_admin = db.query(Teacher).filter(
            Teacher.email == "admin@edulink.com"
        ).first()
        
        if existing_admin:
            # Update admin password to ensure it's correct
            logger.info("Admin teacher exists, updating password...")
            existing_admin.password_hash = get_password_hash("admin123")
            existing_admin.teacher_id = "T000001"  # Ensure correct teacher_id
            existing_admin.name = "Admin Teacher"  # Ensure correct name
            db.commit()
            db.refresh(existing_admin)
            logger.info("✓ Admin teacher password updated")
            
            return {
                "message": "Database initialized successfully",
                "admin_updated": True,
                "admin_email": "admin@edulink.com",
                "admin_password": "admin123",
                "warning": "⚠️ CHANGE THE ADMIN PASSWORD AFTER FIRST LOGIN!"
            }
        
        # Create admin teacher if it doesn't exist
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


def extract_first_name(full_name: str) -> str:
    """Extract first name from full name."""
    name = full_name.strip()
    prefixes = ['Haji', 'Hajah', 'Dato', 'Datuk', 'Datin', 'Dr', 'Prof', 'Mr', 'Mrs', 'Ms', 'Miss']
    for prefix in prefixes:
        if name.startswith(prefix + ' '):
            name = name[len(prefix) + 1:].strip()
    parts = name.split()
    if not parts:
        return "teacher"
    first_name = parts[0]
    first_name = re.sub(r'[^a-zA-Z]', '', first_name).lower()
    if len(first_name) < 2 and len(parts) > 1:
        first_name = re.sub(r'[^a-zA-Z]', '', parts[1]).lower()
    if not first_name or len(first_name) < 2:
        first_name = "teacher"
    return first_name


def generate_email(name: str, teacher_id: int) -> str:
    """Generate email in format: firstname_id@edulink.com"""
    first_name = extract_first_name(name)
    return f"{first_name}_{teacher_id}@edulink.com"


@router.post("/seed-teachers")
def seed_teachers_endpoint(db: Session = Depends(get_db)):
    """
    Seed teachers from CSV data.
    
    Creates all 74 teachers with:
    - Email format: firstname_id@edulink.com
    - Password: admin123 (same as admin)
    - Teacher with Bil=1 is set as admin
    """
    try:
        teachers_data = [
            (1, "Haji Zuhair Azuar bin Arifin", "Pengetua"),
            (2, "Asmariah binti Harun", "PK Pentadbiran"),
            (3, "Nina Rafida binti Zahari", "PK Hem"),
            (4, "Anuar bin Md Ghazali", "PK Koku"),
            (5, "Azilah bint Hussin", "GK VoTek"),
            (6, "Bong Lip Chi", "GKK"),
            (7, "Saidatulnizam binti Idris", "GK Sains"),
            (8, "Chan Su San", "GK Bahasa"),
            (9, "A.R. Kanimalar a/p Arasu", "Guru"),
            (10, "Arthini a/p Kanesin", "Guru"),
            (11, "Azeera binti Jamian", "Guru"),
            (12, "Aziah binti Abdul Aziz @ Mohd Salleh", "Guru"),
            (13, "Azlili binti Ahmad", "Guru"),
            (14, "Che Mohd Yazrizal bin Che Ismail", "Guru"),
            (15, "Fauziah binti Daud", "Guru"),
            (16, "Habsah binti Mohamed @ Yahaya", "Guru"),
            (17, "Hadibah bt Khalib", "Guru"),
            (18, "Ijlali Husna binti Alias", "Guru"),
            (19, "Joyce a/p Armoothdam", "Guru"),
            (20, "Koey Li Li", "Guru"),
            (21, "Lee Bee Siang", "Guru"),
            (22, "Lee Kam See", "Guru"),
            (23, "Muhamad Faizal bin M Yusop", "Guru"),
            (24, "Muhammad Esyraq Faiq bin Mohd Radzi", "Guru"),
            (25, "Noor Azwa binti Mohd Anuar", "Guru"),
            (26, "Noorsakyna binti Kasim", "Guru"),
            (27, "Nor Aznieza binti Ab. Rahman", "Guru"),
            (28, "Norhalis Syafiq bin Baharuddin", "Guru"),
            (29, "Norazlina @ Azlina binti Jaafar", "Guru"),
            (30, "Nur Fatin Aini bt Ab Halim", "Guru"),
            (31, "Nur Natrah Natasha bt Mustapa Ayub", "Guru"),
            (32, "Nurraihan Afiqah bt Harun", "Guru"),
            (33, "Nurul Huda binti Kamarudin", "Guru"),
            (34, "Nurul Nabila binti Azmi", "Guru"),
            (35, "Nurul Shahida binti Mohamad Salin", "Guru"),
            (36, "Nurulamira binti Mansyurdin", "Guru"),
            (37, "Pon Amaravathi a/p S.Ramiah", "Guru"),
            (38, "R.Gopal a/l R. Ramanathan", "Guru"),
            (39, "Ramlah binti Ramlan", "Guru"),
            (40, "Rasyidin bin Ishak @ Yusoff Bakri", "Guru"),
            (41, "Rofishah bt Isa", "Guru"),
            (42, "Shaidatul Aishah binti Jeffry Suzzi", "Guru"),
            (43, "Siti Nordiana bt Sadek", "Guru"),
            (44, "Siti Nurtasnim binti Mat Zuki", "Guru"),
            (45, "Teoh Sock Phin", "Guru"),
            (46, "Venu Srilatchumy a/p Puvanesvarah", "Guru"),
            (47, "Wong Wing Kai", "Guru"),
            (48, "Zaleha binti Abu Talib", "Guru"),
            (49, "Zam Zurina binti Zahari", "Guru"),
            (50, "Khairul Farez bin Nahrawi", "PK Ptg"),
            (51, "Ailyanti binti Mustapa", "Guru"),
            (52, "Ban Boon Keat", "Guru"),
            (53, "Ching Zhi Yang", "Guru"),
            (54, "Faradina binti Mat Khairi", "Guru"),
            (55, "Hartinawati binti Abdul Samad", "Guru"),
            (56, "Juliana binti Hasan", "Guru"),
            (57, "Kribashini a/p Seteyen Selen", "Guru"),
            (58, "Lam Lee Ching", "Guru"),
            (59, "Liyana Irdina bt Kamarudin", "Guru"),
            (60, "Meor Muhammad Saifullah bin Abdullah", "Guru"),
            (61, "Mohd Azli bin Kamiran", "Guru"),
            (62, "Mohd Aidie Azhar bin Zukipli", "Guru"),
            (63, "Mohamad Sharifudin bin Mustapha", "Guru"),
            (64, "Muhammad Izzul Azmi bin Mohd Salleh", "Guru"),
            (65, "Muhammad Syahir bin Yusoff", "Guru"),
            (66, "Muhammad Yusri bin Yahya", "Guru"),
            (67, "Nik Hamizah binti Nik Hashim", "Guru"),
            (68, "Noor Faraheen bt Mohd Rahmat", "Guru"),
            (69, "Nor Habibah bt Ab Azib", "Guru"),
            (70, "Nurul Ayuniey binti Salleh", "Guru"),
            (71, "Rohana binti Mohd Razali", "Guru"),
            (72, "Rusnani binti Saad", "Guru"),
            (73, "Selvi a/p Kathiry", "Guru"),
            (74, "Sivakumar a/l Thuraisingam", "Guru"),
        ]
        
        created_count = 0
        updated_count = 0
        
        for bil, name, role in teachers_data:
            teacher_id = f"T{bil:06d}"
            email = generate_email(name, bil)
            
            existing = db.query(Teacher).filter(
                (Teacher.email == email) | (Teacher.teacher_id == teacher_id)
            ).first()
            
            if existing:
                existing.name = name
                existing.teacher_id = teacher_id
                existing.email = email
                existing.password_hash = get_password_hash("admin123")
                if bil == 1:
                    existing.is_admin = True
                updated_count += 1
            else:
                teacher = Teacher(
                    teacher_id=teacher_id,
                    name=name,
                    email=email,
                    password_hash=get_password_hash("admin123"),
                    is_admin=(bil == 1)
                )
                db.add(teacher)
                created_count += 1
        
        db.commit()
        
        logger.info(f"Seeded teachers: {created_count} created, {updated_count} updated")
        
        return {
            "message": "Teachers seeded successfully",
            "created": created_count,
            "updated": updated_count,
            "total": len(teachers_data),
            "admin_email": generate_email("Haji Zuhair Azuar bin Arifin", 1),
            "admin_password": "admin123"
        }
        
    except Exception as e:
        logger.error(f"Error seeding teachers: {e}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed teachers: {str(e)}"
        )
