import React, { useState } from 'react';
import { Badge } from './Badge';
import { TopBar } from './TopBar';
import { SidebarLayout } from './SidebarLayout';
import { NavItem } from './NavItem';
import { SectionLabel } from './SectionLabel';
import { UserFooter } from './UserFooter';
import { Icons } from './Icons';
import { useAuthStore } from '../../store/authStore';
import { NotificationConfigPanel } from './NotificationConfigPanel';

export function RegistryPortal() {
  const [active, setActive] = useState("overview");
  const { user, logout } = useAuthStore();

  const logo = (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">St</div>
      <div>
        <p className="text-sm font-bold text-gray-900 leading-none">St. Jude's University</p>
        <p className="text-xs text-gray-400">MAIN CAMPUS</p>
      </div>
    </div>
  );

  const nav = (
    <>
      <SectionLabel>Administrative</SectionLabel>
      {[
        { id: "overview", label: "Executive Overview", icon: <Icons.Overview /> },
        { id: "staff", label: "Staff Room", icon: <Icons.Staff /> },
        { id: "curriculum", label: "Curriculum Builder", icon: <Icons.Curriculum /> },
        { id: "assignments", label: "Assignments", icon: <Icons.Assignments /> },
        { id: "fees", label: "Fee Control", icon: <Icons.Fees /> },
        { id: "results", label: "Results Publishing", icon: <Icons.Results /> },
        { id: "notifications", label: "Notifications Config", icon: <Icons.Overview /> }
      ].map(item => (
        <NavItem
          key={item.id}
          {...item}
          active={active === item.id}
          onClick={() => setActive(item.id)}
        />
      ))}
      <SectionLabel>Account</SectionLabel>
      <NavItem icon={<Icons.Profile />} label="Profile" />
    </>
  );

  const titles: Record<string, string> = {
    overview: "Executive Overview",
    staff: "Staff Room",
    curriculum: "Curriculum Builder",
    assignments: "Assignments",
    fees: "Fee Control",
    results: "Results Publishing",
    notifications: "Messaging & Notifications"
  };

  const userDisplayName = user?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Admin';
  const userInitials = `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`;
  const userRole = user?.roles?.[0] || 'COLLEGEADMIN';

  return (
    <SidebarLayout logo={logo} nav={nav} footer={<UserFooter initials={userInitials} name={userDisplayName} sub={userRole} onLogout={logout} />}>
      <TopBar breadcrumb={["Registry", titles[active]]} />
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {active === "overview" && <RegistryOverview />}
        {active === "staff" && <RegistryStaff />}
        {active === "curriculum" && <RegistryCurriculum />}
        {active === "assignments" && <RegistryAssignments />}
        {active === "fees" && <RegistryFees />}
        {active === "results" && <RegistryResults />}
        {active === "notifications" && user?.tenantId && (
          <NotificationConfigPanel 
            institutionId={user.tenantId} 
            institutionName="St. Jude's University" 
            readOnly={true} 
          />
        )}
      </div>
    </SidebarLayout>
  );
}

function RegistryOverview() {
  const [showReport, setShowReport] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Executive Overview</h1>
        <div className="flex gap-2">
          <button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">Export term report</button>
          <button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">New announcement</button>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-6">St. Jude's University · Fall term 2026</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Active Enrollment", value: "12,482", change: "+2.4%", positive: true },
          { label: "Term Revenue", value: "$4.28M", change: "Steady", positive: false },
          { label: "Avg Attendance", value: "94.1%", change: "-0.8%", positive: false },
          { label: "Faculty", value: "882", change: "+12 new", positive: true }
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className={`text-sm mt-1 font-medium ${s.positive ? "text-emerald-600" : "text-gray-400"}`}>{s.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Fee collection trend</h2>
          <div className="h-32 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400">
            <span>Chart visualization would render here</span>
          </div>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Compliance</p>
          <h2 className="text-base font-bold text-white mb-4">3 active alerts</h2>
          {[
            { c: "bg-amber-400", t: "Faculty credential review due Oct 14" },
            { c: "bg-blue-400", t: "Mid-term grade publishing window opens Sep 21" },
            { c: "bg-red-400", t: "26 invoices marked overdue" }
          ].map((a, i) => (
            <div key={i} className="flex items-start gap-2.5 mb-3">
              <div className={`w-2 h-2 rounded-full ${a.c} mt-1.5 flex-shrink-0`} />
              <p className="text-xs text-gray-400 leading-relaxed">{a.t}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Recent activity</h2>
        <div className="space-y-3">
          {[
            { actor: "Marcus Hale", ac: "bg-blue-100 text-blue-700", action: "released midterm grades", detail: "Algorithms · CS-A · Y3", time: "11 min ago" },
            { actor: "Priya Raman", ac: "bg-purple-100 text-purple-700", action: "generated invoices", detail: "Fall 2026 · 248 students", time: "1 hr ago" },
            { actor: "Helena Vorga", ac: "bg-green-100 text-green-700", action: "added new subject", detail: "Distributed Systems → CS", time: "3 hr ago" },
            { actor: "System", ac: "bg-gray-100 text-gray-600", action: "auto-retried 4 failed payments", detail: "Stripe · USD", time: "Yesterday" }
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-3 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${a.ac}`}>{a.actor}</span>
              <span className="text-sm text-gray-600">{a.action}</span>
              <span className="text-sm text-gray-400">· {a.detail}</span>
              <span className="ml-auto text-xs text-gray-300">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RegistryStaff() {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Staff Room</h1>
        <div className="flex gap-2">
          <button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">Import CSV</button>
          <button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">Add faculty</button>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-6">Faculty roster, departments and credential status</p>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-4 border-b border-gray-50">
          <input placeholder="Search by name, email or ID…" className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-gray-300" />
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">ID</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Name</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Department</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Role</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { id: "F-1041", name: "Dr. Helena Vorga", dept: "Computer Science", role: "Professor", status: "Active" },
              { id: "F-1042", name: "Marcus Hale", dept: "Computer Science", role: "Asst. Professor", status: "Active" },
              { id: "F-1043", name: "Sana Iqbal", dept: "Mathematics", role: "Lecturer", status: "Active" },
              { id: "F-1044", name: "Theodore Park", dept: "Economics", role: "Professor", status: "On Leave" }
            ].map(s => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{s.id}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                <td className="py-3 px-4 text-gray-600">{s.dept}</td>
                <td className="py-3 px-4 text-gray-500">{s.role}</td>
                <td className="py-3 px-4">
                  <Badge color={s.status === "Active" ? "green" : s.status === "On Leave" ? "orange" : "gray"}>{s.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RegistryCurriculum() {
  const programs = [
    { name: "B.Sc. Computer Science", code: "CS", subjects: [{ n: "Algorithms", h: 31 }, { n: "Data Structures", h: 32 }] },
    { name: "B.Sc. Biochemistry", code: "BIO", subjects: [{ n: "Organic Chemistry", h: 35 }, { n: "Cell Biology", h: 50 }] }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Curriculum Builder</h1>
        <div className="flex gap-2">
          <button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">Discard</button>
          <button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">Save changes</button>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-6">Map subjects to programs · drag to re-order, click to edit</p>

      <div className="grid grid-cols-2 gap-5">
        {programs.map(p => (
          <div key={p.name} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-900">{p.name}</h2>
              <span className="text-xs text-gray-400 font-mono">{p.code}</span>
            </div>
            <div className="space-y-1">
              {p.subjects.map(s => (
                <div key={s.n} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-gray-300 text-xs">⠿</span>
                  <span className="text-xs text-gray-400 w-4">#{p.subjects.indexOf(s) + 1}</span>
                  <span className="flex-1 text-sm text-gray-700">{s.n}</span>
                  <span className="text-xs text-gray-400">{s.h} hrs</span>
                </div>
              ))}
              <button className="w-full text-xs text-gray-400 hover:text-gray-700 py-2 border border-dashed border-gray-200 rounded-lg mt-2 transition-colors">+ Add subject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RegistryAssignments() {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Subject & Staff Assignments</h1>
        <button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">New assignment</button>
      </div>
      <p className="text-sm text-gray-400 mb-6">Map subjects to a class & year, and assign the staff who teach them</p>

      <div className="bg-white rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Subject</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Course</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Year</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Staff</th>
            </tr>
          </thead>
          <tbody>
            {[
              { subject: "Algorithms", course: "B.Sc. Computer Science", year: "Year 3", staff: "Marcus Hale" },
              { subject: "Databases", course: "B.Sc. Computer Science", year: "Year 3", staff: "Marcus Hale" },
              { subject: "Data Structures", course: "B.Sc. Computer Science", year: "Year 2", staff: "Sana Iqbal" }
            ].map(a => (
              <tr key={a.subject} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">{a.subject}</td>
                <td className="py-3 px-4 text-gray-600">{a.course}</td>
                <td className="py-3 px-4 text-gray-600">{a.year}</td>
                <td className="py-3 px-4 text-gray-700">{a.staff}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RegistryFees() {
  const templates = [
    { id: "FT-01", name: "B.Sc. Computer Science", total: "$4,800", items: [["Tuition", "$3600"], ["Lab", "$600"]] },
    { id: "FT-02", name: "B.Sc. Biochemistry", total: "$5,200", items: [["Tuition", "$3800"], ["Lab", "$900"]] }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Fee Control Center</h1>
        <div className="flex gap-2">
          <button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">Send reminders</button>
          <button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">Generate invoices</button>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-6">Templates, mass-invoice generation and collection status</p>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "Collected · Term", value: "$18,250", change: "+12%", positive: true },
          { label: "Outstanding", value: "$14,350", change: "2 overdue", positive: false },
          { label: "Templates", value: "3", change: "Active", positive: false },
          { label: "Auto-Retry Queue", value: "4", change: "Tomorrow 02:00", positive: false }
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">{s.label}</p>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className={`text-sm mt-1 font-medium ${s.positive ? "text-emerald-600" : "text-gray-400"}`}>{s.change}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex justify-between mb-2">
              <span className="text-xs text-gray-400 font-mono">{t.id}</span>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">Fall 2026</span>
            </div>
            <p className="text-sm font-bold text-gray-900 mb-1">{t.name}</p>
            <p className="text-2xl font-bold text-gray-900 mb-3">{t.total}</p>
            {t.items.map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs text-gray-500 py-0.5">
                <span>{k}</span>
                <span>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function RegistryResults() {
  const [toggles] = useState({ 0: true, 3: true });
  const batches = [
    { section: "CS · Section A · Y3", subject: "Algorithms", prog: 48, total: 48, released: "2026-05-02" },
    { section: "CS · Section A · Y3", subject: "Databases", prog: 48, total: 48, released: null },
    { section: "CS · Section B · Y2", subject: "Data Structures", prog: 41, total: 44, released: null }
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Publishing Hub</h1>
        <div className="flex gap-2">
          <button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">Preview release</button>
          <button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">Publish all complete</button>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-6">Master toggle for releasing marks to the student portal</p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Batches</p>
          <p className="text-3xl font-bold text-gray-900">5</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Released</p>
          <p className="text-3xl font-bold text-gray-900">2</p>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Hold</p>
          <p className="text-3xl font-bold text-white">3</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Result batches</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50">
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Section</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Subject</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Progress</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Status</th>
              <th className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">Toggle</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b, i) => (
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-700">{b.section}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{b.subject}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${b.prog === b.total ? "bg-emerald-500" : "bg-amber-400"}`} style={{ width: `${(b.prog / b.total) * 100}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{b.prog}/{b.total}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {b.released ? (
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Released · {b.released}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">Hold</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <button className="w-10 h-6 rounded-full transition-colors relative bg-gray-200">
                    <div className="w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm translate-x-1" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}