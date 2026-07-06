import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Panel, Btn } from "@/components/ui-kit";
import { TableToolbar } from "@/components/table-toolbar";
import { ATTENDANCE_STUDENTS, TEACHER_CLASSES } from "@/lib/mock-data";
import { Check, X, CalendarDays } from "lucide-react";

type Status = "present" | "absent" | "late";

export const Route = createFileRoute("/app/teacher/attendance")({ component: Attendance });

function Attendance() {
  const [classId, setClassId] = useState(TEACHER_CLASSES[0].id);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [q, setQ] = useState("");
  const [marks, setMarks] = useState<Record<string, Status>>(() => Object.fromEntries(ATTENDANCE_STUDENTS.map((s) => [s.id, "present"])));
  const set = (id: string, st: Status) => setMarks((m) => ({ ...m, [id]: st }));
  const all = (st: Status) => setMarks(Object.fromEntries(ATTENDANCE_STUDENTS.map((s) => [s.id, st])));

  const cls = TEACHER_CLASSES.find((c) => c.id === classId)!;
  const counts = ATTENDANCE_STUDENTS.reduce((acc, s) => { acc[marks[s.id]]++; return acc; }, { present: 0, absent: 0, late: 0 } as Record<Status, number>);
  const filtered = useMemo(() => ATTENDANCE_STUDENTS.filter((s) =>
    q === "" || s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase())
  ), [q]);

  return (
    <>
      <AppHeader crumbs={["Faculty", cls.subject, "Attendance"]} />
      <PageContainer>
        <PageTitle
          title="Attendance Grid"
          subtitle={`${cls.subject} · ${cls.section}`}
          action={<div className="flex gap-2"><Btn onClick={() => all("present")}>All present</Btn><Btn onClick={() => all("absent")}>All absent</Btn><Btn variant="primary">Save attendance</Btn></div>}
        />

        <Panel>
          <div className="flex flex-wrap items-end gap-4">
            <label className="block">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Class</span>
              <select value={classId} onChange={(e) => setClassId(e.target.value)}
                className="px-3 py-2 text-sm bg-background ring-1 ring-black/5 rounded-md outline-none focus:ring-ring min-w-[260px]">
                {TEACHER_CLASSES.map((c) => <option key={c.id} value={c.id}>{c.subject} · {c.section}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Class date</span>
              <div className="relative">
                <CalendarDays className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  className="pl-8 pr-3 py-2 text-sm bg-background ring-1 ring-black/5 rounded-md outline-none focus:ring-ring tabular-nums" />
              </div>
            </label>
            <div className="ml-auto grid grid-cols-3 gap-3">
              <Stat label="Present" value={counts.present} tone="text-emerald-600" />
              <Stat label="Late" value={counts.late} tone="text-amber-600" />
              <Stat label="Absent" value={counts.absent} tone="text-destructive" />
            </div>
          </div>
        </Panel>

        <Panel padded={false}>
          <TableToolbar query={q} onQuery={setQ} placeholder="Search students by name or ID…" />
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/40">
                <th className="px-5 py-3">ID</th>
                <th className="px-3 py-3">Student</th>
                <th className="px-3 py-3 text-center">Last 4 sessions</th>
                <th className="px-5 py-3 text-right">Today</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s, i) => {
                const past = [0, 1, 2, 3].map((k) => (i * 7 + k * 3) % 5 === 0);
                const status = marks[s.id];
                return (
                  <tr key={s.id} className="hover:bg-secondary/30">
                    <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{s.id}</td>
                    <td className="px-3 py-3 text-sm font-medium">{s.name}</td>
                    <td className="px-3 py-3 text-center">
                      <div className="flex justify-center gap-1">
                        {past.map((absent, k) => <span key={k} className={`size-2 rounded-full ${absent ? "bg-destructive" : "bg-emerald-500"}`} />)}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex rounded-md ring-1 ring-black/5 overflow-hidden">
                        <button onClick={() => set(s.id, "present")} className={`px-2.5 py-1 text-xs font-medium flex items-center gap-1 ${status === "present" ? "bg-emerald-500 text-white" : "bg-card hover:bg-secondary"}`}><Check className="size-3" />P</button>
                        <button onClick={() => set(s.id, "late")} className={`px-2.5 py-1 text-xs font-medium border-x border-black/5 ${status === "late" ? "bg-amber-500 text-white" : "bg-card hover:bg-secondary"}`}>L</button>
                        <button onClick={() => set(s.id, "absent")} className={`px-2.5 py-1 text-xs font-medium flex items-center gap-1 ${status === "absent" ? "bg-destructive text-white" : "bg-card hover:bg-secondary"}`}><X className="size-3" />A</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-10 text-center text-sm text-muted-foreground">No students match “{q}”.</td></tr>
              )}
            </tbody>
          </table>
        </Panel>
      </PageContainer>
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="px-3 py-2 bg-secondary/50 ring-1 ring-black/5 rounded-md text-center min-w-[80px]">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`text-lg font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}
