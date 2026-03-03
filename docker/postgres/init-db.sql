-- Create Tables
CREATE TABLE IF NOT EXISTS colleges (
    college_id SERIAL PRIMARY KEY,
    college_name VARCHAR(255) NOT NULL,
    college_code VARCHAR(10) NOT NULL UNIQUE,
    address TEXT,
    contact_email VARCHAR(100),
    contact_phone VARCHAR(20),
    website_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by INTEGER,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    role_id INTEGER PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    role_description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    college_id INTEGER REFERENCES colleges(college_id),
    role_id INTEGER NOT NULL REFERENCES user_roles(role_id),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by INTEGER,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
    dept_id SERIAL PRIMARY KEY,
    college_id INTEGER NOT NULL REFERENCES colleges(college_id),
    dept_name VARCHAR(100) NOT NULL,
    dept_code VARCHAR(20) NOT NULL,
    dept_head_user_id INTEGER REFERENCES users(user_id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by INTEGER,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    course_id SERIAL PRIMARY KEY,
    dept_id INTEGER NOT NULL REFERENCES departments(dept_id),
    course_name VARCHAR(100) NOT NULL,
    course_code VARCHAR(20) NOT NULL,
    total_semesters INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by INTEGER,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_profiles (
    student_user_id INTEGER PRIMARY KEY REFERENCES users(user_id),
    roll_number VARCHAR(50) NOT NULL UNIQUE,
    dept_id INTEGER NOT NULL REFERENCES departments(dept_id),
    course_id INTEGER NOT NULL REFERENCES courses(course_id),
    admission_year INTEGER NOT NULL,
    current_semester INTEGER DEFAULT 1,
    parent_name VARCHAR(255),
    parent_phone VARCHAR(20) NOT NULL,
    parent_email VARCHAR(255),
    date_of_birth DATE,
    address TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by INTEGER,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teacher_profiles (
    teacher_user_id INTEGER PRIMARY KEY REFERENCES users(user_id),
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    dept_id INTEGER NOT NULL REFERENCES departments(dept_id),
    hire_date DATE,
    specialization VARCHAR(100),
    qualification VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by INTEGER,
    deleted_at TIMESTAMP
);

-- Seed Data
INSERT INTO user_roles (role_id, role_name, role_description) VALUES
(1, 'SUPERADMIN', 'System Super Administrator with full access'),
(2, 'COLLEGEADMIN', 'Administrator for a specific college'),
(3, 'HOD', 'Head of Department'),
(4, 'TEACHER', 'Faculty Member'),
(5, 'STUDENT', 'Enrolled Student');

INSERT INTO colleges (college_name, college_code, address, contact_email, is_active) VALUES
('Global Institute of Technology', 'GIT001', '123 Tech Park, Silicon Valley', 'info@git.edu', true);

-- Password for all users: password123
-- Hash: $2a$10$syRJoiww4WVnp0huDhfLteltJM22w9UbUhCncwmAE0ClcP5wBicTm

-- Admin User
INSERT INTO users (college_id, role_id, username, email, password_hash, full_name, phone) VALUES
(1, 1, 'admin', 'admin@git.edu', '$2a$10$syRJoiww4WVnp0huDhfLteltJM22w9UbUhCncwmAE0ClcP5wBicTm', 'System Admin', '1234567890');

-- College Admin
INSERT INTO users (college_id, role_id, username, email, password_hash, full_name, phone) VALUES
(1, 2, 'cadmin', 'cadmin@git.edu', '$2a$10$syRJoiww4WVnp0huDhfLteltJM22w9UbUhCncwmAE0ClcP5wBicTm', 'College Admin', '1234567891');

-- Departments
INSERT INTO departments (college_id, dept_name, dept_code) VALUES
(1, 'Computer Science', 'CSE'),
(1, 'Mechanical Engineering', 'ME');

-- HOD
INSERT INTO users (college_id, role_id, username, email, password_hash, full_name, phone) VALUES
(1, 3, 'hod_cse', 'hod_cse@git.edu', '$2a$10$syRJoiww4WVnp0huDhfLteltJM22w9UbUhCncwmAE0ClcP5wBicTm', 'HOD CSE', '1234567892');

UPDATE departments SET dept_head_user_id = (SELECT user_id FROM users WHERE username = 'hod_cse') WHERE dept_code = 'CSE';

-- Teacher
INSERT INTO users (college_id, role_id, username, email, password_hash, full_name, phone) VALUES
(1, 4, 'teacher1', 'teacher1@git.edu', '$2a$10$syRJoiww4WVnp0huDhfLteltJM22w9UbUhCncwmAE0ClcP5wBicTm', 'John Doe', '1234567893');

INSERT INTO teacher_profiles (teacher_user_id, employee_id, dept_id, hire_date, specialization, qualification) VALUES
((SELECT user_id FROM users WHERE username = 'teacher1'), 'EMP001', (SELECT dept_id FROM departments WHERE dept_code = 'CSE'), '2023-01-01', 'Machine Learning', 'PhD in CS');

-- Courses
INSERT INTO courses (dept_id, course_name, course_code, total_semesters) VALUES
((SELECT dept_id FROM departments WHERE dept_code = 'CSE'), 'B.Tech CS', 'BT-CS', 8);

-- Student
INSERT INTO users (college_id, role_id, username, email, password_hash, full_name, phone) VALUES
(1, 5, 'student1', 'student1@git.edu', '$2a$10$syRJoiww4WVnp0huDhfLteltJM22w9UbUhCncwmAE0ClcP5wBicTm', 'Jane Smith', '1234567894');

INSERT INTO student_profiles (student_user_id, roll_number, dept_id, course_id, admission_year, current_semester, parent_phone) VALUES
((SELECT user_id FROM users WHERE username = 'student1'), 'ROLL001', (SELECT dept_id FROM departments WHERE dept_code = 'CSE'), (SELECT course_id FROM courses WHERE course_code = 'BT-CS'), 2023, 1, '9876543210');
