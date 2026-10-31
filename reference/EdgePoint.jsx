import { useState } from "react";

// ─── SHARED COMPONENTS ───────────────────────────────────────────────────────

function Badge({ children, color = "gray" }) {
  const colors = {
    green: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    orange: "bg-amber-50 text-amber-700 border border-amber-200",
    blue: "bg-blue-50 text-blue-700 border border-blue-200",
    red: "bg-red-50 text-red-700 border border-red-200",
    gray: "bg-gray-100 text-gray-600 border border-gray-200",
    dark: "bg-gray-800 text-gray-200 border border-gray-700",
    purple: "bg-purple-50 text-purple-700 border border-purple-200",
  };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[color]}`}>{children}</span>;
}

function TopBar({ breadcrumb }) {
  return (
    <div className="h-14 border-b border-gray-100 bg-white flex items-center justify-between px-6 flex-shrink-0">
      <div className="text-sm font-medium text-gray-500">
        {breadcrumb.map((b, i) => (
          <span key={i}>
            {i > 0 && <span className="mx-2 text-gray-300">/</span>}
            <span className={i === breadcrumb.length - 1 ? "text-gray-900" : ""}>{b}</span>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm bg-gray-50 text-gray-400 border border-gray-100">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <span className="text-xs">Search records, people, invoices…</span>
          <span className="text-xs ml-1 px-1 rounded bg-gray-200">⌘K</span>
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
        </button>
      </div>
    </div>
  );
}

function SidebarLayout({ logo, nav, footer, children }) {
  return (
    <div className="flex h-screen font-sans overflow-hidden bg-gray-50 text-gray-900">
      <aside className="w-60 flex-shrink-0 flex flex-col border-r border-gray-100 bg-white">
        <div className="h-14 flex items-center px-4 border-b border-gray-100 flex-shrink-0">{logo}</div>
        <nav className="flex-1 py-4 px-3 overflow-y-auto">{nav}</nav>
        <div className="p-3 border-t border-gray-100">{footer}</div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">{children}</main>
    </div>
  );
}

function NavItem({ icon, label, active = false, onClick }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${active ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}`}>
      <span>{icon}</span>{label}
    </button>
  );
}

function SectionLabel({ children }) {
  return <p className="text-xs font-semibold tracking-widest uppercase px-3 mb-2 mt-4 text-gray-400">{children}</p>;
}

function UserFooter({ initials, name, sub, onLogout }) {
  return (
    <div className="flex items-center gap-2 px-1">
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-700 flex-shrink-0">{initials}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate text-gray-900">{name}</p>
        <p className="text-xs truncate text-gray-400">{sub}</p>
      </div>
      <button onClick={onLogout} className="flex-shrink-0 text-gray-300 hover:text-gray-600">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
      </button>
    </div>
  );
}

const Icons = {
  Today: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2}/><line x1="16" y1="2" x2="16" y2="6" strokeWidth={2}/><line x1="8" y1="2" x2="8" y2="6" strokeWidth={2}/><line x1="3" y1="10" x2="21" y2="10" strokeWidth={2}/></svg>,
  Marks: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>,
  Analytics: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth={2}/></svg>,
  Wallet: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>,
  Profile: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>,
  Classes: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>,
  Attendance: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>,
  Gradebook: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18"/></svg>,
  Overview: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" strokeWidth={2}/><rect x="14" y="3" width="7" height="7" strokeWidth={2}/><rect x="14" y="14" width="7" height="7" strokeWidth={2}/><rect x="3" y="14" width="7" height="7" strokeWidth={2}/></svg>,
  Staff: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>,
  Curriculum: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>,
  Assignments: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>,
  Fees: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Results: () => <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
};

// ─── LANDING ─────────────────────────────────────────────────────────────────

function Landing({ navigate }) {
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
          <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center"><div className="w-3 h-3 bg-white rounded-full"/></div>
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

// ─── LOGIN ────────────────────────────────────────────────────────────────────

function Login({ navigate, selectedRole }) {
  const [role, setRole] = useState(selectedRole || "registry");
  const roles = [
    { id: "superadmin", label: "Super Admin", sub: "Platform Operator" },
    { id: "registry", label: "College Admin", sub: "Institution Lead" },
    { id: "faculty", label: "Teacher", sub: "Faculty Member" },
    { id: "student", label: "Student / Parent", sub: "Learner" },
  ];
  const emails = { student: "julianne.sterling@stjudes.edu", faculty: "m.hale@stjudes.edu", superadmin: "dr.aris.thorne@stjudes.edu", registry: "priya.raman@stjudes.edu" };
  return (
    <div className="min-h-screen flex font-sans">
      <div className="w-1/2 bg-gray-900 flex flex-col justify-between p-12">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center"><div className="w-3 h-3 bg-gray-900 rounded-full"/></div>
          <span className="font-bold text-white">EdgePoint</span>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-4">Workspace · St. Jude's University</p>
          <blockquote className="text-3xl font-bold text-white leading-snug mb-6">"We migrated 14 campuses in a single term. Registrars finally got a quiet morning back."</blockquote>
          <p className="text-white font-semibold">Dr. Aris Thorne</p>
          <p className="text-gray-400 text-sm">Chief Academic Officer · St. Jude's</p>
        </div>
        <div className="flex gap-4 text-xs text-gray-600 font-semibold tracking-widest"><span>SOC 2</span><span>·</span><span>FERPA</span><span>·</span><span>ISO 27001</span></div>
      </div>
      <div className="w-1/2 bg-white flex items-center justify-center p-12">
        <div className="w-full max-w-md">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">Sign In</p>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Enter the console</h2>
          <p className="text-gray-400 text-sm mb-8">Demo build — pick a role to enter the matching workspace.</p>
          <div className="mb-6">
            <p className="text-sm font-semibold text-gray-700 mb-3">Workspace role</p>
            <div className="grid grid-cols-2 gap-2">
              {roles.map((r) => (
                <button key={r.id} onClick={() => setRole(r.id)} className={`p-3 rounded-lg border text-left transition-all ${role === r.id ? "bg-gray-900 border-gray-900 text-white" : "border-gray-200 hover:border-gray-300 text-gray-700"}`}>
                  <p className="text-sm font-semibold">{r.label}</p>
                  <p className={`text-xs mt-0.5 ${role === r.id ? "text-gray-400" : "text-gray-400"}`}>{r.sub}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input type="email" value={emails[role]} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-400"/>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
            <input type="password" defaultValue="password" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-gray-400"/>
          </div>
          <button onClick={() => navigate(role)} className="w-full bg-gray-900 text-white font-semibold text-sm py-3 rounded-lg hover:bg-gray-700 transition-colors">
            Continue to {roles.find(r2 => r2.id === role)?.label}
          </button>
          <p className="text-center text-xs text-gray-400 mt-4">By continuing you agree to the EdgePoint Acceptable Use Policy.</p>
        </div>
      </div>
    </div>
  );
}

// ─── STUDENT PORTAL ───────────────────────────────────────────────────────────

function StudentPortal({ navigate }) {
  const [active, setActive] = useState("today");
  const logo = (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center"><div className="w-2.5 h-2.5 bg-white rounded-full"/></div>
      <div><p className="text-sm font-bold text-gray-900 leading-none">St. Jude's University</p><p className="text-xs text-gray-400">MAIN CAMPUS</p></div>
    </div>
  );
  const nav = (
    <>
      <SectionLabel>Student Portal</SectionLabel>
      {[{id:"today",label:"Today",icon:<Icons.Today/>},{id:"marks",label:"Marks",icon:<Icons.Marks/>},{id:"exams",label:"Exam Schedule",icon:<Icons.Assignments/>},{id:"analytics",label:"Analytics",icon:<Icons.Analytics/>},{id:"wallet",label:"Wallet",icon:<Icons.Wallet/>}].map(item => (
        <NavItem key={item.id} {...item} active={active===item.id} onClick={()=>setActive(item.id)}/>
      ))}
      <SectionLabel>Account</SectionLabel>
      <NavItem icon={<Icons.Profile/>} label="Profile"/>
    </>
  );
  const titles = {today:"Today",marks:"Marks",exams:"Exam Schedule",analytics:"Analytics",wallet:"Wallet"};
  return (
    <SidebarLayout logo={logo} nav={nav} footer={<UserFooter initials="JS" name="Julianne Sterling" sub="BSc · Year 3" onLogout={()=>navigate("landing")}/>}>
      <TopBar breadcrumb={["Portal", titles[active]]}/>
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {active==="today" && <StudentToday/>}
        {active==="marks" && <StudentMarks/>}
        {active==="exams" && <StudentExams/>}
        {active==="analytics" && <StudentAnalytics/>}
        {active==="wallet" && <StudentWallet/>}
      </div>
    </SidebarLayout>
  );
}

function StudentToday() {
  const timeline = [
    {title:"Algorithms · Midterm released",meta:"92 / 100 · Class avg 78",time:"TODAY · 11:42",tag:"mark",tc:"blue"},
    {title:"Marked Present · Databases",meta:"B-211 · 14:00",time:"YESTERDAY",tag:"attendance",tc:"gray"},
    {title:"Tuition installment received",meta:"$2,400 · Receipt INV-2842",time:"2 DAYS AGO",tag:"fee",tc:"gray"},
    {title:"Genetics · Quiz 4 released",meta:"18 / 20 · Class avg 14.2",time:"3 DAYS AGO",tag:"mark",tc:"blue"},
    {title:"Marked Absent · Operating Sys.",meta:"B-204 · 10:00",time:"5 DAYS AGO",tag:"attendance",tc:"orange"},
    {title:"Library hours extended",meta:"Open until 23:00 during finals",time:"1 WEEK AGO",tag:"notice",tc:"orange"},
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Today, Julianne</h1>
      <p className="text-sm text-gray-400 mb-6">Wednesday · 13 May 2026 · BSc Computer Science · Year 3</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[{l:"Term GPA",v:"3.92",s:"+0.08 vs last term",sc:"text-emerald-600"},{l:"Attendance",v:"96%",s:"Top 12% of class",sc:"text-emerald-600"},{l:"Outstanding Fees",v:"$0",s:"All paid",sc:"text-emerald-600"},{l:"New Marks",v:"2",s:"Released today",sc:"text-gray-400"}].map(s=>(
          <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">{s.l}</p>
            <p className="text-3xl font-bold text-gray-900">{s.v}</p>
            <p className={`text-sm mt-1 font-medium ${s.sc}`}>{s.s}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Story timeline</h2>
          <div className="space-y-4">
            {timeline.map((item,i)=>(
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5"><div className="w-2 h-2 rounded-full bg-gray-400"/></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5"><p className="text-sm font-medium text-gray-900">{item.title}</p><Badge color={item.tc}>{item.tag}</Badge></div>
                  <p className="text-xs text-gray-500">{item.meta}</p>
                  <p className="text-xs text-gray-300 mt-0.5 font-medium tracking-wide">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-4">Today's schedule</h2>
            {[{t:"10:00",s:"Algorithms",r:"B-204"},{t:"12:00",s:"Lunch break",r:"—"},{t:"14:00",s:"Databases",r:"B-211"},{t:"16:00",s:"Project clinic",r:"Lab 3"}].map((s,i)=>(
              <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0">
                <span className="text-xs font-mono text-gray-400 w-12">{s.t}</span>
                <div><p className="text-sm font-medium text-gray-900">{s.s}</p><p className="text-xs text-gray-400">{s.r}</p></div>
              </div>
            ))}
          </div>
          <div className="bg-gray-900 rounded-xl p-5">
            <p className="text-xs font-semibold tracking-widest text-gray-500 uppercase mb-2">Streak</p>
            <p className="text-4xl font-bold text-white">14 days</p>
            <p className="text-sm text-gray-400 mt-1">Of full attendance. Personal best.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StudentMarks() {
  const [sem, setSem] = useState("5");
  const subjects = [
    {code:"CS501",name:"Algorithms",int:28,ext:64,total:92,grade:"A+"},
    {code:"CS502",name:"Databases",int:26,ext:59,total:85,grade:"A"},
    {code:"CS503",name:"Operating Sys.",int:22,ext:49,total:71,grade:"B+"},
    {code:"CS504",name:"Networks",int:27,ext:61,total:88,grade:"A"},
    {code:"CS505",name:"AI Foundations",int:24,ext:55,total:79,grade:"B+"},
  ];
  const gc = (g) => g.startsWith("A") ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-blue-50 text-blue-700 border border-blue-200";
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Examination Marks</h1>
      <p className="text-sm text-gray-400 mb-6">Internal continuous assessment and external university marks</p>
      <div className="flex gap-2 mb-6">
        {[["5","Sem 5 · 2025-26"],["4","Sem 4 · 2024-25"],["3","Sem 3 · 2024-25"]].map(([id,label])=>(
          <button key={id} onClick={()=>setSem(id)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${sem===id?"bg-gray-900 text-white":"bg-white border border-gray-200 text-gray-600 hover:border-gray-300"}`}>{label}</button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50"><h2 className="text-sm font-bold text-gray-900">Sem 5 · 2025-26 · Mark sheet</h2></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-50">{["","Code","Subject","Internal / 30","External / 70","Total / 100","Grade"].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">{h}</th>)}</tr></thead>
          <tbody>
            {subjects.map(s=>(
              <tr key={s.code} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-gray-300 text-xs">›</td>
                <td className="py-3 px-4 text-xs text-gray-400 font-mono">{s.code}</td>
                <td className="py-3 px-4 text-gray-900 font-medium">{s.name}</td>
                <td className="py-3 px-4 text-right text-gray-700">{s.int}</td>
                <td className="py-3 px-4 text-right text-gray-700">{s.ext}</td>
                <td className="py-3 px-4 text-right font-bold text-gray-900">{s.total}</td>
                <td className="py-3 px-4 text-right"><span className={`text-xs font-bold px-2 py-0.5 rounded-full ${gc(s.grade)}`}>{s.grade}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentExams() {
  const exams = [
    {date:"2026-05-15",past:true,code:"CS501-I",subject:"Algorithms · Internal II",time:"10:00 – 11:30",room:"B-204",type:"Internal"},
    {date:"2026-05-17",past:true,code:"CS502-I",subject:"Databases · Internal II",time:"10:00 – 11:30",room:"B-211",type:"Internal"},
    {date:"2026-05-22",code:"CS501",subject:"Algorithms",time:"09:30 – 12:30",room:"Hall A",type:"External"},
    {date:"2026-05-25",code:"CS502",subject:"Databases",time:"09:30 – 12:30",room:"Hall A",type:"External"},
    {date:"2026-05-28",code:"CS503",subject:"Operating Sys.",time:"14:00 – 17:00",room:"Hall B",type:"External"},
    {date:"2026-06-01",code:"CS504",subject:"Networks",time:"09:30 – 12:30",room:"Hall A",type:"External"},
    {date:"2026-06-04",code:"CS505",subject:"AI Foundations",time:"14:00 – 17:00",room:"Hall C",type:"External"},
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Exam Schedule</h1>
      <p className="text-sm text-gray-400 mb-6">Upcoming internal and external assessments</p>
      <div className="bg-white rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-50">{["Date","Code","Subject","Time","Room","Type"].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">{h}</th>)}</tr></thead>
          <tbody>
            {exams.map((e,i)=>(
              <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${e.past?"opacity-50":""}`}>
                <td className="py-3 px-4"><p className="font-mono font-semibold text-gray-900">{e.date}</p>{e.past&&<p className="text-xs text-gray-400">past</p>}</td>
                <td className="py-3 px-4 text-xs text-gray-400 font-mono">{e.code}</td>
                <td className="py-3 px-4 text-gray-900 font-medium">{e.subject}</td>
                <td className="py-3 px-4 text-gray-600">{e.time}</td>
                <td className="py-3 px-4 text-gray-600">{e.room}</td>
                <td className="py-3 px-4"><Badge color={e.type==="Internal"?"blue":"orange"}>{e.type}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentAnalytics() {
  const subjects = [
    {name:"Algorithms",score:92,avg:78,delta:"+6",above:true},
    {name:"Databases",score:85,avg:74,delta:"+2",above:true},
    {name:"Operating Sys.",score:71,avg:76,delta:"-4",above:false},
    {name:"Networks",score:88,avg:80,delta:"+3",above:true},
    {name:"AI Foundations",score:79,avg:72,delta:"+1",above:true},
  ];
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">How am I doing?</h1>
      <p className="text-sm text-gray-400 mb-6">Cross-subject performance, growth and class comparison</p>
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-6">Subject performance vs class average</h2>
          <div className="flex items-end gap-6 h-36 mb-4">
            {subjects.map(s=>(
              <div key={s.name} className="flex-1 flex flex-col items-center">
                <div className="w-full flex items-end gap-1 h-28">
                  <div className="flex-1 bg-blue-500 rounded-t transition-all" style={{height:`${(s.score/100)*100}%`}}/>
                  <div className="flex-1 bg-gray-200 rounded-t" style={{height:`${(s.avg/100)*100}%`}}/>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">{s.name.split(" ")[0]}</p>
              </div>
            ))}
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500"/><span>You</span></div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-gray-300"/><span>Class average</span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Month-over-month growth</h2>
          <svg viewBox="0 0 200 100" className="w-full h-32">
            <defs><linearGradient id="mg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/></linearGradient></defs>
            {(() => {
              const pts = [40,45,42,50,55,58,62,70];
              const mx = Math.max(...pts);
              const coords = pts.map((v,i)=>`${(i/(pts.length-1))*200},${100-(v/mx)*90}`);
              return <>
                <path d={`M ${coords.join(" L ")}`} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d={`M 0,${100-(pts[0]/mx)*90} ${coords.map(c=>`L ${c}`).join(" ")} L 200,100 L 0,100 Z`} fill="url(#mg)"/>
              </>;
            })()}
          </svg>
          <p className="text-2xl font-bold text-gray-900 mt-2">+22.5%</p>
          <p className="text-sm text-gray-400">since September</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50"><h2 className="text-sm font-bold text-gray-900">Subject breakdown</h2></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-50">{["Subject","Your Score","Class Average","Δ vs Last Exam","Standing"].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">{h}</th>)}</tr></thead>
          <tbody>
            {subjects.map(s=>(
              <tr key={s.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                <td className="py-3 px-4 text-gray-700">{s.score}</td>
                <td className="py-3 px-4 text-gray-700">{s.avg}</td>
                <td className={`py-3 px-4 font-semibold ${s.above?"text-emerald-600":"text-red-500"}`}>{s.delta}</td>
                <td className="py-3 px-4"><Badge color={s.above?"green":"red"}>{s.above?"Above average":"Below average"}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StudentWallet() {
  const receipts = [
    {id:"RC-9821",desc:"Tuition · Installment 1",date:"2026-01-10",method:"Card · Visa 4242",amount:"$2,400"},
    {id:"RC-9822",desc:"Library Levy",date:"2026-01-10",method:"Card · Visa 4242",amount:"$200"},
    {id:"RC-9920",desc:"Tuition · Installment 2",date:"2026-04-04",method:"Bank Transfer",amount:"$2,400"},
    {id:"RC-9981",desc:"Lab Fees",date:"2026-04-04",method:"Bank Transfer",amount:"$600"},
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>
        <button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">Download all receipts</button>
      </div>
      <p className="text-sm text-gray-400 mb-6">Payment history, receipts and upcoming charges</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5"><p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Paid · This Term</p><p className="text-3xl font-bold text-gray-900">$5,600</p><p className="text-sm mt-1 text-gray-400">100%</p></div>
        <div className="bg-white rounded-xl border border-gray-100 p-5"><p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Outstanding</p><p className="text-3xl font-bold text-gray-900">$0</p><p className="text-sm mt-1 text-emerald-600 font-medium">All clear</p></div>
        <div className="bg-white rounded-xl border border-gray-100 p-5"><p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Next Due</p><p className="text-3xl font-bold text-gray-900">Sep 15</p><p className="text-sm mt-1 text-gray-400">Installment 1 · Fall</p></div>
        <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-3">Saved Method</p>
          <p className="text-gray-200 font-mono text-sm mb-1">•••• 4242 <span className="ml-4 text-gray-500 text-xs">VISA</span></p>
          <p className="text-xs text-gray-500 mb-3">Julianne Sterling · Exp 04/29</p>
          <button className="w-full text-xs font-semibold text-gray-400 border border-gray-700 rounded-lg py-2 hover:bg-gray-800 transition-colors">Manage payment methods</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50"><h2 className="text-sm font-bold text-gray-900">Receipts</h2></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-50">{["Receipt","Description","Date","Method","Amount","Status"].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">{h}</th>)}</tr></thead>
          <tbody>
            {receipts.map(r=>(
              <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{r.id}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{r.desc}</td>
                <td className="py-3 px-4 text-gray-400 font-mono text-xs">{r.date}</td>
                <td className="py-3 px-4 text-gray-600">{r.method}</td>
                <td className="py-3 px-4 font-semibold text-gray-900">{r.amount}</td>
                <td className="py-3 px-4"><Badge color="green">Paid</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── FACULTY PORTAL ───────────────────────────────────────────────────────────

function FacultyPortal({ navigate }) {
  const [active, setActive] = useState("classes");
  const [selectedClass, setSelectedClass] = useState(null);
  const logo = (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">St</div>
      <div><p className="text-sm font-bold text-gray-900 leading-none">St. Jude's University</p><p className="text-xs text-gray-400">MAIN CAMPUS</p></div>
    </div>
  );
  const nav = (
    <>
      <SectionLabel>Faculty Tools</SectionLabel>
      {[{id:"classes",label:"My Classes",icon:<Icons.Classes/>},{id:"attendance",label:"Attendance Grid",icon:<Icons.Attendance/>},{id:"gradebook",label:"Gradebook",icon:<Icons.Gradebook/>}].map(item=>(
        <NavItem key={item.id} {...item} active={active===item.id} onClick={()=>{setActive(item.id);setSelectedClass(null);}}/>
      ))}
      <SectionLabel>Account</SectionLabel>
      <NavItem icon={<Icons.Profile/>} label="Profile"/>
    </>
  );
  const bc = selectedClass ? ["Faculty","My Classes",selectedClass.name] : active==="classes" ? ["Faculty","My Classes"] : active==="attendance" ? ["Faculty","Algorithms","Attendance"] : ["Faculty","Algorithms · CS-A · Y3","Gradebook"];
  return (
    <SidebarLayout logo={logo} nav={nav} footer={<UserFooter initials="MH" name="Marcus Hale" sub="Computer Science" onLogout={()=>navigate("landing")}/>}>
      <TopBar breadcrumb={bc}/>
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {active==="classes" && !selectedClass && <FacultyCommandCenter onSelect={cls=>{setSelectedClass(cls);}}/>}
        {active==="classes" && selectedClass && <FacultyClassDetail cls={selectedClass} onBack={()=>setSelectedClass(null)}/>}
        {active==="attendance" && <FacultyAttendance/>}
        {active==="gradebook" && <FacultyGradebook/>}
      </div>
    </SidebarLayout>
  );
}

function FacultyCommandCenter({ onSelect }) {
  const classes = [
    {name:"Algorithms",code:"CS · A · Y3",students:48,time:"Today · 10:00",room:"B-204"},
    {name:"Databases",code:"CS · A · Y3",students:48,time:"Today · 14:00",room:"B-211"},
    {name:"Data Structures",code:"CS · B · Y2",students:44,time:"Tomorrow · 09:00",room:"A-118"},
    {name:"AI Foundations",code:"CS · A · Y4",students:36,time:"Thursday · 11:00",room:"B-301"},
  ];
  const flagged = [
    {initials:"NH",name:"Noor Hassan",subject:"Algorithms",reason:"Marks dropped 24% from last assessment"},
    {initials:"EV",name:"Elara Vance",subject:"Databases",reason:"Attendance below 75% threshold"},
    {initials:"MC",name:"Marcus Chen",subject:"Data Structures",reason:"Missed 2 consecutive submissions"},
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
        <button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">Start session</button>
      </div>
      <p className="text-sm text-gray-400 mb-6">Welcome back, Marcus · 4 active sections this term</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[{l:"Sessions Today",v:"2",s:"Next at 10:00"},{l:"Pending Grading",v:"36",s:"Across 2 subjects"},{l:"Avg Attendance",v:"89%",s:"+1.2%",sc:"text-emerald-600"},{l:"Needs Attention",v:"3",s:"Students flagged",sc:"text-red-500"}].map(s=>(
          <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-5">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">{s.l}</p>
            <p className="text-3xl font-bold text-gray-900">{s.v}</p>
            <p className={`text-sm mt-1 font-medium ${s.sc||"text-gray-400"}`}>{s.s}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {classes.map(cls=>(
          <button key={cls.name} onClick={()=>onSelect(cls)} className="bg-white rounded-xl border border-gray-100 p-5 text-left hover:border-gray-300 hover:shadow-sm transition-all group">
            <div className="flex items-center justify-between mb-4"><span className="text-xs text-gray-400 font-mono">{cls.code}</span><span className="text-gray-300 group-hover:text-gray-600 transition-colors">→</span></div>
            <p className="text-lg font-bold text-gray-900 mb-3">{cls.name}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>👥 {cls.students}</span><span>🕐 {cls.time}</span><span>📍 {cls.room}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50"><h2 className="text-sm font-bold text-gray-900">Needs attention</h2></div>
        {flagged.map((f,i)=>(
          <div key={i} className="flex items-center gap-3 px-5 py-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">{f.initials}</div>
            <div className="flex-1"><p className="text-sm font-medium text-gray-900">{f.name} <span className="text-gray-400 font-normal">· {f.subject}</span></p><p className="text-xs text-gray-400">{f.reason}</p></div>
            <button className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">Open profile</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FacultyClassDetail({ cls, onBack }) {
  const students = [
    {id:"S-2401",name:"Julianne Sterling",att:"70%",grade:60},{id:"S-2402",name:"Marcus Chen",att:"83%",grade:67},
    {id:"S-2403",name:"Elara Vance",att:"96%",grade:74},{id:"S-2404",name:"Dimitri Petrov",att:"79%",grade:81},
    {id:"S-2405",name:"Lin Zhao",att:"92%",grade:88},{id:"S-2406",name:"Noor Hassan",att:"75%",grade:95},
    {id:"S-2407",name:"Felix Ortega",att:"88%",grade:62},{id:"S-2408",name:"Anika Sørensen",att:"71%",grade:69},
    {id:"S-2409",name:"Tomás Riveros",att:"84%",grade:76},{id:"S-2410",name:"Yuki Watanabe",att:"97%",grade:83},
    {id:"S-2411",name:"Hanan El-Amin",att:"80%",grade:90},{id:"S-2412",name:"Oliver Brennan",att:"93%",grade:97},
  ];
  return (
    <div>
      <button onClick={onBack} className="text-xs text-gray-400 hover:text-gray-700 mb-4 flex items-center gap-1 transition-colors">← Back to classes</button>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>
        <div className="flex gap-2">
          <button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">Mark attendance</button>
          <button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">Open gradebook</button>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-6">{cls.code} · {cls.students} students · Next {cls.time} · {cls.room}</p>
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50"><h2 className="text-sm font-bold text-gray-900">Roster</h2></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-50">{["ID","Student","Attendance","Last Grade","Quick Actions"].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">{h}</th>)}</tr></thead>
          <tbody>
            {students.map(s=>(
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{s.id}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                <td className={`py-3 px-4 font-semibold ${parseInt(s.att)<75?"text-red-500":"text-gray-700"}`}>{s.att}</td>
                <td className="py-3 px-4 text-gray-700">{s.grade}</td>
                <td className="py-3 px-4"><div className="flex gap-2"><button className="text-xs border border-gray-100 rounded px-2 py-1 text-gray-500 hover:text-gray-900 transition-colors">📋 Mark</button><button className="text-xs border border-gray-100 rounded px-2 py-1 text-gray-500 hover:text-gray-900 transition-colors">📄 Grade</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FacultyAttendance() {
  const students = [
    {id:"S-2401",name:"Julianne Sterling",h:["P","A","P","P"]},{id:"S-2402",name:"Marcus Chen",h:["P","P","L","P"]},
    {id:"S-2403",name:"Elara Vance",h:["P","L","P","P"]},{id:"S-2404",name:"Dimitri Petrov",h:["P","P","P","A"]},
    {id:"S-2405",name:"Lin Zhao",h:["P","P","P","P"]},{id:"S-2406",name:"Noor Hassan",h:["A","P","P","P"]},
    {id:"S-2407",name:"Felix Ortega",h:["P","P","L","P"]},{id:"S-2408",name:"Anika Sørensen",h:["P","L","P","A"]},
    {id:"S-2409",name:"Tomás Riveros",h:["P","P","P","A"]},{id:"S-2410",name:"Yuki Watanabe",h:["P","P","P","P"]},
    {id:"S-2411",name:"Hanan El-Amin",h:["A","P","P","P"]},{id:"S-2412",name:"Oliver Brennan",h:["P","P","L","P"]},
  ];
  const [today, setToday] = useState(students.map(()=>"P"));
  const dc = (v) => v==="P"?"bg-emerald-500":v==="L"?"bg-amber-400":"bg-red-400";
  const presentCount = today.filter(v=>v==="P").length;
  const lateCount = today.filter(v=>v==="L").length;
  const absentCount = today.filter(v=>v==="A").length;
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Attendance Grid</h1>
      <p className="text-sm text-gray-400 mb-6">Algorithms · CS · A · Y3</p>
      <div className="bg-white rounded-xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-6 flex-wrap">
          <div><label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">Class</label><select className="border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none"><option>Algorithms · CS · A · Y3</option></select></div>
          <div><label className="text-xs font-semibold text-gray-400 uppercase tracking-widest block mb-1">Date</label><input type="date" defaultValue="2026-05-18" className="border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-700 focus:outline-none"/></div>
          <div className="ml-auto flex gap-6">
            <div className="text-center"><p className="text-2xl font-bold text-emerald-600">{presentCount}</p><p className="text-xs text-gray-400">Present</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-amber-500">{lateCount}</p><p className="text-xs text-gray-400">Late</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-red-500">{absentCount}</p><p className="text-xs text-gray-400">Absent</p></div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-4 border-b border-gray-50 flex items-center justify-between flex-wrap gap-2">
          <input placeholder="Search students…" className="border border-gray-100 rounded-lg px-3 py-1.5 text-sm text-gray-600 focus:outline-none w-56"/>
          <div className="flex gap-2">
            <button onClick={()=>setToday(students.map(()=>"P"))} className="text-xs font-semibold border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">All present</button>
            <button onClick={()=>setToday(students.map(()=>"A"))} className="text-xs font-semibold border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">All absent</button>
            <button className="bg-gray-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">Save attendance</button>
          </div>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-50">{["ID","Student","Last 4 Sessions","Today"].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">{h}</th>)}</tr></thead>
          <tbody>
            {students.map((s,i)=>(
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{s.id}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                <td className="py-3 px-4"><div className="flex gap-1.5">{s.h.map((h,j)=><div key={j} className={`w-3 h-3 rounded-full ${dc(h)}`}/>)}</div></td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-1">
                    {["P","L","A"].map(opt=>(
                      <button key={opt} onClick={()=>setToday(prev=>{const n=[...prev];n[i]=opt;return n;})}
                        className={`text-xs font-semibold px-2.5 py-1 rounded transition-all ${today[i]===opt?(opt==="P"?"bg-emerald-500 text-white":opt==="L"?"bg-amber-400 text-white":"bg-red-400 text-white"):"text-gray-400 hover:bg-gray-100"}`}>
                        {opt==="P"?"✓ P":opt==="L"?"L":"× A"}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FacultyGradebook() {
  const students = [
    {id:"S-2401",name:"Julianne Sterling",mid:92,proj:88,att:"96%",avg:90,standing:"Excelling"},
    {id:"S-2402",name:"Marcus Chen",mid:78,proj:82,att:"88%",avg:80,standing:"On track"},
    {id:"S-2403",name:"Elara Vance",mid:64,proj:70,att:"71%",avg:67,standing:"Pending"},
    {id:"S-2404",name:"Dimitri Petrov",mid:95,proj:91,att:"98%",avg:93,standing:"Excelling"},
    {id:"S-2405",name:"Lin Zhao",mid:81,proj:84,att:"92%",avg:83,standing:"On track"},
    {id:"S-2406",name:"Noor Hassan",mid:58,proj:62,att:"64%",avg:60,standing:"Pending"},
    {id:"S-2407",name:"Felix Ortega",mid:86,proj:80,att:"90%",avg:83,standing:"On track"},
    {id:"S-2408",name:"Anika Sørensen",mid:89,proj:92,att:"94%",avg:91,standing:"Excelling"},
  ];
  const sc = (s) => s==="Excelling"?"bg-emerald-50 text-emerald-700 border border-emerald-200":s==="On track"?"bg-blue-50 text-blue-700 border border-blue-200":"bg-amber-50 text-amber-700 border border-amber-200";
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Gradebook</h1>
        <div className="flex gap-2"><button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">Export CSV</button><button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">Submit for review</button></div>
      </div>
      <p className="text-sm text-gray-400 mb-6">Spreadsheet-style entry · changes save when you commit</p>
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-4 border-b border-gray-50 flex gap-3">
          <input placeholder="Search students…" className="flex-1 border border-gray-100 rounded-lg px-3 py-1.5 text-sm text-gray-600 focus:outline-none"/>
          <select className="border border-gray-100 rounded-lg px-3 py-1.5 text-sm text-gray-600 focus:outline-none"><option>Standing: All</option><option>Excelling</option><option>On track</option><option>Pending</option></select>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-50">{["ID","Student","Mid","Project","Final","Attendance","Avg","Standing"].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">{h}</th>)}</tr></thead>
          <tbody>
            {students.map(s=>(
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{s.id}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                <td className="py-3 px-4 text-gray-700">{s.mid}</td>
                <td className="py-3 px-4 text-gray-700">{s.proj}</td>
                <td className="py-3 px-4 text-gray-300">—</td>
                <td className={`py-3 px-4 font-semibold ${parseInt(s.att)<75?"text-red-500":"text-gray-700"}`}>{s.att}</td>
                <td className="py-3 px-4 font-bold text-gray-900">{s.avg}</td>
                <td className="py-3 px-4"><span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${sc(s.standing)}`}>{s.standing}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REGISTRY PORTAL ──────────────────────────────────────────────────────────

function RegistryPortal({ navigate }) {
  const [active, setActive] = useState("overview");
  const logo = (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-xs">St</div>
      <div><p className="text-sm font-bold text-gray-900 leading-none">St. Jude's University</p><p className="text-xs text-gray-400">MAIN CAMPUS</p></div>
    </div>
  );
  const nav = (
    <>
      <SectionLabel>Administrative</SectionLabel>
      {[{id:"overview",label:"Executive Overview",icon:<Icons.Overview/>},{id:"staff",label:"Staff Room",icon:<Icons.Staff/>},{id:"curriculum",label:"Curriculum Builder",icon:<Icons.Curriculum/>},{id:"assignments",label:"Assignments",icon:<Icons.Assignments/>},{id:"fees",label:"Fee Control",icon:<Icons.Fees/>},{id:"results",label:"Results Publishing",icon:<Icons.Results/>}].map(item=>(
        <NavItem key={item.id} {...item} active={active===item.id} onClick={()=>setActive(item.id)}/>
      ))}
      <SectionLabel>Account</SectionLabel>
      <NavItem icon={<Icons.Profile/>} label="Profile"/>
    </>
  );
  const titles = {overview:"Executive Overview",staff:"Staff Room",curriculum:"Curriculum Builder",assignments:"Assignments",fees:"Fee Control",results:"Results Publishing"};
  return (
    <SidebarLayout logo={logo} nav={nav} footer={<UserFooter initials="PR" name="Priya Raman" sub="Registrar" onLogout={()=>navigate("landing")}/>}>
      <TopBar breadcrumb={["Registry", titles[active]]}/>
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {active==="overview" && <RegistryOverview/>}
        {active==="staff" && <RegistryStaff/>}
        {active==="curriculum" && <RegistryCurriculum/>}
        {active==="assignments" && <RegistryAssignments/>}
        {active==="fees" && <RegistryFees/>}
        {active==="results" && <RegistryResults/>}
      </div>
    </SidebarLayout>
  );
}

function RegistryOverview() {
  const months = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
  const vals = [18,22,21,25,30,35,38,42,38,45,50,56];
  const mx = Math.max(...vals);
  const pts = vals.map((v,i)=>`${(i/(vals.length-1))*560},${110-(v/mx)*100}`).join(" L ");
  const area = `M 0,${110-(vals[0]/mx)*100} L ${pts.replace("M ","")} L 560,110 L 0,110 Z`;
  const activity = [
    {actor:"Marcus Hale",ac:"bg-blue-100 text-blue-700",action:"released midterm grades",detail:"Algorithms · CS-A · Y3",time:"11 min ago"},
    {actor:"Priya Raman",ac:"bg-purple-100 text-purple-700",action:"generated invoices",detail:"Fall 2026 · 248 students",time:"1 hr ago"},
    {actor:"Helena Vorga",ac:"bg-green-100 text-green-700",action:"added new subject",detail:"Distributed Systems → CS",time:"3 hr ago"},
    {actor:"System",ac:"bg-gray-100 text-gray-600",action:"auto-retried 4 failed payments",detail:"Stripe · USD",time:"Yesterday"},
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-gray-900">Executive Overview</h1>
        <div className="flex gap-2"><button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">Export term report</button><button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">New announcement</button></div>
      </div>
      <p className="text-sm text-gray-400 mb-6">St. Jude's University · Fall term 2026</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[{l:"Active Enrollment",v:"12,482",s:"+2.4%",sc:"text-emerald-600"},{l:"Term Revenue",v:"$4.28M",s:"Steady",sc:"text-gray-400"},{l:"Avg Attendance",v:"94.1%",s:"-0.8%",sc:"text-red-500"},{l:"Faculty",v:"882",s:"+12 new",sc:"text-emerald-600"}].map(s=>(
          <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-5"><p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">{s.l}</p><p className="text-3xl font-bold text-gray-900">{s.v}</p><p className={`text-sm mt-1 font-medium ${s.sc}`}>{s.s}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4"><h2 className="text-sm font-bold text-gray-900">Fee collection trend</h2><select className="border border-gray-100 rounded-lg px-3 py-1.5 text-xs text-gray-600 focus:outline-none"><option>Last 12 months</option></select></div>
          <svg viewBox="0 0 560 120" className="w-full h-36" preserveAspectRatio="none">
            <defs><linearGradient id="rg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.15"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/></linearGradient></defs>
            <path d={`M ${pts}`} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d={area} fill="url(#rg)"/>
          </svg>
          <div className="flex justify-between text-xs text-gray-400 mt-2">{months.map(m=><span key={m}>{m}</span>)}</div>
        </div>
        <div className="bg-gray-900 rounded-xl p-5">
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Compliance</p>
          <h2 className="text-base font-bold text-white mb-4">3 active alerts</h2>
          {[{c:"bg-amber-400",t:"Faculty credential review due Oct 14"},{c:"bg-blue-400",t:"Mid-term grade publishing window opens Sep 21"},{c:"bg-red-400",t:"26 invoices marked overdue"}].map((a,i)=>(
            <div key={i} className="flex items-start gap-2.5 mb-3"><div className={`w-2 h-2 rounded-full ${a.c} mt-1 flex-shrink-0`}/><p className="text-xs text-gray-400 leading-relaxed">{a.t}</p></div>
          ))}
          <button className="mt-2 w-full text-xs font-semibold text-gray-500 border border-gray-700 rounded-lg py-2 hover:bg-gray-800 transition-colors">Open compliance log</button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        <h2 className="text-sm font-bold text-gray-900 mb-4">Recent activity</h2>
        <div className="space-y-3">
          {activity.map((a,i)=>(
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
  const staff = [
    {id:"F-1041",name:"Dr. Helena Vorga",dept:"Computer Science",role:"Professor",email:"h.vorga@stjudes.edu",load:18,status:"Active"},
    {id:"F-1042",name:"Marcus Hale",dept:"Computer Science",role:"Asst. Professor",email:"m.hale@stjudes.edu",load:22,status:"Active"},
    {id:"F-1043",name:"Sana Iqbal",dept:"Mathematics",role:"Lecturer",email:"s.iqbal@stjudes.edu",load:24,status:"Active"},
    {id:"F-1044",name:"Theodore Park",dept:"Economics",role:"Professor",email:"t.park@stjudes.edu",load:0,status:"On Leave"},
    {id:"F-1045",name:"Aïsha Bencheikh",dept:"Biochemistry",role:"Asst. Professor",email:"a.bench@stjudes.edu",load:20,status:"Active"},
    {id:"F-1046",name:"Rohan Patel",dept:"Physics",role:"Lecturer",email:"r.patel@stjudes.edu",load:0,status:"Pending"},
    {id:"F-1047",name:"Eleanor Voss",dept:"Modern History",role:"Professor",email:"e.voss@stjudes.edu",load:16,status:"Active"},
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-1"><h1 className="text-2xl font-bold text-gray-900">Staff Room</h1><div className="flex gap-2"><button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">Import CSV</button><button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">Add faculty</button></div></div>
      <p className="text-sm text-gray-400 mb-6">Faculty roster, departments and credential status</p>
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-4 border-b border-gray-50 space-y-3">
          <input placeholder="Search by name, email or ID…" className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none focus:border-gray-300"/>
          <div className="flex gap-3"><select className="flex-1 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none"><option>Dept: All</option></select><select className="flex-1 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none"><option>Status: All</option></select></div>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-50">{["ID","Name","Department","Role","Email","Load (H)","Status"].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">{h}</th>)}</tr></thead>
          <tbody>
            {staff.map(s=>(
              <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{s.id}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{s.name}</td>
                <td className="py-3 px-4 text-gray-600">{s.dept}</td>
                <td className="py-3 px-4 text-gray-500">{s.role}</td>
                <td className="py-3 px-4 text-xs text-gray-400 font-mono">{s.email}</td>
                <td className="py-3 px-4 text-gray-700">{s.load}</td>
                <td className="py-3 px-4"><Badge color={s.status==="Active"?"green":s.status==="On Leave"?"orange":"gray"}>{s.status}</Badge></td>
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
    {name:"B.Sc. Computer Science",code:"CS",subjects:[{n:"Algorithms",h:31},{n:"Data Structures",h:32},{n:"Operating Systems",h:31},{n:"Networks",h:52},{n:"Databases",h:44},{n:"AI Foundations",h:56}]},
    {name:"B.Sc. Biochemistry",code:"BIO",subjects:[{n:"Organic Chemistry",h:35},{n:"Cell Biology",h:50},{n:"Genetics",h:49},{n:"Biostatistics",h:49}]},
    {name:"B.A. Economics",code:"ECO",subjects:[{n:"Microeconomics",h:41},{n:"Macroeconomics",h:46},{n:"Econometrics",h:43},{n:"Game Theory",h:58}]},
    {name:"B.A. Modern History",code:"HIST",subjects:[{n:"20th Century Europe",h:58},{n:"Cold War",h:47},{n:"Decolonisation",h:55},{n:"Public Memory",h:50}]},
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-1"><h1 className="text-2xl font-bold text-gray-900">Curriculum Builder</h1><div className="flex gap-2"><button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">Discard</button><button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">Save changes</button></div></div>
      <p className="text-sm text-gray-400 mb-6">Map subjects to programs · drag to re-order, click to edit</p>
      <div className="grid grid-cols-2 gap-5">
        {programs.map(p=>(
          <div key={p.name} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4"><h2 className="text-sm font-bold text-gray-900">{p.name}</h2><span className="text-xs text-gray-400 font-mono">{p.code}</span></div>
            <div className="space-y-1">
              {p.subjects.map((s,i)=>(
                <div key={s.n} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <span className="text-gray-300 text-xs">⠿</span>
                  <span className="text-xs text-gray-400 w-4">#{i+1}</span>
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
  const items = [
    {id:"A-01",subject:"Algorithms",course:"B.Sc. Computer Science",year:"Year 3",section:"Section A",staff:"Marcus Hale"},
    {id:"A-02",subject:"Databases",course:"B.Sc. Computer Science",year:"Year 3",section:"Section A",staff:"Marcus Hale"},
    {id:"A-03",subject:"Data Structures",course:"B.Sc. Computer Science",year:"Year 2",section:"Section B",staff:"Sana Iqbal"},
    {id:"A-04",subject:"AI Foundations",course:"B.Sc. Computer Science",year:"Year 4",section:"Section A",staff:"Dr. Helena Vorga"},
    {id:"A-05",subject:"Genetics",course:"B.Sc. Biochemistry",year:"Year 2",section:"Section A",staff:"Aïsha Bencheikh"},
    {id:"A-06",subject:"Econometrics",course:"B.A. Economics",year:"Year 3",section:"Section A",staff:"Theodore Park"},
  ];
  const yc = (y) => y==="Year 3"?"bg-blue-50 text-blue-700 border border-blue-200":y==="Year 2"?"bg-purple-50 text-purple-700 border border-purple-200":"bg-amber-50 text-amber-700 border border-amber-200";
  return (
    <div>
      <div className="flex items-center justify-between mb-1"><h1 className="text-2xl font-bold text-gray-900">Subject & Staff Assignments</h1><button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">New assignment</button></div>
      <p className="text-sm text-gray-400 mb-6">Map subjects to a class & year, and assign the staff who teach them</p>
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-4 border-b border-gray-50 space-y-3">
          <input placeholder="Search subject, staff, or section…" className="w-full border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none"/>
          <div className="flex gap-3"><select className="flex-1 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none"><option>Course: All</option></select><select className="flex-1 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none"><option>Year: All</option></select></div>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-50">{["ID","Subject","Course","Year","Section","Assigned Staff","Actions"].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">{h}</th>)}</tr></thead>
          <tbody>
            {items.map(a=>(
              <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{a.id}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{a.subject}</td>
                <td className="py-3 px-4 text-gray-600">{a.course}</td>
                <td className="py-3 px-4"><span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${yc(a.year)}`}>{a.year}</span></td>
                <td className="py-3 px-4 text-gray-600">{a.section}</td>
                <td className="py-3 px-4 text-gray-700">{a.staff}</td>
                <td className="py-3 px-4 text-gray-300 hover:text-red-400 cursor-pointer">🗑</td>
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
    {id:"FT-01",name:"B.Sc. Computer Science",total:"$4,800",items:[["Tuition","$3600"],["Lab","$600"],["Library","$200"],["Activities","$400"]]},
    {id:"FT-02",name:"B.Sc. Biochemistry",total:"$5,200",items:[["Tuition","$3800"],["Lab","$900"],["Library","$200"],["Activities","$300"]]},
    {id:"FT-03",name:"B.A. Economics",total:"$3,900",items:[["Tuition","$3200"],["Library","$250"],["Activities","$450"]]},
  ];
  const invoices = [
    {id:"INV-2841",student:"Julianne Sterling",course:"CS",amount:4800,paid:4800,status:"Paid"},
    {id:"INV-2842",student:"Marcus Chen",course:"CS",amount:4800,paid:2400,status:"Partial"},
    {id:"INV-2843",student:"Elara Vance",course:"BIO",amount:5200,paid:0,status:"Overdue"},
    {id:"INV-2844",student:"Dimitri Petrov",course:"HIST",amount:3900,paid:3900,status:"Paid"},
    {id:"INV-2845",student:"Lin Zhao",course:"ECO",amount:3900,paid:1950,status:"Partial"},
    {id:"INV-2846",student:"Noor Hassan",course:"CS",amount:4800,paid:0,status:"Overdue"},
    {id:"INV-2847",student:"Felix Ortega",course:"BIO",amount:5200,paid:5200,status:"Paid"},
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-1"><h1 className="text-2xl font-bold text-gray-900">Fee Control Center</h1><div className="flex gap-2"><button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">Send reminders</button><button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">Generate invoices</button></div></div>
      <p className="text-sm text-gray-400 mb-6">Templates, mass-invoice generation and collection status</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[{l:"Collected · Term",v:"$18,250",s:"+12%",sc:"text-emerald-600"},{l:"Outstanding",v:"$14,350",s:"2 overdue",sc:"text-red-500"},{l:"Templates",v:"3",s:"Active"},{l:"Auto-Retry Queue",v:"4",s:"Tomorrow 02:00"}].map(s=>(
          <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-5"><p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">{s.l}</p><p className="text-3xl font-bold text-gray-900">{s.v}</p><p className={`text-sm mt-1 font-medium ${s.sc||"text-gray-400"}`}>{s.s}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4 mb-6">
        {templates.map(t=>(
          <div key={t.id} className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex justify-between mb-2"><span className="text-xs text-gray-400 font-mono">{t.id}</span><span className="text-xs font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">Fall 2026</span></div>
            <p className="text-sm font-bold text-gray-900 mb-1">{t.name}</p>
            <p className="text-2xl font-bold text-gray-900 mb-3">{t.total}</p>
            {t.items.map(([k,v])=><div key={k} className="flex justify-between text-xs text-gray-500 py-0.5"><span>{k}</span><span>{v}</span></div>)}
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50"><h2 className="text-sm font-bold text-gray-900 mb-3">Invoices</h2>
          <div className="flex gap-3"><select className="flex-1 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none"><option>Status: All</option></select><select className="flex-1 border border-gray-100 rounded-lg px-3 py-2 text-sm text-gray-600 focus:outline-none"><option>Course: All</option></select></div>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-50">{["Invoice","Student","Course","Amount","Paid","Progress","Status","Action"].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">{h}</th>)}</tr></thead>
          <tbody>
            {invoices.map(inv=>(
              <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{inv.id}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{inv.student}</td>
                <td className="py-3 px-4 text-xs text-gray-400 font-mono">{inv.course}</td>
                <td className="py-3 px-4 text-gray-700">${inv.amount.toLocaleString()}</td>
                <td className="py-3 px-4 text-gray-700">${inv.paid.toLocaleString()}</td>
                <td className="py-3 px-4"><div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${inv.status==="Paid"?"bg-emerald-500":inv.status==="Partial"?"bg-blue-500":"bg-gray-200"}`} style={{width:`${(inv.paid/inv.amount)*100}%`}}/></div></td>
                <td className="py-3 px-4"><Badge color={inv.status==="Paid"?"green":inv.status==="Partial"?"blue":"red"}>{inv.status}</Badge></td>
                <td className="py-3 px-4"><button className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">Update</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RegistryResults() {
  const [toggles, setToggles] = useState({0:true,3:true});
  const batches = [
    {section:"CS · Section A · Y3",subject:"Algorithms",prog:48,total:48,released:"2026-05-02"},
    {section:"CS · Section A · Y3",subject:"Databases",prog:48,total:48,released:null},
    {section:"CS · Section B · Y2",subject:"Data Structures",prog:41,total:44,released:null},
    {section:"BIO · Section A · Y2",subject:"Genetics",prog:36,total:36,released:"2026-04-28"},
    {section:"ECO · Section A · Y3",subject:"Econometrics",prog:30,total:33,released:null},
  ];
  return (
    <div>
      <div className="flex items-center justify-between mb-1"><h1 className="text-2xl font-bold text-gray-900">Publishing Hub</h1><div className="flex gap-2"><button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">Preview release</button><button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">Publish all complete</button></div></div>
      <p className="text-sm text-gray-400 mb-6">Master toggle for releasing marks to the student portal</p>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5"><p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Batches</p><p className="text-3xl font-bold text-gray-900">5</p></div>
        <div className="bg-white rounded-xl border border-gray-100 p-5"><p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">Released</p><p className="text-3xl font-bold text-gray-900">2</p></div>
        <div className="bg-gray-900 rounded-xl p-5"><p className="text-xs font-semibold tracking-widest uppercase text-gray-500 mb-2">Hold</p><p className="text-3xl font-bold text-white">3</p></div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50"><h2 className="text-sm font-bold text-gray-900">Result batches</h2></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-50">{["Section","Subject","Entry Progress","Released","Master Toggle"].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">{h}</th>)}</tr></thead>
          <tbody>
            {batches.map((b,i)=>(
              <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                <td className="py-3 px-4 text-sm text-gray-700">{b.section}</td>
                <td className="py-3 px-4 font-medium text-gray-900">{b.subject}</td>
                <td className="py-3 px-4"><div className="flex items-center gap-3"><div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className={`h-full rounded-full ${b.prog===b.total?"bg-emerald-500":"bg-amber-400"}`} style={{width:`${(b.prog/b.total)*100}%`}}/></div><span className="text-xs text-gray-500">{b.prog}/{b.total}</span></div></td>
                <td className="py-3 px-4">{b.released?<span className="text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">Released · {b.released}</span>:<span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full">Hold</span>}</td>
                <td className="py-3 px-4"><button onClick={()=>setToggles(p=>({...p,[i]:!p[i]}))} className={`w-10 h-6 rounded-full transition-colors relative ${toggles[i]?"bg-gray-900":"bg-gray-200"}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform shadow-sm ${toggles[i]?"translate-x-5":"translate-x-1"}`}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── SUPER ADMIN PORTAL ───────────────────────────────────────────────────────

function SuperAdminPortal({ navigate }) {
  const logo = (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center"><div className="w-3 h-3 bg-white rounded-sm"/></div>
      <div><p className="text-sm font-bold text-gray-900 leading-none">EdgePoint Platform</p><p className="text-xs text-gray-400">PLATFORM CONSOLE</p></div>
    </div>
  );
  return (
    <SidebarLayout logo={logo} nav={<><SectionLabel>Platform</SectionLabel><NavItem icon={<Icons.Overview/>} label="Overview" active/><SectionLabel>Account</SectionLabel><NavItem icon={<Icons.Profile/>} label="Profile"/></>} footer={<UserFooter initials="DA" name="Dr. Aris Thorne" sub="Platform Operator" onLogout={()=>navigate("landing")}/>}>
      <TopBar breadcrumb={["Platform","Executive Overview"]}/>
      <div className="flex-1 overflow-y-auto p-6 bg-gray-50"><PlatformConsole/></div>
    </SidebarLayout>
  );
}

function PlatformConsole() {
  const months = ["Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec","Jan","Feb","Mar"];
  const rev = [14,16,15,18,22,26,30,35,31,38,44,52];
  const mx = Math.max(...rev);
  const coords = rev.map((v,i)=>`${(i/(rev.length-1))*560},${120-(v/mx)*110}`);
  const institutions = [
    {name:"St. Jude's University",slug:"stjudes",plan:"Enterprise",students:"12,482",staff:882,mrr:"$48,200",status:"Active",ob:"2022-08-14"},
    {name:"Northern Tech Polytechnic",slug:"ntp",plan:"Growth",students:"8,210",staff:612,mrr:"$28,400",status:"Active",ob:"2023-01-05"},
    {name:"Lakeside Arts Academy",slug:"lakeside",plan:"Starter",students:"3,500",staff:244,mrr:"$9,800",status:"Auditing",ob:"2024-03-22"},
    {name:"Meridian Medical College",slug:"meridian",plan:"Enterprise",students:"6,420",staff:530,mrr:"$41,200",status:"Active",ob:"2021-11-02"},
    {name:"Cascade State University",slug:"cascade",plan:"Growth",students:"9,930",staff:701,mrr:"$32,900",status:"Active",ob:"2023-09-15"},
    {name:"Verdant Agricultural Inst.",slug:"verdant",plan:"Starter",students:"2,210",staff:188,mrr:"$7,300",status:"Trial",ob:"2025-04-30"},
  ];
  const sc = (s) => s==="Active"?"green":s==="Auditing"?"orange":s==="Trial"?"blue":"gray";
  const pc = (p) => p==="Enterprise"?"dark":p==="Growth"?"blue":"gray";
  return (
    <div>
      <div className="flex items-center justify-between mb-1"><h1 className="text-2xl font-bold text-gray-900">Platform Console</h1><div className="flex gap-2"><button className="border border-gray-200 text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-50">Export</button><button className="bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-gray-700">Onboard institution</button></div></div>
      <p className="text-sm text-gray-400 mb-6">6 institutions · real-time platform health</p>
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[{l:"Active Institutions",v:"6",s:"+1 this month",sc:"text-emerald-600"},{l:"Total Students",v:"42,752",s:"+2.4%",sc:"text-emerald-600"},{l:"MRR",v:"$167.8k",s:"+8.2%",sc:"text-emerald-600"},{l:"Uptime · 30D",v:"99.98%",s:"SLA met",sc:"text-emerald-600"}].map(s=>(
          <div key={s.l} className="bg-white rounded-xl border border-gray-100 p-5"><p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-2">{s.l}</p><p className="text-3xl font-bold text-gray-900">{s.v}</p><p className={`text-sm mt-1 font-medium ${s.sc}`}>{s.s}</p></div>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="col-span-2 bg-white rounded-xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4"><h2 className="text-sm font-bold text-gray-900">Platform revenue · last 12 months</h2><select className="border border-gray-100 rounded-lg px-3 py-1.5 text-xs text-gray-600 focus:outline-none"><option>USD</option></select></div>
          <svg viewBox="0 0 560 130" className="w-full h-36" preserveAspectRatio="none">
            <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/><stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/></linearGradient></defs>
            <path d={`M ${coords.join(" L ")}`} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d={`M 0,${120-(rev[0]/mx)*110} L ${coords.join(" L ")} L 560,130 L 0,130 Z`} fill="url(#pg)"/>
            {coords.map((c,i)=>{const [x,y]=c.split(",");return <circle key={i} cx={x} cy={y} r="3.5" fill="#3b82f6"/>;} )}
          </svg>
          <div className="flex justify-between text-xs text-gray-400 mt-2">{months.map(m=><span key={m}>{m}</span>)}</div>
          <div className="flex gap-8 mt-4 pt-4 border-t border-gray-50">
            {[["Trailing 30D","$268k"],["YOY Growth","+38%"],["Net Retention","114%"]].map(([l,v])=>(
              <div key={l}><p className="text-xs text-gray-400">{l}</p><p className="text-lg font-bold text-gray-900">{v}</p></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Health alerts</h2>
          {[{c:"bg-amber-400",t:"Lakeside · audit pending",d:"Tier 2 review window closes in 6 days"},{c:"bg-emerald-400",t:"Verdant · onboarding complete",d:"Trial converts in 14 days"},{c:"bg-red-400",t:"Cascade · invoice failure",d:"Auto-retry scheduled for tomorrow 02:00"}].map((a,i)=>(
            <div key={i} className="flex items-start gap-3 mb-4"><div className={`w-2 h-2 rounded-full ${a.c} mt-1.5 flex-shrink-0`}/><div><p className="text-sm font-semibold text-gray-900">{a.t}</p><p className="text-xs text-gray-400 mt-0.5">{a.d}</p></div></div>
          ))}
          <div className="mt-4 pt-4 border-t border-gray-50">
            <h3 className="text-xs font-semibold text-gray-700 mb-2">Today's session count</h3>
            <p className="text-3xl font-bold text-gray-900">214 <span className="text-sm font-medium text-emerald-600">+11 vs avg</span></p>
            <div className="mt-2 w-full h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{width:"82%"}}/></div>
            <p className="text-xs text-gray-400 mt-2">82% of sessions confirmed by faculty.</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="p-5 border-b border-gray-50"><h2 className="text-sm font-bold text-gray-900">Institutions</h2></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-gray-50">{["Institution","Slug","Plan","Students","Staff","MRR","Status","Onboarded"].map(h=><th key={h} className="text-left py-3 px-4 text-xs font-semibold tracking-widest uppercase text-gray-400">{h}</th>)}</tr></thead>
          <tbody>
            {institutions.map(inst=>(
              <tr key={inst.slug} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer">
                <td className="py-3 px-4 font-medium text-gray-900">{inst.name}</td>
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{inst.slug}</td>
                <td className="py-3 px-4"><Badge color={pc(inst.plan)}>{inst.plan}</Badge></td>
                <td className="py-3 px-4 text-gray-700">{inst.students}</td>
                <td className="py-3 px-4 text-gray-700">{inst.staff}</td>
                <td className="py-3 px-4 font-semibold text-gray-900">{inst.mrr}</td>
                <td className="py-3 px-4"><Badge color={sc(inst.status)}>{inst.status}</Badge></td>
                <td className="py-3 px-4 text-xs font-mono text-gray-400">{inst.ob}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("landing");
  const [role, setRole] = useState(null);
  const navigate = (to, r = null) => { setView(to); if (r) setRole(r); };

  if (view === "landing") return <Landing navigate={navigate}/>;
  if (view === "login") return <Login navigate={navigate} selectedRole={role}/>;
  if (view === "student") return <StudentPortal navigate={navigate}/>;
  if (view === "faculty") return <FacultyPortal navigate={navigate}/>;
  if (view === "registry") return <RegistryPortal navigate={navigate}/>;
  if (view === "superadmin") return <SuperAdminPortal navigate={navigate}/>;
  return null;
}
