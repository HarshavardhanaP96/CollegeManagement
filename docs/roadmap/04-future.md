# Future (v1.1 and later)

Not needed for v1.0. Grouped by theme; IDs from the Functionality Master where they exist.

## v1.1 (P2 in the spec)

| Area | Features |
|---|---|
| Student | Improvement exams (CM-070), alumni transition (CM-075) |
| Assignments | Resubmission (CM-117) |
| Timetable | Timetable builder with clash detection (CM-200); feeds session-based attendance |
| Finance (add-on) | Fee templates, invoices, receipts, reminders (CM-220). UI ideas from the removed prototype are noted in `docs/foundations/vision.md`; `FEE_REMINDER` event already defined |
| Payments | Payment gateway (Stripe keys provisioned but unused, or Razorpay for India), webhook handling with idempotency keys |
| Clearance | Clearance workflow and graduation clearance (CM-223/224), unless moved into v1.0 |
| Placement | Drives, applications, offers (CM-230–232) |
| Library (add-on) | Catalogue, issue/return, fines (CM-240) |
| Add-ons | Admissions portal (CM-310), Accreditation/NAAC data (CM-330), Events (CM-340), Research (CM-350), Alumni (CM-360) |

## Experience
- Parent/guardian portal (CM-320/321): attendance, marks, fees, absence alerts; read-only by
  default, guardian link approved by the college.
- Student/parent mobile app or PWA with push notifications.
- Localisation (Hindi + regional languages), multi-language notifications.
- In-app messaging between teachers, students, parents.
- Analytics add-on (CM-292): at-risk students (attendance + marks trends), department comparisons.

## Exams, deeper
- Exam seating and invigilation duty allocation.
- Question paper setting and moderation.
- Online exams / quizzes.

## Integrations
- SSO: OIDC/SAML (Google Workspace, Microsoft 365).
- Biometric / RFID attendance devices.
- LMS (Moodle, Google Classroom).
- University and government feeds (results, scholarships, AISHE/NIRF reporting).
- BI read models / data warehouse export.
- SMS provider in addition to email and WhatsApp.

## Platform & scale
- Multi-region disaster recovery (DR-006), with RPO/RTO from 02 §4.
- Selective event streaming (Kafka/SNS) only where a real consumer needs it.
- Read replicas for reports and dashboards.
- Per-tenant feature entitlements and subscription/billing for the SaaS itself.

## Compliance
- ISO 27001 (COMP-004), ISO 27701 / SOC 2 (COMP-005).
- Data-nomination right and breach notification under DPDP (follow-ups from the privacy spec).
- Data residency option per tenant.
