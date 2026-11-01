# DPDP Privacy Workflows — Design

**Date:** 2026-10-19
**Status:** Implemented; merged to `main` on 2026-11-01. The migration shipped as `V7__privacy_workflows.sql` (renumbered again at merge because `V6__unique_attendance_per_day.sql` landed first); this spec keeps its original V6 wording below.
**Traces to:** PRIV-006 (notice/consent), PRIV-007 (data-principal requests), PRIV-008/009 (retention & deletion), COMP-001 — see `docs/reviews/2026-10-19-spec-gap-review.md` §3.1. These have no CM functionality ID yet; a CHG record should assign one.

## 1. Goal and scope

Give each college the tooling to meet DPDP obligations for its students and teachers:

1. **Consent and notice**: versioned notice, per-purpose consent ledger, withdrawal.
2. **Data-principal requests**: access, correction, erasure and grievance, with an admin queue and a response deadline.
3. **Retention**: per-college policies and a scheduled, auditable anonymise/delete job.

Backend and UI are both in scope.

**Out of scope (first cut):** verifiable guardian consent for minors, breach-notification tracking, the Parent role, HOD access to privacy admin, rate limiting, and a data-nomination right.

## 2. Decisions and assumptions

| # | Decision | Source |
|---|---|---|
| D1 | Scope is the three workflows above, backend + UI | User |
| D2 | Erasure **anonymises identifiers and keeps academic records** (marks, attendance) under the pseudonymous `roll_number`/`user_id` | User |
| D3 | New `privacy` module in the monolith with a `PersonalDataContributor` interface | User (approved) |
| D4 | Tenant-scoped: every table carries `college_id`; each college configures its own notice, purposes and retention | Assumption |
| D5 | Default response deadline is 30 days, configurable per college. **Not verified against the DPDP Rules; confirm with counsel before go-live.** | Assumption |
| D6 | Consent-based purposes start as not granted; nothing is pre-ticked | Assumption |
| D7 | Retention policies ship disabled with placeholder durations; the scheduler defaults to dry-run | Assumption |

## 3. Data model — `V6__privacy_workflows.sql` (shipped as `V7`)

This migration is V6: `main` has since committed `V4__add_notification_channel_rules.sql` and `V5__create_audit_log.sql`, so V6 is the next free version. Conventions follow V2: `SERIAL` primary keys, standard audit columns, `IF NOT EXISTS`. The migration must run on Postgres (prod) and H2 (`dev` profile).

| Table | Purpose | Key columns |
|---|---|---|
| `privacy_purposes` | What data is used for | `college_id`, `code`, `name`, `description`, `legal_basis` (`CONSENT`\|`LEGITIMATE_USE`), `withdrawable`. Seeded per college: `ACADEMIC_RECORDS` (not withdrawable), `EMAIL_SMS_COMMS`, `PARENT_NOTIFICATIONS`. |
| `privacy_notices` | Versioned notice text | `college_id`, `version`, `body`, `effective_from`. Immutable once published. |
| `consent_records` | Append-only consent ledger | `user_id`, `purpose_id`, `notice_id`, `status` (`GRANTED`\|`WITHDRAWN`), `recorded_at`, `source_ip`. Current state = latest row per (user, purpose). |
| `data_requests` | A principal's request | `college_id`, `user_id`, `type` (`ACCESS`\|`CORRECTION`\|`ERASURE`\|`GRIEVANCE`), `status`, `details`, `correction_payload`, `submitted_at`, `due_at`, `assigned_to`, `resolution_note`, `rejection_reason`, `resolved_at` |
| `data_request_events` | Status history | `request_id`, `from_status`, `to_status`, `actor_id`, `note`, `at` |
| `retention_policies` | Per-college rules | `college_id`, `data_category`, `retention_days`, `trigger_event` (e.g. `ACCOUNT_DEACTIVATED`, `GRADUATED`), `action` (`ANONYMISE`\|`DELETE`), `enabled` |
| `retention_runs` | One row per run | `college_id`, `dry_run`, `started_at`, `finished_at`, `status`, `records_processed`, `records_failed` |
| `privacy_audit_log` | Append-only trail | `college_id`, `actor_id`, `subject_user_id`, `action`, `details` |

**Request lifecycle:** `SUBMITTED → IN_REVIEW → COMPLETED | PARTIALLY_COMPLETED | REJECTED`. The requester may cancel while `SUBMITTED`.

**Changes to existing tables**
- `users.anonymised_at TIMESTAMP`.
- Anonymising `users`: `username = 'erased-<id>'`, `email = 'erased-<id>@invalid.local'`, `full_name = 'Erased User'`, random `password_hash`, `phone = NULL`, `is_active = false`, `anonymised_at = now`. (`username`/`email` are `NOT NULL` and unique, hence placeholders.)
- Anonymising `student_profiles`: clear `date_of_birth`, `address`, `parent_name`, `parent_email`; set `parent_phone` (`NOT NULL`) to the empty string. `roll_number` stays as the pseudonymous key.

## 4. Backend — package `com.edgepoint.privacy`

| Unit | Responsibility | Depends on |
|---|---|---|
| `ConsentService` | Publish notice version, record grant/withdraw, report current consent, reject withdrawal of non-withdrawable purposes | consent/purpose/notice repos, `PrivacyAuditService` |
| `DataRequestService` | Create requests, enforce the state machine, assign, resolve, compute `due_at` | request repos, contributors, `PrivacyAuditService` |
| `PersonalDataContributor` | Interface: `export(userId)`, `correct(userId, fields)`, `anonymise(userId)` | — |
| `UserDataContributor`, `StudentDataContributor`, `TeacherDataContributor` | Implementations for `users`, `student_profiles`, `teacher_profiles`. `correct` accepts a whitelist only (name, phone, parent contacts, address); email, roll number and role are excluded. | existing repositories |
| `ErasureService` | Run all contributors in one transaction; refuse or partially complete when a legal hold applies | contributors, `PrivacyAuditService` |
| `RetentionService` | Evaluate enabled policies, call `ErasureService` for eligible users, support `dryRun` | policy/run repos |
| `RetentionScheduler` | `@Scheduled` nightly cron calling `RetentionService`; dry-run until the college turns it off | `RetentionService` |
| `PrivacyAuditService` | Append-only writes to `privacy_audit_log` | audit repo |

New modules add a contributor and need no change to privacy code.

**Rules**
- **Erasure is irreversible**: needs `COLLEGEADMIN` approval and a note. The first call moves the request to `IN_REVIEW`; a second explicit call executes it.
- **No self-approval**: an admin cannot action their own erasure request (addresses the self-approval gap in the spec review).
- **Access export**: a JSON bundle from the contributors, stored against the request, downloadable only by the requester; each download is audited.
- **Idempotent scheduler**: users with `anonymised_at` set are skipped. A failure on one user is recorded in the run and does not abort the batch.
- **Tenancy**: every query filters by `TenantContext.getCollegeId()`.

## 5. REST API (prefix `/privacy`)

Responses use `ApiResponse<T>`; authorisation uses `@PreAuthorize`.

| Endpoint | Roles | Purpose |
|---|---|---|
| `GET /privacy/notice/current` | authenticated | Active notice and purposes |
| `GET /privacy/consents/me` | authenticated | My current consent per purpose |
| `POST /privacy/consents` | authenticated | Grant/withdraw one purpose |
| `POST /privacy/requests` | STUDENT, TEACHER | Raise a request |
| `GET /privacy/requests/me` | STUDENT, TEACHER | Track my requests |
| `POST /privacy/requests/{id}/cancel` | requester | Cancel while `SUBMITTED` |
| `GET /privacy/requests/{id}/export` | requester | Download access bundle |
| `GET /privacy/admin/requests` | COLLEGEADMIN, SUPERADMIN | Queue with filters, overdue flag |
| `POST /privacy/admin/requests/{id}/review` | COLLEGEADMIN | Move to `IN_REVIEW`, assign |
| `POST /privacy/admin/requests/{id}/resolve` | COLLEGEADMIN | Complete / partially complete / reject, with reason |
| `GET`, `POST /privacy/admin/notices` | COLLEGEADMIN | List and publish notice versions |
| `GET`, `PUT /privacy/admin/retention-policies` | COLLEGEADMIN | View and edit policies |
| `POST /privacy/admin/retention/run?dryRun=true` | COLLEGEADMIN | On-demand run |
| `GET /privacy/admin/retention/runs` | COLLEGEADMIN | Run history |
| `GET /privacy/admin/audit` | COLLEGEADMIN | Privacy audit trail |

## 6. Frontend

- **Consent gate**: modal on first login or when a new notice version is published; blocks until the user responds.
- **"My Privacy" page** (student, teacher): consents, request form, request status and history.
- **College admin "Privacy" area**: request queue (overdue first), request detail with resolve actions, notice editor, retention policy table with dry-run, audit log.
- **Plumbing**: `frontend/src/api/privacy.ts` plus `queryKeys` entries, following the existing pattern.

## 7. Errors and testing

- Invalid transitions raise `BusinessRuleViolationException`; unknown requests raise `ResourceNotFoundException`.
- **TDD throughout** (red, green, refactor):
  - Unit: state machine, consent ledger, contributor anonymisation, retention selection.
  - Integration: Flyway migration (V6) on Postgres and H2, controller role checks, cross-tenant isolation (a college cannot see another college's requests).
  - Destructive path: after erasure, marks and attendance remain and personal fields are gone.
  - Frontend: consent gate and request form.

## 8. Open items before go-live

- Counsel to confirm the response deadline (D5) and the legal-hold rules for academic records.
- The college sets real retention durations (D7); the placeholders are not legal advice.
- Assign a CM functionality ID via a CHG record.

## 9. Implementation amendments (added while writing the plan)

Findings from reading the code that change or sharpen the design above:

1. **H2/dev and tests do not run Flyway.** `application-dev.yml` and `application-test.properties` set `spring.flyway.enabled=false` with `ddl-auto: create-drop`, so entities build the schema there. The SQL migration targets PostgreSQL only and is verified separately (Task 1, Step 8). This supersedes the "must run on H2" sentence in section 3.
2. **Migration number** was renumbered from V5 to V6 because `main` committed `V5__create_audit_log.sql` while this branch was in progress.
3. **`retention_policies.action`** only has `ANONYMISE` in this cut. `DELETE` would break the "keep academic records" decision (D2). **`trigger_event`** only has `ACCOUNT_DEACTIVATED`; the model has no graduation date.
4. **Retention eligibility** = user with role `STUDENT` or `TEACHER`, `is_active = false`, `anonymised_at IS NULL`, and `COALESCE(deleted_at, updated_at, created_at)` older than the policy's `retention_days`. There is no explicit deactivation timestamp today, so this is the best available reference date.
5. **Scheduler dry-run** is a global property `app.privacy.retention-dry-run` (default `true`), not a per-college switch. Policies are per college and ship disabled.
6. **`data_requests.export_payload TEXT`** is added to hold the access bundle; **`data_request_events.occurred_at`** replaces the column called `at`.
7. **Request status `CANCELLED`** is added to the lifecycle (the spec allowed cancelling but listed no status).
8. **Extra endpoints:** `GET /privacy/requests/{id}` (requester's detail with history) and `GET /privacy/admin/requests/{id}` (admin detail), needed by the UI.
9. **PARTIALLY_COMPLETED** is only valid for ERASURE requests and needs a note naming what was retained; every resolve needs a note.
10. **SUPERADMIN** reads admin data for one college by passing `collegeId`; COLLEGEADMIN always gets their own college and any `collegeId` is ignored. Write endpoints are COLLEGEADMIN only.
11. **Frontend tests** need a runner: the repo has none, so Vitest + Testing Library are added as devDependencies (Task 9).
12. The existing generic `audit` package (uncommitted at planning time) is not reused: `privacy_audit_log` needs `subject_user_id` and must not depend on uncommitted code.
