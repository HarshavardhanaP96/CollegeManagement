// Mock data for the EdgePoint ERP UI shell

export type Role = "superadmin" | "admin" | "teacher" | "student";

export const ROLES: { id: Role; label: string; description: string; sub: string }[] = [
  {
    id: "superadmin",
    label: "Super Admin",
    description: "Manage every institution on the platform",
    sub: "Platform Operator",
  },
  {
    id: "admin",
    label: "College Admin",
    description: "Run a single college: staff, fees, curriculum, results",
    sub: "Institution Lead",
  },
  {
    id: "teacher",
    label: "Teacher",
    description: "Mark attendance, enter grades, manage classes",
    sub: "Faculty Member",
  },
  {
    id: "student",
    label: "Student / Parent",
    description: "View timeline, analytics, fees and receipts",
    sub: "Learner",
  },
];

export const ROLE_USERS: Record<Role, { name: string; sub: string; tenant: string }> = {
  superadmin: { name: "Dr. Aris Thorne", sub: "Platform Operator", tenant: "EdgePoint Platform" },
  admin:     { name: "Priya Raman",      sub: "Registrar",         tenant: "St. Jude's University" },
  teacher:   { name: "Marcus Hale",      sub: "Computer Science",  tenant: "St. Jude's University" },
  student:   { name: "Julianne Sterling",sub: "BSc · Year 3",      tenant: "St. Jude's University" },
};

// SuperAdmin
export const TENANTS = [
  { id: "t1", name: "St. Jude's University",      slug: "stjudes",   plan: "Enterprise", students: 12482, staff: 882, mrr: 48200, status: "Active",   onboarded: "2022-08-14" },
  { id: "t2", name: "Northern Tech Polytechnic",  slug: "ntp",       plan: "Growth",     students:  8210, staff: 612, mrr: 28400, status: "Active",   onboarded: "2023-01-09" },
  { id: "t3", name: "Lakeside Arts Academy",      slug: "lakeside",  plan: "Starter",    students:  3500, staff: 244, mrr:  9800, status: "Auditing", onboarded: "2024-03-22" },
  { id: "t4", name: "Meridian Medical College",   slug: "meridian",  plan: "Enterprise", students:  6420, staff: 530, mrr: 41200, status: "Active",   onboarded: "2021-11-02" },
  { id: "t5", name: "Cascade State University",   slug: "cascade",   plan: "Growth",     students:  9930, staff: 701, mrr: 32900, status: "Active",   onboarded: "2023-09-18" },
  { id: "t6", name: "Verdant Agricultural Inst.", slug: "verdant",   plan: "Starter",    students:  2210, staff: 188, mrr:  7300, status: "Trial",    onboarded: "2025-04-30" },
];

export const REVENUE_SERIES = [
  { m: "Apr", v: 168 }, { m: "May", v: 174 }, { m: "Jun", v: 182 }, { m: "Jul", v: 178 },
  { m: "Aug", v: 196 }, { m: "Sep", v: 212 }, { m: "Oct", v: 224 }, { m: "Nov", v: 231 },
  { m: "Dec", v: 218 }, { m: "Jan", v: 240 }, { m: "Feb", v: 255 }, { m: "Mar", v: 268 },
];

// Admin — Staff
export const STAFF = [
  { id: "F-1041", name: "Dr. Helena Vorga",  dept: "Computer Science", role: "Professor",        email: "h.vorga@stjudes.edu",  status: "Active",  load: 18 },
  { id: "F-1042", name: "Marcus Hale",       dept: "Computer Science", role: "Asst. Professor",  email: "m.hale@stjudes.edu",   status: "Active",  load: 22 },
  { id: "F-1043", name: "Sana Iqbal",        dept: "Mathematics",      role: "Lecturer",         email: "s.iqbal@stjudes.edu",  status: "Active",  load: 24 },
  { id: "F-1044", name: "Theodore Park",     dept: "Economics",        role: "Professor",        email: "t.park@stjudes.edu",   status: "On Leave", load: 0 },
  { id: "F-1045", name: "Aïsha Bencheikh",   dept: "Biochemistry",     role: "Asst. Professor",  email: "a.bench@stjudes.edu",  status: "Active",  load: 20 },
  { id: "F-1046", name: "Rohan Patel",       dept: "Physics",          role: "Lecturer",         email: "r.patel@stjudes.edu",  status: "Pending", load: 0 },
  { id: "F-1047", name: "Eleanor Voss",      dept: "Modern History",   role: "Professor",        email: "e.voss@stjudes.edu",   status: "Active",  load: 16 },
];

// Admin — Curriculum
export const COURSES = [
  { id: "CS",   name: "B.Sc. Computer Science",  subjects: ["Algorithms", "Data Structures", "Operating Systems", "Networks", "Databases", "AI Foundations"] },
  { id: "BIO",  name: "B.Sc. Biochemistry",      subjects: ["Organic Chemistry", "Cell Biology", "Genetics", "Biostatistics"] },
  { id: "ECO",  name: "B.A. Economics",          subjects: ["Microeconomics", "Macroeconomics", "Econometrics", "Game Theory"] },
  { id: "HIST", name: "B.A. Modern History",     subjects: ["20th Century Europe", "Cold War", "Decolonisation", "Public Memory"] },
];

// Admin — Fees
export const FEE_TEMPLATES = [
  { id: "FT-01", course: "B.Sc. Computer Science", term: "Fall 2026", total: 4800, components: { Tuition: 3600, Lab: 600, Library: 200, Activities: 400 } },
  { id: "FT-02", course: "B.Sc. Biochemistry",     term: "Fall 2026", total: 5200, components: { Tuition: 3800, Lab: 900, Library: 200, Activities: 300 } },
  { id: "FT-03", course: "B.A. Economics",         term: "Fall 2026", total: 3900, components: { Tuition: 3200, Library: 250, Activities: 450 } },
];

export const INVOICES = [
  { id: "INV-2841", student: "Julianne Sterling", course: "CS",   amount: 4800, paid: 4800, status: "Paid"     },
  { id: "INV-2842", student: "Marcus Chen",       course: "CS",   amount: 4800, paid: 2400, status: "Partial"  },
  { id: "INV-2843", student: "Elara Vance",       course: "BIO",  amount: 5200, paid: 0,    status: "Overdue"  },
  { id: "INV-2844", student: "Dimitri Petrov",    course: "HIST", amount: 3900, paid: 3900, status: "Paid"     },
  { id: "INV-2845", student: "Lin Zhao",          course: "ECO",  amount: 3900, paid: 1950, status: "Partial"  },
  { id: "INV-2846", student: "Noor Hassan",       course: "CS",   amount: 4800, paid: 0,    status: "Overdue"  },
  { id: "INV-2847", student: "Felix Ortega",      course: "BIO",  amount: 5200, paid: 5200, status: "Paid"     },
];

// Admin — Results publishing
export const RESULT_BATCHES = [
  { id: "R-1", section: "CS · Section A · Y3", subject: "Algorithms",     entered: 48, total: 48, published: true,  releasedAt: "2026-05-02" },
  { id: "R-2", section: "CS · Section A · Y3", subject: "Databases",      entered: 48, total: 48, published: false, releasedAt: null },
  { id: "R-3", section: "CS · Section B · Y2", subject: "Data Structures",entered: 41, total: 44, published: false, releasedAt: null },
  { id: "R-4", section: "BIO · Section A · Y2",subject: "Genetics",       entered: 36, total: 36, published: true,  releasedAt: "2026-04-28" },
  { id: "R-5", section: "ECO · Section A · Y3",subject: "Econometrics",   entered: 30, total: 33, published: false, releasedAt: null },
];

// Teacher — Classes
export const TEACHER_CLASSES = [
  { id: "C1", subject: "Algorithms",      section: "CS · A · Y3", students: 48, nextSession: "Today · 10:00", room: "B-204" },
  { id: "C2", subject: "Databases",       section: "CS · A · Y3", students: 48, nextSession: "Today · 14:00", room: "B-211" },
  { id: "C3", subject: "Data Structures", section: "CS · B · Y2", students: 44, nextSession: "Tomorrow · 09:00", room: "A-118" },
  { id: "C4", subject: "AI Foundations",  section: "CS · A · Y4", students: 36, nextSession: "Thursday · 11:00", room: "B-301" },
];

// Teacher — Attendance
export const ATTENDANCE_STUDENTS = [
  { id: "S-2401", name: "Julianne Sterling" },
  { id: "S-2402", name: "Marcus Chen"       },
  { id: "S-2403", name: "Elara Vance"       },
  { id: "S-2404", name: "Dimitri Petrov"    },
  { id: "S-2405", name: "Lin Zhao"          },
  { id: "S-2406", name: "Noor Hassan"       },
  { id: "S-2407", name: "Felix Ortega"      },
  { id: "S-2408", name: "Anika Sørensen"    },
  { id: "S-2409", name: "Tomás Riveros"     },
  { id: "S-2410", name: "Yuki Watanabe"     },
  { id: "S-2411", name: "Hanan El-Amin"     },
  { id: "S-2412", name: "Oliver Brennan"    },
];

// Teacher — Gradebook
export const GRADEBOOK = [
  { id: "S-2401", name: "Julianne Sterling", mid: 92, project: 88, final: null, attendance: 96 },
  { id: "S-2402", name: "Marcus Chen",       mid: 78, project: 82, final: null, attendance: 88 },
  { id: "S-2403", name: "Elara Vance",       mid: 64, project: 70, final: null, attendance: 71 },
  { id: "S-2404", name: "Dimitri Petrov",    mid: 95, project: 91, final: null, attendance: 98 },
  { id: "S-2405", name: "Lin Zhao",          mid: 81, project: 84, final: null, attendance: 92 },
  { id: "S-2406", name: "Noor Hassan",       mid: 58, project: 62, final: null, attendance: 64 },
  { id: "S-2407", name: "Felix Ortega",      mid: 86, project: 80, final: null, attendance: 90 },
  { id: "S-2408", name: "Anika Sørensen",    mid: 89, project: 92, final: null, attendance: 94 },
];

// Student — Timeline
export const STUDENT_TIMELINE = [
  { type: "mark",       title: "Algorithms · Midterm released",   detail: "92 / 100 · Class avg 78",        when: "Today · 11:42" },
  { type: "attendance", title: "Marked Present · Databases",      detail: "B-211 · 14:00",                  when: "Yesterday" },
  { type: "fee",        title: "Tuition installment received",    detail: "$2,400 · Receipt INV-2842",      when: "2 days ago" },
  { type: "mark",       title: "Genetics · Quiz 4 released",      detail: "18 / 20 · Class avg 14.2",       when: "3 days ago" },
  { type: "attendance", title: "Marked Absent · Operating Sys.",  detail: "B-204 · 10:00",                  when: "5 days ago" },
  { type: "notice",     title: "Library hours extended",          detail: "Open until 23:00 during finals", when: "1 week ago" },
];

export const STUDENT_SUBJECTS = [
  { subject: "Algorithms",      mine: 92, avg: 78, trend: "+6"  },
  { subject: "Databases",       mine: 85, avg: 74, trend: "+2"  },
  { subject: "Operating Sys.",  mine: 71, avg: 76, trend: "-4"  },
  { subject: "Networks",        mine: 88, avg: 80, trend: "+3"  },
  { subject: "AI Foundations",  mine: 79, avg: 72, trend: "+1"  },
];

export const STUDENT_GROWTH = [
  { m: "Sep", v: 71 }, { m: "Oct", v: 74 }, { m: "Nov", v: 73 }, { m: "Dec", v: 78 },
  { m: "Jan", v: 80 }, { m: "Feb", v: 82 }, { m: "Mar", v: 85 }, { m: "Apr", v: 87 },
];

export const STUDENT_RECEIPTS = [
  { id: "RC-9821", desc: "Tuition · Installment 1", date: "2026-01-10", amount: 2400, method: "Card · Visa 4242" },
  { id: "RC-9822", desc: "Library Levy",            date: "2026-01-10", amount:  200, method: "Card · Visa 4242" },
  { id: "RC-9920", desc: "Tuition · Installment 2", date: "2026-04-04", amount: 2400, method: "Bank Transfer" },
  { id: "RC-9981", desc: "Lab Fees",                date: "2026-04-04", amount:  600, method: "Bank Transfer" },
];

// Marks (internal/external) by semester
export type MarkRow = { code: string; subject: string; internal: number; external: number; total: number; grade: string };
export const STUDENT_MARKS: Record<string, MarkRow[]> = {
  "Sem 5 · 2025-26": [
    { code: "CS501", subject: "Algorithms",       internal: 28, external: 64, total: 92, grade: "A+" },
    { code: "CS502", subject: "Databases",        internal: 26, external: 59, total: 85, grade: "A"  },
    { code: "CS503", subject: "Operating Sys.",   internal: 22, external: 49, total: 71, grade: "B+" },
    { code: "CS504", subject: "Networks",         internal: 27, external: 61, total: 88, grade: "A"  },
    { code: "CS505", subject: "AI Foundations",   internal: 24, external: 55, total: 79, grade: "B+" },
  ],
  "Sem 4 · 2024-25": [
    { code: "CS401", subject: "Discrete Math",    internal: 25, external: 58, total: 83, grade: "A"  },
    { code: "CS402", subject: "Data Structures",  internal: 27, external: 60, total: 87, grade: "A"  },
    { code: "CS403", subject: "Computer Org.",    internal: 21, external: 48, total: 69, grade: "B"  },
    { code: "CS404", subject: "OOP in Java",      internal: 26, external: 57, total: 83, grade: "A"  },
  ],
  "Sem 3 · 2024-25": [
    { code: "CS301", subject: "Probability",      internal: 23, external: 52, total: 75, grade: "B+" },
    { code: "CS302", subject: "Digital Logic",    internal: 25, external: 56, total: 81, grade: "A"  },
    { code: "CS303", subject: "Web Tech",         internal: 28, external: 62, total: 90, grade: "A+" },
  ],
};

// Exam schedule
export const EXAM_SCHEDULE = [
  { code: "CS501", subject: "Algorithms",       date: "2026-05-22", time: "09:30 – 12:30", room: "Hall A", type: "External" },
  { code: "CS502", subject: "Databases",        date: "2026-05-25", time: "09:30 – 12:30", room: "Hall A", type: "External" },
  { code: "CS503", subject: "Operating Sys.",   date: "2026-05-28", time: "14:00 – 17:00", room: "Hall B", type: "External" },
  { code: "CS504", subject: "Networks",         date: "2026-06-01", time: "09:30 – 12:30", room: "Hall A", type: "External" },
  { code: "CS505", subject: "AI Foundations",   date: "2026-06-04", time: "14:00 – 17:00", room: "Hall C", type: "External" },
  { code: "CS501-I", subject: "Algorithms · Internal II", date: "2026-05-15", time: "10:00 – 11:30", room: "B-204", type: "Internal" },
  { code: "CS502-I", subject: "Databases · Internal II",  date: "2026-05-17", time: "10:00 – 11:30", room: "B-211", type: "Internal" },
];

// Subject ↔ staff & class assignments
export type Assignment = { id: string; subject: string; course: string; year: string; section: string; staff: string };
export const ASSIGNMENTS: Assignment[] = [
  { id: "A-01", subject: "Algorithms",      course: "B.Sc. Computer Science", year: "Year 3", section: "A", staff: "Marcus Hale" },
  { id: "A-02", subject: "Databases",       course: "B.Sc. Computer Science", year: "Year 3", section: "A", staff: "Marcus Hale" },
  { id: "A-03", subject: "Data Structures", course: "B.Sc. Computer Science", year: "Year 2", section: "B", staff: "Sana Iqbal"  },
  { id: "A-04", subject: "AI Foundations",  course: "B.Sc. Computer Science", year: "Year 4", section: "A", staff: "Dr. Helena Vorga" },
  { id: "A-05", subject: "Genetics",        course: "B.Sc. Biochemistry",     year: "Year 2", section: "A", staff: "Aïsha Bencheikh" },
  { id: "A-06", subject: "Econometrics",    course: "B.A. Economics",         year: "Year 3", section: "A", staff: "Theodore Park" },
];
