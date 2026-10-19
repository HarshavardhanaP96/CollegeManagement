/**
 * Query Strategy — single source of truth for every TanStack Query key used
 * in the app.
 *
 * Why this exists: before this file, every page wrote its own inline key
 * (`queryKey: ['courses']`), and every mutation wrote its own inline
 * invalidation target (`invalidateQueries({ queryKey: ['courses'] })`).
 * Nothing checked that the two matched, so a typo in either one silently
 * breaks cache invalidation (a mutation succeeds but the list page never
 * refetches). Centralizing the keys here makes that class of bug a
 * TypeScript error instead of a runtime surprise, and gives every resource
 * a predictable shape to extend.
 *
 * Convention (matches TanStack Query's recommended key-factory pattern):
 *   - `resource.all`            → the broad key. Use for the unfiltered list
 *                                  fetch AND as the invalidation target after
 *                                  create/update/delete (TanStack matches by
 *                                  prefix, so invalidating `.all` also
 *                                  invalidates any parameterized query below).
 *   - `resource.bySomething(x)` → a specific parameterized fetch (pagination,
 *                                  a semester, a date, an assignment id...).
 *
 * When you add a new resource or a new parameterized query, add it here
 * rather than inlining an array literal in the page.
 */

export const queryKeys = {
  colleges: {
    all: ['colleges'] as const,
    byId: (id: number) => ['colleges', id] as const,
  },
  notificationConfig: {
    byCollege: (collegeId: number) => ['notification-config', collegeId] as const,
  },
  notificationChannelRules: {
    byCollege: (collegeId: number) => ['notification-channel-rules', collegeId] as const,
  },
  auditLog: {
    all: ['audit-log'] as const,
    list: (filters: object) => ['audit-log', filters] as const,
  },
  departments: {
    all: ['departments'] as const,
    byId: (id: number) => ['departments', id] as const,
  },
  courses: {
    all: ['courses'] as const,
    byId: (id: number) => ['courses', id] as const,
  },
  subjects: {
    all: ['subjects'] as const,
    byId: (id: number) => ['subjects', id] as const,
  },
  students: {
    all: ['students'] as const,
    byId: (id: number) => ['students', id] as const,
  },
  teachers: {
    all: ['teachers'] as const,
    byId: (id: number) => ['teachers', id] as const,
  },
  classes: {
    all: ['classes'] as const,
    byId: (id: number) => ['classes', id] as const,
  },

  teacherAssignments: { all: ['teacher-assignments'] as const },

  classSubjects: {
    byClass: (classId: number) => ['class-subjects', classId] as const,
  },
  classAssignments: {
    byClass: (classId: number) => ['class-assignments', classId] as const,
  },
  enrollments: {
    byClass: (classId: number) => ['enrollments', classId] as const,
  },
  examTypes: {
    all: ['exam-types'] as const,
  },
  roster: {
    marks: (assignmentId?: number) => ['roster', 'marks', assignmentId] as const,
    attendance: (assignmentId?: number) => ['roster', 'attendance', assignmentId] as const,
  },

  appInfo: { all: ['app-info'] as const },

  studentProfile: { all: ['student-profile'] as const },

  studentMarks: {
    all: ['student-marks'] as const,
    bySemester: (semester?: number) => ['student-marks', semester] as const,
  },
  studentAttendance: {
    all: ['student-attendance'] as const,
    bySemester: (semester?: number) => ['student-attendance', semester] as const,
  },
  attendance: {
    all: ['attendance'] as const,
    byAssignment: (assignmentId?: number, date?: string) =>
      ['attendance', assignmentId, date] as const,
  },
  marks: {
    all: ['marks'] as const,
    byAssignment: (assignmentId?: number, examTypeId?: number) =>
      ['marks', assignmentId, examTypeId] as const,
  },

  // Dashboard stat cards (roleStrategy.ts `dashboardCards[].queryKey`). Each stat needs its own
  // key even when two cards call the same underlying endpoint (e.g. getTeacherDashboard() for
  // both "Total Assignments" and "My Students") — TanStack Query caches by key, so two cards
  // sharing one literal key silently share one cached value instead of each running its own
  // fetchFn. That exact collision existed here before (`['teacher-dashboard']` used twice) and
  // made the second stat card silently display the first card's number.
  dashboardStats: {
    collegesCount: ['dashboard', 'colleges-count'] as const,
    departmentsCount: ['dashboard', 'departments-count'] as const,
    studentsCount: ['dashboard', 'students-count'] as const,
    teacherAssignmentsCount: ['dashboard', 'teacher-assignments-count'] as const,
    teacherStudentsCount: ['dashboard', 'teacher-students-count'] as const,
    studentSummary: ['dashboard', 'student-summary'] as const,
  },

  // AnalyticsPage pulls the full unfiltered set of several resources for
  // client-side aggregation — kept as distinct keys (rather than reusing
  // e.g. `courses.all`) since it may later fetch a heavier/differently
  // shaped payload than the paginated list pages do.
  analytics: {
    colleges: ['analytics', 'colleges'] as const,
    departments: ['analytics', 'departments'] as const,
    courses: ['analytics', 'courses'] as const,
    teachers: ['analytics', 'teachers'] as const,
    students: ['analytics', 'students'] as const,
    subjects: ['analytics', 'subjects'] as const,
    classes: ['analytics', 'classes'] as const,
  },
  privacy: {
    notice: ['privacy', 'notice'] as const,
    myRequests: ['privacy', 'requests', 'me'] as const,
    myRequest: (id: number) => ['privacy', 'requests', 'me', id] as const,
    adminRequests: (filters: object) => ['privacy', 'admin', 'requests', filters] as const,
    adminRequest: (id: number) => ['privacy', 'admin', 'requests', id] as const,
    notices: ['privacy', 'admin', 'notices'] as const,
    policies: ['privacy', 'admin', 'policies'] as const,
    runs: ['privacy', 'admin', 'runs'] as const,
    audit: (page: number) => ['privacy', 'admin', 'audit', page] as const,
  },
} as const;
