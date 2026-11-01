-- One live attendance row per student, per assignment, per day. Bulk marking upserts against
-- this; the index stops a double-submit race from creating duplicates.

-- Soft-delete any duplicates the old check-then-insert race may have left, keeping the newest.
UPDATE attendance_records
SET is_deleted = TRUE, deleted_at = CURRENT_TIMESTAMP
WHERE attendance_id IN (
    SELECT attendance_id FROM (
        SELECT attendance_id,
               ROW_NUMBER() OVER (PARTITION BY assignment_id, student_user_id, record_date
                                  ORDER BY attendance_id DESC) AS rn
        FROM attendance_records
        WHERE is_deleted = FALSE
    ) ranked
    WHERE rn > 1
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_records_assignment_student_date
    ON attendance_records (assignment_id, student_user_id, record_date)
    WHERE is_deleted = FALSE;
