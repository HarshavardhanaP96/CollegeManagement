import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Kpi, Panel, Tag, Btn } from "@/components/ui-kit";
import { STUDENT_RECEIPTS } from "@/lib/mock-data";

export const Route = createFileRoute("/app/student/wallet")({ component: StudentWallet });

function StudentWallet() {
  const total = STUDENT_RECEIPTS.reduce((s, r) => s + r.amount, 0);
  return (
    <>
      <AppHeader crumbs={["Portal", "Wallet"]} />
      <PageContainer>
        <PageTitle title="Wallet" subtitle="Payment history, receipts and upcoming charges" action={<Btn variant="primary">Download all receipts</Btn>} />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 grid grid-cols-3 gap-4">
            <Kpi label="Paid · this term" value={`$${total.toLocaleString()}`} delta="100%" deltaTone="up" />
            <Kpi label="Outstanding" value="$0" delta="All clear" deltaTone="up" />
            <Kpi label="Next due" value="Sep 15" delta="Installment 1 · Fall" deltaTone="muted" />
          </div>
          <div className="p-6 rounded-xl bg-primary text-primary-foreground">
            <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">Saved method</p>
            <div className="mt-4 flex items-baseline justify-between">
              <span className="font-mono text-base tracking-widest">•••• 4242</span>
              <span className="text-[10px] opacity-70">VISA</span>
            </div>
            <div className="mt-1 text-xs opacity-70">Julianne Sterling · Exp 04/29</div>
            <button className="w-full mt-5 py-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-xs font-medium rounded-md">Manage payment methods</button>
          </div>
        </div>

        <Panel title="Receipts" padded={false}>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/40">
                <th className="px-5 py-3">Receipt</th>
                <th className="px-3 py-3">Description</th>
                <th className="px-3 py-3">Date</th>
                <th className="px-3 py-3">Method</th>
                <th className="px-3 py-3 text-right">Amount</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {STUDENT_RECEIPTS.map((r) => (
                <tr key={r.id} className="hover:bg-secondary/30">
                  <td className="px-5 py-3 text-xs font-mono">{r.id}</td>
                  <td className="px-3 py-3 text-sm font-medium">{r.desc}</td>
                  <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{r.date}</td>
                  <td className="px-3 py-3 text-sm text-muted-foreground">{r.method}</td>
                  <td className="px-3 py-3 text-sm text-right tabular-nums">${r.amount.toLocaleString()}</td>
                  <td className="px-5 py-3"><Tag tone="green">Paid</Tag></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </PageContainer>
    </>
  );
}
