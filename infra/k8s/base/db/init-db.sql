CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS colleges (
    college_id SERIAL PRIMARY KEY,
    college_name VARCHAR(255) NOT NULL,
    college_code VARCHAR(50) NOT NULL UNIQUE,
    address TEXT,
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    created_by INTEGER,
    updated_by INTEGER,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_by INTEGER,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_roles (
    role_id SERIAL PRIMARY KEY,
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

-- Seed Data
INSERT INTO colleges (college_id, college_name, college_code, address, contact_email) VALUES
(1, 'St. Jude''s University', 'STJUDE', '123 College St', 'admin@stjudes.edu') ON CONFLICT DO NOTHING;

INSERT INTO user_roles (role_id, role_name) VALUES
(1, 'ROLE_SUPERADMIN'),
(2, 'ROLE_REGISTRAR'),
(3, 'ROLE_FACULTY'),
(4, 'ROLE_STUDENT')
ON CONFLICT DO NOTHING;

INSERT INTO users (college_id, role_id, username, email, password_hash, full_name, is_active) VALUES
(1, 1, 'dr.aris.thorne', 'dr.aris.thorne@stjudes.edu', '$2a$10$hx2vNv/gLPU4mMpjwujc9uuekG/h1nzwB9X7lfuYLvq7egOtqGSRa', 'Aris Thorne', true),
(1, 2, 'priya.raman', 'priya.raman@stjudes.edu', '$2a$10$hx2vNv/gLPU4mMpjwujc9uuekG/h1nzwB9X7lfuYLvq7egOtqGSRa', 'Priya Raman', true),
(1, 3, 'm.hale', 'm.hale@stjudes.edu', '$2a$10$hx2vNv/gLPU4mMpjwujc9uuekG/h1nzwB9X7lfuYLvq7egOtqGSRa', 'Morgan Hale', true),
(1, 4, 'julianne.sterling', 'julianne.sterling@stjudes.edu', '$2a$10$hx2vNv/gLPU4mMpjwujc9uuekG/h1nzwB9X7lfuYLvq7egOtqGSRa', 'Julianne Sterling', true)
ON CONFLICT DO NOTHING;
