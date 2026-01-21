"""
Quick Migration Script
Run this script to apply the QUICK_MIGRATION.sql to convert enum to VARCHAR.
This specifically handles the enum-to-VARCHAR conversion for the severity column.
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal
from sqlalchemy import text
from loguru import logger

def run_quick_migration():
    """Run the QUICK_MIGRATION.sql script."""
    migration_file = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        'migrations',
        'QUICK_MIGRATION.sql'
    )
    
    if not os.path.exists(migration_file):
        logger.error(f"Migration file not found: {migration_file}")
        return False
    
    logger.info(f"Reading migration file: {migration_file}")
    with open(migration_file, 'r', encoding='utf-8') as f:
        migration_sql = f.read()
    
    db = SessionLocal()
    try:
        logger.info("Starting quick migration...")
        logger.info("This will:")
        logger.info("  1. Add is_admin to teachers (if needed)")
        logger.info("  2. Rename standard to form in students (if needed)")
        logger.info("  3. Update discipline_records to misconduct system (if needed)")
        logger.info("  4. Convert severity column from enum to VARCHAR (if needed)")
        logger.info("  5. Drop student_points table (if exists)")
        
        # Execute the entire migration SQL
        # PostgreSQL DO blocks need to be executed as single statements
        # Split by semicolons but handle DO blocks specially
        statements = []
        current_statement = ""
        in_do_block = False
        
        for line in migration_sql.split('\n'):
            line = line.strip()
            if not line or line.startswith('--'):
                continue
            
            current_statement += line + ' '
            
            # Check if we're starting a DO block
            if 'DO $$' in line.upper() or 'DO $$' in current_statement.upper():
                in_do_block = True
            
            # Check if DO block ends
            if in_do_block and 'END $$;' in line.upper():
                statements.append(current_statement.strip())
                current_statement = ""
                in_do_block = False
            elif not in_do_block and current_statement.rstrip().endswith(';'):
                # Regular statement ending with semicolon
                statements.append(current_statement.strip())
                current_statement = ""
        
        # Add any remaining statement
        if current_statement.strip():
            statements.append(current_statement.strip())
        
        logger.info(f"Found {len(statements)} statements to execute")
        
        for i, statement in enumerate(statements, 1):
            if statement:
                try:
                    logger.info(f"Executing statement {i}/{len(statements)}...")
                    logger.debug(f"Statement: {statement[:100]}...")  # Log first 100 chars
                    db.execute(text(statement))
                    db.commit()
                except Exception as e:
                    error_msg = str(e).lower()
                    # Some statements might fail if already executed (idempotent)
                    if any(phrase in error_msg for phrase in [
                        'already exists', 
                        'does not exist',
                        'duplicate_object',
                        'duplicate',
                        'cannot drop',
                        'relation already exists'
                    ]):
                        logger.warning(f"Statement {i} skipped (already applied or not applicable): {str(e)[:100]}")
                        db.rollback()
                    else:
                        logger.error(f"Error executing statement {i}: {e}")
                        logger.error(f"Statement was: {statement[:200]}")
                        db.rollback()
                        # Continue with other statements for some errors
                        if 'not found' not in error_msg:
                            raise
        
        logger.info("=" * 60)
        logger.info("Quick Migration completed successfully!")
        logger.info("=" * 60)
        logger.info("Database schema has been updated:")
        logger.info("  ✓ teachers.is_admin column (if needed)")
        logger.info("  ✓ students.standard → form (if needed)")
        logger.info("  ✓ discipline_records updated to misconduct system (if needed)")
        logger.info("  ✓ severity column converted from enum to VARCHAR (if needed)")
        logger.info("  ✓ student_points table removed (if existed)")
        logger.info("=" * 60)
        
        return True
        
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        import traceback
        logger.error(traceback.format_exc())
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 60)
    print("EduLink BErCHAMPION Quick Migration")
    print("=" * 60)
    print("\nThis script will apply the QUICK_MIGRATION.sql to:")
    print("  - Add is_admin to teachers")
    print("  - Rename standard to form")
    print("  - Update discipline_records")
    print("  - Convert severity from enum to VARCHAR (fixes SQLAlchemy issues)")
    print("  - Drop student_points table\n")
    
    try:
        success = run_quick_migration()
        if success:
            print("\n✓ Migration completed successfully!")
            print("The database is now ready for the misconduct system.")
        else:
            print("\n✗ Migration failed. Please check the logs above.")
            sys.exit(1)
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
