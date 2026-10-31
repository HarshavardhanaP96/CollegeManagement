# Vision & Product Requirements

## Outcome
EdgePoint (College Management System) is a multi-tenant academic ERP. One
deployment serves many colleges (tenants), each with its own departments,
courses, staff, and students, isolated via `TenantContext` extracted from the
JWT. The product gives each of five roles — Super Admin, College Admin, HOD,
Teacher, Student — the minimum surface needed to do their job: platform
operators onboard and configure colleges, college/department staff run
academics (courses, classes, staffing, enrollment), teachers run their
classroom (attendance, marks), and students self-serve their own record.

## Scope
- In scope (built or being built now): tenant/college management, department
  → course → subject → class hierarchy, teacher assignment, student
  enrollment, attendance capture, marks entry, per-role dashboards, per-college
  notification config (SMTP/WhatsApp), support ticket intake, observability
  (ELK + Discord alerting).
- In scope (planned, not yet wired to a real backend — see
  [requirements.md](requirements.md) open items): fee/billing management
  (templates, invoices), revenue reporting — no code today. The unreachable
  prototype that mocked them (`components/edgepoint/`, `lib/mock-data.ts`) was
  deleted 2026-10-31; ideas worth keeping: fee templates per course + term
  broken into components (tuition, lab, library, activities); invoices with
  paid amount and Paid/Partial/Overdue status; a student "wallet" with
  receipts; a SUPERADMIN revenue series per tenant. The prototype is in git
  history (and `reference/EdgePoint.jsx`) if needed.

## Non-goals
- Not now: parent/guardian portal, mobile app, LMS/course-content delivery,
  payment processing (Stripe keys exist in config but no flow calls them),
  multi-language UI.

## Success criteria
- Every role's job list in [requirements.md](requirements.md) maps to a
  working, tested API endpoint documented in [contracts.md](contracts.md).
- `@PreAuthorize` on every controller matches the intended role matrix in
  `frontend/src/strategies/roleStrategy.ts` (today's source of truth for who
  sees what) — no silent frontend/backend authorization drift like the
  `ClassController` issue already found and fixed (see
  [docs/ACCESS_CONTROL.md](../ACCESS_CONTROL.md)).
- Backend test suite (`docs/Testing_Strategy.md`, `docs/TESTING.md`) stays
  green; new endpoints ship with controller + service tests, not just a
  manual check.

## Constraints
- Must preserve the existing tenant-isolation model (`TenantContext`, JWT
  claims) — any new endpoint must scope data by college/department the same
  way existing ones do.
- Must preserve the existing role hierarchy
  (`SUPERADMIN > COLLEGEADMIN > HOD > TEACHER | STUDENT`) rather than
  introducing a parallel permission model.
- No other compliance constraint known today (no stated data-residency or
  regulatory requirement) — revisit if the product starts handling payments
  or government-issued student IDs.
