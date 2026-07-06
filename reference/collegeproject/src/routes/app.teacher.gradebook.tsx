import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Panel, Tag, Btn } from "@/components/ui-kit";
import { TableToolbar } from "@/components/table-toolbar";
import { GRADEBOOK } from "@/lib/mock-data";

export const Route = createFileRoute("/app/teacher/gradebook")({ component: Gradebook });

function Gradebook() {
  const [rows, setRows] = useState(GRADEBOOK);
  const [q, setQ] = useState("");
  const [standing, setStanding] = useState("");
  const update = (id: string, key: "mid" | "project" | "final", val: string) => {
    const n = val === "" ? null : Math.max(0, Math.min(100, Number(val)));
    if (val !== "" && Number.isNaN(n)) return;
    setRows((r) => r.map((x) => x.id === id ? { ...x, [key]: n } : x));
  };
  const grade = (avg: number | null) => {
    if (avg === null) return { tone: "neutral" as const, label: "—" };
    if (avg >= 85) return { tone: "green"   as const, label: "Excelling" };
    if (avg >= 70) return { tone: "blue"    as const, label: "On track"  };
    if (avg >= 60) return { tone: "amber"   as const, label: "Pending"   };
    return            { tone: "red"     as const, label: "At risk"   };
  };
  const filtered = useMemo(() => rows.filter((r) => {
    if (q !== "" && !r.name.toLowerCase().includes(q.toLowerCase()) && !r.id.toLowerCase().includes(q.toLowerCase())) return false;
    if (standing !== "") {
      const scores = [r.mid, r.project, r.final].filter((v): v is number => v !== null);
      const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
      if (grade(avg).label !== standing) return false;
    }
    return true;
  }), [rows, q, standing]);
  return (
    <>
      <AppHeader crumbs={["Faculty", "Algorithms · CS-A · Y3", "Gradebook"]} />
      <PageContainer>
        <PageTitle
          title="Gradebook"
          subtitle="Spreadsheet-style entry · changes save when you commit"
          action={<div className="flex gap-2"><Btn>Export CSV</Btn><Btn variant="primary">Submit for review</Btn></div>}
        />

        <Panel padded={false}>
          <TableToolbar
            query={q} onQuery={setQ}
            placeholder="Search students by name or ID…"
            filters={[{
              label: "Standing", value: standing, onChange: setStanding,
              options: ["Excelling","On track","Pending","At risk"].map((v) => ({ label: v, value: v })),
            }]}
          />
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/40">
                <th className="px-5 py-3">ID</th>
                <th className="px-3 py-3">Student</th>
                <th className="px-3 py-3 text-right">Mid</th>
                <th className="px-3 py-3 text-right">Project</th>
                <th className="px-3 py-3 text-right">Final</th>
                <th className="px-3 py-3 text-right">Attendance</th>
                <th className="px-3 py-3 text-right">Avg</th>
                <th className="px-5 py-3">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((r) => {
                const scores = [r.mid, r.project, r.final].filter((v): v is number => v !== null);
                const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
                const g = grade(avg);
                return (
                  <tr key={r.id} className="hover:bg-secondary/30">
                    <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{r.id}</td>
                    <td className="px-3 py-3 text-sm font-medium">{r.name}</td>
                    {(["mid", "project", "final"] as const).map((k) => (
                      <td key={k} className="px-3 py-3 text-right">
                        <input
                          value={r[k] ?? ""}
                          onChange={(e) => update(r.id, k, e.target.value)}
                          placeholder="—"
                          className="w-14 text-sm text-right tabular-nums px-2 py-1 bg-transparent rounded ring-1 ring-transparent hover:ring-black/5 focus:ring-ring focus:bg-card outline-none"
                        />
                      </td>
                    ))}
                    <td className="px-3 py-3 text-sm text-right tabular-nums text-muted-foreground">{r.attendance}%</td>
                    <td className="px-3 py-3 text-sm text-right tabular-nums font-semibold">{avg ?? "—"}</td>
                    <td className="px-5 py-3"><Tag tone={g.tone}>{g.label}</Tag></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </PageContainer>
    </>
  );
}
