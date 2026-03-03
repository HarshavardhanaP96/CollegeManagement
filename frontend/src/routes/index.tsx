import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { useAuthStore } from '../store/authStore';
import { getRoleStrategy } from '../strategies/roleStrategy';

// Auth pages
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Dashboard
import { DashboardPage } from '../pages/DashboardPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';

// SuperAdmin pages
import { CollegeListPage } from '../pages/superadmin/CollegeListPage';
import { CollegeCreatePage } from '../pages/superadmin/CollegeCreatePage';

// CollegeAdmin pages
import { DepartmentListPage } from '../pages/collegeadmin/DepartmentListPage';
import { DepartmentCreatePage } from '../pages/collegeadmin/DepartmentCreatePage';
import { CourseListPage } from '../pages/collegeadmin/CourseListPage';
import { CourseCreatePage } from '../pages/collegeadmin/CourseCreatePage';

// HOD pages
import { SubjectListPage } from '../pages/hod/SubjectListPage';
import { SubjectCreatePage } from '../pages/hod/SubjectCreatePage';
import { TeacherListPage } from '../pages/hod/TeacherListPage';
import { TeacherCreatePage } from '../pages/hod/TeacherCreatePage';
import { StudentListPage } from '../pages/hod/StudentListPage';
import { StudentCreatePage } from '../pages/hod/StudentCreatePage';
import { ClassListPage } from '../pages/hod/ClassListPage';
import { ClassCreatePage } from '../pages/hod/ClassCreatePage';

// Teacher pages
import { TeacherAttendancePage } from '../pages/teacher/TeacherAttendancePage';
import { TeacherMarksPage } from '../pages/teacher/TeacherMarksPage';

// Student pages
import { StudentProfilePage } from '../pages/student/StudentProfilePage';
import { StudentMarksPage } from '../pages/student/StudentMarksPage';
import { StudentAttendancePage } from '../pages/student/StudentAttendancePage';

/** 
 * Route → Component mapping.
 * Sub-routes like /new are allowed if their parent list route is in the role strategy.
 */
const routeComponentMap: Record<string, React.ComponentType> = {
  '/analytics':             AnalyticsPage,
  '/colleges':              CollegeListPage,
  '/colleges/new':          CollegeCreatePage,
  '/departments':           DepartmentListPage,
  '/departments/new':       DepartmentCreatePage,
  '/courses':               CourseListPage,
  '/courses/new':           CourseCreatePage,
  '/subjects':              SubjectListPage,
  '/subjects/new':          SubjectCreatePage,
  '/teachers':              TeacherListPage,
  '/teachers/new':          TeacherCreatePage,
  '/students':              StudentListPage,
  '/students/new':          StudentCreatePage,
  '/classes':               ClassListPage,
  '/classes/new':           ClassCreatePage,
  '/attendance':            TeacherAttendancePage,
  '/marks':                 TeacherMarksPage,
  '/profile':               StudentProfilePage,
  '/student-marks':         StudentMarksPage,
  '/student-attendance':    StudentAttendancePage,
};

function RoleGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function LayoutWrapper() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}

function AppRoutes() {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const strategy = user ? getRoleStrategy(user.roleName) : null;
  const allowedPaths = new Set(strategy?.navItems.map((item) => item.path) ?? []);

  return (
    <Routes>
      <Route element={<LayoutWrapper />}>
        <Route path="/" element={<DashboardPage />} />

        {Object.entries(routeComponentMap).map(([path, Component]) => {
          // Rule: Allow if path is in sidebar OR if path ends in /new and parent path is in sidebar
          const parentPath = path.endsWith('/new') ? path.replace('/new', '') : path;
          const isAllowed = allowedPaths.has(path) || allowedPaths.has(parentPath);
          
          if (!isAllowed) return null;

          return (
            <Route
              key={path}
              path={path}
              element={
                <RoleGate>
                  <Component />
                </RoleGate>
              }
            />
          );
        })}

        <Route
          path="/unauthorized"
          element={
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <h1 className="text-4xl font-black text-slate-900">403</h1>
              <p className="mt-2 text-lg text-slate-600 font-medium">
                Identity Verified. Access Authorization Failed.
              </p>
            </div>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default AppRoutes;
