import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Panel, Tag, Btn } from "@/components/ui-kit";
import { TableToolbar } from "@/components/table-toolbar";
import { STAFF } from "@/lib/mock-data";

export const Route = createFileRoute("/app/admin/staff")({ component: Staff });

function Staff() {
  const [q, setQ] = useState("");
  const [dept, setDept] = useState("");
  const [status, setStatus] = useState("");

  const departments = Array.from(new Set(STAFF.map((s) => s.dept)));
  const filtered = useMemo(() => STAFF.filter((s) =>
    (dept === "" || s.dept === dept) &&
    (status === "" || s.status === status) &&
    (q === "" || s.name.toLowerCase().includes(q.toLowerCase()) || s.email.toLowerCase().includes(q.toLowerCase()) || s.id.toLowerCase().includes(q.toLowerCase()))
  ), [q, dept, status]);

  return (
    <>
      <AppHeader crumbs={["Registry", "Staff Room"]} />
      <PageContainer>
        <PageTitle
          title="Staff Room"
          subtitle="Faculty roster, departments and credential status"
          action={<div className="flex gap-2"><Btn>Import CSV</Btn><Btn variant="primary">Add faculty</Btn></div>}
        />

        <Panel padded={false}>
          <TableToolbar
            query={q} onQuery={setQ}
            placeholder="Search by name, email or ID…"
            filters={[
              { label: "Dept",   value: dept,   onChange: setDept,   options: departments.map((d) => ({ label: d, value: d })) },
              { label: "Status", value: status, onChange: setStatus, options: ["Active","Pending","On Leave"].map((v) => ({ label: v, value: v })) },
            ]}
          />
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/40">
                <th className="px-5 py-3">ID</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">Department</th>
                <th className="px-3 py-3">Role</th>
                <th className="px-3 py-3">Email</th>
                <th className="px-3 py-3 text-right">Weekly load (h)</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/30">
                  <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{s.id}</td>
                  <td className="px-3 py-3 text-sm font-medium">{s.name}</td>
                  <td className="px-3 py-3 text-sm">{s.dept}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{s.role}</td>
                  <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{s.email}</td>
                  <td className="px-3 py-3 text-sm text-right tabular-nums">{s.load}</td>
                  <td className="px-5 py-3"><Tag tone={s.status === "Active" ? "green" : s.status === "Pending" ? "amber" : "neutral"}>{s.status}</Tag></td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-sm text-muted-foreground">No staff match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </Panel>
      </PageContainer>
    </>
  );
}
