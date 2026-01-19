-- Edulink Database Schema
-- Creates all required tables for the discipline tracking system
-- Compatible with MySQL 8.0+

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS edulink_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE edulink_db;

-- ============================================
-- STUDENTS TABLE
-- Stores student information and face embeddings
-- ============================================
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    standard INT NOT NULL CHECK (standard >= 1 AND standard <= 6),
    face_embedding TEXT NULL COMMENT 'JSON array of 512-dimensional face embedding from buffalo_l model',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes for common queries
    INDEX idx_student_id (student_id),
    INDEX idx_student_name (name),
    INDEX idx_student_class (class_name),
    INDEX idx_student_standard (standard)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TEACHERS TABLE
-- Stores teacher credentials and information
-- ============================================
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    teacher_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_teacher_id (teacher_id),
    INDEX idx_teacher_email (email),
    INDEX idx_teacher_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- DISCIPLINE RECORDS TABLE
-- Tracks rewards and punishments for students
-- ============================================
CREATE TABLE IF NOT EXISTS discipline_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    teacher_id INT NULL,
    type ENUM('reward', 'punishment') NOT NULL,
    points_change INT NOT NULL COMMENT 'Positive for rewards, negative for punishments',
    reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign keys
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
    
    -- Indexes for common queries
    INDEX idx_discipline_student (student_id),
    INDEX idx_discipline_teacher (teacher_id),
    INDEX idx_discipline_type (type),
    INDEX idx_discipline_created (created_at),
    INDEX idx_discipline_student_created (student_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- STUDENT POINTS TABLE
-- Tracks current Sahsiah points for each student
-- ============================================
CREATE TABLE IF NOT EXISTS student_points (
    student_id INT PRIMARY KEY,
    current_points INT NOT NULL DEFAULT 100 COMMENT 'Sahsiah points, can go below 0 or above 100',
    
    -- Foreign key
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TRIGGERS
-- Automatically manage student points
-- ============================================

-- Trigger: Create student_points entry when new student is added
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_student_insert
AFTER INSERT ON students
FOR EACH ROW
BEGIN
    INSERT INTO student_points (student_id, current_points) VALUES (NEW.id, 100);
END //
DELIMITER ;

-- Trigger: Update student points when discipline record is added
DELIMITER //
CREATE TRIGGER IF NOT EXISTS after_discipline_insert
AFTER INSERT ON discipline_records
FOR EACH ROW
BEGIN
    UPDATE student_points 
    SET current_points = current_points + NEW.points_change
    WHERE student_id = NEW.student_id;
END //
DELIMITER ;

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert a default admin teacher (password: admin123)
-- Password hash is bcrypt hash of 'admin123'
INSERT INTO teachers (teacher_id, name, email, password_hash) VALUES 
('T000001', 'Admin Teacher', 'admin@edulink.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.N0TUFgHXXXXXXX')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Note: The above password hash is a placeholder. 
-- Generate proper hash using Python: 
-- from passlib.context import CryptContext
-- pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
-- print(pwd_context.hash("admin123"))
