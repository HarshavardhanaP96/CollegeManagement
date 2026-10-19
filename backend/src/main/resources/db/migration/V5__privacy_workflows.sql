-- DPDP privacy workflows: consent, data-principal requests, retention.
-- Mirrors the JPA entities in com.edgepoint.privacy.domain (Hibernate runs with ddl-auto: validate in prod).
-- PostgreSQL only; dev/test build the schema from the entities instead (see docs/superpowers/specs/2026-10-19-dpdp-privacy-workflows-design.md section 9).

ALTER TABLE users ADD COLUMN IF NOT EXISTS anonymised_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS privacy_purposes (
    purpose_id   SERIAL PRIMARY KEY,
    college_id   INTEGER      NOT NULL REFERENCES colleges(college_id),
    code         VARCHAR(50)  NOT NULL,
    name         VARCHAR(100) NOT NULL,
    description  TEXT,
    legal_basis  VARCHAR(20)  NOT NULL,
    withdrawable BOOLEAN      NOT NULL DEFAULT TRUE,
    active       BOOLEAN      NOT NULL DEFAULT TRUE,

    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP,

    CONSTRAINT uq_privacy_purposes_college_code UNIQUE (college_id, code)
);

CREATE TABLE IF NOT EXISTS privacy_notices (
    notice_id      SERIAL PRIMARY KEY,
    college_id     INTEGER   NOT NULL REFERENCES colleges(college_id),
    version        INTEGER   NOT NULL,
    body           TEXT      NOT NULL,
    effective_from TIMESTAMP NOT NULL,
    published_by   INTEGER,
    created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_privacy_notices_college_version UNIQUE (college_id, version)
);

CREATE TABLE IF NOT EXISTS consent_records (
    consent_id  SERIAL PRIMARY KEY,
    college_id  INTEGER     NOT NULL REFERENCES colleges(college_id),
    user_id     INTEGER     NOT NULL REFERENCES users(user_id),
    purpose_id  INTEGER     NOT NULL REFERENCES privacy_purposes(purpose_id),
    notice_id   INTEGER     NOT NULL REFERENCES privacy_notices(notice_id),
    status      VARCHAR(20) NOT NULL,
    recorded_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source_ip   VARCHAR(45)
);
CREATE INDEX IF NOT EXISTS idx_consent_records_user_purpose ON consent_records(user_id, purpose_id, consent_id DESC);

CREATE TABLE IF NOT EXISTS data_requests (
    request_id         SERIAL PRIMARY KEY,
    college_id         INTEGER     NOT NULL REFERENCES colleges(college_id),
    user_id            INTEGER     NOT NULL REFERENCES users(user_id),
    type               VARCHAR(20) NOT NULL,
    status             VARCHAR(30) NOT NULL,
    details            TEXT,
    correction_payload TEXT,
    export_payload     TEXT,
    submitted_at       TIMESTAMP   NOT NULL,
    due_at             TIMESTAMP   NOT NULL,
    assigned_to        INTEGER,
    resolution_note    TEXT,
    rejection_reason   TEXT,
    resolved_at        TIMESTAMP,

    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_data_requests_college_status_due ON data_requests(college_id, status, due_at);
CREATE INDEX IF NOT EXISTS idx_data_requests_user ON data_requests(user_id);

CREATE TABLE IF NOT EXISTS data_request_events (
    event_id    SERIAL PRIMARY KEY,
    request_id  INTEGER     NOT NULL REFERENCES data_requests(request_id),
    from_status VARCHAR(30),
    to_status   VARCHAR(30) NOT NULL,
    actor_id    INTEGER,
    note        TEXT,
    occurred_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_data_request_events_request ON data_request_events(request_id);

CREATE TABLE IF NOT EXISTS retention_policies (
    policy_id      SERIAL PRIMARY KEY,
    college_id     INTEGER     NOT NULL REFERENCES colleges(college_id),
    data_category  VARCHAR(50) NOT NULL,
    retention_days INTEGER     NOT NULL,
    trigger_event  VARCHAR(30) NOT NULL,
    action         VARCHAR(20) NOT NULL,
    enabled        BOOLEAN     NOT NULL DEFAULT FALSE,

    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP,

    CONSTRAINT uq_retention_policies_college_category UNIQUE (college_id, data_category)
);

CREATE TABLE IF NOT EXISTS retention_runs (
    run_id            SERIAL PRIMARY KEY,
    college_id        INTEGER     NOT NULL REFERENCES colleges(college_id),
    dry_run           BOOLEAN     NOT NULL,
    started_at        TIMESTAMP   NOT NULL,
    finished_at       TIMESTAMP,
    status            VARCHAR(20) NOT NULL,
    records_processed INTEGER     NOT NULL DEFAULT 0,
    records_failed    INTEGER     NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_retention_runs_college ON retention_runs(college_id, run_id DESC);

CREATE TABLE IF NOT EXISTS privacy_audit_log (
    audit_id        BIGSERIAL PRIMARY KEY,
    college_id      INTEGER      NOT NULL REFERENCES colleges(college_id),
    actor_id        INTEGER,
    subject_user_id INTEGER,
    action          VARCHAR(100) NOT NULL,
    details         TEXT,
    created_at      TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_privacy_audit_log_college ON privacy_audit_log(college_id, audit_id DESC);
