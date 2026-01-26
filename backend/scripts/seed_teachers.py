"""
Seed Teachers Script
Imports teachers from CSV data and creates accounts with email format: firstname_id@edulink.com
All passwords set to admin123 (same as admin)
"""

import sys
import os
import re

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import SessionLocal, init_db
from app.models import Teacher
from app.utils.security import get_password_hash
from loguru import logger


def extract_first_name(full_name: str) -> str:
    """
    Extract first name from full name.
    Handles Malay names like "Haji Zuhair Azuar bin Arifin" -> "zuhair"
    Handles names like "Asmariah binti Harun" -> "asmariah"
    Handles names like "Nina Rafida binti Zahari" -> "nina"
    Handles names like "A.R. Kanimalar a/p Arasu" -> "kanimalar"
    """
    # Remove titles and prefixes
    name = full_name.strip()
    
    # Remove common prefixes
    prefixes = ['Haji', 'Hajah', 'Dato', 'Datuk', 'Datin', 'Dr', 'Prof', 'Mr', 'Mrs', 'Ms', 'Miss']
    for prefix in prefixes:
        if name.startswith(prefix + ' '):
            name = name[len(prefix) + 1:].strip()
    
    # Split by spaces
    parts = name.split()
    
    if not parts:
        return "teacher"
    
    # Get first meaningful word (skip single letters like "A.R.")
    first_name = parts[0]
    
    # Remove dots and special chars, convert to lowercase
    first_name = re.sub(r'[^a-zA-Z]', '', first_name).lower()
    
    # If first name is too short or empty, try next part
    if len(first_name) < 2 and len(parts) > 1:
        first_name = re.sub(r'[^a-zA-Z]', '', parts[1]).lower()
    
    # Fallback
    if not first_name or len(first_name) < 2:
        first_name = "teacher"
    
    return first_name


def generate_email(name: str, teacher_id: int) -> str:
    """Generate email in format: firstname_id@edulink.com"""
    first_name = extract_first_name(name)
    return f"{first_name}_{teacher_id}@edulink.com"


def seed_teachers():
    """Seed teachers from CSV data."""
    
    # Initialize database tables
    logger.info("Initializing database tables...")
    init_db()
    logger.info("✓ Database tables created")
    
    db = SessionLocal()
    
    try:
        # CSV data - Bil, Name, Role
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
        skipped_count = 0
        
        logger.info("=" * 60)
        logger.info("Seeding teachers from CSV data...")
        logger.info("=" * 60)
        
        for bil, name, role in teachers_data:
            # Generate teacher_id (T000001, T000002, etc.)
            teacher_id = f"T{bil:06d}"
            
            # Generate email: firstname_id@edulink.com
            email = generate_email(name, bil)
            
            # Check if teacher already exists (by email or teacher_id)
            existing = db.query(Teacher).filter(
                (Teacher.email == email) | (Teacher.teacher_id == teacher_id)
            ).first()
            
            if existing:
                # Update existing teacher
                existing.name = name
                existing.teacher_id = teacher_id
                existing.email = email
                # Update password to admin123
                existing.password_hash = get_password_hash("admin123")
                # Set admin if Bil=1
                if bil == 1:
                    existing.is_admin = True
                updated_count += 1
                logger.info(f"✓ Updated: {teacher_id} - {name} ({email})")
            else:
                # Create new teacher
                teacher = Teacher(
                    teacher_id=teacher_id,
                    name=name,
                    email=email,
                    password_hash=get_password_hash("admin123"),
                    is_admin=(bil == 1)  # Only Bil=1 is admin
                )
                db.add(teacher)
                created_count += 1
                logger.info(f"✓ Created: {teacher_id} - {name} ({email})")
        
        db.commit()
        
        logger.info("=" * 60)
        logger.info(f"Summary:")
        logger.info(f"  Created: {created_count} teachers")
        logger.info(f"  Updated: {updated_count} teachers")
        logger.info(f"  Skipped: {skipped_count} teachers")
        logger.info("=" * 60)
        logger.info(f"\nAdmin account:")
        logger.info(f"  Email: {generate_email('Haji Zuhair Azuar bin Arifin', 1)}")
        logger.info(f"  Password: admin123")
        logger.info(f"\n⚠️  All teachers should change their passwords after first login!")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.error(f"Error seeding teachers: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_teachers()
