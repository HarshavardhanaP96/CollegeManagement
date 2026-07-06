import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Kpi, Panel, Tag, Btn, AreaChart } from "@/components/ui-kit";
import { REVENUE_SERIES } from "@/lib/mock-data";

export const Route = createFileRoute("/app/admin/")({ component: AdminOverview });

function AdminOverview() {
  return (
    <>
      <AppHeader crumbs={["Registry", "Executive Overview"]} />
      <PageContainer>
        <PageTitle
          title="Executive Overview"
          subtitle="St. Jude's University · Fall term 2026"
          action={<div className="flex gap-2"><Btn>Export term report</Btn><Btn variant="primary">New announcement</Btn></div>}
        />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi label="Active Enrollment" value="12,482" delta="+2.4%" deltaTone="up" />
          <Kpi label="Term Revenue" value="$4.28M" delta="Steady" deltaTone="muted" />
          <Kpi label="Avg Attendance" value="94.1%" delta="-0.8%" deltaTone="down" />
          <Kpi label="Faculty" value="882" delta="+12 new" deltaTone="up" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Panel title="Fee collection trend" action={<select className="text-[10px] font-medium bg-secondary border-0 rounded px-2 py-1 outline-none"><option>Last 12 months</option></select>}>
              <AreaChart data={REVENUE_SERIES} height={180} />
            </Panel>
          </div>
          <div className="space-y-6">
            <div className="p-6 bg-primary text-primary-foreground rounded-xl">
              <div className="text-[10px] font-semibold uppercase tracking-widest opacity-70">Compliance</div>
              <h3 className="text-base font-semibold mt-1 mb-4">3 active alerts</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex gap-3"><span className="size-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />Faculty credential review due Oct 14</li>
                <li className="flex gap-3"><span className="size-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />Mid-term grade publishing window opens Sep 21</li>
                <li className="flex gap-3"><span className="size-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />26 invoices marked overdue</li>
              </ul>
              <button className="w-full mt-5 py-2 bg-primary-foreground/10 hover:bg-primary-foreground/20 text-xs font-medium rounded-md">Open compliance log</button>
            </div>
            <Panel title="Today's session count">
              <div className="flex items-baseline gap-3"><span className="text-3xl font-semibold tabular-nums">214</span><Tag tone="green">+11 vs avg</Tag></div>
              <div className="mt-3 h-2 bg-secondary rounded-full overflow-hidden"><div className="h-full bg-accent w-[82%]" /></div>
              <p className="text-xs text-muted-foreground mt-2">82% of scheduled sessions confirmed by faculty.</p>
            </Panel>
          </div>
        </div>

        <Panel title="Recent activity">
          <ul className="divide-y divide-border -mx-5">
            {[
              { who: "Marcus Hale",   what: "released midterm grades",          ctx: "Algorithms · CS-A · Y3", when: "11 min ago", tag: "green" },
              { who: "Priya Raman",   what: "generated invoices",               ctx: "Fall 2026 · 248 students", when: "1 hr ago", tag: "blue" },
              { who: "Helena Vorga",  what: "added new subject",                ctx: "Distributed Systems → CS", when: "3 hr ago", tag: "neutral" },
              { who: "System",        what: "auto-retried 4 failed payments",   ctx: "Stripe · USD",            when: "Yesterday", tag: "amber" },
            ].map((a, i) => (
              <li key={i} className="px-5 py-3 flex items-center gap-4 text-sm">
                <Tag tone={a.tag as "green" | "blue" | "neutral" | "amber"}>{a.who}</Tag>
                <span className="text-foreground">{a.what}</span>
                <span className="text-muted-foreground">· {a.ctx}</span>
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">{a.when}</span>
              </li>
            ))}
          </ul>
        </Panel>
      </PageContainer>
    </>
  );
}
