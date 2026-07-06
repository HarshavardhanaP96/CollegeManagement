# EdgePoint — Institutional ERP
## System Design Document: HLD + LLD

> **MULTI-TENANT · ROW-LEVEL ISOLATED · BUILT FOR SCALE**

| Field | Value |
|---|---|
| Document Type | System Design – HLD + LLD |
| Project / System | EdgePoint Institutional ERP |
| Version | 1.0 |
| Date | May 2026 |
| Roles Covered | Super Admin · College Admin · Teacher · Student / Parent |
| Primary Tech Stack | Spring Boot · React / TypeScript · PostgreSQL · Redis · Kafka |

---

## Table of Contents

1. [Executive Overview](#1-executive-overview)
2. [HLD – System Architecture](#2-hld--system-architecture)
3. [HLD – Role & Portal Architecture](#3-hld--role--portal-architecture)
4. [HLD – Module Map](#4-hld--module-map)
5. [HLD – Key Data Flows](#5-hld--key-data-flows)
6. [HLD – Technology Stack](#6-hld--technology-stack)
7. [LLD – Database Schema](#7-lld--database-schema)
8. [LLD – API Design](#8-lld--api-design)
9. [LLD – Module-Level Design](#9-lld--module-level-design)
10. [LLD – Security Architecture](#10-lld--security-architecture)
11. [LLD – Non-Functional Design](#11-lld--non-functional-design)
12. [Deployment & Infrastructure](#12-deployment--infrastructure)

---

## 1. Executive Overview

EdgePoint is a cloud-native, multi-tenant Institutional ERP platform designed to unify all administrative, academic, and financial operations across every campus a university operates — through a single, role-isolated interface.

### 1.1 Problem Statement

Universities typically run siloed systems for fee collection, gradebooks, attendance, curriculum, and staff management. Data silos create reconciliation overhead, delayed grade publishing, manual invoice generation, and lack of real-time visibility for both students and administrators.

### 1.2 Solution

EdgePoint provides a unified data ledger with four distinct role-based portals, centralized through a common API gateway and backed by a multi-tenant PostgreSQL schema with row-level isolation.

| Role | Portal | Primary Capabilities |
|---|---|---|
| **Super Admin** | Platform Console | Manage all institutions, MRR, uptime, onboarding, audit |
| **College Admin (Registrar)** | Registry Portal | Staff, curriculum, assignments, fees, results publishing |
| **Teacher / Faculty** | Faculty Portal | Class roster, attendance grid, gradebook, session management |
| **Student / Parent** | Student Portal | Today dashboard, marks, exam schedule, analytics, wallet |

### 1.3 Key Metrics (Live Demo Data)

| Metric | Value | Metric | Value |
|---|---|---|---|
| Active Institutions | **6** | Total Students | **42,752** |
| MRR | **$167.8k (+8.2%)** | Platform Uptime (30d) | **99.98%** |
| YOY Growth | **+38%** | Net Retention | **114%** |

---

## 2. HLD – System Architecture

### 2.1 Architecture Style

EdgePoint follows a **Layered Monolith with Modular Domains** architecture — a pragmatic choice that supports rapid iteration while enforcing clear module boundaries. The system is designed to be extracted into microservices per domain (fees, marks, attendance) as scale demands.

> **Core Architectural Decisions**
> - Multi-tenant with `tenant_id` at every row — enforced at the Spring Data JPA repository layer via `@Filter`
> - Role-based routing: each role (superadmin, registrar, faculty, student) gets its own URL namespace and React workspace
> - Session-based auth with JWT at edge (API gateway) + HttpOnly cookies for SPAs
> - Kafka for async events: grade publishing, invoice generation, attendance streak recalculation
> - Redis for: session caching, rate limiting, real-time attendance counters, grade-release pub/sub
> - CDN-backed static assets; server-side pagination for all roster/invoice tables

### 2.2 System Layers

| Layer | Technology | Responsibility |
|---|---|---|
| Presentation | React 18 + TypeScript + TanStack Query | Four isolated SPAs; shared component library (Radix UI + Tailwind) |
| API Gateway | Spring Cloud Gateway / Nginx | Auth filter, rate limiting, tenant context injection, routing |
| Application | Spring Boot 3.x (Java 21) | Domain modules: Auth, Student, Faculty, Registry, Finance, Analytics |
| Messaging | Apache Kafka | grade-published, invoice-generated, attendance-marked events |
| Cache | Redis Cluster | Sessions, real-time counters, grade-release pub/sub, rate limits |
| Persistence | PostgreSQL 16 (primary + read replicas) | Multi-tenant schema; row-level isolation via tenant_id |
| File Storage | S3 / MinIO | Receipts, grade PDFs, CSV exports, curriculum attachments |
| Observability | Micrometer + Grafana + Loki | Metrics, distributed tracing (OpenTelemetry), structured logs |

### 2.3 High-Level Architecture Diagram

```
[ React SPA: Super Admin ] [ React SPA: College Admin ] [ React SPA: Faculty ] [ React SPA: Student ]
                                        ↓  HTTPS  ↓
                           [ API Gateway / Spring Cloud Gateway ]
                    JWT Validation · Tenant Context · Rate Limiting · Routing
                                        ↓  Internal  ↓
  ┌──────────────┬──────────────┬──────────────┬──────────────┬──────────────┐
  │  Auth Module │ Student Mod  │ Faculty Mod  │ Registry Mod │ Finance Mod  │
  └──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┴──────┬───────┘
         │              │         ↓ Kafka Events ↓     │              │
  ┌──────┴──────────────┴──────────────┴───────────────┴──────────────┴───────┐
  │              PostgreSQL (Multi-Tenant)  +  Redis Cluster                   │
  └────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. HLD – Role & Portal Architecture

### 3.1 Portal: Student / Parent

> Route prefix: `/portal` | Authenticated via student credentials

| Screen | Route | Key Features |
|---|---|---|
| Today | `/portal/today` | GPA, attendance %, outstanding fees, new marks, story timeline, today schedule, streak widget |
| Marks | `/portal/marks` | Semester tabs, mark sheet table (internal/external/total/grade), expandable rows, search + filter |
| Exam Schedule | `/portal/exams` | Upcoming internals & externals, date/code/subject/time/room/type, search + type filter |
| Analytics | `/portal/analytics` | Bar chart: score vs class average per subject, month-over-month growth line chart, breakdown table with delta + standing badge |
| Wallet | `/portal/wallet` | Paid this term, outstanding, next due date, saved payment method, receipts table (receipt#, description, date, method, amount, status) |

### 3.2 Portal: Faculty / Teacher

> Route prefix: `/faculty` | Authenticated via staff credentials

| Screen | Route | Key Features |
|---|---|---|
| Command Center (My Classes) | `/faculty/classes` | Sessions today, pending grading count, avg attendance, flagged students, class cards, needs-attention alerts |
| Class Detail / Roster | `/faculty/classes/:id` | Student roster with attendance %, last grade, quick-action Mark + Grade buttons, search |
| Attendance Grid | `/faculty/attendance` | Class + date selector, present/late/absent counters, last-4-sessions dot indicators per student, P/L/A toggle |
| Gradebook | `/faculty/classes/:id/gradebook` | Spreadsheet-style entry (mid/project/final/attendance/avg), standing badges (Excelling/On track/Pending), Export CSV, Submit for review |

### 3.3 Portal: College Admin / Registrar

> Route prefix: `/registry` | Authenticated via admin credentials

| Screen | Route | Key Features |
|---|---|---|
| Executive Overview | `/registry/overview` | Active enrollment, term revenue, avg attendance, faculty count, fee trend chart (12mo), compliance alerts, recent activity feed |
| Staff Room | `/registry/staff` | Faculty roster with dept/role/email/weekly load/status, search + dept/status filter, Import CSV, Add faculty |
| Curriculum Builder | `/registry/curriculum` | Drag-to-reorder subjects per program, hours per subject, multi-program cards, Add subject, Save/Discard |
| Assignments | `/registry/assignments` | Map subjects to class+year+section+staff, search + course/year filter, New assignment, Delete |
| Fee Control | `/registry/fees` | Fee templates per program, invoice table with progress/status/action, Generate invoices, Send reminders |
| Results Publishing | `/registry/results` | Result batches with entry progress bar, master toggle per batch (hold/release), Publish all complete, Preview release |

### 3.4 Portal: Super Admin / Platform Console

> Route prefix: `/platform` | Role: `superadmin` — manages all institutions

| Screen | Route | Key Features |
|---|---|---|
| Platform Console | `/platform/overview` | Active institutions, total students, MRR, uptime, revenue chart (12mo), health alerts, institutions table (slug/plan/students/staff/MRR/status/onboarded) |
| Profile | `/platform/profile` | Display name + email update, password change, role display |

---

## 4. HLD – Module Map

| Module | Backend Package | Responsibilities |
|---|---|---|
| Auth | `com.edgepoint.auth` | JWT issuance, refresh tokens, role lookup, HttpOnly cookie management, login page role picker |
| Tenant | `com.edgepoint.tenant` | Institution CRUD, plan management, onboarding flow, tenant_id context propagation |
| Student | `com.edgepoint.student` | Student profile, enrollment, today dashboard aggregation, story timeline events, streak computation |
| Marks | `com.edgepoint.marks` | Internal/external mark entry, grade calculation, semester mark sheets, mark release (triggered by Results module) |
| Exam | `com.edgepoint.exam` | Exam schedule CRUD, internal vs external classification, room assignment, date-based filtering |
| Analytics | `com.edgepoint.analytics` | Cross-subject performance aggregation, class average computation, month-over-month growth, standing classification |
| Finance | `com.edgepoint.finance` | Fee templates, invoice generation (mass), payment recording, Stripe integration, auto-retry queue, receipt PDF generation |
| Faculty | `com.edgepoint.faculty` | Staff CRUD, weekly load tracking, credential status, department management |
| Attendance | `com.edgepoint.attendance` | Session-level P/L/A recording, last-4-session history, attendance % aggregation, real-time counters (Redis) |
| Gradebook | `com.edgepoint.gradebook` | Mid/project/final entry, standing classification, CSV export, submit-for-review workflow |
| Curriculum | `com.edgepoint.curriculum` | Program–subject mapping, drag-order management, credit hours, subject CRUD |
| Results Publishing | `com.edgepoint.results` | Batch management, master toggle (hold/release), entry progress tracking, Kafka publish event on release |
| Platform | `com.edgepoint.platform` | Super-admin institution list, MRR aggregation, health alerts, audit trail, onboard institution workflow |

---

## 5. HLD – Key Data Flows

### 5.1 Grade Publishing Flow

```
1. Faculty enters marks in Gradebook → clicks "Submit for review"
2. Gradebook module sets batch entry_status = SUBMITTED in DB
3. Registrar opens Results Publishing → reviews batch (entry_progress shows 48/48)
4. Registrar toggles master_toggle ON → Results module publishes Kafka event: grade-published
5. Marks consumer receives event → sets marks.released = true for batch in DB
6. Student Portal "Today" screen shows "New Marks" badge → Story timeline adds grade event
7. Analytics module recomputes subject performance & growth percentages asynchronously
```

### 5.2 Invoice Generation & Payment Flow

```
1. Registrar selects fee template (e.g., B.Sc. CS = $4,800) → clicks "Generate invoices"
2. Finance module creates Invoice records for all enrolled students of the program in bulk
3. Kafka event: invoice-generated published → Notification service sends email to students
4. Student sees invoice in Wallet → pays via saved card (Stripe) or bank transfer
5. Payment webhook received → Invoice.paid_amount updated → Receipt PDF generated (S3)
6. Auto-retry queue (Redis) handles failed payments at 02:00 AM daily
```

### 5.3 Attendance Recording Flow

```
1. Faculty opens Attendance Grid → selects class + date
2. System pre-loads last-4-sessions per student from attendance_records table (DB + Redis cache)
3. Faculty marks P/L/A per student → real-time counters update via Redis INCR
4. "Save attendance" → batch UPSERT into attendance_records → Kafka: attendance-marked event
5. Student streak consumer recalculates consecutive full-attendance days → updates student_streaks
6. Student "Today" screen reflects updated attendance % and streak widget
```

---

## 6. HLD – Technology Stack

| Concern | Choice | Rationale |
|---|---|---|
| Frontend Framework | React 18 + TypeScript | Component reuse across 4 portals; TanStack Query for server state; Vite for dev speed |
| UI Primitives | Radix UI + Tailwind CSS | Accessible, unstyled primitives with custom token design system |
| Charts | Recharts / D3 | Bar charts (subject performance), line charts (growth, fee trend) |
| Backend | Spring Boot 3.x (Java 21) | Virtual threads for high concurrency; Spring Data JPA with `@Filter` for tenant isolation |
| API Style | REST + OpenAPI 3.1 | Well-understood by all consumers; Swagger UI for developer portal |
| Auth | Spring Security + JWT | Role-based access at method level (`@PreAuthorize`); HttpOnly cookies for SPA token storage |
| Primary DB | PostgreSQL 16 | JSONB for flexible metadata; full-text search for global search; row-level security |
| Cache / Session | Redis 7 Cluster | Sessions, real-time attendance counters, rate limiting (token bucket), pub/sub for grade release |
| Messaging | Apache Kafka | Decouples grade publishing, invoice generation, notification dispatch; at-least-once delivery |
| Payments | Stripe API | Card tokenization, webhook-based payment confirmation, saved payment methods |
| File Storage | AWS S3 / MinIO | Receipts, grade PDFs, CSV exports; pre-signed URLs for secure download |
| CI/CD | GitHub Actions + Docker | Multi-stage Docker builds; separate images per portal SPA + backend |
| Infra | Kubernetes (EKS / GKE) | HPA on API pods; separate namespace per environment (dev/staging/prod) |

---

## 7. LLD – Database Schema

> All tables include `tenant_id UUID NOT NULL` (indexed) for multi-tenant isolation. Soft deletes via `deleted_at`. All PKs are UUIDs (`gen_random_uuid()`).

### 7.1 Core Tenant & User Tables

#### `institutions` _(platform-level, no tenant_id)_

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| slug | VARCHAR(50) UNIQUE | URL identifier e.g. `stjudes` |
| name | VARCHAR | |
| plan | ENUM | `starter \| growth \| enterprise` |
| status | ENUM | `active \| auditing \| trial` |
| mrr_cents | INTEGER | Aggregated; updated via background job |
| student_count, staff_count | INTEGER | Denormalized aggregates |
| onboarded_at, created_at | TIMESTAMPTZ | |

#### `users`

| Column | Type | Notes |
|---|---|---|
| id, tenant_id | UUID | |
| email | VARCHAR | UNIQUE per tenant |
| password_hash | VARCHAR | BCrypt hash |
| role | ENUM | `superadmin \| registrar \| faculty \| student` |
| display_name, avatar_url | VARCHAR | |
| last_login_at, created_at | TIMESTAMPTZ | |

### 7.2 Academic Tables

#### `programs`

| Column | Type | Notes |
|---|---|---|
| id, tenant_id | UUID | |
| code | VARCHAR | `CS \| BIO \| ECO \| HIST` |
| name | VARCHAR | e.g. "B.Sc. Computer Science" |
| years | INTEGER | Duration of program |

#### `subjects`

| Column | Type | Notes |
|---|---|---|
| id, tenant_id, program_id | UUID, FK | |
| code, name | VARCHAR | |
| hours | INTEGER | Credit hours |
| order_index | INTEGER | For drag-reorder in curriculum builder |

#### `sections`

| Column | Type | Notes |
|---|---|---|
| id, tenant_id, program_id | UUID, FK | |
| year | INTEGER | |
| label | VARCHAR | `A \| B \| C` |

#### `assignments` _(subject–staff mapping)_

| Column | Type | Notes |
|---|---|---|
| id, tenant_id | UUID | |
| subject_id, section_id, faculty_id | UUID FK | UNIQUE(subject_id, section_id) |

#### `enrollments`

| Column | Type | Notes |
|---|---|---|
| id, tenant_id | UUID | |
| student_id, section_id | UUID FK | |
| term | VARCHAR | e.g. "2025-26" |

### 7.3 Marks & Attendance Tables

#### `marks`

| Column | Type | Notes |
|---|---|---|
| id, tenant_id | UUID | |
| student_id, assignment_id | UUID FK | |
| internal | DECIMAL | Out of 30 |
| external | DECIMAL | Out of 70 |
| total, grade | DECIMAL, VARCHAR | Computed via app logic |
| term, semester | VARCHAR | |
| released | BOOLEAN | `false` until registrar toggles |
| released_at | TIMESTAMPTZ | |

#### `gradebook_entries`

| Column | Type | Notes |
|---|---|---|
| id, tenant_id | UUID | |
| assignment_id, student_id | UUID FK | |
| mid, project, final_score, avg | DECIMAL | |
| standing | ENUM | `excelling \| on_track \| pending` |
| entry_status | ENUM | `draft \| submitted \| approved` |

#### `attendance_records`

| Column | Type | Notes |
|---|---|---|
| id, tenant_id | UUID | |
| student_id, assignment_id | UUID FK | |
| class_date | DATE | |
| status | ENUM | `P \| L \| A` |
| — | — | UNIQUE(student_id, assignment_id, class_date) |

#### `student_streaks`

| Column | Type | Notes |
|---|---|---|
| student_id | UUID PK | |
| current_streak, best_streak | INTEGER | |
| last_updated | DATE | Recomputed by Kafka consumer |

### 7.4 Finance Tables

#### `fee_templates`

| Column | Type | Notes |
|---|---|---|
| id, tenant_id, program_id | UUID, FK | |
| term | VARCHAR | e.g. "Fall 2026" |
| line_items | JSONB | `[{label:"Tuition",amount:3600}, {label:"Lab",amount:600}]` |
| total_cents | INTEGER | Denormalized sum of line_items |

#### `invoices`

| Column | Type | Notes |
|---|---|---|
| id, tenant_id | UUID | |
| student_id, template_id | UUID FK | |
| amount_cents, paid_cents | INTEGER | |
| status | ENUM | `pending \| partial \| paid \| overdue` |
| due_date | DATE | |
| overdue_retried_at | TIMESTAMPTZ | |

#### `receipts`

| Column | Type | Notes |
|---|---|---|
| id, tenant_id | UUID | |
| invoice_id, student_id | UUID FK | |
| receipt_number | VARCHAR | Format: `RC-9821` |
| description | VARCHAR | e.g. "Tuition · Installment 1" |
| amount_cents | INTEGER | |
| method | ENUM | `card \| bank_transfer \| cash` |
| payment_date | DATE | |
| status | ENUM | `paid \| pending \| failed` |
| pdf_url | VARCHAR | S3 pre-signed URL |

---

## 8. LLD – API Design

> Base URL: `/api/v1`
> Auth: `Bearer <JWT>` in `Authorization` header (also accepts HttpOnly cookie)
> Tenant: resolved from JWT claim `tenant_id`

### 8.1 Auth APIs

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | None | Role picker login; returns JWT + sets HttpOnly refresh cookie |
| POST | `/auth/refresh` | Refresh cookie | Issues new access JWT |
| POST | `/auth/logout` | JWT | Invalidates session in Redis |

### 8.2 Student Portal APIs

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/student/today` | student | Aggregated: GPA, attendance, fees, new marks, timeline events, today schedule, streak |
| GET | `/student/marks?term=&semester=` | student | Mark sheet for semester; supports multi-semester tabs |
| GET | `/student/exams` | student | Exam schedule list with search & type filter |
| GET | `/student/analytics` | student | Subject performance vs class avg, growth chart data, breakdown table |
| GET | `/student/wallet` | student | Paid this term, outstanding, next due, saved payment method, receipts list |
| GET | `/student/wallet/receipts/download` | student | S3 pre-signed URL download for all receipts ZIP |

### 8.3 Faculty Portal APIs

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/faculty/classes` | faculty | Command center: sessions today, pending grading, avg attendance, flagged students |
| GET | `/faculty/classes/:id/roster` | faculty | Student list with attendance%, last grade, paginated |
| GET | `/faculty/attendance?classId=&date=` | faculty | Load attendance grid with last-4-sessions per student |
| POST | `/faculty/attendance/save` | faculty | Batch upsert attendance records; triggers Kafka event |
| GET | `/faculty/classes/:id/gradebook` | faculty | Gradebook entries with mid/project/final/avg/standing |
| PUT | `/faculty/gradebook/:entryId` | faculty | Update a single gradebook entry (cell-level save) |
| POST | `/faculty/gradebook/:id/submit` | faculty | Submit batch for review; changes entry_status → SUBMITTED |
| GET | `/faculty/gradebook/:id/export` | faculty | Stream CSV of gradebook data |

### 8.4 Registry (Admin) APIs

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/registry/overview` | registrar | Executive overview: enrollment, revenue, attendance, faculty, chart data, compliance alerts |
| GET | `/registry/staff` | registrar | Faculty list with dept/role/load/status; filterable |
| POST | `/registry/staff` | registrar | Add new faculty member |
| POST | `/registry/staff/import` | registrar | CSV bulk import of faculty |
| GET/PUT | `/registry/curriculum` | registrar | Get / save curriculum (programs + ordered subjects) |
| GET/POST/DELETE | `/registry/assignments` | registrar | Subject–staff assignment CRUD |
| GET | `/registry/fees` | registrar | Fee templates + invoice list with filters |
| POST | `/registry/fees/generate` | registrar | Mass invoice generation from template; async Kafka trigger |
| POST | `/registry/fees/remind` | registrar | Send reminders to overdue/partial invoice holders |
| GET | `/registry/results` | registrar | Result batches with entry progress |
| PATCH | `/registry/results/:id/toggle` | registrar | Set released=true/false; triggers Kafka on release |
| POST | `/registry/results/publish-all` | registrar | Release all complete batches in one action |

### 8.5 Platform (Super Admin) APIs

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/platform/overview` | superadmin | Platform metrics: institutions, students, MRR, uptime, revenue chart, health alerts |
| GET | `/platform/institutions` | superadmin | List all institutions with plan/status/MRR/students/staff |
| POST | `/platform/institutions` | superadmin | Onboard new institution |
| GET | `/platform/export` | superadmin | Export platform snapshot CSV/PDF |

---

## 9. LLD – Module-Level Design

### 9.1 Today Dashboard Aggregator

The `/student/today` endpoint is the most read-heavy call. It is backed by a composite aggregation service:

- **GPA:** Average of `(total marks / 100)` across all released marks for current term — computed query with index on `(student_id, term, released)`
- **Attendance %:** `SELECT COUNT(*) FILTER (WHERE status='P') / COUNT(*) FROM attendance_records WHERE student_id = ? GROUP BY student_id`
- **Outstanding fees:** `SUM(amount_cents - paid_cents) FROM invoices WHERE student_id = ? AND status != 'paid'`
- **New marks:** marks released in last 24h; cached in Redis with TTL = 1h
- **Story timeline:** UNION of (marks, attendance, receipts, notices) ordered by `created_at DESC`, LIMIT 20
- **Today schedule:** assignments WHERE section matches student's enrollment AND `day_of_week = TODAY`
- **Streak:** read from `student_streaks` (written by Kafka consumer)

### 9.2 Analytics Engine

Performance computation pipeline for `/student/analytics`:

- **Subject scores:** released marks for current semester, grouped by subject → `your_score`
- **Class average:** `AVG(total) FROM marks WHERE assignment_id = ? AND released = true GROUP BY assignment_id`
- **Delta vs last exam:** `current_total - previous_total` for same subject → `+6`, `-4` etc.
- **Standing:** if `your_score > class_avg` → "Above average" else "Below average"
- **Month-over-month growth:** rolling average of total marks grouped by month; percentage delta from previous month
- **Caching:** all analytics cached in Redis with key `analytics:{tenant_id}:{student_id}` TTL = 6h; invalidated on `grade-published` Kafka event

### 9.3 Attendance Grid Service

Optimized for 48-student classes with real-time counter display:

- **Page load:** fetch last 4 sessions per student via window function `ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY class_date DESC)`
- **Real-time counters** (Present/Late/Absent): stored as Redis Hash `attendance:{classId}:{date}` → updated via `HINCRBY` on each P/L/A click
- **Save attendance:** batch UPSERT (`ON CONFLICT DO UPDATE`) into `attendance_records` → publishes `attendance-marked` Kafka event
- **"All present" / "All absent" buttons:** single API call with `[{studentId, status}...]` for entire class

### 9.4 Results Publishing & Kafka Topology

| Kafka Topic | Producer | Consumer(s) + Action |
|---|---|---|
| `grade-published` | Results module | Marks module: set `released=true` · Analytics: invalidate cache · Notification: push to student |
| `invoice-generated` | Finance module | Notification: email student · Audit: log to activity feed |
| `attendance-marked` | Attendance module | Streak consumer: recompute `student_streaks` · Analytics: update attendance % |
| `payment-received` | Stripe webhook handler | Finance: update invoice `paid_cents`, status · PDF: generate receipt · Audit: log |

---

## 10. LLD – Security Architecture

| Security Layer | Implementation Detail |
|---|---|
| **Authentication** | Spring Security + JWT. Access token TTL: 15 min. Refresh token TTL: 7 days, stored as `HttpOnly, Secure, SameSite=Strict` cookie. Refresh rotation on each use. |
| **Authorization** | `@PreAuthorize` annotations per controller method. Roles: `ROLE_SUPERADMIN`, `ROLE_REGISTRAR`, `ROLE_FACULTY`, `ROLE_STUDENT`. Method-level guards prevent cross-role data access. |
| **Multi-Tenant Isolation** | Hibernate `@Filter("tenantFilter")` applied globally — every repository query appended with `AND tenant_id = :tenantId`. Verified via integration tests with cross-tenant data isolation checks. |
| **DB Row-Level Security** | PostgreSQL RLS policies as defense-in-depth: `CREATE POLICY tenant_isolation ON institutions USING (tenant_id = current_setting('app.tenant_id')::uuid)` |
| **Rate Limiting** | Redis token bucket per IP + per user. Login endpoint: 5 attempts / 15 min. API endpoints: 200 req / min per user. |
| **Input Validation** | Bean Validation (`@NotNull`, `@Size`, `@Email`) on all DTOs. SQL injection prevented via parameterized JPQL queries. XSS: React's default escaping + CSP headers. |
| **Payment Security** | PCI-DSS: card data never touches EdgePoint servers. Stripe.js tokenizes card client-side. Webhook signature verification (HMAC-SHA256) on all Stripe events. |
| **Data in Transit** | TLS 1.3 enforced at load balancer. HSTS header. Internal service-to-service: mTLS within Kubernetes cluster. |
| **Audit Trail** | `audit_logs` table: captures actor, action, entity_type, entity_id, old_value, new_value, timestamp. Populated via Spring AOP `@AfterReturning` on all write operations. |
| **FERPA Compliance** | Student academic records isolated by `tenant + student_id`. Faculty can only view students in their assigned sections. |

---

## 11. LLD – Non-Functional Design

| NFR | Target | Implementation |
|---|---|---|
| **Availability** | 99.9% SLA | Multi-AZ PostgreSQL + Redis. Kubernetes pod anti-affinity. Health probes + rolling deploys. |
| **Performance** | p95 < 200ms API | Read replicas for analytics queries. Redis caching for today/analytics endpoints. DB indexes on `tenant_id` + FK combos. |
| **Scalability** | 42k+ students | HPA on API pods (CPU > 70%). Kafka partitioning per tenant. Connection pooling (HikariCP). Stateless API layer. |
| **Observability** | Full tracing | OpenTelemetry traces exported to Jaeger. Micrometer metrics to Prometheus + Grafana dashboards. Structured JSON logs via Loki. |
| **Search** | < 100ms global search | PostgreSQL full-text search (`tsvector`) on students/invoices/people. GIN index. Debounced 300ms from UI. |
| **Data Retention** | 7 years academic | Soft deletes (`deleted_at`). Archived records in separate schema after 3 years. S3 lifecycle policies for receipt PDFs. |
| **Backup** | RPO < 1h, RTO < 4h | Continuous WAL archiving to S3. Daily `pg_dump` snapshots. Redis AOF persistence. |

---

## 12. Deployment & Infrastructure

### 12.1 Container Strategy

| Container | Contents |
|---|---|
| `edgepoint-api` | Spring Boot fat JAR (Java 21 + virtual threads). Multi-stage build: build in Maven, run in distroless JRE. |
| `edgepoint-web-student` | Vite-built React SPA served by Nginx. Student + Parent portal. |
| `edgepoint-web-faculty` | Vite-built React SPA. Faculty portal. |
| `edgepoint-web-admin` | Vite-built React SPA. College Admin (Registry) portal. |
| `edgepoint-web-platform` | Vite-built React SPA. Super Admin platform console. |

### 12.2 Kubernetes Workloads

| Workload | Replicas | Notes |
|---|---|---|
| `api-deployment` | 3–10 (HPA) | CPU threshold 70%; liveness `/actuator/health`; readiness `/actuator/ready` |
| `web-*` (4 SPAs) | 2 each | Nginx static serving; CloudFront CDN in front |
| `postgresql` | 1 primary + 2 replicas | Patroni HA; replicas for read-only analytics queries |
| `redis-cluster` | 6 nodes (3+3) | Cluster mode; session data + rate limiting + pub/sub |
| `kafka` | 3 brokers | KRaft mode (no Zookeeper); 4 partitions per topic; retention 7d |

### 12.3 CI/CD Pipeline

- **PR:** GitHub Actions → lint (ESLint + Checkstyle) → unit tests → integration tests (Testcontainers) → OWASP Dependency Check
- **Merge to main:** Docker build + push to ECR/GCR → `helm upgrade --install` to staging namespace
- **Manual gate:** promote to production with blue/green switchover via Nginx upstream swap
- **DB migrations:** managed by Flyway; run as Kubernetes Job before API deployment

### 12.4 Compliance Posture

| Standard | Implementation |
|---|---|
| **SOC 2 Type II** | Audit logging, access controls, encryption at rest (AES-256) and in transit (TLS 1.3) |
| **FERPA** | Student data isolated by `tenant + student_id`; access controls enforced at API and DB layer |
| **ISO 27001** | Information security management via access review, vulnerability scanning, incident response runbook |
| **GDPR-ready** | Data export API (student's own data), right-to-erasure via soft delete + anonymization job |

---

*EdgePoint System Design Document · v1.0 · May 2026 · Confidential*