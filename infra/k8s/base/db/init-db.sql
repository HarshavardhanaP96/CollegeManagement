CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    logo_url VARCHAR(255),
    timezone VARCHAR(64) DEFAULT 'UTC',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    trial_ends_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(120) NOT NULL,
    last_name VARCHAR(120) NOT NULL,
    phone VARCHAR(40),
    profile_photo_key VARCHAR(255),
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(64) NOT NULL,
    PRIMARY KEY (user_id, role)
);

INSERT INTO institutions (
    id, tenant_id, name, domain, timezone, status, created_at, updated_at
) VALUES (
    '11111111-1111-1111-1111-111111111111',
    '11111111-1111-1111-1111-111111111111',
    'St. Jude''s University',
    'stjudes.edu',
    'Asia/Kolkata',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

INSERT INTO users (
    id, tenant_id, email, password_hash, first_name, last_name, status, created_at, updated_at
) VALUES
    (
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        '11111111-1111-1111-1111-111111111111',
        'dr.aris.thorne@stjudes.edu',
        '$2a$10$hx2vNv/gLPU4mMpjwujc9uuekG/h1nzwB9X7lfuYLvq7egOtqGSRa',
        'Aris',
        'Thorne',
        'ACTIVE',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '11111111-1111-1111-1111-111111111111',
        'priya.raman@stjudes.edu',
        '$2a$10$hx2vNv/gLPU4mMpjwujc9uuekG/h1nzwB9X7lfuYLvq7egOtqGSRa',
        'Priya',
        'Raman',
        'ACTIVE',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'cccccccc-cccc-cccc-cccc-cccccccccccc',
        '11111111-1111-1111-1111-111111111111',
        'm.hale@stjudes.edu',
        '$2a$10$hx2vNv/gLPU4mMpjwujc9uuekG/h1nzwB9X7lfuYLvq7egOtqGSRa',
        'Morgan',
        'Hale',
        'ACTIVE',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ),
    (
        'dddddddd-dddd-dddd-dddd-dddddddddddd',
        '11111111-1111-1111-1111-111111111111',
        'julianne.sterling@stjudes.edu',
        '$2a$10$hx2vNv/gLPU4mMpjwujc9uuekG/h1nzwB9X7lfuYLvq7egOtqGSRa',
        'Julianne',
        'Sterling',
        'ACTIVE',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_roles (user_id, role) VALUES
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ROLE_SUPERADMIN'),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ROLE_REGISTRAR'),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ROLE_FACULTY'),
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'ROLE_STUDENT')
ON CONFLICT (user_id, role) DO NOTHING;
