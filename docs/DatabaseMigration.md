# College Management System - Database Migrations

**Migration Tool:** Flyway
**Database:** PostgreSQL 15
**Version:** 2.0 (2026-10-06 — see note below)

> **This doc previously described a Liquibase-based migration system** (XML changesets under
> `src/main/resources/db/changelog/`) that was never actually implemented — no such directory
> ever existed in this repo, and `backend/src/main/resources/application-dev.yml` carried a
> dangling reference to that nonexistent changelog path for exactly that reason (fixed
> separately). The project's real migration tool has always been **Flyway**
> (`org.flywaydb:flyway-core` + `flyway-database-postgresql` in `backend/pom.xml`,
> `spring.flyway.*` in `application.yml`). This rewrite describes what's actually there.

---

## How it actually works

1. **Baseline schema** — `infra/k8s/base/db/init-db.sql` creates the original core tables
   (`colleges`, `user_roles`, `users`, `departments`, `courses`, `student_profiles`,
   `teacher_profiles`) and seeds one demo college + one user per role. It's applied exactly
   once, outside Flyway, via Postgres's `docker-entrypoint-initdb.d` mechanism (both the Docker
   Compose Postgres service and the k8s Postgres init use this same file — there's a single
   canonical copy, not a duplicate per deployment target).
2. **Everything after that baseline is a Flyway migration** under
   `backend/src/main/resources/db/migration/`, auto-applied on application startup
   (`spring.flyway.enabled: true`, `locations: classpath:db/migration`,
   `baseline-on-migrate: true` in `application.yml`) — there is no manual CLI step; starting the
   app runs any pending migration.
3. **Never edit `init-db.sql` for an environment that's already running** (test/prod have real,
   if placeholder, data) — add a new `V{n}__description.sql` instead, same as any other
   incremental change from here on.

## Migration files today

| File | Adds |
|---|---|
| `V1__init_notification.sql` | `notification_configs` (per-college SMTP/WhatsApp config, see [OBSERVABILITY.md](OBSERVABILITY.md) / `NotificationConfig`) |
| `V2__add_academic_attendance_schema.sql` | `subjects`, `classes`, `class_subjects`, `teacher_assignments`, `student_enrollments`, `exam_types`, `marks`, `attendance_records` — every table the baseline never created but the `academic`/`attendance` JPA entities need |
| `V3__fix_courses_schema_drift.sql` | `courses.college_id` + `courses.duration_years` — columns the `Course` entity requires that the baseline table never had |

`V2`/`V3` are why `ddl-auto: validate` (the real, safe default in `application.yml`) now actually
works in the `test`/`prod` k8s overlays — before they existed, those overlays had to override to
`ddl-auto: update` as an explicitly-flagged stopgap (see git history on
`infra/k8s/overlays/{test,prod}/backend-*.yaml` and
[docs/foundations/architecture.md](foundations/architecture.md)'s decision log).

Both are written defensively idempotent (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT
EXISTS`, a guarded `DO $$ ... $$` block for the FK constraint in `V3`) so they're safe to apply
against either a fresh database or one that was previously bootstrapped by the old
`ddl-auto: update` stopgap and already has these tables in a Hibernate-generated shape.

## Writing a new migration

1. Add `V{n}__description.sql` (next integer after the highest existing `V{n}`) to
   `backend/src/main/resources/db/migration/`.
2. Match the existing audit-column convention
   (`created_at`/`updated_at`/`created_by`/`updated_by`/`is_deleted`/`deleted_by`/`deleted_at`,
   per `com.edgepoint.core.domain.AuditableEntity`) for any table backing an entity that extends
   it — check the entity first; not all of them do (`ExamType` doesn't, see `V2`'s comment).
   `SERIAL` for `Integer`-typed `@Id` fields, `BIGSERIAL` for `Long`-typed ones (`V1`'s
   `NotificationConfig.id` is the one `Long` example today).
3. Prefer `IF NOT EXISTS` on every `CREATE`, so the migration is safe to apply twice and safe
   against a DB that an earlier `ddl-auto: update` run may have already partially built.
4. Test it the way this round was verified: apply `init-db.sql` + every migration in order
   against a throwaway Postgres container, then boot the app with `ddl-auto: validate` (the
   default) against that same database and confirm it starts without a schema validation error.

## Rollback

Flyway migrations in this project are **forward-only** — there's no down-migration tooling
configured. A rollback that needs a schema revert requires a hand-written migration that undoes
the change (e.g. `DROP COLUMN`), not an automatic "undo." Back up before any migration that
touches a table with real data (`pg_dump -U postgres edgepoint > backup_$(date +%Y%m%d).sql`).
