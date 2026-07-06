import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Kpi, Panel, Tag, Btn, AreaChart } from "@/components/ui-kit";
import { TENANTS, REVENUE_SERIES } from "@/lib/mock-data";

export const Route = createFileRoute("/app/superadmin")({ component: SuperAdmin });

function SuperAdmin() {
  const totalStudents = TENANTS.reduce((s, t) => s + t.students, 0);
  const totalMrr = TENANTS.reduce((s, t) => s + t.mrr, 0);
  return (
    <>
      <AppHeader crumbs={["Platform", "Executive Overview"]} />
      <PageContainer>
        <PageTitle
          title="Platform Console"
          subtitle={`${TENANTS.length} institutions · real-time platform health`}
          action={<div className="flex gap-2"><Btn>Export</Btn><Btn variant="primary">Onboard institution</Btn></div>}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi label="Active Institutions" value={String(TENANTS.length)} delta="+1 this month" deltaTone="up" />
          <Kpi label="Total Students" value={totalStudents.toLocaleString()} delta="+2.4%" deltaTone="up" />
          <Kpi label="MRR" value={`$${(totalMrr / 1000).toFixed(1)}k`} delta="+8.2%" deltaTone="up" />
          <Kpi label="Uptime · 30d" value="99.98%" delta="SLA met" deltaTone="muted" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Panel title="Platform revenue · last 12 months" action={<select className="text-[10px] font-medium bg-secondary border-0 rounded px-2 py-1 outline-none"><option>USD</option><option>EUR</option></select>}>
              <AreaChart data={REVENUE_SERIES} height={180} />
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
                <div><div className="text-[10px] text-muted-foreground uppercase tracking-wider">Trailing 30d</div><div className="text-lg font-semibold tabular-nums mt-0.5">$268k</div></div>
                <div><div className="text-[10px] text-muted-foreground uppercase tracking-wider">YoY growth</div><div className="text-lg font-semibold tabular-nums mt-0.5 text-emerald-600">+38%</div></div>
                <div><div className="text-[10px] text-muted-foreground uppercase tracking-wider">Net retention</div><div className="text-lg font-semibold tabular-nums mt-0.5">114%</div></div>
              </div>
            </Panel>
          </div>
          <Panel title="Health alerts" padded>
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3"><span className="size-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div><div className="font-medium">Lakeside · audit pending</div><div className="text-muted-foreground text-xs">Tier 2 review window closes in 6 days</div></div></li>
              <li className="flex gap-3"><span className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div><div className="font-medium">Verdant · onboarding complete</div><div className="text-muted-foreground text-xs">Trial converts in 14 days</div></div></li>
              <li className="flex gap-3"><span className="size-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <div><div className="font-medium">Cascade · invoice failure</div><div className="text-muted-foreground text-xs">Auto-retry scheduled for tomorrow 02:00</div></div></li>
            </ul>
          </Panel>
        </div>

        <Panel title="Institutions">
          <div className="overflow-x-auto -mx-5">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
                  <th className="px-5 py-2.5">Institution</th>
                  <th className="px-3 py-2.5">Slug</th>
                  <th className="px-3 py-2.5">Plan</th>
                  <th className="px-3 py-2.5 text-right">Students</th>
                  <th className="px-3 py-2.5 text-right">Staff</th>
                  <th className="px-3 py-2.5 text-right">MRR</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-5 py-2.5">Onboarded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {TENANTS.map((t) => (
                  <tr key={t.id} className="hover:bg-secondary/40">
                    <td className="px-5 py-3 text-sm font-medium">{t.name}</td>
                    <td className="px-3 py-3 text-xs font-mono text-muted-foreground">{t.slug}</td>
                    <td className="px-3 py-3 text-sm">{t.plan}</td>
                    <td className="px-3 py-3 text-sm text-right tabular-nums">{t.students.toLocaleString()}</td>
                    <td className="px-3 py-3 text-sm text-right tabular-nums">{t.staff}</td>
                    <td className="px-3 py-3 text-sm text-right tabular-nums">${t.mrr.toLocaleString()}</td>
                    <td className="px-3 py-3"><Tag tone={t.status === "Active" ? "green" : t.status === "Trial" ? "blue" : "amber"}>{t.status}</Tag></td>
                    <td className="px-5 py-3 text-xs font-mono text-muted-foreground">{t.onboarded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </PageContainer>
    </>
  );
}
