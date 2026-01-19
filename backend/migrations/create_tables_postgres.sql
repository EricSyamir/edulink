-- Edulink Database Schema (PostgreSQL / Supabase)
-- Creates all required tables for the discipline tracking system
-- Compatible with PostgreSQL 14+ (Supabase)

-- ============================================
-- STUDENTS TABLE
-- Stores student information and face embeddings
-- ============================================
CREATE TABLE IF NOT EXISTS students (
  id BIGSERIAL PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  class_name VARCHAR(100) NOT NULL,
  standard INT NOT NULL CHECK (standard >= 1 AND standard <= 6),
  face_embedding TEXT NULL, -- JSON array of 512 floats (buffalo_l embedding)
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_student_name ON students(name);
CREATE INDEX IF NOT EXISTS idx_student_class ON students(class_name);
CREATE INDEX IF NOT EXISTS idx_student_standard ON students(standard);

-- Auto-update updated_at on row updates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
CREATE TRIGGER trg_students_updated_at
BEFORE UPDATE ON students
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================
-- TEACHERS TABLE
-- Stores teacher credentials and information
-- ============================================
CREATE TABLE IF NOT EXISTS teachers (
  id BIGSERIAL PRIMARY KEY,
  teacher_id VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_teacher_id ON teachers(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_email ON teachers(email);
CREATE INDEX IF NOT EXISTS idx_teacher_name ON teachers(name);

DROP TRIGGER IF EXISTS trg_teachers_updated_at ON teachers;
CREATE TRIGGER trg_teachers_updated_at
BEFORE UPDATE ON teachers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- ============================================
-- DISCIPLINE RECORDS TABLE
-- Tracks rewards and punishments for students
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'discipline_type') THEN
    CREATE TYPE discipline_type AS ENUM ('reward', 'punishment');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS discipline_records (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id BIGINT NULL REFERENCES teachers(id) ON DELETE SET NULL,
  type discipline_type NOT NULL,
  points_change INT NOT NULL,
  reason TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discipline_student ON discipline_records(student_id);
CREATE INDEX IF NOT EXISTS idx_discipline_teacher ON discipline_records(teacher_id);
CREATE INDEX IF NOT EXISTS idx_discipline_type ON discipline_records(type);
CREATE INDEX IF NOT EXISTS idx_discipline_created ON discipline_records(created_at);
CREATE INDEX IF NOT EXISTS idx_discipline_student_created ON discipline_records(student_id, created_at);

-- ============================================
-- STUDENT POINTS TABLE
-- Tracks current Sahsiah points for each student
-- ============================================
CREATE TABLE IF NOT EXISTS student_points (
  student_id BIGINT PRIMARY KEY REFERENCES students(id) ON DELETE CASCADE,
  current_points INT NOT NULL DEFAULT 100
);

-- ============================================
-- TRIGGERS
-- Automatically manage student_points
-- ============================================

-- Create student_points entry when new student is added
CREATE OR REPLACE FUNCTION create_student_points()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO student_points (student_id, current_points)
  VALUES (NEW.id, 100)
  ON CONFLICT (student_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_students_points_init ON students;
CREATE TRIGGER trg_students_points_init
AFTER INSERT ON students
FOR EACH ROW
EXECUTE FUNCTION create_student_points();

-- Update student points when discipline record is added
CREATE OR REPLACE FUNCTION apply_discipline_points()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE student_points
  SET current_points = current_points + NEW.points_change
  WHERE student_id = NEW.student_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_discipline_points_apply ON discipline_records;
CREATE TRIGGER trg_discipline_points_apply
AFTER INSERT ON discipline_records
FOR EACH ROW
EXECUTE FUNCTION apply_discipline_points();

