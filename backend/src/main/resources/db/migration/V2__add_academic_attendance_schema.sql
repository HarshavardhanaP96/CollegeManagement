-- Flyway baseline for the academic/attendance schema that Hibernate's ddl-auto: validate
-- expects but docker/postgres/init-db.sql never created. init-db.sql only creates:
-- colleges, user_roles, users, departments, courses, student_profiles, teacher_profiles.
-- This migration adds every remaining table backing the JPA entities under
-- com.edgepoint.academic.domain and com.edgepoint.attendance.domain.
--
-- All statements are defensively idempotent (IF NOT EXISTS) so this runs safely whether
-- applied to (a) a fresh DB where only init-db.sql has run, or (b) a DB previously
-- bootstrapped by the ddl-auto: update stopgap that already has these tables in a
-- Hibernate-generated shape.
--
-- Column/type/nullable/unique choices are taken directly from the JPA entities; audit
-- columns follow com.edgepoint.core.domain.AuditableEntity (created_at/updated_at/
-- created_by/updated_by/is_deleted/deleted_by/deleted_at), matching the pattern already
-- used in docker/postgres/init-db.sql and V1__init_notification.sql.
-- FKs reference the exact PK columns created by init-db.sql: colleges.college_id,
-- departments.dept_id, courses.course_id, users.user_id.

-- subjects: com.edgepoint.academic.domain.Subject
CREATE TABLE IF NOT EXISTS subjects (
    subject_id      SERIAL PRIMARY KEY,
    dept_id         INTEGER      NOT NULL REFERENCES departments(dept_id),
    subject_code    VARCHAR(20)  NOT NULL,
    subject_name    VARCHAR(100) NOT NULL,
    credits         INTEGER DEFAULT 3,
    subject_type    VARCHAR(20),

    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_subjects_dept_id ON subjects(dept_id);

-- classes: com.edgepoint.academic.domain.AcademicClass (@Table(name = "classes"))
CREATE TABLE IF NOT EXISTS classes (
    class_id        SERIAL PRIMARY KEY,
    dept_id         INTEGER      NOT NULL REFERENCES departments(dept_id),
    course_id       INTEGER      NOT NULL REFERENCES courses(course_id),
    academic_year   VARCHAR(20)  NOT NULL,
    semester        INTEGER      NOT NULL,
    section         VARCHAR(10),
    class_name      VARCHAR(100) NOT NULL,

    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_classes_dept_id   ON classes(dept_id);
CREATE INDEX IF NOT EXISTS idx_classes_course_id ON classes(course_id);

-- class_subjects: com.edgepoint.academic.domain.ClassSubject
CREATE TABLE IF NOT EXISTS class_subjects (
    class_subject_id    SERIAL PRIMARY KEY,
    class_id            INTEGER NOT NULL REFERENCES classes(class_id),
    subject_id          INTEGER NOT NULL REFERENCES subjects(subject_id),

    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_class_subjects_class_id   ON class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_id ON class_subjects(subject_id);

-- teacher_assignments: com.edgepoint.academic.domain.TeacherAssignment
CREATE TABLE IF NOT EXISTS teacher_assignments (
    assignment_id     SERIAL PRIMARY KEY,
    class_subject_id  INTEGER NOT NULL REFERENCES class_subjects(class_subject_id),
    teacher_user_id   INTEGER NOT NULL REFERENCES users(user_id),
    is_active         BOOLEAN DEFAULT TRUE,

    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_subject_id ON teacher_assignments(class_subject_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_user_id ON teacher_assignments(teacher_user_id);

-- student_enrollments: com.edgepoint.academic.domain.StudentEnrollment
CREATE TABLE IF NOT EXISTS student_enrollments (
    enrollment_id      SERIAL PRIMARY KEY,
    student_user_id    INTEGER NOT NULL REFERENCES users(user_id),
    class_id           INTEGER NOT NULL REFERENCES classes(class_id),
    enrollment_status  VARCHAR(20) DEFAULT 'Active',

    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_user_id ON student_enrollments(student_user_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_id        ON student_enrollments(class_id);

-- exam_types: com.edgepoint.academic.domain.ExamType
-- NOTE: ExamType does NOT extend AuditableEntity (plain @Entity) — it only carries its own
-- created_at field, so no updated_at/created_by/updated_by/is_deleted/deleted_by/deleted_at
-- columns are added here.
CREATE TABLE IF NOT EXISTS exam_types (
    exam_type_id    SERIAL PRIMARY KEY,
    college_id      INTEGER     NOT NULL REFERENCES colleges(college_id),
    exam_type_name  VARCHAR(50) NOT NULL,
    max_marks       INTEGER     NOT NULL,

    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exam_types_college_id ON exam_types(college_id);

-- marks: com.edgepoint.academic.domain.Mark
CREATE TABLE IF NOT EXISTS marks (
    mark_id          SERIAL PRIMARY KEY,
    assignment_id    INTEGER       NOT NULL REFERENCES teacher_assignments(assignment_id),
    student_user_id  INTEGER       NOT NULL REFERENCES users(user_id),
    exam_type_id     INTEGER       NOT NULL REFERENCES exam_types(exam_type_id),
    marks_obtained   NUMERIC(5,2)  NOT NULL,
    remarks          TEXT,

    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marks_assignment_id   ON marks(assignment_id);
CREATE INDEX IF NOT EXISTS idx_marks_student_user_id ON marks(student_user_id);
CREATE INDEX IF NOT EXISTS idx_marks_exam_type_id    ON marks(exam_type_id);

-- attendance_records: com.edgepoint.attendance.domain.AttendanceRecord
CREATE TABLE IF NOT EXISTS attendance_records (
    attendance_id    SERIAL PRIMARY KEY,
    assignment_id    INTEGER NOT NULL REFERENCES teacher_assignments(assignment_id),
    student_user_id  INTEGER NOT NULL REFERENCES users(user_id),
    record_date      DATE    NOT NULL,
    is_present       BOOLEAN NOT NULL,
    remarks          TEXT,

    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP,
    created_by  INTEGER,
    updated_by  INTEGER,
    is_deleted  BOOLEAN DEFAULT FALSE,
    deleted_by  INTEGER,
    deleted_at  TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_assignment_id   ON attendance_records(assignment_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_user_id ON attendance_records(student_user_id);
