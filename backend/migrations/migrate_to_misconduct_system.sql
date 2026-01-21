-- Migration Script: Update database schema for EduLink BErCHAMPION
-- Migrates from points system to misconduct tracking system
-- Run this script on your existing database

-- ============================================
-- 1. UPDATE TEACHERS TABLE
-- Add is_admin column
-- ============================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'teachers' AND column_name = 'is_admin'
    ) THEN
        ALTER TABLE teachers ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;
        -- Set existing admin accounts (if any) to admin
        UPDATE teachers SET is_admin = TRUE WHERE email IN ('admin@edulink.com', 'admin2@edulink.com');
    END IF;
END $$;

-- ============================================
-- 2. UPDATE STUDENTS TABLE
-- Rename standard to form and update constraint
-- ============================================
DO $$ 
BEGIN
    -- Rename column if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'students' AND column_name = 'standard'
    ) THEN
        -- First, update any values > 5 to 5 (since we're changing from 1-6 to 1-5)
        UPDATE students SET standard = 5 WHERE standard > 5;
        -- Rename the column
        ALTER TABLE students RENAME COLUMN standard TO form;
        -- Update constraint
        ALTER TABLE students DROP CONSTRAINT IF EXISTS students_form_check;
        ALTER TABLE students ADD CONSTRAINT students_form_check CHECK (form >= 1 AND form <= 5);
        -- Update index name if needed
        DROP INDEX IF EXISTS idx_student_standard;
        CREATE INDEX IF NOT EXISTS idx_student_form ON students(form);
    END IF;
END $$;

-- ============================================
-- 3. UPDATE DISCIPLINE_RECORDS TABLE
-- Migrate from points system to misconduct system
-- ============================================
DO $$ 
BEGIN
    -- Check if we need to migrate
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'discipline_records' AND column_name = 'type'
    ) THEN
        -- Add new columns if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'discipline_records' AND column_name = 'severity'
        ) THEN
            -- Add severity column
            ALTER TABLE discipline_records ADD COLUMN severity VARCHAR(20);
            -- Migrate data: rewards -> light, punishments -> medium
            UPDATE discipline_records SET severity = 'light' WHERE type = 'reward';
            UPDATE discipline_records SET severity = 'medium' WHERE type = 'punishment';
            -- Make it NOT NULL after migration
            ALTER TABLE discipline_records ALTER COLUMN severity SET NOT NULL;
            -- Create enum type if it doesn't exist
            DO $$ BEGIN
                CREATE TYPE misconduct_severity AS ENUM ('light', 'medium');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
            -- Change column type to enum
            ALTER TABLE discipline_records ALTER COLUMN severity TYPE misconduct_severity USING severity::misconduct_severity;
        END IF;
        
        -- Add misconduct_type column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'discipline_records' AND column_name = 'misconduct_type'
        ) THEN
            ALTER TABLE discipline_records ADD COLUMN misconduct_type VARCHAR(100);
            -- Set default values based on severity
            UPDATE discipline_records SET misconduct_type = 
                CASE 
                    WHEN severity = 'light' THEN 'Late to Class'
                    WHEN severity = 'medium' THEN 'Skipping Class'
                END;
            ALTER TABLE discipline_records ALTER COLUMN misconduct_type SET NOT NULL;
        END IF;
        
        -- Rename reason to notes if needed
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'discipline_records' AND column_name = 'reason'
        ) AND NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'discipline_records' AND column_name = 'notes'
        ) THEN
            ALTER TABLE discipline_records RENAME COLUMN reason TO notes;
        END IF;
        
        -- Drop old columns (type and points_change)
        ALTER TABLE discipline_records DROP COLUMN IF EXISTS type;
        ALTER TABLE discipline_records DROP COLUMN IF EXISTS points_change;
        
        -- Update indexes
        DROP INDEX IF EXISTS idx_discipline_type;
        CREATE INDEX IF NOT EXISTS idx_discipline_severity ON discipline_records(severity);
        CREATE INDEX IF NOT EXISTS idx_discipline_misconduct_type ON discipline_records(misconduct_type);
    END IF;
END $$;

-- ============================================
-- 4. DROP STUDENT_POINTS TABLE
-- No longer needed with misconduct system
-- ============================================
DROP TABLE IF EXISTS student_points CASCADE;

-- ============================================
-- 5. DROP OLD TRIGGERS (if they exist)
-- ============================================
DROP TRIGGER IF EXISTS after_discipline_insert ON discipline_records;
DROP FUNCTION IF EXISTS update_student_points() CASCADE;

-- ============================================
-- 6. VERIFY MIGRATION
-- ============================================
DO $$ 
BEGIN
    RAISE NOTICE 'Migration completed successfully!';
    RAISE NOTICE 'Please verify:';
    RAISE NOTICE '  - teachers.is_admin column exists';
    RAISE NOTICE '  - students.form column exists (replaced standard)';
    RAISE NOTICE '  - discipline_records has severity and misconduct_type columns';
    RAISE NOTICE '  - student_points table has been removed';
END $$;
