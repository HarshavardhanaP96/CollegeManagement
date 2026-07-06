import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Kpi, Panel, Tag, Btn } from "@/components/ui-kit";
import { TableToolbar } from "@/components/table-toolbar";
import { Modal } from "@/components/modal";
import { FEE_TEMPLATES, INVOICES } from "@/lib/mock-data";

type Invoice = (typeof INVOICES)[number];

export const Route = createFileRoute("/app/admin/fees")({ component: Fees });

function Fees() {
  const [rows, setRows] = useState<Invoice[]>(INVOICES);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [course, setCourse] = useState("");
  const [edit, setEdit] = useState<Invoice | null>(null);

  const filtered = useMemo(() => rows.filter((r) =>
    (status === "" || r.status === status) &&
    (course === "" || r.course === course) &&
    (q === "" || r.student.toLowerCase().includes(q.toLowerCase()) || r.id.toLowerCase().includes(q.toLowerCase()))
  ), [rows, q, status, course]);

  const collected = rows.reduce((s, i) => s + i.paid, 0);
  const due = rows.reduce((s, i) => s + (i.amount - i.paid), 0);

  const courses = Array.from(new Set(rows.map((r) => r.course)));

  return (
    <>
      <AppHeader crumbs={["Registry", "Fee Control"]} />
      <PageContainer>
        <PageTitle
          title="Fee Control Center"
          subtitle="Templates, mass-invoice generation and collection status"
          action={<div className="flex gap-2"><Btn>Send reminders</Btn><Btn variant="primary">Generate invoices</Btn></div>}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi label="Collected · term" value={`$${collected.toLocaleString()}`} delta="+12%" deltaTone="up" />
          <Kpi label="Outstanding" value={`$${due.toLocaleString()}`} delta={`${rows.filter(r => r.status === "Overdue").length} overdue`} deltaTone="down" />
          <Kpi label="Templates" value={String(FEE_TEMPLATES.length)} delta="Active" deltaTone="muted" />
          <Kpi label="Auto-retry queue" value="4" delta="Tomorrow 02:00" deltaTone="muted" />
        </div>

        <Panel title="Fee templates">
          <div className="grid lg:grid-cols-3 gap-3">
            {FEE_TEMPLATES.map((t) => (
              <div key={t.id} className="p-4 rounded-lg ring-1 ring-black/5 bg-background">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground">{t.id}</span>
                  <Tag tone="blue">{t.term}</Tag>
                </div>
                <div className="mt-2 text-sm font-medium">{t.course}</div>
                <div className="mt-3 text-2xl font-semibold tabular-nums">${t.total.toLocaleString()}</div>
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {Object.entries(t.components).map(([k, v]) => (
                    <li key={k} className="flex justify-between"><span>{k}</span><span className="tabular-nums">${v}</span></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Invoices" padded={false}>
          <TableToolbar
            query={q} onQuery={setQ}
            placeholder="Search by student name or invoice ID…"
            filters={[
              { label: "Status", value: status, onChange: setStatus, options: ["Paid","Partial","Overdue"].map(v => ({ label: v, value: v })) },
              { label: "Course", value: course, onChange: setCourse, options: courses.map(v => ({ label: v, value: v })) },
            ]}
          />
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/40">
                <th className="px-5 py-3">Invoice</th>
                <th className="px-3 py-3">Student</th>
                <th className="px-3 py-3">Course</th>
                <th className="px-3 py-3 text-right">Amount</th>
                <th className="px-3 py-3 text-right">Paid</th>
                <th className="px-3 py-3">Progress</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((i) => {
                const pct = Math.round((i.paid / i.amount) * 100);
                return (
                  <tr key={i.id} className="hover:bg-secondary/30">
                    <td className="px-5 py-3 text-xs font-mono">{i.id}</td>
                    <td className="px-3 py-3 text-sm font-medium">{i.student}</td>
                    <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{i.course}</td>
                    <td className="px-3 py-3 text-sm text-right tabular-nums">${i.amount.toLocaleString()}</td>
                    <td className="px-3 py-3 text-sm text-right tabular-nums">${i.paid.toLocaleString()}</td>
                    <td className="px-3 py-3 w-40">
                      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                        <div className={`h-full ${i.status === "Overdue" ? "bg-destructive" : i.status === "Paid" ? "bg-emerald-500" : "bg-accent"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </td>
                    <td className="px-3 py-3"><Tag tone={i.status === "Paid" ? "green" : i.status === "Partial" ? "amber" : "red"}>{i.status}</Tag></td>
                    <td className="px-5 py-3 text-right"><Btn onClick={() => setEdit(i)}>Update</Btn></td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-sm text-muted-foreground">No invoices match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </Panel>
      </PageContainer>

      <UpdateFeeModal
        invoice={edit}
        onClose={() => setEdit(null)}
        onSave={(updated) => { setRows(rows.map((r) => r.id === updated.id ? updated : r)); setEdit(null); }}
      />
    </>
  );
}

function deriveStatus(amount: number, paid: number): Invoice["status"] {
  if (paid <= 0) return "Overdue";
  if (paid >= amount) return "Paid";
  return "Partial";
}

function UpdateFeeModal({ invoice, onClose, onSave }: {
  invoice: Invoice | null; onClose: () => void; onSave: (i: Invoice) => void;
}) {
  const [paid, setPaid] = useState<number>(invoice?.paid ?? 0);
  const [status, setStatus] = useState<Invoice["status"]>(invoice?.status ?? "Partial");

  // Re-sync when invoice changes
  if (invoice && paid !== invoice.paid && status === invoice.status) {
    // no-op safeguard; modal remounts via key below
  }

  if (!invoice) return null;
  const remaining = invoice.amount - paid;

  return (
    <Modal
      key={invoice.id}
      open={!!invoice}
      onClose={onClose}
      title={`Update ${invoice.id} · ${invoice.student}`}
      footer={<>
        <Btn onClick={onClose}>Cancel</Btn>
        <Btn variant="primary" onClick={() => onSave({ ...invoice, paid: Math.max(0, Math.min(invoice.amount, paid)), status })}>Save</Btn>
      </>}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="p-3 bg-secondary/50 rounded-md"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Amount</p><p className="font-semibold tabular-nums">${invoice.amount}</p></div>
          <div className="p-3 bg-secondary/50 rounded-md"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Paid</p><p className="font-semibold tabular-nums">${paid}</p></div>
          <div className="p-3 bg-secondary/50 rounded-md"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Remaining</p><p className="font-semibold tabular-nums">${Math.max(0, remaining)}</p></div>
        </div>
        <label className="block">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Amount paid (USD)</span>
          <input type="number" min={0} max={invoice.amount} value={paid}
            onChange={(e) => { const v = Number(e.target.value); setPaid(v); setStatus(deriveStatus(invoice.amount, v)); }}
            className="w-full px-3 py-2 text-sm bg-background ring-1 ring-black/5 rounded-md outline-none focus:ring-ring tabular-nums" />
        </label>
        <label className="block">
          <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Status</span>
          <select value={status} onChange={(e) => setStatus(e.target.value as Invoice["status"])}
            className="w-full px-3 py-2 text-sm bg-background ring-1 ring-black/5 rounded-md outline-none focus:ring-ring">
            {(["Paid","Partial","Overdue"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>
    </Modal>
  );
}
