-- Per-college SMTP and WhatsApp Cloud API configuration
-- college_id references colleges.college_id (INTEGER PK)
CREATE TABLE IF NOT EXISTS notification_configs (
    id              BIGSERIAL PRIMARY KEY,
    college_id      INTEGER       NOT NULL UNIQUE
                    REFERENCES colleges(college_id) ON DELETE CASCADE,

    -- SMTP
    smtp_host           VARCHAR(255),
    smtp_port           INTEGER,
    smtp_username       VARCHAR(255),
    smtp_password       VARCHAR(1024),   -- store encrypted in production
    smtp_from_email     VARCHAR(255),
    smtp_from_name      VARCHAR(255),
    smtp_use_ssl        BOOLEAN NOT NULL DEFAULT TRUE,
    smtp_enabled        BOOLEAN NOT NULL DEFAULT FALSE,

    -- WhatsApp Cloud API
    whatsapp_api_url              VARCHAR(512),
    whatsapp_api_key              VARCHAR(1024),  -- bearer token, store encrypted
    whatsapp_phone_number_id      VARCHAR(255),
    whatsapp_business_account_id  VARCHAR(255),
    whatsapp_enabled              BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_configs_college_id
    ON notification_configs(college_id);
