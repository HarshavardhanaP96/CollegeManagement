# College Management System (EdgePoint) - Project Structure

**Backend:** Spring Boot 3.5.8, Java 17, Maven
**Frontend:** React 19 (Vite) with TypeScript
**State Management:** Zustand
**Data Fetching:** TanStack Query v5 + TanStack Table v8
**Validation:** Zod + React Hook Form
**Database:** PostgreSQL, migrated via Flyway

> This doc reflects the actual source tree. Regenerate the listings below (`find backend/src/main/java -name '*.java'`, `find frontend/src -type f`) if they drift again.

---

## Backend — feature-first packages under `com.edgepoint`

Each feature package is a vertical slice with its own `controller/`, `domain/`, `dto/`, `repository/`,
`service/` (no shared layer-wide packages except `core`).

```
backend/src/main/java/com/edgepoint/
├── ProductionApplication.java        # main entry point
├── config/
│   └── WebSecurityConfig.java
├── core/                             # shared: auth, tenancy, shared entities, error handling
│   ├── controller/CollegeController.java
│   ├── domain/{AuditableEntity,College,User,UserRole}.java
│   ├── dto/                          # auth + college request/response DTOs
│   ├── exception/                    # GlobalExceptionHandler + custom exceptions
│   ├── repository/{CollegeRepository,UserRepository,UserRoleRepository,SoftDeleteRepository}.java
│   ├── security/
│   │   ├── AuthController.java, AuthService(Impl).java
│   │   ├── JwtService.java, JwtAuthenticationFilter.java
│   │   ├── TenantContext.java
│   │   └── crypto/EncryptedStringConverter.java   # AES-256-GCM AttributeConverter for secret columns
│   └── service/CollegeService(Impl).java
├── academic/                         # departments, courses, subjects, classes, marks
│   ├── controller/{ClassController,CourseController,DepartmentController,MarkController,
│   │                StudentMarkController,SubjectController}.java
│   ├── domain/{AcademicClass,ClassSubject,Course,Department,ExamType,Mark,
│   │            StudentEnrollment,Subject,TeacherAssignment}.java
│   ├── dto/                          # create/update/response DTOs per entity
│   ├── repository/                   # + repository/projection/StudentMarkProjection.java
│   └── service/                      # {X}Service + {X}ServiceImpl per entity
├── attendance/
│   ├── controller/{AttendanceController,StudentAttendanceController}.java
│   ├── domain/AttendanceRecord.java
│   ├── dto/
│   ├── repository/ (+ projection/AttendanceProjection.java)
│   └── service/{AttendanceService(Impl),StudentAttendanceService(Impl)}.java
├── student/
│   ├── controller/{StudentDashboardController,StudentManagementController,StudentProfileController}.java
│   ├── domain/StudentProfile.java
│   ├── dto/
│   ├── repository/StudentProfileRepository.java
│   └── service/{StudentDashBoardService(Impl),StudentManagementService(Impl),StudentProfileService(Impl)}.java
├── teacher/
│   ├── controller/{TeacherDashboardController,TeacherManagementController}.java
│   ├── domain/TeacherProfile.java
│   ├── dto/
│   ├── repository/TeacherProfileRepository.java
│   └── service/{TeacherDashboardService(Impl),TeacherManagementService(Impl)}.java
└── notification/                     # per-college SMTP + WhatsApp Cloud API config (in progress)
    ├── controller/NotificationConfigController.java
    ├── domain/NotificationConfig.java        # secrets encrypted via EncryptedStringConverter
    ├── dto/{NotificationConfigDto,NotificationConfigRequest}.java
    ├── repository/NotificationConfigRepository.java
    └── service/NotificationConfigService.java
```

### Resources
```
backend/src/main/resources/
├── application.yml            # active config: datasource, JPA, flyway, redis, kafka, jwt, stripe, encryption-key
├── application-dev.yml
├── logback-spring.xml
└── db/
    ├── migration/              # Flyway SQL migrations — INCREMENTAL changes only, on top of the baseline below
    │   └── V1__init_notification.sql
    └── changelog/               # unused Liquibase leftover from an earlier iteration (empty, not wired up)
```

`backend/src/main/resources/application.properties` (a pre-Maven-migration leftover) was **removed** — it
silently took precedence over `application.yml` and pointed the datasource at a nonexistent
`college_management` database while re-enabling the empty Liquibase changelog above, so the app failed to
start against the real `edgepoint` database. If a `.properties` file reappears here alongside
`application.yml`, treat it as a bug, not an intentional override.

### Baseline schema vs. Flyway
Hibernate runs with `ddl-auto: validate` — it never creates tables. The **baseline** schema (colleges,
users, departments, courses, attendance, marks, …) lives in `docker/postgres/init-db.sql` and is applied
once, outside of Flyway, when the Postgres container first initializes (`docker-entrypoint-initdb.d`).
Flyway (`db/migration/V*.sql`) only carries *incremental* changes on top of that baseline (currently just
`notification_configs`). `docker/postgres/init-db.sql` also seeds one demo college and one user per role
(`admin` / `cadmin` / `hod_cse` / `teacher1` / `student1`, password `password123` for all) — useful for
local login/visual testing.

### Tests
```
backend/src/test/java/com/edgepoint/
├── ProductionApplicationTests.java
├── academic/service/MarkServiceTest.java
├── attendance/repository/AttendanceRepositoyTest.java
├── config/                     # IntegrationTestBase, TestConfig, TestDataBuilder, @WithMockCustomUser, ...
├── core/{controller,repository,security,service}/...Test.java
└── integration/{api,repository}/...IntegrationTest.java
```

---

## Frontend — `frontend/src`

```
frontend/src/
├── App.tsx, main.tsx, index.css, App.css
├── api/                         # axios client + one module per resource
│   ├── client.ts, index.ts
│   └── {assignment,attendance,auth,class,college,course,dashboard,department,
│          enrollment,institution,marks,notificationConfig,student,subject,teacher}.ts
├── components/
│   ├── common/                  # shared UI kit: Button, Card, DataTable, Modal, Select, Table,
│   │                             #   ErrorBoundary, ProtectedRoute, FormPageLayout, table-toolbar, ui-kit
│   ├── layout/                  # MainLayout, Sidebar, Header, Breadcrumb, navIconMap
│   └── edgepoint/                # role portals + shared EdgePoint UI
│       ├── EdgePointApp.tsx, SidebarLayout.tsx, TopBar.tsx, SuperAdminPortal.tsx, RegistryPortal.tsx
│       ├── NotificationConfigPanel.tsx
│       ├── faculty/{FacultyAttendance,FacultyClassDetail,FacultyCommandCenter,FacultyGradebook,FacultyPortal}.tsx
│       └── student/{StudentAnalytics,StudentExams,StudentMarks,StudentPortal,StudentToday,StudentWallet}.tsx
├── pages/
│   ├── {LoginPage,DashboardPage,AnalyticsPage,NotFoundPage}.tsx
│   ├── superadmin/{CollegeCreatePage,CollegeListPage}.tsx
│   ├── collegeadmin/{CourseCreatePage,CourseListPage,DepartmentCreatePage,DepartmentListPage}.tsx
│   ├── hod/{ClassCreatePage,ClassListPage,StudentCreatePage,StudentListPage,
│   │         SubjectCreatePage,SubjectListPage,TeacherCreatePage,TeacherListPage}.tsx
│   ├── teacher/{TeacherAttendancePage,TeacherMarksPage}.tsx
│   └── student/{StudentAttendancePage,StudentMarksPage,StudentProfilePage}.tsx
├── routes/index.tsx
├── store/authStore.ts            # Zustand
├── strategies/roleStrategy.ts    # role-based nav/permission strategy
└── lib/{mock-data,session}.ts
```

---

## Environment Variables

Actual variables read by `backend/src/main/resources/application.yml` (defaults shown are dev-only):

```
JWT_SECRET               # HS256 signing key for JWTs
ENCRYPTION_KEY            # base64 AES-256 key for encrypting secret DB columns (notification config, etc.)
STRIPE_API_KEY
STRIPE_WEBHOOK_SECRET
```

Datasource, Redis, and Kafka connection settings are currently hardcoded to localhost defaults in
`application.yml` rather than externalized via env vars — override per-environment via Spring profiles
or `SPRING_*` property overrides if deploying outside local dev.

### Frontend (`.env`)
```
VITE_API_BASE_URL        # read in frontend/src/api/client.ts; defaults to http://localhost:8080/api/v1
```

---

**End of Project Structure Document**
