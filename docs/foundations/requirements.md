# Requirements & Non-Functional Requirements

Organized by role, since that's how access, jobs, and the API surface are
actually partitioned in this system (`roleStrategy.ts` on the frontend,
`@PreAuthorize` on the backend). For each role: the jobs it does today, the
API surface that backs those jobs (endpoint inventory lives in
[contracts.md](contracts.md), not duplicated here), and known gaps — missing
or half-built pieces, called out so they aren't mistaken for new scope.

## Role: Super Admin (`SUPERADMIN`)
Platform operator. Implicitly included in every `@PreAuthorize` check in the
codebase (role hierarchy root) — can do everything every other role can, plus:
- [x] FR-SA1: Register, list, update, delete colleges (tenants); view
      per-college statistics. (`CollegeController`, `/colleges/**`)
- [x] FR-SA2: Set per-college notification config (SMTP + WhatsApp secrets,
      AES-256-GCM encrypted at rest). Only SUPERADMIN can **write**;
      COLLEGEADMIN is read-only. (`NotificationConfigController`)
- [x] FR-SA3: View cross-tenant dashboard/analytics.
- [ ] FR-SA4 (gap): No endpoint to deactivate/suspend a college without
      hard-deleting it, and no billing/plan management for tenants.

## Role: College Admin (`COLLEGEADMIN`)
Runs one college. Scoped to their own `collegeId` via `TenantContext`.
- [x] FR-CA1: CRUD departments, courses within their college.
      (`DepartmentController`, `CourseController`)
- [x] FR-CA2: Configure exam types for their college. (`ExamTypeController`)
- [x] FR-CA3: Read (not write) notification config for their college.
- [x] FR-CA5: Choose, per event type (absence, marks published, fee reminder,
      announcement), whether email and/or WhatsApp is used for their college.
      SUPERADMIN can do the same for any college. (`NotificationChannelRuleController`)
- [x] FR-N1: When a teacher marks a student absent, the parent is notified on
      the channels enabled for ATTENDANCE_ABSENCE (default email only), using the
      college's SMTP/WhatsApp config. Async, best effort, no retry. Only the
      absence event is wired; other event types have no trigger yet.
      (`NotificationDispatcher`, `AttendanceServiceImpl`)
- [x] FR-CA4: CRUD students, teachers, classes, subjects — same endpoints HOD
      uses, scoped by college instead of department.
- [ ] FR-CA5 (gap): No per-college branding/settings page beyond
      SMTP/WhatsApp — e.g. no academic-year/term configuration endpoint yet.

## Role: HOD (`HOD`)
Runs one department within a college. Scoped by `departmentId`.
- [x] FR-HOD1: CRUD subjects, classes within their department.
      (`SubjectController`, `ClassController`)
- [x] FR-HOD2: CRUD students and teachers within their department.
      (`StudentManagementController`, `TeacherManagementController`)
- [x] FR-HOD3: Assign a teacher to a class+subject
      (`TeacherAssignment`), enroll students into a class.
      (`ClassController` `/teacher-assignments`, `EnrollmentController`)
- [x] FR-HOD4: Read-only on departments (cannot create/update their own
      department record).
- [ ] FR-HOD5 (gap): Per-row "Manage"/"Details" links on list pages
      (courses, departments, students, teachers, subjects, classes) navigate
      to detail routes that don't exist yet — only list + create pages are
      built today (see `docs/ACCESS_CONTROL.md` "Known gaps"). No update
      path exists in the UI even though the backend supports `PUT`.

## Role: Teacher (`TEACHER`)
Runs their own classroom. Scoped to their own `TeacherAssignment`s.
- [x] FR-T1: View their assigned classes/subjects. (`/attendance/my-assignments`)
- [x] FR-T2: Mark attendance for a session, view/update it, view summary and
      roster. (`AttendanceController`)
- [x] FR-T3: Enter and update marks for an assignment, view mark summary and
      roster. (`MarkController`)
- [x] FR-T4: View own dashboard (`TeacherDashboardController`).
- [ ] FR-T5 (gap, in progress): `TeacherAttendancePage`'s "Submit Attendance"
      flow never fetches the per-student roster to actually mark — the
      backend roster endpoint exists (`GET
      /attendance/assignment/{id}/roster`) but the frontend doesn't call it
      yet, so the submit button stays permanently disabled.
- [ ] FR-T6 (gap): Read-only on students/subjects/classes they teach — no
      endpoint issue, this is intentional scope per `roleStrategy.ts`.

## Role: Student (`STUDENT`)
Self-service only, scoped to their own `userId`.
- [x] FR-S1: View and update own profile (contact/parent details only).
      (`StudentProfileController`)
- [x] FR-S2: View own marks, overall and by subject. (`StudentMarkController`)
- [x] FR-S3: View own attendance, overall and by subject.
      (`StudentAttendanceController`)
- [x] FR-S4: View own dashboard. (`StudentDashboardController`)
- [ ] FR-S5 (gap): No fee/invoice view for students — billing has no real
      backend (no invoice domain object anywhere). The old frontend mock data
      for it was removed; see [vision.md](vision.md) scope for the ideas kept.

## Cross-role
- [x] FR-X1: Login, logout, refresh token, change password, validate token —
      available to all authenticated roles. (`AuthController`)
- [x] FR-X2: Submit a support request — any authenticated role.
      (`SupportController`)
- [x] FR-X4: Read help articles (Knowledge Base): browse by category, search,
      rate "was this helpful?" — any authenticated role, filtered by the
      article's visible roles. SUPERADMIN authors, publishes, archives and
      deletes articles and categories. (`KnowledgeBaseController`,
      `KnowledgeBaseAdminController`; `/knowledgebase`, `/kb-admin` in the UI)
- [x] FR-X3 (resolved 2026-10-31): the orphaned `frontend/src/api/institution.ts`
      client (called `/institutions`, which has no backend) was deleted
      together with the disconnected `components/edgepoint/` prototype tree.

## Non-functional requirements
- **Security:** JWT (HS256) bearer auth on every endpoint except
  `/auth/login` and `/auth/refresh-token`; `@PreAuthorize` per controller is
  the real enforcement boundary — the frontend's `<Can>`/`usePermissions`/
  `ProtectedRoute` strategies are UX convenience only (see
  `docs/ACCESS_CONTROL.md`). Secrets (notification config SMTP/WhatsApp
  credentials) encrypted at rest via AES-256-GCM
  (`EncryptedStringConverter`).
- **Multi-tenancy:** every data-returning endpoint must scope by
  `TenantContext` (college, and department where applicable). Treat any new
  endpoint that skips this as a bug, not a style choice — this is how the
  `ClassController`/`ClassManagementServiceImpl` mismatch became a real
  authorization gap (fixed; see `docs/ACCESS_CONTROL.md`).
- **Performance:** no formal SLA documented today. Revisit once the
  dashboard/analytics endpoints carry real cross-tenant aggregation load.
- **Observability:** ELK stack (Elasticsearch/Logstash/Kibana) for log
  aggregation, Discord webhook alerting on failure-rate/slow-request
  thresholds (`DiscordAlertService`, `FailureRateMonitor`,
  `SlowRequestInterceptor`). See `docs/OBSERVABILITY.md`.
- **Scalability:** containerized (Docker Compose for dev, k8s + ArgoCD for
  deployment — see `infra/`). Postgres is the only datastore in active use;
  Redis/Kafka config exists in `application.yml` but nothing in the codebase
  currently uses either.
- **Compliance:** none formally required today. Revisit if billing/payments
  (Stripe keys are already provisioned but unused) or government ID fields
  are added — those would likely trigger PCI/data-protection obligations.

## Open questions / edge cases
- Duplicate DTO classes sharing a simple name across packages
  (`com.edgepoint.student.dto.StudentMarkDTO` vs
  `com.edgepoint.academic.dto.StudentMarkDTO`, and the `StudentAttendanceDTO`
  equivalent) — confusing to grep, worth a rename pass before adding more
  student-facing DTOs in either package.
- Resolved: `APIdoc.md` (stale fork, missing Support/Observability sections)
  and `User-Guide.md` (byte-identical dup of `USER_GUIDE.md`) were deleted.
  `API.md` and `USER_GUIDE.md` are now the sole canonical copies.
- No endpoint-level versioning strategy beyond the `/api/v1` prefix — decide
  this before the first breaking change to a role's contract.
