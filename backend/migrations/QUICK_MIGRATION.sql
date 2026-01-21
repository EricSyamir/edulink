-- QUICK MIGRATION SCRIPT FOR RENDER/CLOUD DATABASE
-- Copy and paste this entire script into your PostgreSQL database console
-- Or run via: psql $DATABASE_URL -f QUICK_MIGRATION.sql

-- 1. Add is_admin to teachers table
ALTER TABLE teachers ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- Set existing admin accounts
UPDATE teachers SET is_admin = TRUE WHERE email IN ('admin@edulink.com', 'admin2@edulink.com');

-- 2. Rename standard to form in students table (if column exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'standard') THEN
        UPDATE students SET standard = 5 WHERE standard > 5;
        ALTER TABLE students RENAME COLUMN standard TO form;
        ALTER TABLE students DROP CONSTRAINT IF EXISTS students_form_check;
        ALTER TABLE students ADD CONSTRAINT students_form_check CHECK (form >= 1 AND form <= 5);
    END IF;
END $$;

-- 3. Create enum type for severity (if it doesn't exist)
DO $$ 
BEGIN
    CREATE TYPE misconduct_severity AS ENUM ('light', 'medium');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 4. Add severity column to discipline_records (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discipline_records' AND column_name = 'severity') THEN
        ALTER TABLE discipline_records ADD COLUMN severity VARCHAR(20);
        
        -- Migrate data based on type enum (cast to text for comparison)
        UPDATE discipline_records SET severity = 'light' WHERE type::text = 'reward';
        UPDATE discipline_records SET severity = 'medium' WHERE type::text = 'punishment';
        
        ALTER TABLE discipline_records ALTER COLUMN severity SET NOT NULL;
        
        -- Convert to enum type
        ALTER TABLE discipline_records ALTER COLUMN severity TYPE misconduct_severity USING severity::misconduct_severity;
    END IF;
END $$;

-- 5. Add misconduct_type column
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discipline_records' AND column_name = 'misconduct_type') THEN
        ALTER TABLE discipline_records ADD COLUMN misconduct_type VARCHAR(100);
        UPDATE discipline_records SET misconduct_type = 
            CASE 
                WHEN severity::text = 'light' THEN 'Late to Class'
                WHEN severity::text = 'medium' THEN 'Skipping Class'
                ELSE 'Late to Class'
            END;
        ALTER TABLE discipline_records ALTER COLUMN misconduct_type SET NOT NULL;
    END IF;
END $$;

-- 6. Rename reason to notes
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discipline_records' AND column_name = 'reason') 
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'discipline_records' AND column_name = 'notes') THEN
        ALTER TABLE discipline_records RENAME COLUMN reason TO notes;
    END IF;
END $$;

-- 7. Drop old columns from discipline_records
ALTER TABLE discipline_records DROP COLUMN IF EXISTS type;
ALTER TABLE discipline_records DROP COLUMN IF EXISTS points_change;

-- 8. Drop old enum type if it exists (cleanup)
DO $$ 
BEGIN
    DROP TYPE IF EXISTS disciplinetype CASCADE;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- 9. Drop student_points table
DROP TABLE IF EXISTS student_points CASCADE;

-- 10. Create indexes
DROP INDEX IF EXISTS idx_student_standard;
CREATE INDEX IF NOT EXISTS idx_student_form ON students(form);
CREATE INDEX IF NOT EXISTS idx_discipline_severity ON discipline_records(severity);
CREATE INDEX IF NOT EXISTS idx_discipline_misconduct_type ON discipline_records(misconduct_type);

-- Done!
SELECT 'Migration completed successfully!' AS status;
