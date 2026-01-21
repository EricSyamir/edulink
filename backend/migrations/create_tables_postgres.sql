-- EduLink BErCHAMPION Database Schema
-- Creates all required tables for the discipline tracking system
-- Compatible with PostgreSQL 12+

-- Note: Using VARCHAR instead of enum for severity to avoid SQLAlchemy serialization issues

-- ============================================
-- STUDENTS TABLE
-- Stores student information and face embeddings
-- ============================================
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    form INTEGER NOT NULL CHECK (form >= 1 AND form <= 5),
    face_embedding TEXT NULL, -- JSON array of 512-dimensional face embedding
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for students
CREATE INDEX IF NOT EXISTS idx_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_student_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_student_class ON students(class_name);
CREATE INDEX IF NOT EXISTS idx_student_form ON students(form);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_students_updated_at ON students;
CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- TEACHERS TABLE
-- Stores teacher credentials and information
-- ============================================
CREATE TABLE IF NOT EXISTS teachers (
    id SERIAL PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for teachers
CREATE INDEX IF NOT EXISTS idx_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teacher_name ON teachers(name);

-- Trigger to update updated_at timestamp
DROP TRIGGER IF EXISTS update_teachers_updated_at ON teachers;
CREATE TRIGGER update_teachers_updated_at
    BEFORE UPDATE ON teachers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- DISCIPLINE RECORDS TABLE
-- Tracks light and medium misconducts for students
-- ============================================
CREATE TABLE IF NOT EXISTS discipline_records (
    id SERIAL PRIMARY KEY,
    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    teacher_id INTEGER REFERENCES teachers(id) ON DELETE SET NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('light', 'medium')),
    misconduct_type VARCHAR(100) NOT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for discipline_records
CREATE INDEX IF NOT EXISTS idx_discipline_student ON discipline_records(student_id);
CREATE INDEX IF NOT EXISTS idx_discipline_teacher ON discipline_records(teacher_id);
CREATE INDEX IF NOT EXISTS idx_discipline_severity ON discipline_records(severity);
CREATE INDEX IF NOT EXISTS idx_discipline_misconduct_type ON discipline_records(misconduct_type);
CREATE INDEX IF NOT EXISTS idx_discipline_created ON discipline_records(created_at);
CREATE INDEX IF NOT EXISTS idx_discipline_student_created ON discipline_records(student_id, created_at);

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert default admin teachers (password: admin123)
-- To generate password hash, use: 
-- python -c "from passlib.context import CryptContext; print(CryptContext(schemes=['bcrypt']).hash('admin123'))"
INSERT INTO teachers (teacher_id, name, email, password_hash, is_admin) 
VALUES 
    ('T000001', 'Admin 1', 'admin@edulink.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.N0TUFgHXXXXXXX', TRUE),
    ('T000002', 'Admin 2', 'admin2@edulink.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.N0TUFgHXXXXXXX', TRUE)
ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name;
