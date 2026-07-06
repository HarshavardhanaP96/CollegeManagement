import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Panel, Btn } from "@/components/ui-kit";
import { TableToolbar } from "@/components/table-toolbar";
import { TEACHER_CLASSES, ATTENDANCE_STUDENTS } from "@/lib/mock-data";
import { ClipboardCheck, FileSpreadsheet } from "lucide-react";

export const Route = createFileRoute("/app/teacher/class/$classId")({ component: TeacherClassDetail });

function TeacherClassDetail() {
  const { classId } = Route.useParams();
  const cls = TEACHER_CLASSES.find((c) => c.id === classId) ?? TEACHER_CLASSES[0];
  const [q, setQ] = useState("");

  const students = useMemo(() => ATTENDANCE_STUDENTS.filter((s) =>
    q === "" || s.name.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase())
  ), [q]);

  return (
    <>
      <AppHeader crumbs={["Faculty", "My Classes", cls.subject]} />
      <PageContainer>
        <PageTitle
          title={cls.subject}
          subtitle={`${cls.section} · ${cls.students} students · Next ${cls.nextSession} · ${cls.room}`}
          action={
            <div className="flex gap-2">
              <Link to="/app/teacher/attendance"><Btn>Mark attendance</Btn></Link>
              <Link to="/app/teacher/gradebook"><Btn variant="primary">Open gradebook</Btn></Link>
            </div>
          }
        />

        <Panel title="Roster" padded={false}>
          <TableToolbar query={q} onQuery={setQ} placeholder="Search students by name or ID…" />
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/40">
                <th className="px-5 py-3">ID</th>
                <th className="px-3 py-3">Student</th>
                <th className="px-3 py-3 text-right">Attendance</th>
                <th className="px-3 py-3 text-right">Last grade</th>
                <th className="px-5 py-3 text-right">Quick actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((s, i) => {
                const att = 70 + ((i * 13) % 30);
                const grade = 60 + ((i * 7) % 40);
                return (
                  <tr key={s.id} className="hover:bg-secondary/30">
                    <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{s.id}</td>
                    <td className="px-3 py-3 text-sm font-medium">{s.name}</td>
                    <td className="px-3 py-3 text-sm text-right tabular-nums">{att}%</td>
                    <td className="px-3 py-3 text-sm text-right tabular-nums">{grade}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button className="px-2 py-1 text-[11px] rounded ring-1 ring-black/5 hover:bg-secondary inline-flex items-center gap-1"><ClipboardCheck className="size-3" />Mark</button>
                        <button className="px-2 py-1 text-[11px] rounded ring-1 ring-black/5 hover:bg-secondary inline-flex items-center gap-1"><FileSpreadsheet className="size-3" />Grade</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-muted-foreground">No students match “{q}”.</td></tr>
              )}
            </tbody>
          </table>
        </Panel>
      </PageContainer>
    </>
  );
}
