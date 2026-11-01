-- Global (not per-college) help articles for every role. V6-V8 are taken by other branches.
CREATE TABLE IF NOT EXISTS kb_categories (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(100) NOT NULL,
    slug           VARCHAR(100) NOT NULL,
    display_order  INTEGER      NOT NULL DEFAULT 0,

    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP
);

-- Slugs are unique among live rows only, so a deleted slug can be reused.
CREATE UNIQUE INDEX IF NOT EXISTS uq_kb_categories_slug ON kb_categories (slug) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS kb_articles (
    id               BIGSERIAL PRIMARY KEY,
    category_id      BIGINT       NOT NULL REFERENCES kb_categories(id),
    title            VARCHAR(200) NOT NULL,
    slug             VARCHAR(200) NOT NULL,
    body             TEXT         NOT NULL,
    status           VARCHAR(20)  NOT NULL DEFAULT 'DRAFT',
    visible_roles    VARCHAR(255),
    published_at     TIMESTAMP,
    helpful_count    INTEGER      NOT NULL DEFAULT 0,
    unhelpful_count  INTEGER      NOT NULL DEFAULT 0,

    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP,

    CONSTRAINT ck_kb_articles_status CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_kb_articles_slug ON kb_articles (slug) WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_kb_articles_status_category ON kb_articles (status, category_id) WHERE is_deleted = FALSE;

CREATE TABLE IF NOT EXISTS kb_article_feedback (
    id          BIGSERIAL PRIMARY KEY,
    article_id  BIGINT  NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
    user_id     INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    is_helpful  BOOLEAN NOT NULL,

    CONSTRAINT uq_kb_feedback_article_user UNIQUE (article_id, user_id)
);
