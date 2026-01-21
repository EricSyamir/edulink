-- Migration Script: Update database schema for EduLink BErCHAMPION (MySQL)
-- Migrates from points system to misconduct tracking system
-- Run this script on your existing MySQL database

-- ============================================
-- 1. UPDATE TEACHERS TABLE
-- Add is_admin column
-- ============================================
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'teachers' 
    AND COLUMN_NAME = 'is_admin'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE teachers ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL',
    'SELECT "Column is_admin already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Set existing admin accounts to admin
UPDATE teachers SET is_admin = TRUE WHERE email IN ('admin@edulink.com', 'admin2@edulink.com');

-- ============================================
-- 2. UPDATE STUDENTS TABLE
-- Rename standard to form and update constraint
-- ============================================
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'students' 
    AND COLUMN_NAME = 'standard'
);

SET @sql = IF(@col_exists > 0,
    'ALTER TABLE students CHANGE COLUMN standard form INT NOT NULL CHECK (form >= 1 AND form <= 5)',
    'SELECT "Column standard does not exist (may already be renamed)" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Update any values > 5 to 5
UPDATE students SET form = 5 WHERE form > 5;

-- Drop old index and create new one
DROP INDEX IF EXISTS idx_student_standard ON students;
CREATE INDEX IF NOT EXISTS idx_student_form ON students(form);

-- ============================================
-- 3. UPDATE DISCIPLINE_RECORDS TABLE
-- Migrate from points system to misconduct system
-- ============================================
-- Add severity column
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'discipline_records' 
    AND COLUMN_NAME = 'severity'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE discipline_records ADD COLUMN severity ENUM(\'light\', \'medium\')',
    'SELECT "Column severity already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Migrate data: rewards -> light, punishments -> medium
UPDATE discipline_records SET severity = 'light' WHERE type = 'reward';
UPDATE discipline_records SET severity = 'medium' WHERE type = 'punishment';

-- Make severity NOT NULL
ALTER TABLE discipline_records MODIFY COLUMN severity ENUM('light', 'medium') NOT NULL;

-- Add misconduct_type column
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'discipline_records' 
    AND COLUMN_NAME = 'misconduct_type'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE discipline_records ADD COLUMN misconduct_type VARCHAR(100)',
    'SELECT "Column misconduct_type already exists" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Set default values based on severity
UPDATE discipline_records SET misconduct_type = 
    CASE 
        WHEN severity = 'light' THEN 'Late to Class'
        WHEN severity = 'medium' THEN 'Skipping Class'
    END
WHERE misconduct_type IS NULL;

ALTER TABLE discipline_records MODIFY COLUMN misconduct_type VARCHAR(100) NOT NULL;

-- Rename reason to notes if needed
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'discipline_records' 
    AND COLUMN_NAME = 'reason'
);

SET @sql = IF(@col_exists > 0,
    'ALTER TABLE discipline_records CHANGE COLUMN reason notes TEXT',
    'SELECT "Column reason does not exist (may already be renamed)" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Drop old columns
ALTER TABLE discipline_records DROP COLUMN IF EXISTS type;
ALTER TABLE discipline_records DROP COLUMN IF EXISTS points_change;

-- Update indexes
DROP INDEX IF EXISTS idx_discipline_type ON discipline_records;
CREATE INDEX IF NOT EXISTS idx_discipline_severity ON discipline_records(severity);
CREATE INDEX IF NOT EXISTS idx_discipline_misconduct_type ON discipline_records(misconduct_type);

-- ============================================
-- 4. DROP STUDENT_POINTS TABLE
-- ============================================
DROP TABLE IF EXISTS student_points;

-- ============================================
-- 5. DROP OLD TRIGGERS
-- ============================================
DROP TRIGGER IF EXISTS after_discipline_insert;
DROP TRIGGER IF EXISTS after_student_insert;

-- ============================================
-- Migration Complete!
-- ============================================
SELECT 'Migration completed successfully!' AS status;
