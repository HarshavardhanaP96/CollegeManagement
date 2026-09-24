/**
 * Role Strategy Pattern
 * 
 * Each RoleStrategy defines:
 *  - navItems:       sidebar links visible to the role
 *  - dashboardCards: what cards to show on the dashboard
 *  - homeRedirect:   where to go after login
 * 
 * To add a new role:
 *  1. Create a new strategy in strategies/
 *  2. Register it in the registry below
 *  3. Done — sidebar, dashboard, and routing will pick it up automatically
 */

import {
  getColleges,
  getDepartments,
  getTeacherDashboard,
  getStudentDashboard,
  getStudents
} from '../api';
import { queryKeys } from '../api/queryKeys';

// ===== Types =====

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon?: string; // key into components/layout/navIconMap.tsx
  group?: string;
}

export type Action = 'create' | 'read' | 'update' | 'delete';
export type Resource =
  | 'colleges'
  | 'departments'
  | 'courses'
  | 'subjects'
  | 'students'
  | 'teachers'
  | 'classes'
  | 'attendance'
  | 'marks'
  | 'examTypes'
  | 'profile'
  | 'support';

export interface DashboardCard {
  key: string;
  title: string;
  type: 'stat' | 'quick-action' | 'chart';
  queryKey?: readonly string[];
  // for stat cards
  fetchFn?: () => Promise<{ label: string; value: string | number }>;
  // For quick-action
  actions?: { label: string; path: string; icon?: string }[];
}

export interface RoleStrategy {
  roleName: string;
  displayName: string;
  navItems: NavItem[];
  dashboardCards: DashboardCard[];
  homeRedirect: string;
  permissions: Partial<Record<Resource, Action[]>>;
}

// ===== Individual Strategies =====

const ALL_ACTIONS: Action[] = ['create', 'read', 'update', 'delete'];

const superAdminStrategy: RoleStrategy = {
  roleName: 'SUPERADMIN',
  displayName: 'Super Admin',
  navItems: [
    { key: 'dashboard',     label: 'Dashboard',     path: '/',                   icon: 'dashboard', group: 'Main' },
    { key: 'analytics',     label: 'Intelligence',  path: '/analytics',          icon: 'analytics', group: 'Main' },
    { key: 'colleges',      label: 'Colleges',      path: '/colleges',           icon: 'colleges', group: 'Management' },
    { key: 'departments',   label: 'Departments',   path: '/departments',        icon: 'departments', group: 'Management' },
    { key: 'courses',       label: 'Courses',       path: '/courses',            icon: 'courses', group: 'Management' },
    { key: 'subjects',      label: 'Subjects',      path: '/subjects',           icon: 'subjects', group: 'Academic' },
    { key: 'students',      label: 'Students',      path: '/students',           icon: 'students', group: 'Academic' },
    { key: 'teachers',      label: 'Teachers',      path: '/teachers',           icon: 'teachers', group: 'Academic' },
    { key: 'classes',       label: 'Classes',       path: '/classes',            icon: 'classes', group: 'Academic' },
    { key: 'attendance',    label: 'Attendance',     path: '/attendance',         icon: 'attendance', group: 'Operations' },
    { key: 'marks',         label: 'Marks',          path: '/marks',             icon: 'marks', group: 'Operations' },
    { key: 'examTypes',     label: 'Exam Types',     path: '/exam-types',        icon: 'examTypes', group: 'Operations' },
    { key: 'support',       label: 'Support',        path: '/support',           icon: 'support', group: 'Support' },
  ],
  permissions: {
    colleges: ALL_ACTIONS,
    departments: ALL_ACTIONS,
    courses: ALL_ACTIONS,
    subjects: ALL_ACTIONS,
    students: ALL_ACTIONS,
    teachers: ALL_ACTIONS,
    classes: ALL_ACTIONS,
    attendance: ALL_ACTIONS,
    marks: ALL_ACTIONS,
    examTypes: ALL_ACTIONS,
    profile: ALL_ACTIONS,
    support: ['create', 'read'],
  },
  dashboardCards: [
    {
      key: 'stat-colleges',
      title: 'Total Colleges',
      type: 'stat',
      queryKey: queryKeys.dashboardStats.collegesCount,
      fetchFn: async () => {
        const res = await getColleges({ size: 1 });
        return { label: 'Colleges', value: res.data.pageable.totalElements || 0 };
      }
    },
    {
      key: 'stat-departments',
      title: 'Total Departments',
      type: 'stat',
      queryKey: queryKeys.dashboardStats.departmentsCount,
      fetchFn: async () => {
        const res = await getDepartments();
        return { label: 'Departments', value: res.data.length || 0 };
      }
    },
    {
      key: 'quick-actions',
      title: 'Quick Actions',
      type: 'quick-action',
      actions: [
        { label: 'Register College', path: '/colleges/new', icon: 'plus' },
        { label: 'Manage Colleges', path: '/colleges', icon: 'colleges' },
        { label: 'System Overview', path: '/', icon: 'dashboard' },
      ],
    },
  ],
  homeRedirect: '/',
};

const collegeAdminStrategy: RoleStrategy = {
  roleName: 'COLLEGEADMIN',
  displayName: 'College Admin',
  navItems: [
    { key: 'dashboard',     label: 'Dashboard',     path: '/',              icon: 'dashboard', group: 'Main' },
    { key: 'analytics',     label: 'Intelligence',  path: '/analytics',     icon: 'analytics', group: 'Main' },
    { key: 'departments',   label: 'Departments',   path: '/departments',   icon: 'departments', group: 'Management' },
    { key: 'courses',       label: 'Courses',       path: '/courses',       icon: 'courses', group: 'Management' },
    { key: 'subjects',      label: 'Subjects',      path: '/subjects',      icon: 'subjects', group: 'Academic' },
    { key: 'students',      label: 'Students',      path: '/students',      icon: 'students', group: 'Academic' },
    { key: 'teachers',      label: 'Teachers',      path: '/teachers',      icon: 'teachers', group: 'Academic' },
    { key: 'classes',       label: 'Classes',       path: '/classes',       icon: 'classes', group: 'Academic' },
    { key: 'examTypes',     label: 'Exam Types',    path: '/exam-types',    icon: 'examTypes', group: 'Operations' },
    { key: 'support',       label: 'Support',       path: '/support',       icon: 'support', group: 'Support' },
  ],
  permissions: {
    departments: ALL_ACTIONS,
    courses: ALL_ACTIONS,
    subjects: ALL_ACTIONS,
    students: ALL_ACTIONS,
    teachers: ALL_ACTIONS,
    classes: ALL_ACTIONS,
    attendance: ALL_ACTIONS,
    marks: ALL_ACTIONS,
    examTypes: ALL_ACTIONS,
    profile: ALL_ACTIONS,
    support: ['create', 'read'],
  },
  dashboardCards: [
    {
      key: 'stat-students',
      title: 'Total Students',
      type: 'stat',
      queryKey: queryKeys.dashboardStats.studentsCount,
      fetchFn: async () => {
        const res = await getStudents();
        return { label: 'Students', value: res.data.length || 0 };
      }
    },
    {
      key: 'quick-actions',
      title: 'Quick Actions',
      type: 'quick-action',
      actions: [
        { label: 'Establish Dept', path: '/departments/new', icon: 'departments' },
        { label: 'Formulate Course', path: '/courses/new', icon: 'courses' },
        { label: 'Enroll Student', path: '/students/new', icon: 'students' },
      ],
    },
  ],
  homeRedirect: '/',
};

const hodStrategy: RoleStrategy = {
  roleName: 'HOD',
  displayName: 'Head of Department',
  navItems: [
    { key: 'dashboard',   label: 'Dashboard',  path: '/',            icon: 'dashboard', group: 'Main' },
    { key: 'analytics',   label: 'Analytics',  path: '/analytics',   icon: 'analytics', group: 'Main' },
    { key: 'subjects',    label: 'Subjects',    path: '/subjects',    icon: 'subjects', group: 'Department' },
    { key: 'students',    label: 'Students',    path: '/students',    icon: 'students', group: 'Department' },
    { key: 'teachers',    label: 'Teachers',    path: '/teachers',    icon: 'teachers', group: 'Department' },
    { key: 'classes',     label: 'Classes',     path: '/classes',     icon: 'classes', group: 'Department' },
    { key: 'support',     label: 'Support',     path: '/support',     icon: 'support', group: 'Support' },
  ],
  permissions: {
    subjects: ALL_ACTIONS,
    students: ALL_ACTIONS,
    teachers: ALL_ACTIONS,
    classes: ALL_ACTIONS,
    attendance: ALL_ACTIONS,
    marks: ALL_ACTIONS,
    departments: ['read'],
    // Read-only: HOD reads the course catalog to link a new class to a program
    // (see ClassCreatePage) — matches CourseController's @PreAuthorize on GET.
    courses: ['read'],
    examTypes: ['read'],
    profile: ALL_ACTIONS,
    support: ['create', 'read'],
  },
  dashboardCards: [
    {
      key: 'quick-actions',
      title: 'Quick Actions',
      type: 'quick-action',
      actions: [
        { label: 'Enroll Student', path: '/students/new', icon: 'students' },
        { label: 'Onboard Faculty', path: '/teachers/new', icon: 'teachers' },
        { label: 'Instantiate Class', path: '/classes/new', icon: 'classes' },
      ],
    },
  ],
  homeRedirect: '/',
};

const teacherStrategy: RoleStrategy = {
  roleName: 'TEACHER',
  displayName: 'Teacher',
  navItems: [
    { key: 'dashboard',   label: 'Dashboard',   path: '/',             icon: 'dashboard', group: 'Main' },
    { key: 'attendance',  label: 'Attendance',   path: '/attendance',   icon: 'attendance', group: 'My Work' },
    { key: 'marks',       label: 'Marks',        path: '/marks',        icon: 'marks', group: 'My Work' },
    { key: 'support',     label: 'Support',      path: '/support',      icon: 'support', group: 'Support' },
  ],
  permissions: {
    attendance: ALL_ACTIONS,
    marks: ALL_ACTIONS,
    students: ['read'],
    subjects: ['read'],
    classes: ['read'],
    examTypes: ['read'],
    profile: ALL_ACTIONS,
    support: ['create', 'read'],
  },
  dashboardCards: [
    {
      key: 'stat-assignments',
      title: 'Total Assignments',
      type: 'stat',
      queryKey: queryKeys.dashboardStats.teacherAssignmentsCount,
      fetchFn: async () => {
        const res = await getTeacherDashboard();
        return { label: 'Assignments', value: res.data.totalAssignments };
      }
    },
    {
      key: 'stat-students',
      title: 'My Students',
      type: 'stat',
      queryKey: queryKeys.dashboardStats.teacherStudentsCount,
      fetchFn: async () => {
        const res = await getTeacherDashboard();
        return { label: 'Students', value: res.data.totalStudents };
      }
    },
    {
      key: 'quick-actions',
      title: 'Quick Actions',
      type: 'quick-action',
      actions: [
        { label: 'Mark Attendance', path: '/attendance', icon: 'attendance' },
        { label: 'Enter Marks', path: '/marks', icon: 'marks' },
      ],
    },
  ],
  homeRedirect: '/',
};

const studentStrategy: RoleStrategy = {
  roleName: 'STUDENT',
  displayName: 'Student',
  navItems: [
    { key: 'dashboard',         label: 'Dashboard',       path: '/',                     icon: 'dashboard', group: 'Main' },
    { key: 'profile',           label: 'My Profile',      path: '/profile',              icon: 'profile', group: 'My Data' },
    { key: 'student-marks',     label: 'My Marks',        path: '/student-marks',        icon: 'marks', group: 'My Data' },
    { key: 'student-attendance',label: 'My Attendance',   path: '/student-attendance',   icon: 'attendance', group: 'My Data' },
    { key: 'support',           label: 'Support',         path: '/support',              icon: 'support', group: 'Support' },
  ],
  permissions: {
    profile: ['read', 'update'],
    attendance: ['read'],
    marks: ['read'],
    subjects: ['read'],
    support: ['create', 'read'],
  },
  dashboardCards: [
    {
      key: 'stat-attendance',
      title: 'Overall Attendance',
      type: 'stat',
      queryKey: queryKeys.dashboardStats.studentSummary,
      fetchFn: async () => {
        const res = await getStudentDashboard();
        return { label: 'Attendance', value: `${res.data.overallAttendance.toFixed(1)}%` };
      }
    },
    {
      key: 'quick-actions',
      title: 'Quick Actions',
      type: 'quick-action',
      actions: [
        { label: 'View Profile', path: '/profile', icon: 'profile' },
        { label: 'View Marks', path: '/student-marks', icon: 'marks' },
        { label: 'View Attendance', path: '/student-attendance', icon: 'attendance' },
      ],
    },
  ],
  homeRedirect: '/',
};

// ===== Strategy Registry =====

const strategyRegistry: Record<string, RoleStrategy> = {
  SUPERADMIN: superAdminStrategy,
  COLLEGEADMIN: collegeAdminStrategy,
  HOD: hodStrategy,
  TEACHER: teacherStrategy,
  STUDENT: studentStrategy,
};

/**
 * Get the strategy for a given role name.
 * Falls back to student strategy if the role is unknown.
 */
export function getRoleStrategy(roleName: string): RoleStrategy {
  const normalized = roleName.toUpperCase();
  return strategyRegistry[normalized] ?? studentStrategy;
}

/**
 * Check if a role can perform a specific action on a resource.
 */
export function canPerform(roleName: string, action: Action, resource: Resource): boolean {
  const strategy = getRoleStrategy(roleName);
  return strategy.permissions[resource]?.includes(action) ?? false;
}

/**
 * Check if a given role is allowed to access a specific route.
 */
export function isRouteAllowed(roleName: string, path: string): boolean {
  const strategy = getRoleStrategy(roleName);
  // Strip trailing slashes and common dynamic segments for basic check
  const normalizedPath = path.split('/').filter(Boolean)[0] || '';
  if (!normalizedPath) return true; // Home is always allowed

  return strategy.navItems.some((item) => {
    const itemRoot = item.path.split('/').filter(Boolean)[0] || '';
    return itemRoot === normalizedPath;
  });
}

/**
 * Get all registered role names.
 */
export function getAllRoleNames(): string[] {
  return Object.keys(strategyRegistry);
}
