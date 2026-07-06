import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Panel, Tag } from "@/components/ui-kit";
import { TableToolbar } from "@/components/table-toolbar";
import { EXAM_SCHEDULE } from "@/lib/mock-data";

export const Route = createFileRoute("/app/student/exams")({ component: StudentExams });

function StudentExams() {
  const [q, setQ] = useState("");
  const [type, setType] = useState("");
  const rows = useMemo(() => EXAM_SCHEDULE.filter((r) =>
    (type === "" || r.type === type) &&
    (q === "" || r.subject.toLowerCase().includes(q.toLowerCase()) || r.code.toLowerCase().includes(q.toLowerCase()))
  ).sort((a, b) => a.date.localeCompare(b.date)), [q, type]);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <>
      <AppHeader crumbs={["Portal", "Exam Schedule"]} />
      <PageContainer>
        <PageTitle title="Exam Schedule" subtitle="Upcoming internal and external assessments" />

        <Panel padded={false}>
          <TableToolbar
            query={q} onQuery={setQ}
            placeholder="Search subject or code…"
            filters={[{
              label: "Type", value: type, onChange: setType,
              options: [{ label: "Internal", value: "Internal" }, { label: "External", value: "External" }],
            }]}
          />
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/40">
                <th className="px-5 py-3">Date</th>
                <th className="px-3 py-3">Code</th>
                <th className="px-3 py-3">Subject</th>
                <th className="px-3 py-3">Time</th>
                <th className="px-3 py-3">Room</th>
                <th className="px-5 py-3">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => (
                <tr key={r.code} className="hover:bg-secondary/30">
                  <td className="px-5 py-3 text-xs font-mono">
                    <div className="font-semibold tabular-nums">{r.date}</div>
                    {r.date < today && <span className="text-[10px] text-muted-foreground">past</span>}
                  </td>
                  <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{r.code}</td>
                  <td className="px-3 py-3 text-sm font-medium">{r.subject}</td>
                  <td className="px-3 py-3 text-sm tabular-nums">{r.time}</td>
                  <td className="px-3 py-3 text-sm">{r.room}</td>
                  <td className="px-5 py-3"><Tag tone={r.type === "Internal" ? "blue" : "amber"}>{r.type}</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </PageContainer>
    </>
  );
}
