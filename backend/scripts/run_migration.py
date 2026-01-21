"""
Database Migration Script
Run this script to migrate existing database to the new misconduct system.
Supports both PostgreSQL and MySQL.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal
from sqlalchemy import text
from loguru import logger

def detect_database_type():
    """Detect database type from connection URL."""
    url = str(engine.url)
    if 'postgresql' in url.lower():
        return 'postgresql'
    elif 'mysql' in url.lower():
        return 'mysql'
    else:
        raise ValueError(f"Unsupported database type: {url}")

def run_migration():
    """Run the appropriate migration script."""
    db_type = detect_database_type()
    logger.info(f"Detected database type: {db_type}")
    
    # Read migration SQL file
    if db_type == 'postgresql':
        migration_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'migrations',
            'migrate_to_misconduct_system.sql'
        )
    else:  # mysql
        migration_file = os.path.join(
            os.path.dirname(os.path.dirname(__file__)),
            'migrations',
            'migrate_to_misconduct_system_mysql.sql'
        )
    
    if not os.path.exists(migration_file):
        logger.error(f"Migration file not found: {migration_file}")
        return False
    
    logger.info(f"Reading migration file: {migration_file}")
    with open(migration_file, 'r', encoding='utf-8') as f:
        migration_sql = f.read()
    
    db = SessionLocal()
    try:
        logger.info("Starting migration...")
        
        # Execute migration SQL
        # Split by semicolons and execute each statement
        statements = [s.strip() for s in migration_sql.split(';') if s.strip()]
        
        for i, statement in enumerate(statements, 1):
            if statement:
                try:
                    logger.info(f"Executing statement {i}/{len(statements)}...")
                    db.execute(text(statement))
                    db.commit()
                except Exception as e:
                    # Some statements might fail if already executed (idempotent)
                    if 'already exists' in str(e).lower() or 'does not exist' in str(e).lower():
                        logger.warning(f"Statement {i} skipped (already applied or not applicable): {e}")
                        db.rollback()
                    else:
                        logger.error(f"Error executing statement {i}: {e}")
                        db.rollback()
                        raise
        
        logger.info("=" * 60)
        logger.info("Migration completed successfully!")
        logger.info("=" * 60)
        logger.info("Database schema has been updated:")
        logger.info("  ✓ teachers.is_admin column added")
        logger.info("  ✓ students.standard renamed to form")
        logger.info("  ✓ discipline_records updated to misconduct system")
        logger.info("  ✓ student_points table removed")
        logger.info("=" * 60)
        
        return True
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("EduLink BErCHAMPION Database Migration")
    print("=" * 60)
    print("\nThis script will migrate your database from the points")
    print("system to the new misconduct tracking system.\n")
    
    try:
        success = run_migration()
        if success:
            print("\n✓ Migration completed successfully!")
            print("You can now use the application with the new misconduct system.")
        else:
            print("\n✗ Migration failed. Please check the logs above.")
            sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        sys.exit(1)
