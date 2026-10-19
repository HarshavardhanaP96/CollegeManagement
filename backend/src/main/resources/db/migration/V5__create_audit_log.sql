CREATE TABLE IF NOT EXISTS audit_log (
    id             BIGSERIAL PRIMARY KEY,
    college_id     INTEGER      NOT NULL REFERENCES colleges(college_id),
    actor_user_id  INTEGER,
    actor_username VARCHAR(255),
    action         VARCHAR(20)  NOT NULL,
    entity_type    VARCHAR(255) NOT NULL,
    entity_id      VARCHAR(255),
    changes        TEXT,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_college_created ON audit_log(college_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_college_entity ON audit_log(college_id, entity_type);
