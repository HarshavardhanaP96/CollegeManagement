import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Building2, Users, BookOpen, Wallet, GraduationCap,
  ClipboardCheck, FileSpreadsheet, FileCheck2, CalendarDays, BarChart3,
  Receipt, LogOut, Search, Bell, Library, Award, Network, UserCircle,
} from "lucide-react";
import { useRole, clearStoredRole } from "@/lib/session";
import { ROLE_USERS, type Role } from "@/lib/mock-data";

type NavItem = { to: string; label: string; icon: React.ComponentType<{ className?: string }> };
type NavGroup = { label: string; items: NavItem[] };

const NAV: Record<Role, NavGroup[]> = {
  superadmin: [
    { label: "Platform", items: [
      { to: "/app/superadmin", label: "Overview", icon: LayoutDashboard },
    ] },
    { label: "Account", items: [
      { to: "/app/profile", label: "Profile", icon: UserCircle },
    ] },
  ],
  admin: [
    { label: "Administrative", items: [
      { to: "/app/admin",             label: "Executive Overview", icon: LayoutDashboard },
      { to: "/app/admin/staff",       label: "Staff Room",         icon: Users },
      { to: "/app/admin/curriculum",  label: "Curriculum Builder", icon: Library },
      { to: "/app/admin/assignments", label: "Assignments",        icon: Network },
      { to: "/app/admin/fees",        label: "Fee Control",        icon: Wallet },
      { to: "/app/admin/results",     label: "Results Publishing", icon: FileCheck2 },
    ] },
    { label: "Account", items: [
      { to: "/app/profile", label: "Profile", icon: UserCircle },
    ] },
  ],
  teacher: [
    { label: "Faculty Tools", items: [
      { to: "/app/teacher",            label: "My Classes",      icon: BookOpen },
      { to: "/app/teacher/attendance", label: "Attendance Grid", icon: ClipboardCheck },
      { to: "/app/teacher/gradebook",  label: "Gradebook",       icon: FileSpreadsheet },
    ] },
    { label: "Account", items: [
      { to: "/app/profile", label: "Profile", icon: UserCircle },
    ] },
  ],
  student: [
    { label: "Student Portal", items: [
      { to: "/app/student",           label: "Today",         icon: CalendarDays },
      { to: "/app/student/marks",     label: "Marks",         icon: Award },
      { to: "/app/student/exams",     label: "Exam Schedule", icon: CalendarDays },
      { to: "/app/student/analytics", label: "Analytics",     icon: BarChart3 },
      { to: "/app/student/wallet",    label: "Wallet",        icon: Receipt },
    ] },
    { label: "Account", items: [
      { to: "/app/profile", label: "Profile", icon: UserCircle },
    ] },
  ],
};


const ROLE_ICON: Record<Role, React.ComponentType<{ className?: string }>> = {
  superadmin: Building2,
  admin: GraduationCap,
  teacher: BookOpen,
  student: GraduationCap,
};

export function AppSidebar({ role }: { role: Role }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const groups = NAV[role];
  const user = ROLE_USERS[role];
  const TenantIcon = ROLE_ICON[role];

  const isActive = (to: string) => path === to || (to !== "/app" && path.startsWith(to + "/"));

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-sidebar flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-md ring-1 ring-black/5 bg-card">
          <div className="size-7 bg-primary rounded-sm grid place-items-center">
            <TenantIcon className="size-3.5 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{user.tenant}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              {role === "superadmin" ? "Platform Console" : "Main Campus"}
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {groups.map((g) => (
          <div key={g.label}>
            <div className="text-[10px] font-semibold text-muted-foreground/80 px-3 py-2 uppercase tracking-widest">
              {g.label}
            </div>
            <div className="space-y-0.5">
              {g.items.map((item) => {
                const active = isActive(item.to);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={[
                      "flex items-center gap-2.5 px-3 py-2 text-sm rounded-md transition-colors",
                      active
                        ? "bg-primary/5 text-foreground font-medium ring-1 ring-black/5"
                        : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent font-medium",
                    ].join(" ")}
                  >
                    <Icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="size-8 rounded-full bg-secondary ring-1 ring-black/5 grid place-items-center text-[11px] font-semibold text-foreground">
            {user.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate">{user.name}</p>
            <p className="text-[10px] text-muted-foreground">{user.sub}</p>
          </div>
          <button
            onClick={() => { clearStoredRole(); navigate({ to: "/login" }); }}
            className="size-7 grid place-items-center rounded-md text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
            title="Sign out"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function AppHeader({ crumbs }: { crumbs: string[] }) {
  return (
    <header className="h-14 border-b border-border bg-background/70 backdrop-blur-sm flex items-center justify-between px-8 sticky top-0 z-10">
      <nav className="flex items-center gap-2 text-sm">
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            {i > 0 && <span className="text-border-strong">/</span>}
            <span className={i === crumbs.length - 1 ? "text-foreground font-medium" : "text-muted-foreground"}>
              {c}
            </span>
          </span>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search records, people, invoices…"
            className="pl-9 pr-12 py-1.5 bg-secondary border-0 rounded-md text-sm w-80 focus:ring-1 focus:ring-ring placeholder:text-muted-foreground outline-none"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 bg-card ring-1 ring-black/5 rounded">⌘K</kbd>
        </div>
        <button className="size-8 grid place-items-center rounded-md bg-card ring-1 ring-black/5 text-muted-foreground hover:text-foreground">
          <Bell className="size-4" />
        </button>
      </div>
    </header>
  );
}
