import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Panel, Tag } from "@/components/ui-kit";
import { TableToolbar } from "@/components/table-toolbar";
import { STUDENT_MARKS } from "@/lib/mock-data";

export const Route = createFileRoute("/app/student/marks")({ component: StudentMarks });

function StudentMarks() {
  const semesters = Object.keys(STUDENT_MARKS);
  const [sem, setSem] = useState(semesters[0]);
  const [type, setType] = useState("");
  const [q, setQ] = useState("");

  const rows = useMemo(() => {
    const base = STUDENT_MARKS[sem] ?? [];
    return base.filter((r) =>
      (q === "" || r.subject.toLowerCase().includes(q.toLowerCase()) || r.code.toLowerCase().includes(q.toLowerCase())),
    );
  }, [sem, q]);

  const showInternal = type === "" || type === "internal";
  const showExternal = type === "" || type === "external";

  return (
    <>
      <AppHeader crumbs={["Portal", "Marks"]} />
      <PageContainer>
        <PageTitle
          title="Examination Marks"
          subtitle="Internal continuous assessment and external university marks"
        />

        <div className="flex flex-wrap gap-2">
          {semesters.map((s) => (
            <button key={s} onClick={() => setSem(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md ring-1 ${sem === s ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-black/5 hover:bg-secondary"}`}>
              {s}
            </button>
          ))}
        </div>

        <Panel title={`${sem} · Mark sheet`} padded={false}>
          <TableToolbar
            query={q} onQuery={setQ}
            placeholder="Search by subject or course code…"
            filters={[{
              label: "Type",
              value: type, onChange: setType,
              options: [{ label: "Internal", value: "internal" }, { label: "External", value: "external" }],
            }]}
          />
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/40">
                <th className="px-5 py-3">Code</th>
                <th className="px-3 py-3">Subject</th>
                {showInternal && <th className="px-3 py-3 text-right">Internal / 30</th>}
                {showExternal && <th className="px-3 py-3 text-right">External / 70</th>}
                <th className="px-3 py-3 text-right">Total / 100</th>
                <th className="px-5 py-3">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((r) => {
                const tone = r.total >= 85 ? "green" : r.total >= 70 ? "blue" : r.total >= 60 ? "amber" : "red";
                return (
                  <tr key={r.code} className="hover:bg-secondary/30">
                    <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{r.code}</td>
                    <td className="px-3 py-3 text-sm font-medium">{r.subject}</td>
                    {showInternal && <td className="px-3 py-3 text-sm text-right tabular-nums">{r.internal}</td>}
                    {showExternal && <td className="px-3 py-3 text-sm text-right tabular-nums">{r.external}</td>}
                    <td className="px-3 py-3 text-sm text-right tabular-nums font-semibold">{r.total}</td>
                    <td className="px-5 py-3"><Tag tone={tone as never}>{r.grade}</Tag></td>
                  </tr>
                );
              })}
              {rows.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">No subjects match your search.</td></tr>
              )}
            </tbody>
          </table>
        </Panel>
      </PageContainer>
    </>
  );
}
