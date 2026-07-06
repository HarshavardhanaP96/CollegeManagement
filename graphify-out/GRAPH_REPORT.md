# Graph Report - CollegeManagement  (2026-06-01)

## Corpus Check
- 152 files · ~33,751 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 696 nodes · 966 edges · 113 communities (97 shown, 16 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 40 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c8f19c7d`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 12|Community 12]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 81|Community 81]]

## God Nodes (most connected - your core abstractions)
1. `useAuthStore` - 32 edges
2. `compilerOptions` - 20 edges
3. `compilerOptions` - 18 edges
4. `apiClient` - 16 edges
5. `ApiResponse` - 13 edges
6. `clsx` - 12 edges
7. `getErrorMessage()` - 12 edges
8. `Badge()` - 12 edges
9. `Test Cases for Auth APIs` - 12 edges
10. `build` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Modal()` --calls--> `clsx`  [INFERRED]
  frontend/src/components/common/Modal.tsx → frontend/package.json
- `Card()` --calls--> `clsx`  [INFERRED]
  frontend/src/components/common/Card.tsx → frontend/package.json
- `FormPageLayout()` --calls--> `clsx`  [INFERRED]
  frontend/src/components/common/FormPageLayout.tsx → frontend/package.json
- `Breadcrumbs()` --calls--> `clsx`  [INFERRED]
  frontend/src/components/common/Breadcrumbs.tsx → frontend/package.json
- `Loading()` --calls--> `clsx`  [INFERRED]
  frontend/src/components/common/Loading.tsx → frontend/package.json

## Communities (113 total, 16 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (26): Badge(), BadgeProps, Icons, NavItem(), NavItemProps, NotificationConfigPanel(), SectionLabel(), SectionLabelProps (+18 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (29): BreadcrumbItem, Breadcrumbs(), BreadcrumbsProps, Button, ButtonProps, Card(), CardProps, DataTableProps (+21 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (36): dependencies, axios, @hookform/resolvers, lucide-react, react, react-dom, react-hook-form, react-router-dom (+28 more)

### Community 3 - "Community 3"
Cohesion: 0.08
Nodes (9): WebSecurityConfig, JwtAuthFilter, build, OncePerRequestFilter, JwtAuthFilter, JwtService, WebSecurityConfig, JwtService (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.08
Nodes (25): API Contract Testing, AuthController Tests:, AuthService Tests:, CI/CD Integration, Edge Cases:, Get Current User Endpoint (/api/v1/auth/me), Integration Test Cases, Integration Tests: (+17 more)

### Community 5 - "Community 5"
Cohesion: 0.18
Nodes (8): getErrorMessage(), ClassCreatePage(), CreateClassForm, createClassSchema, ClassListPage(), StudentListPage(), TeacherAttendancePage(), TeacherMarksPage()

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (21): Assignment, ASSIGNMENTS, ATTENDANCE_STUDENTS, COURSES, EXAM_SCHEDULE, FEE_TEMPLATES, GRADEBOOK, INVOICES (+13 more)

### Community 7 - "Community 7"
Cohesion: 0.09
Nodes (21): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, jsx, lib, module, moduleDetection, moduleResolution (+13 more)

### Community 8 - "Community 8"
Cohesion: 0.12
Nodes (14): CollegeCreateRequest, CollegeDetail, CollegeDetailResponse, CollegeListItem, CollegeResponse, CollegeUpdateRequest, createCollege(), getColleges() (+6 more)

### Community 9 - "Community 9"
Cohesion: 0.10
Nodes (19): compilerOptions, allowImportingTsExtensions, erasableSyntaxOnly, lib, module, moduleDetection, moduleResolution, noEmit (+11 more)

### Community 10 - "Community 10"
Cohesion: 0.22
Nodes (5): AttendanceCreateRequest, AttendanceRecord, AttendanceResponse, AttendanceSummary, AttendanceUpdateRequest

### Community 11 - "Community 11"
Cohesion: 0.07
Nodes (32): AuthUser, login(), LoginRequest, LoginResponse, getStudentDashboard(), StudentDashboardDto, StudentDto, ProtectedRoute() (+24 more)

### Community 12 - "Community 12"
Cohesion: 0.14
Nodes (10): AssignHODRequest, createDepartment(), DepartmentCreateRequest, DepartmentResponse, DepartmentUpdateRequest, getDepartments(), CreateDeptForm, createDeptSchema (+2 more)

### Community 13 - "Community 13"
Cohesion: 0.16
Nodes (8): CourseCreateRequest, CourseResponse, CourseUpdateRequest, getCourses(), CourseListPage(), CreateStudentForm, createStudentSchema, StudentCreatePage()

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (9): createTeacher(), getTeachers(), TeacherCreateRequest, TeacherResponse, TeacherUpdateRequest, CreateTeacherForm, createTeacherSchema, TeacherCreatePage() (+1 more)

### Community 15 - "Community 15"
Cohesion: 0.08
Nodes (19): AnalyticsControllerIntegrationTest, Header(), MainLayout(), MainLayoutProps, ICONS, NavIcon(), ROLE_ICON, Sidebar() (+11 more)

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (5): MarkCreateRequest, MarkEntry, MarkResponse, MarksSummary, MarkUpdateRequest

### Community 18 - "Community 18"
Cohesion: 0.21
Nodes (7): getMyAttendance(), getMyMarks(), NotFoundPage(), RoleGate(), routeComponentMap, StudentAttendancePage(), StudentMarksPage()

### Community 19 - "Community 19"
Cohesion: 0.16
Nodes (8): apiClient, ApiErrorPayload, refreshToken, token, StudentDashboardData, TeacherDashboardData, getInstitutions(), InstitutionDto

### Community 20 - "Community 20"
Cohesion: 0.48
Nodes (5): getNotificationConfig(), NotificationConfigDto, NotificationConfigRequest, updateNotificationConfig(), Props

### Community 23 - "Community 23"
Cohesion: 0.25
Nodes (4): AddSubjectToClassRequest, ClassCreateRequest, ClassResponse, getClasses()

### Community 24 - "Community 24"
Cohesion: 0.18
Nodes (7): createSubject(), SubjectCreateRequest, SubjectResponse, SubjectUpdateRequest, CreateSubjectForm, createSubjectSchema, SubjectCreatePage()

### Community 28 - "Community 28"
Cohesion: 0.33
Nodes (5): code:js (export default defineConfig([), code:js (// eslint.config.js), Expanding the ESLint configuration, React Compiler, React + TypeScript + Vite

### Community 29 - "Community 29"
Cohesion: 0.40
Nodes (4): createCourse(), CourseCreatePage(), CreateCourseForm, createCourseSchema

### Community 31 - "Community 31"
Cohesion: 0.40
Nodes (4): Additional Links, Getting Started, Guides, Reference Documentation

### Community 33 - "Community 33"
Cohesion: 0.33
Nodes (3): ApiResponse, EnrollmentRequest, EnrollmentResponse

### Community 35 - "Community 35"
Cohesion: 0.13
Nodes (6): NotificationConfigController, error(), success(), GlobalExceptionHandler, NotificationConfigRepository, NotificationConfigService

### Community 36 - "Community 36"
Cohesion: 0.29
Nodes (5): getSubjects(), SubjectListPage(), AnalyticsPage(), STAT_BORDER, STAT_DOT

### Community 38 - "Community 38"
Cohesion: 0.50
Nodes (3): Select, SelectOption, SelectProps

## Knowledge Gaps
- **232 isolated node(s):** `files`, `references`, `tsBuildInfoFile`, `target`, `useDefineForClassFields` (+227 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `clsx` connect `Community 1` to `Community 2`?**
  _High betweenness centrality (0.149) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Community 2` to `Community 1`?**
  _High betweenness centrality (0.124) - this node is a cross-community bridge._
- **Why does `useAuthStore` connect `Community 11` to `Community 0`, `Community 18`, `Community 15`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **What connects `files`, `references`, `tsBuildInfoFile` to the rest of the system?**
  _232 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.0889894419306184 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.06025369978858351 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05405405405405406 - nodes in this community are weakly interconnected._