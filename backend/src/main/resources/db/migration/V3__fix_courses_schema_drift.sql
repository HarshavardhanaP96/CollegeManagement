-- com.edgepoint.academic.domain.Course maps college_id (NOT NULL FK to colleges) and
-- duration_years (NOT NULL, default 4) — neither of which docker/postgres/init-db.sql's
-- `courses` table has (it only has dept_id and total_semesters). Hibernate's
-- ddl-auto: validate fails on `courses` today independent of the V2 migration; this
-- fixes the drift instead of editing the already-deployed baseline file.
--
-- Backfill is safe: every existing courses.dept_id is NOT NULL and departments.college_id
-- is NOT NULL, so every row has a resolvable college_id before the column is made required.

ALTER TABLE courses ADD COLUMN IF NOT EXISTS college_id INTEGER;

UPDATE courses c
SET college_id = d.college_id
FROM departments d
WHERE c.dept_id = d.dept_id
  AND c.college_id IS NULL;

ALTER TABLE courses ALTER COLUMN college_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_courses_college_id'
    ) THEN
        ALTER TABLE courses
            ADD CONSTRAINT fk_courses_college_id FOREIGN KEY (college_id) REFERENCES colleges(college_id);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_courses_college_id ON courses(college_id);

ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_years INTEGER NOT NULL DEFAULT 4;
