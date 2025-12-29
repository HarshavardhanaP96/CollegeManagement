import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);

  const isSuperAdmin = user?.roleName?.toLowerCase() === 'superadmin';

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
        <h1 className="text-xl font-semibold">College Management System</h1>
        <div className="text-sm text-slate-700">
          <div>{user?.fullName}</div>
          <div className="text-xs text-slate-500">{user?.roleName}</div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold">Dashboard</h2>
          <p className="text-sm text-slate-600">
            Role-based dashboards (SuperAdmin, CollegeAdmin, HOD, Teacher, Student) will appear
            here based on the authenticated user.
          </p>
        </div>

        {isSuperAdmin && (
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-2 text-base font-semibold">SuperAdmin Actions</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>
                <Link
                  to="/superadmin/colleges"
                  className="text-sky-700 underline underline-offset-2 hover:text-sky-900"
                >
                  Manage Colleges
                </Link>
              </li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}



