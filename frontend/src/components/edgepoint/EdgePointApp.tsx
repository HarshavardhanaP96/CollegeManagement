import { useState } from 'react';
import { useAuthStore, getRoleName } from '../../store/authStore';
import { login } from '../../api/auth';
import { StudentPortal } from './student/StudentPortal';
import { FacultyPortal } from './faculty/FacultyPortal';
import { RegistryPortal } from './RegistryPortal';
import { SuperAdminPortal } from './SuperAdminPortal';

// ===== LANDING =====

function Landing({ navigate }: { navigate: (to: string, role?: string) => void }) {
  const roles = [
    { id: "superadmin", role: "PLATFORM OPERATOR", title: "Super Admin", desc: "Manage every institution on the platform", icon: "🏛" },
    { id: "registry", role: "INSTITUTION LEAD", title: "College Admin", desc: "Run a single college: staff, fees, curriculum, results", icon: "🎓" },
    { id: "faculty", role: "FACULTY MEMBER", title: "Teacher", desc: "Mark attendance, enter grades, manage classes", icon: "📖" },
    { id: "student", role: "LEARNER", title: "Student / Parent", desc: "View timeline, analytics, fees and receipts", icon: "👤" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <nav className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full"/>
          </div>
          <span className="font-bold text-gray-900">EdgePoint</span>
          <span className="text-xs text-gray-400 ml-1">INSTITUTIONAL ERP</span>
        </div>
        <button onClick={() => navigate("login")} className="text-sm font-medium text-gray-600 hover:text-gray-900">Sign in</button>
      </nav>
      <div className="max-w-4xl mx-auto px-8 pt-24 pb-16">
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-4">Multi-Tenant · Row-Level Isolated · Built for Scale</p>
        <h1 className="text-6xl font-bold text-gray-900 tracking-tight leading-none mb-6">One ledger for<br/>the whole institution.</h1>
        <p className="text-lg text-gray-500 max-w-lg leading-relaxed mb-10">EdgePoint runs admissions, attendance, gradebooks, fees and analytics across every campus you operate — with a calm, data-dense interface built for registrars, faculty and families.</p>
        <div className="flex items-center gap-3 mb-20">
          <button onClick={() => navigate("login")} className="bg-gray-900 text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2">Open the console →</button>
          <button className="text-sm font-semibold text-gray-600 px-6 py-3 rounded-lg border border-gray-200 hover:bg-gray-50">Explore as a role</button>
        </div>
        <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-5">Try a Workspace</p>
        <div className="grid grid-cols-2 gap-4">
          {roles.map((r) => (
            <button key={r.id} onClick={() => navigate("login", r.id)} className="bg-white border border-gray-100 rounded-xl p-6 text-left hover:border-gray-300 hover:shadow-md transition-all group">
              <div className="flex items-start justify-between mb-6">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-xl group-hover:bg-gray-200 transition-colors">{r.icon}</div>
                <span className="text-gray-300 group-hover:text-gray-600 transition-colors text-lg">→</span>
              </div>
              <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-1">{r.role}</p>
              <p className="text-lg font-bold text-gray-900 mb-1">{r.title}</p>
              <p className="text-sm text-gray-500">{r.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== LOGIN =====

function Login({ navigate, selectedRole }: { navigate: (to: string, role?: string) => void; selectedRole?: string }) {
  const [role, setRole] = useState(selectedRole || "registry");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login: setAuth } = useAuthStore();

  const roles = [
    { id: "superadmin", label: "Super Admin", sub: "Platform Operator" },
    { id: "registry", label: "College Admin", sub: "Institution Lead" },
    { id: "faculty", label: "Teacher", sub: "Faculty Member" },
    { id: "student", label: "Student / Parent", sub: "Learner" },
  ];

  // Demo credentials mapping - updated for new backend format
  const demoCredentials = {
    student: { email: "julianne.sterling@stjudes.edu", password: "password" },
    faculty: { email: "m.hale@stjudes.edu", password: "password" },
    superadmin: { email: "dr.aris.thorne@stjudes.edu", password: "password" },
    registry: { email: "priya.raman@stjudes.edu", password: "password" },
  };

  const handleLogin = async () => {
    setLoading(true);
    setError(null);

    const creds = demoCredentials[role as keyof typeof demoCredentials];
    if (!creds) {
      setError("Invalid role selected");
      setLoading(false);
      return;
    }

    try {
      const response = await login({ email: creds.email, password: creds.password });
      if (!response.success) {
        setError(response.error?.message || "Login failed");
        setLoading(false);
        return;
      }
      setAuth(response.data);
      navigate(role);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans">
      <div className="w-1/2 bg-gray-900 flex flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <div className="w-3 h-3 bg-gray-900 rounded-full"/>
          </div>
          <span className="font-bold text-white">EdgePoint</span>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-4">Workspace · St. Jude's University</p>
          <blockquote className="text-3xl font-bold text-white leading-snug mb-6">"We migrated 14 campuses in a single term. Registrars finally got a quiet morning back."</blockquote>
          <p className="text-white font-semibold">Dr. Aris Thorne</p>
          <p className="text-gray-400 text-sm">Chief Academic Officer · St. Jude's</p>
        </div>
        <div className="flex gap-4 text-xs text-gray-600 font-semibold tracking-widest">
          <span>SOC 2</span>
          <span>·</span>
          <span>FERPA</span>
          <span>·</span>
          <span>ISO 27001</span>
        </div>
      </div>
      <div className="w-1/2 bg-white flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">Sign In</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Enter the console</h2>
          <p className="text-gray-400 text-sm mb-8">Select your role and use demo credentials to access the workspace.</p>
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Workspace role</p>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    role === r.id
                      ? "bg-gray-900 border-gray-900 text-white"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  <p className="text-sm font-semibold">{r.label}</p>
                  <p className={`text-xs mt-0.5 ${role === r.id ? "text-gray-400" : "text-gray-400"}`}>{r.sub}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={demoCredentials[role as keyof typeof demoCredentials]?.email || ""}
              readOnly
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={demoCredentials[role as keyof typeof demoCredentials]?.password || ""}
              readOnly
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>
          {error && (
            <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </div>
          )}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-gray-900 text-white font-semibold text-sm py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Continue to "}
            {roles.find(r2 => r2.id === role)?.label}
          </button>
          <p className="text-center text-xs text-gray-400 mt-4">By continuing you agree to the EdgePoint Acceptable Use Policy.</p>
        </div>
      </div>
    </div>
  );
}

// ===== PORTAL ROUTER =====

function PortalRouter({ user }: { user: { roles: string[] } | null }) {
  if (!user) return null;

  const roleName = getRoleName(user);

  if (roleName === "SUPERADMIN") {
    return <SuperAdminPortal />;
  }
  if (roleName === "COLLEGEADMIN") {
    return <RegistryPortal />;
  }
  if (roleName === "HOD") {
    return <FacultyPortal />;
  }
  if (roleName === "TEACHER") {
    return <FacultyPortal />;
  }
  if (roleName === "STUDENT") {
    return <StudentPortal />;
  }

  return <StudentPortal />;
}

// Export the EdgePointApp component
export function EdgePointApp() {
  const [view, setView] = useState("landing");
  const [role, setRole] = useState<string | null>(null);
  const { user } = useAuthStore();

  const navigate = (to: string, r?: string) => {
    setView(to);
    if (r) setRole(r);
  };

  // If user is already authenticated, show their portal
  if (user) {
    return <PortalRouter user={user} />;
  }

  if (view === "landing") return <Landing navigate={navigate} />;
  if (view === "login") return <Login navigate={navigate} selectedRole={role ?? undefined} />;

  return <Landing navigate={navigate} />;
}