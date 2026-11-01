import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { MainLayout } from '../components/layout/MainLayout';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { useAuthStore } from '../store/authStore';
import { isRouteAllowed } from '../strategies/roleStrategy';

// Auth pages
import { LoginPage } from '../pages/LoginPage';
import { NotFoundPage } from '../pages/NotFoundPage';

// Dashboard
import { DashboardPage } from '../pages/DashboardPage';
import { AnalyticsPage } from '../pages/AnalyticsPage';

// SuperAdmin pages
import { CollegeListPage } from '../pages/superadmin/CollegeListPage';
import { CollegeCreatePage } from '../pages/superadmin/CollegeCreatePage';
import { CollegeDetailPage } from '../pages/superadmin/CollegeDetailPage';

// CollegeAdmin pages
import { DepartmentListPage } from '../pages/collegeadmin/DepartmentListPage';
import { DepartmentCreatePage } from '../pages/collegeadmin/DepartmentCreatePage';
import { DepartmentDetailPage } from '../pages/collegeadmin/DepartmentDetailPage';
import { CourseListPage } from '../pages/collegeadmin/CourseListPage';
import { CourseCreatePage } from '../pages/collegeadmin/CourseCreatePage';
import { CourseDetailPage } from '../pages/collegeadmin/CourseDetailPage';
import { ExamTypeListPage } from '../pages/collegeadmin/ExamTypeListPage';
import { ExamTypeCreatePage } from '../pages/collegeadmin/ExamTypeCreatePage';

// HOD pages
import { SubjectListPage } from '../pages/hod/SubjectListPage';
import { SubjectCreatePage } from '../pages/hod/SubjectCreatePage';
import { SubjectDetailPage } from '../pages/hod/SubjectDetailPage';
import { TeacherListPage } from '../pages/hod/TeacherListPage';
import { TeacherCreatePage } from '../pages/hod/TeacherCreatePage';
import { TeacherDetailPage } from '../pages/hod/TeacherDetailPage';
import { StudentListPage } from '../pages/hod/StudentListPage';
import { StudentCreatePage } from '../pages/hod/StudentCreatePage';
import { StudentDetailPage } from '../pages/hod/StudentDetailPage';
import { ClassListPage } from '../pages/hod/ClassListPage';
import { ClassCreatePage } from '../pages/hod/ClassCreatePage';
import { ClassDetailPage } from '../pages/hod/ClassDetailPage';

// Teacher pages
import { TeacherAttendancePage } from '../pages/teacher/TeacherAttendancePage';
import { TeacherMarksPage } from '../pages/teacher/TeacherMarksPage';

// Student pages
import { StudentProfilePage } from '../pages/student/StudentProfilePage';
import { StudentMarksPage } from '../pages/student/StudentMarksPage';
import { StudentAttendancePage } from '../pages/student/StudentAttendancePage';

// Shared pages
import { SupportPage } from '../pages/SupportPage';
import { CollegeConfigPage } from '../pages/CollegeConfigPage';
import { AuditLogPage } from '../pages/collegeadmin/AuditLogPage';
import { KnowledgeBasePage } from '../pages/knowledgebase/KnowledgeBasePage';
import { KnowledgeBaseArticlePage } from '../pages/knowledgebase/KnowledgeBaseArticlePage';
import { KnowledgeBaseListPage } from '../pages/superadmin/KnowledgeBaseListPage';
import { KnowledgeBaseEditorPage } from '../pages/superadmin/KnowledgeBaseEditorPage';
import { MyPrivacyPage } from '../pages/MyPrivacyPage';
import { PrivacyAdminPage } from '../pages/collegeadmin/PrivacyAdminPage';
import { PrivacyRequestDetailPage } from '../pages/collegeadmin/privacy/PrivacyRequestDetailPage';

/**
 * Route → Component mapping.
 * Sub-routes like /new and /:id are allowed if their parent list route is in the role
 * strategy (isRouteAllowed only looks at the first path segment — see roleStrategy.ts).
 */
const routeComponentMap: Record<string, React.ComponentType> = {
  '/analytics':             AnalyticsPage,
  '/colleges':              CollegeListPage,
  '/colleges/new':          CollegeCreatePage,
  '/colleges/:id':          CollegeDetailPage,
  '/colleges/:id/config':   CollegeConfigPage,
  '/college-config':        CollegeConfigPage,
  '/departments':           DepartmentListPage,
  '/departments/new':       DepartmentCreatePage,
  '/departments/:id':       DepartmentDetailPage,
  '/courses':               CourseListPage,
  '/courses/new':           CourseCreatePage,
  '/courses/:id':           CourseDetailPage,
  '/exam-types':            ExamTypeListPage,
  '/exam-types/new':        ExamTypeCreatePage,
  '/subjects':              SubjectListPage,
  '/subjects/new':          SubjectCreatePage,
  '/subjects/:id':          SubjectDetailPage,
  '/teachers':              TeacherListPage,
  '/teachers/new':          TeacherCreatePage,
  '/teachers/:id':          TeacherDetailPage,
  '/students':              StudentListPage,
  '/students/new':          StudentCreatePage,
  '/students/:id':          StudentDetailPage,
  '/classes':               ClassListPage,
  '/classes/new':           ClassCreatePage,
  '/classes/:id':           ClassDetailPage,
  '/attendance':            TeacherAttendancePage,
  '/marks':                 TeacherMarksPage,
  '/profile':               StudentProfilePage,
  '/student-marks':         StudentMarksPage,
  '/student-attendance':    StudentAttendancePage,
  '/audit-log':             AuditLogPage,
  '/support':               SupportPage,
  '/knowledgebase':         KnowledgeBasePage,
  '/knowledgebase/:id':     KnowledgeBaseArticlePage,
  '/kb-admin':              KnowledgeBaseListPage,
  '/kb-admin/new':          KnowledgeBaseEditorPage,
  '/kb-admin/:id':          KnowledgeBaseEditorPage,
  '/my-privacy':                  MyPrivacyPage,
  '/privacy-admin':               PrivacyAdminPage,
  '/privacy-admin/requests/:id':  PrivacyRequestDetailPage,
};

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

  // Only register routes this role can reach at all, per the Route Access
  // Strategy (isRouteAllowed — the same rule ProtectedRoute enforces per
  // request, and the same rule Sidebar uses to decide which links to show).
  // This keeps unreachable routes out of the router entirely rather than
  // relying solely on the runtime guard.
  const roleName = user?.roleName ?? '';

  return (
    <Routes>
      <Route element={<LayoutWrapper />}>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {Object.entries(routeComponentMap).map(([path, Component]) => {
          if (!isRouteAllowed(roleName, path)) return null;

          return (
            <Route
              key={path}
              path={path}
              element={
                <ProtectedRoute>
                  <Component />
                </ProtectedRoute>
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
