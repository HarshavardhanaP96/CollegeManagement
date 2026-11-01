# Grudhra College Management — Specification Gap & Release-Scope Review

**Date:** 2026-10-19
**Source:** Google Drive folder `1gmnYIuTsbtQOxUWprvn5tCAwSG7GDUFZ` (10 files, all dated 2026-10-08), compared against this repository at commit `7540b36`.

**Files reviewed (all read in full):**

| # | File | Size / content |
|---|------|----------------|
| 1 | Functionality Master v1.5 | 133 functionality records (116 CM + 17 OPS), 13 sheets |
| 2 | Roles & Responsibilities v1.4 | 21 roles, 10 responsibilities, 991 permission mappings |
| 3 | Developer Master v1.4 | Build order, 19 work packages, indexes, DoD, gates |
| 4 | Architecture & Technical Spec v1.0 | 19 target components, 15 domains, NFRs |
| 5 | Workflow & Business Rules v1.0 | 47 workflows, 195 transitions, 20 business rules |
| 6 | API & Integration Spec v1.0 | Conventions, error model, jobs, webhooks, 8 integrations |
| 7 | Test Scenario & Test Case Master v1.1 | 399 scenarios, 798 cases, 18 security tests |
| 8 | Security, Compliance & Production Readiness v1.0 | 15 SEC, 14 PRIV, 10 COMP, 13 PRD checks |
| 9 | Migration, UAT, Go-Live & Change Control v1.0 | 8 stages, 16 entity maps, 12 reconciliation checks |
| 10 | Developer Handover v1.0 (docx) | Entry point, WP sequence, domain rules |

---

## 1. Release scope as the specs define it

The Functionality Master gives each priority a release meaning: **P0** = foundation/security, **P1** = core, **P2** = "v1.1/important", **P3** = later/add-on (there are no P3 records).

### Current release (v1.0) = P0 + P1: 117 functionalities

| Module | P0 | P1 | Notes |
|---|---|---|---|
| Platform (CM-001–007) | 3 | 4 | Org/Institution/Campus, config, entitlements, subscription, data export |
| Identity & Access (CM-010–018) | 8 | 1 | Person, account, roles, permission eval, scope, delegation (P1), support access, audit, sessions |
| Academic (CM-030–044) | 13 | 2 | Unit, program, curriculum + versions, subject concept/curriculum subject, year/period/batch, class/section, offering, faculty assignment; component & lab batch are P1 |
| Student (CM-060–074) | 5 | 9 | Profile, enrollment as source of truth, promotion (P0); admission, conditional promotion, repeat, backlog, supplementary, transfer, break/rejoin, withdrawal, graduation (P1) |
| Attendance (CM-090–096) | 5 | 2 | Session-based marking, correction, shortage, eligibility; verification & condonation P1 |
| Assignments (CM-110–116) | — | 7 | Create, publish, submit, deadlines, late, extension, evaluation |
| Assessment/Marks (CM-130–136) | 7 | — | Entry → submit → verify → correct → approve → finalize |
| Examination (CM-150–155) | 3 | 3 | Config, eligibility, evaluation (P0); registration, schedule, hall ticket (P1) |
| Results (CM-156–161) | 4 | 2 | Calculate → verify → approve → publish; revaluation and supplementary (P1) |
| Projects (CM-180–184) | — | 5 | Proposal, guide, approval, milestones, viva |
| Internships (CM-190–194) | — | 5 | Org, allocation, offer, reports, evaluation |
| Documents / Notifications / Requests / My Work / Reports (CM-260–291) | — | 9 | Cross-cutting |
| Add-ons in v1.0 (disabled by default) | — | 4 | CM-292 Analytics, CM-320/321 Parent, CM-370 Integrations |
| Grudhra Operations (OPS-001–017) | 7 | 10 | Portfolio, onboarding, implementation, migration, UAT, go-live, support (P0); health, usage, renewals, etc. (P1) |

### Future release (v1.1) = P2: 16 functionalities

| Area | IDs |
|---|---|
| Student | CM-070 Improvement, CM-075 Alumni transition |
| Assignments | CM-117 Resubmission |
| Timetable | CM-200 |
| Finance (add-on) | CM-220 Student finance |
| Clearance | CM-223 Clearance workflow, CM-224 Graduation clearance |
| Placement | CM-230–232 |
| Library (add-on) | CM-240 |
| Add-ons | CM-310 Admissions, CM-330 Accreditation, CM-340 Events, CM-350 Research, CM-360 Alumni |

### Roadmap items named outside the Functionality Master (later)
ISO 27001 (COMP-004), ISO 27701/SOC 2 (COMP-005), SSO/OIDC/SAML (INTG-005), biometric devices (INTG-004), LMS (INTG-007), university/government feeds (INTG-006), BI read models (INTG-008), multi-region DR (DR-006), selective Kafka/SNS (ARCH-013).

### What the prototype already covers
About 20 of the 133 IDs have any prototype code (College, Department, Course, Subject, Class, ClassSubject, TeacherAssignment, StudentProfile, StudentEnrollment, AttendanceRecord, Mark, ExamType, NotificationConfig, SupportRequest, analytics). The spec classifies all of them as **REBUILD/REFACTOR**, and 103 IDs are **NEW**. In practice, v1.0 is mostly new build.

---

## 2. Blocking specification defects (fix before any WP is "done")

The handover says the specs are frozen and traceability gates block completion (CL-010, CL-011). The defects below make those gates impossible to pass, so they need a change record (CHG-xxx) first.

### 2.1 Test IDs point at the wrong features — P0 traceability defect
- Test Master scenario IDs are numbered by **row position**, not by Functionality ID: `TS-CM-008-xx` tests **CM-010**, `TS-CM-010-xx` tests **CM-012**, and so on. **126 of 133** scenario prefixes do not match their functionality number.
- The Regression Suite repeats this: `REG-CM-010` (Person) requires `TC-CM-008-*`.
- The Functionality Master says CM-010's cases are `TC-CM-010-01/02`. In the Test Master that ID belongs to Role assignment (CM-012).
- **Effect:** every "Functionality → Test" link outside CM-001–007 resolves to the wrong feature.

### 2.2 Five incompatible cross-reference ID schemes
| Source | Example for CM-001 |
|---|---|
| Functionality Master 01 | `TC-CM-001-01`, (no WF/API ID) |
| Functionality Master 10_TRACE_INDEX | `WF-PLT-001`, `API-PLT-001`, `SEC-PLT-001`, `TS-PLT-001`, `UAT-PLT-001`, `ENT-PLT-001` |
| Developer Master 03_FUNCTIONALITY_INDEX | `WF-PLT-001`, `TS-CM-001`, `UAT-CM-001` |
| Developer Master 05_TEST_SCENARIO_INDEX | `TS-PLT-001`, `TC-PLT-001-01` |
| Developer Master 06_VERIFICATION_INDEX | `WF-CM-001`, `API-CM-001`, `SEC-CM-001`, `TS-CM-001-NEG` |
| Test Master | `TS-CM-001-01`, `TC-CM-001-01-01`, `UAT-CM-001` |

Other mismatches:
- **Workflow:** in the Workflow spec `WF-PLT-001` = *Customer onboarding (OPS-002)*, not CM-001. The Workflow spec uses `WF-IDN-*`; the masters use `WF-IAM-*`.
- **API:** the API spec defines no per-endpoint IDs (`API-001…015` are conventions), so every `API-PLT-*`/`API-CM-*` reference is dangling.
- **Security:** the Security spec uses `SEC-001…015`, Architecture uses `SEC-AUTH-001` etc., and the masters use `SEC-PLT-*`/`SEC-CM-*`. None of these resolve to each other.
- **Entitlements:** `ENT-PLT-001…` (trace index) vs `ENT-CORE`/`ENT-ADDON-*` (entitlement map).
- **Bad reference:** `SEC-TC-004` (delegation expiry) points to `SEC-OPS-001`, which is the support-access control.

**Recommendation:** issue a single CHG that makes the Functionality ID the stem everywhere (`TS-CM-010-01`, `TC-CM-010-01-01`, `WF-STU-002` etc. kept as workflow IDs but listed per functionality) and regenerates the indexes. It's mechanical but has to happen before the first WP is closed.

### 2.3 Permission matrix cannot support the product's own workflows
Analysis of all 991 mappings:

| Gap | Detail |
|---|---|
| **No permissions at all** | CM-260/262 Documents, CM-280/281 Requests, CM-290 My Work, CM-291 Reports (all P1 core) |
| **Students can't act** | CR-11 has VIEW only (31). They can't submit assignments (CM-112 is CREATE by CR-05 only), raise requests, or register for exams |
| **Students can't see their own data** | CR-11 has no VIEW on attendance (CM-091), marks (CM-131) or published results (CM-159). The prototype already has student attendance/marks pages |
| **Faculty can't mark attendance** | CM-090/091 CREATE/UPDATE is HOD (CR-04) only; CR-05 is VIEW |
| **Nobody verifies marks/results** | CM-133 Mark verification and CM-157 Result verification have no VERIFY mapping |
| **Self-approval everywhere** | The same role creates *and* approves in CM-065/066/069/073/074 (CR-01), CM-092/095 (CR-04), CM-111/134/135 (CR-05), CM-158/160/161 (CR-07), CM-182 (CR-15), CM-224 (CR-09), CM-005–007 (GR-01). This contradicts AC-001 / APR-003 unless separation comes purely from per-user runtime checks, and no second approver role exists to fall back to (EXC-007) |
| **Leadership has no authority** | CR-02 Principal and CR-03 Vice Principal are VIEW-only but "Can Approve? Yes" |
| **Customer admin can't manage users** | CM-011/012/014/015 are GR-01 only, so every customer user/role change needs Grudhra |
| **HR role (CR-08) has zero mappings** | And there is no Employee functionality at all (see 3.1) |
| **Internal roles under-powered** | GR-02 Implementation is VIEW-only on OPS-003–006, which are its own job. GR-04 Support is VIEW-only on OPS-007 tickets |
| **Parent role contradicts itself** | CR-12 is "read-only" but has CREATE/UPDATE/CORRECT on CM-320/321, so a guardian could link themselves to a student |
| **Unused actions** | DELEGATE, RECOMMEND, ADMINISTER are defined but never mapped. 987/991 rows are `Delegable = No`, though 18 roles say "Can Delegate: Yes" |
| **Responsibility gates look auto-filled** | RS-07 (Admission Coordinator) is the gate on 171 rows, including CR-01 viewing Organization |

### 2.4 Workflows are skeletons
- All 195 transitions have the same trigger ("Authorized transition action") and the same validation text. None says **which role** may perform it.
- Only forward paths exist. States such as *Rejected*, *Returned*, *Cancelled*, *Reopened* have **no transition into them** (e.g. WF-STU-008 Withdrawal has no rejection path; WF-RES-002 "Verified / Returned" is one state).
- Branch states are merged into one state ("Applied / Rejected", "Eligible/Conditional/Not Eligible/Pending").
- 30+ functionalities have no workflow, including CM-001–005, CM-007, CM-060, CM-161 Supplementary result, CM-200, CM-290–292, CM-320/321, OPS-001/010/012–014/016.

### 2.5 Results can't be built from the current calculation rules
CALC-005/006 say "configured weights" and "versioned rules" but nowhere define the **grading scheme**: grade points, SGPA/CGPA, credits, pass criteria, grace/moderation, rounding, or absent/withheld handling. CM-156 Result calculation is P0. Without a decision record this is unimplementable, so the developer would have to guess, which EXEC-006 forbids.

### 2.6 Test cases are templates, not executable cases
All 798 cases have the same four generic steps ("Open the supported workflow… Enter valid test data…"). There are no feature-specific preconditions, data or expected values, and calculations have no oracle values. They satisfy the coverage count but not the "executable" claim in 00_README.

### 2.7 Work-package and control inconsistencies
- WP numbering: Handover `WP-01…WP-17`, Developer Master `WP-001…WP-019`, and build order uses `WP-MIG-001`/`WP-REL-001` for what the WP map calls `WP-018`/`WP-019`.
- WP-013 scope "CM-210–CM-240": **CM-210 doesn't exist**. WP-013 is P1 but every functionality in it is P2.
- WP-012 (P1) contains CM-200 Timetable (P2). WP-016 (P2) contains CM-320/321 Parent (P1). WP-017 is P0 but 10 of its 17 OPS items are P1.
- OPS-001–007 (P0) depend on CM-005/CM-006 (P1): a priority inversion.
- CM-074 Graduation (P1) runs through WF-STU-009 "Clearance Pending → Cleared" and APR-007, but Clearance (CM-223/224) is P2. Either graduation ships without clearance in v1.0, or clearance moves to P1.
- OPS-* rows say "Optional add-on / Can disable: Yes / Disabled until entitled", while the entitlement map says "Internal, enabled for Grudhra staff, cannot disable".
- The Functionality Master "Dependencies" column is module-generic (every Academic row depends on CM-001;002;003) and disagrees with the specific 05_DEPENDENCY_MAP.
- Developer Master 08_DOCUMENT_REGISTRY is stale: DOC-05–12 say "To derive", DOC-03 says v1.0 (it's v1.4), DOC-04 says v1.0 (Test Master is v1.1), and DOC-04/DOC-13 are duplicates.
- Version tables conflict: FM `09_VERSION_CONTROL` says v1.5 is current, while `10_VERSION_CONTROL` says 1.4 is current. Rows 1.3/1.4 in FM and Developer Master have date/status columns swapped.
- Developer Master 09_CLAUDE_RULES: rule ID `CR-08` collides with the HR role ID, and CL-008/CL-009 are missing.

---

## 3. Missing features (not in any of the 10 documents)

### 3.1 Needed for v1.0. Other parts of the spec already depend on them.
| Missing capability | Why it's required now |
|---|---|
| **Employee / Faculty record & HR** | Architecture DOM-05, role CR-08, MIG-MAP-007 (TeacherProfile → Person + Employee + Faculty), DATA-004. No CM ID exists; CM-044 assumes faculty already exist |
| **Grading scheme / credit & GPA configuration** | Prerequisite for CM-156–161 (see 2.5) |
| **Login, password reset/first-login, MFA for privileged roles** | CM-018 covers only sessions. ADMINISTER needs "step-up controls" and SEC-001 needs an account lifecycle |
| **Bulk import (students, staff, structure)** | JOB-003, IDEM-004 and the migration plan depend on it, but there's no functionality ID. Onboarding a college without it is impractical |
| **Academic calendar / holidays / working days** | Needed for CALC-001 attendance percentage and session generation |
| **Marksheet / transcript / certificate output** | Result publication and graduation have no document output defined |
| **Privacy workflows (DPDP)** | PRIV-006 notice/consent, PRIV-007 data-principal requests, PRIV-008/009 retention & deletion. COMP-001 is "Required", but there's no functionality ID |
| **Audit log viewer for customers** | CM-017 VIEW is internal-only. Customers can't review their own audit trail |
| **Notification channels & preferences** | INTG-002/003 email/SMS are "core", but CM-270/271 don't cover channel config, opt-out or delivery status UI |

### 3.2 For v1.1 or later
Exam seating/invigilation (RS-05 already exists), question papers and moderation, fee payment gateway flow (WH-001/INTG-001 are specified but CM-220 is P2), student/parent mobile experience, localisation, and in-app messaging.

### 3.3 Missing operating decisions (needed before production)
- **RPO/RTO and SLA:** DR-005 and NFR-001 reference them, but no values are set.
- **Thresholds:** performance targets (NFR-002 "agreed pilot load"), rate limits, alert thresholds (MON-001/002).
- **Policies:** password/session policy and the data-retention schedule (PRIV-008).
- **Infrastructure choices:** AWS region (COMP-009) and the single IaC tool (ARCH-019).

---

## 4. Architecture target vs. what's in the repo

| Area | Spec target | Repo today | Action |
|---|---|---|---|
| Runtime | AWS ECS/Fargate behind ALB/CloudFront/WAF | Kubernetes + ArgoCD (`infra/k8s`, `infra/argocd`), Jenkins | **Decision record needed.** Either amend ARCH-008/018/019 or plan the move |
| Messaging | SQS (+ SNS, Kafka only if justified) | Kafka | Same |
| Observability | CloudWatch + app telemetry | ELK + Prometheus | Same |
| Tenancy | Organization → Institution → Campus → … → Student | Single `college_id` via `TenantContext` | REBUILD (WP-003) |
| Roles | 21 roles + responsibilities + scope + delegation | 5 roles (SUPERADMIN, COLLEGEADMIN, HOD, TEACHER, STUDENT), one `role_id` per user | REBUILD (WP-004) |
| Schema ownership | Flyway owns everything (MIG-ARCH-001) | Core tables (`users`, `colleges`, `departments`, `courses`, `user_roles`, `student_profiles`, `teacher_profiles`) come from an external `init-db.sql` (see `V2__add_academic_attendance_schema.sql:3`) | Fix in WP-001 |
| Audit | Before/after, actor, scope, reason, correlation ID | `AuditableEntity` has created/updated timestamps and user IDs only | WP-002 |

### Known prototype P0 security issues (PRD-002/003/004), still present
- CORS wildcard with credentials: `backend/src/main/java/com/edgepoint/config/WebSecurityConfig.java:66` and `:70`
- `/actuator/**` is public (`WebSecurityConfig.java:51`), and `health.show-details: always` is set in `application.yml:107`
- Swagger UI/API docs are public (`WebSecurityConfig.java:46`)
- The JWT secret has a hard-coded fallback default: `backend/src/main/resources/application.yml:62`
- The DB password defaults to `postgres`: `application.yml:13`
- Tenant scoping is uneven: only 11 of 33 service classes reference the college/tenant ID
- 22 test files, with no RBAC, tenant-isolation, BOLA or workflow tests

---

## 5. Recommended next steps

**Option A (recommended): fix the specs first with one change record, then start WP-001.**
Spend a few days on one CHG that does three things:
1. Normalises all IDs (2.1, 2.2).
2. Repairs the permission matrix (2.3).
3. Adds the 9 missing v1.0 functionalities (3.1) and the grading-scheme decision (2.5).

WP-001 (build/Flyway/security baseline) can run **in parallel**, because it doesn't depend on any of those IDs. *Why:* otherwise every WP after WP-003 will fail its own traceability and DoD gates.

**Option B:** start WP-001 → WP-004 now and log each defect as a deviation (DEV-xxx) as it's hit. That's faster to start, but the deviation register will grow quickly and the access-model fixes land mid-build.

**Option C:** re-baseline the release split. Move Clearance (CM-223/224) to P1 so graduation works in v1.0, or explicitly ship graduation without clearance. Combine this with A or B.

Whichever option is chosen, also:
- Record decisions on the AWS-vs-Kubernetes runtime, SQS-vs-Kafka and CloudWatch-vs-ELK.
- Close the five prototype security items in section 4 as part of WP-001/WP-002.
