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

// ===== Types =====

export interface NavItem {
  key: string;
  label: string;
  path: string;
  icon?: string; // emoji/icon identifier
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
  | 'profile';

export interface DashboardCard {
  key: string;
  title: string;
  type: 'stat' | 'quick-action' | 'chart';
  queryKey?: string[];
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
    { key: 'dashboard',     label: 'Dashboard',     path: '/',                   icon: '📊', group: 'Main' },
    { key: 'analytics',     label: 'Intelligence',  path: '/analytics',          icon: '🧠', group: 'Main' },
    { key: 'colleges',      label: 'Colleges',      path: '/colleges',           icon: '🏛️', group: 'Management' },
    { key: 'departments',   label: 'Departments',   path: '/departments',        icon: '🏢', group: 'Management' },
    { key: 'courses',       label: 'Courses',       path: '/courses',            icon: '📚', group: 'Management' },
    { key: 'subjects',      label: 'Subjects',      path: '/subjects',           icon: '📖', group: 'Academic' },
    { key: 'students',      label: 'Students',      path: '/students',           icon: '🧑‍🎓', group: 'Academic' },
    { key: 'teachers',      label: 'Teachers',      path: '/teachers',           icon: '👨‍🏫', group: 'Academic' },
    { key: 'classes',       label: 'Classes',       path: '/classes',            icon: '🎓', group: 'Academic' },
    { key: 'attendance',    label: 'Attendance',     path: '/attendance',         icon: '📋', group: 'Operations' },
    { key: 'marks',         label: 'Marks',          path: '/marks',             icon: '📝', group: 'Operations' },
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
    profile: ALL_ACTIONS,
  },
  dashboardCards: [
    {
      key: 'stat-colleges',
      title: 'Total Colleges',
      type: 'stat',
      queryKey: ['colleges-count'],
      fetchFn: async () => {
        const res = await getColleges({ size: 1 });
        return { label: 'Colleges', value: res.data.pageable.totalElements || 0 };
      }
    },
    {
      key: 'stat-departments',
      title: 'Total Departments',
      type: 'stat',
      queryKey: ['departments-count'],
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
        { label: 'Register College', path: '/colleges/new', icon: '➕' },
        { label: 'Manage Colleges', path: '/colleges', icon: '🏛️' },
        { label: 'System Overview', path: '/', icon: '📊' },
      ],
    },
  ],
  homeRedirect: '/',
};

const collegeAdminStrategy: RoleStrategy = {
  roleName: 'COLLEGEADMIN',
  displayName: 'College Admin',
  navItems: [
    { key: 'dashboard',     label: 'Dashboard',     path: '/',              icon: '📊', group: 'Main' },
    { key: 'analytics',     label: 'Intelligence',  path: '/analytics',     icon: '🧠', group: 'Main' },
    { key: 'departments',   label: 'Departments',   path: '/departments',   icon: '🏢', group: 'Management' },
    { key: 'courses',       label: 'Courses',       path: '/courses',       icon: '📚', group: 'Management' },
    { key: 'subjects',      label: 'Subjects',      path: '/subjects',      icon: '📖', group: 'Academic' },
    { key: 'students',      label: 'Students',      path: '/students',      icon: '🧑‍🎓', group: 'Academic' },
    { key: 'teachers',      label: 'Teachers',      path: '/teachers',      icon: '👨‍🏫', group: 'Academic' },
    { key: 'classes',       label: 'Classes',       path: '/classes',       icon: '🎓', group: 'Academic' },
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
    profile: ALL_ACTIONS,
  },
  dashboardCards: [
    {
      key: 'stat-students',
      title: 'Total Students',
      type: 'stat',
      queryKey: ['students-count'],
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
        { label: 'Establish Dept', path: '/departments/new', icon: '🏢' },
        { label: 'Formulate Course', path: '/courses/new', icon: '📚' },
        { label: 'Enroll Student', path: '/students/new', icon: '🧑‍🎓' },
      ],
    },
  ],
  homeRedirect: '/',
};

const hodStrategy: RoleStrategy = {
  roleName: 'HOD',
  displayName: 'Head of Department',
  navItems: [
    { key: 'dashboard',   label: 'Dashboard',  path: '/',            icon: '📊', group: 'Main' },
    { key: 'analytics',   label: 'Analytics',  path: '/analytics',   icon: '🧠', group: 'Main' },
    { key: 'subjects',    label: 'Subjects',    path: '/subjects',    icon: '📖', group: 'Department' },
    { key: 'students',    label: 'Students',    path: '/students',    icon: '🧑‍🎓', group: 'Department' },
    { key: 'teachers',    label: 'Teachers',    path: '/teachers',    icon: '👨‍🏫', group: 'Department' },
    { key: 'classes',     label: 'Classes',     path: '/classes',     icon: '🎓', group: 'Department' },
  ],
  permissions: {
    subjects: ALL_ACTIONS,
    students: ALL_ACTIONS,
    teachers: ALL_ACTIONS,
    classes: ALL_ACTIONS,
    attendance: ALL_ACTIONS,
    marks: ALL_ACTIONS,
    departments: ['read'],
    profile: ALL_ACTIONS,
  },
  dashboardCards: [
    {
      key: 'quick-actions',
      title: 'Quick Actions',
      type: 'quick-action',
      actions: [
        { label: 'Enroll Student', path: '/students/new', icon: '🧑‍🎓' },
        { label: 'Onboard Faculty', path: '/teachers/new', icon: '👨‍🏫' },
        { label: 'Instantiate Class', path: '/classes/new', icon: '🎓' },
      ],
    },
  ],
  homeRedirect: '/',
};

const teacherStrategy: RoleStrategy = {
  roleName: 'TEACHER',
  displayName: 'Teacher',
  navItems: [
    { key: 'dashboard',   label: 'Dashboard',   path: '/',             icon: '📊', group: 'Main' },
    { key: 'attendance',  label: 'Attendance',   path: '/attendance',   icon: '📋', group: 'My Work' },
    { key: 'marks',       label: 'Marks',        path: '/marks',        icon: '📝', group: 'My Work' },
  ],
  permissions: {
    attendance: ALL_ACTIONS,
    marks: ALL_ACTIONS,
    students: ['read'],
    subjects: ['read'],
    classes: ['read'],
    profile: ALL_ACTIONS,
  },
  dashboardCards: [
    {
      key: 'stat-assignments',
      title: 'Total Assignments',
      type: 'stat',
      queryKey: ['teacher-dashboard'],
      fetchFn: async () => {
        const res = await getTeacherDashboard();
        return { label: 'Assignments', value: res.data.totalAssignments };
      }
    },
    {
      key: 'stat-students',
      title: 'My Students',
      type: 'stat',
      queryKey: ['teacher-dashboard'],
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
        { label: 'Mark Attendance', path: '/attendance', icon: '📋' },
        { label: 'Enter Marks', path: '/marks', icon: '📝' },
      ],
    },
  ],
  homeRedirect: '/',
};

const studentStrategy: RoleStrategy = {
  roleName: 'STUDENT',
  displayName: 'Student',
  navItems: [
    { key: 'dashboard',         label: 'Dashboard',       path: '/',                     icon: '📊', group: 'Main' },
    { key: 'profile',           label: 'My Profile',      path: '/profile',              icon: '👤', group: 'My Data' },
    { key: 'student-marks',     label: 'My Marks',        path: '/student-marks',        icon: '📝', group: 'My Data' },
    { key: 'student-attendance',label: 'My Attendance',   path: '/student-attendance',   icon: '📋', group: 'My Data' },
  ],
  permissions: {
    profile: ['read', 'update'],
    attendance: ['read'],
    marks: ['read'],
    subjects: ['read'],
  },
  dashboardCards: [
    {
      key: 'stat-attendance',
      title: 'Overall Attendance',
      type: 'stat',
      queryKey: ['student-dashboard'],
      fetchFn: async () => {
        const res = await getStudentDashboard();
        return { label: 'Attendance', value: `${res.data.overallAttendance.attendancePercentage.toFixed(1)}%` };
      }
    },
    {
      key: 'quick-actions',
      title: 'Quick Actions',
      type: 'quick-action',
      actions: [
        { label: 'View Profile', path: '/profile', icon: '👤' },
        { label: 'View Marks', path: '/student-marks', icon: '📝' },
        { label: 'View Attendance', path: '/student-attendance', icon: '📋' },
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
