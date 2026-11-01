# New Features — Current Release (v1.0)

Features that don't exist yet and the v1.0 scope needs. IDs (`CM-xxx`, `OPS-xxx`) are from the
Functionality Master; see `docs/reviews/2026-10-19-spec-gap-review.md` for the full list and
sources.

## 0. Decide before building (blockers)

These are spec problems, not code. Build on top of them and every later work package fails its own
traceability gate.

- [ ] One change record that makes the functionality id the stem of every test/workflow/API id
      (126 of 133 test prefixes point at the wrong feature).
- [ ] Repair the permission matrix: students can't see their own attendance/marks/results, faculty
      can't mark attendance, nobody can verify marks/results, same role creates and approves.
- [ ] **Grading scheme decision**: grade points, credits, SGPA/CGPA, pass criteria,
      grace/moderation, rounding, absent/withheld. Result calculation (CM-156) is impossible without it.
- [ ] Runtime decisions: AWS ECS vs current Kubernetes/ArgoCD, SQS vs Kafka, CloudWatch vs ELK.
      The repo runs the latter in each pair; record the choice.
- [ ] Graduation needs Clearance (CM-223/224, currently v1.1). Either move clearance to v1.0 or ship
      graduation without it.

## 1. Platform & identity

| Feature | Why now | Notes |
|---|---|---|
| Password reset / first-login forced change | No reset flow exists; admins must reset by hand | Email link with single-use token, audited |
| MFA for SUPERADMIN / COLLEGEADMIN | Spec requires step-up for privileged roles | TOTP first |
| Session list + revoke | Refresh-token store now exists (`V8`) | "Sign out other devices" |
| College suspend/deactivate (FR-SA4) | Only hard delete exists | Soft state, blocks login for that tenant |
| Org → Institution → Campus tenancy (WP-003) | Today one `college_id` per tenant | Large; plan as its own feature branch |
| Richer roles (WP-004): Principal, Exam Cell, Admission, HR, Parent… | 5 roles today vs 21 in spec | Keep the role hierarchy; add scope + delegation |
| Customer user/role management by College Admin | Today every user change needs the platform team | Within own college only |

## 2. Academics

| Feature | Notes |
|---|---|
| Academic year / term / batch configuration (FR-CA5 gap) | Needed for promotion and attendance % |
| Academic calendar, holidays, working days | Attendance percentage and session generation depend on it |
| Curriculum + versions, programme, section, lab batch | Spec CM-030–044 |
| Faculty/employee record (HR) | No CM id in spec yet; CM-044 assumes faculty exist |
| Student lifecycle: admission, promotion, repeat, backlog, transfer, break/rejoin, withdrawal, graduation | CM-060–074 |
| Bulk import (CSV/XLSX) of students, staff, structure | Onboarding a college is impractical without it; validate + dry run + per-row errors |

## 3. Attendance (builds on `feat/bulk-attendance`)

- [ ] Attendance correction with reason and approval (CM-092).
- [ ] Shortage report and exam eligibility (CM-093/094), using the calendar above.
- [ ] Condonation workflow (CM-095).
- [ ] Session-based marking (multiple periods per day) — the new unique index is per day, so this
      needs a `session/period` column and a new index.

## 4. Assessment, exams, results

- [ ] Marks workflow: entry → submit → verify → correct → approve → finalize (CM-130–136). Today
      marks are entered and editable with no states.
- [ ] Exam registration, schedule, hall ticket (CM-150–155).
- [ ] Result calculation → verify → approve → publish, revaluation, supplementary (CM-156–161).
- [ ] Trigger `MARKS_PUBLISHED` notification on publish.
- [ ] Marksheet / transcript / certificate PDF output.

## 5. Teaching & student work

- [ ] Assignments: create, publish, submit, deadlines, late, extension, evaluation (CM-110–116).
- [ ] Projects: proposal, guide, approval, milestones, viva (CM-180–184).
- [ ] Internships: organisation, allocation, offer, reports, evaluation (CM-190–194).

## 6. Cross-cutting

- [x] **Knowledge Base**: articles, categories, search, draft → publish, "was this helpful?",
      role-targeted visibility (`feat/knowledge-base`, `V9`). Follow-ups: seed articles, markdown.
- [ ] Support tickets persisted with status (today `SupportController` only forwards to Discord).
- [ ] Documents (CM-260/262), Requests (CM-280/281), My Work inbox (CM-290), Reports (CM-291).
- [ ] Announcements with the `ANNOUNCEMENT` notification event.
- [ ] In-app notification centre + delivery status, per-user opt-out.
- [ ] Data export per college (CM-007), audited.

## 7. Privacy follow-ups (`feature/dpdp-privacy` is merged)

- [ ] Verifiable guardian consent for minors.
- [ ] Rate limiting on privacy endpoints (reuse the login limiter approach).
- [ ] HOD access to privacy admin (decide).
- [ ] Breach-notification tracking.

## 8. Platform operations (OPS-001–017)

- [ ] Customer onboarding checklist, implementation tracking, migration, UAT, go-live (OPS P0 set).
- [ ] Tenant health and usage view for SUPERADMIN.
