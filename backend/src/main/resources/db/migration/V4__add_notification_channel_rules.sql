-- Per-college routing of notification events to channels (email / WhatsApp).
-- Missing rows mean defaults (email on, WhatsApp off) at the application layer.
CREATE TABLE IF NOT EXISTS notification_channel_rules (
    id                BIGSERIAL PRIMARY KEY,
    college_id        INTEGER     NOT NULL REFERENCES colleges(college_id) ON DELETE CASCADE,
    event_type        VARCHAR(50) NOT NULL,
    email_enabled     BOOLEAN     NOT NULL DEFAULT TRUE,
    whatsapp_enabled  BOOLEAN     NOT NULL DEFAULT FALSE,

    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP,

    CONSTRAINT uq_channel_rule_college_event UNIQUE (college_id, event_type)
);
