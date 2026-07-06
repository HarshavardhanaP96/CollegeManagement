import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Panel, AreaChart, BarChart, Tag } from "@/components/ui-kit";
import { STUDENT_GROWTH, STUDENT_SUBJECTS } from "@/lib/mock-data";

export const Route = createFileRoute("/app/student/analytics")({ component: StudentAnalytics });

function StudentAnalytics() {
  return (
    <>
      <AppHeader crumbs={["Portal", "Analytics"]} />
      <PageContainer>
        <PageTitle title="How am I doing?" subtitle="Cross-subject performance, growth and class comparison" />

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Panel title="Subject performance vs class average">
              <BarChart data={STUDENT_SUBJECTS.map((s) => ({ label: s.subject.split(" ")[0], mine: s.mine, avg: s.avg }))} height={200} />
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-accent" /> You</span>
                <span className="flex items-center gap-1.5"><span className="size-2 rounded-sm bg-border-strong" /> Class average</span>
              </div>
            </Panel>
          </div>
          <Panel title="Month-over-month growth">
            <AreaChart data={STUDENT_GROWTH} height={200} />
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tabular-nums">+22.5%</span>
              <span className="text-xs text-muted-foreground">since September</span>
            </div>
          </Panel>
        </div>

        <Panel title="Subject breakdown" padded={false}>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/40">
                <th className="px-5 py-3">Subject</th>
                <th className="px-3 py-3 text-right">Your score</th>
                <th className="px-3 py-3 text-right">Class average</th>
                <th className="px-3 py-3 text-right">Δ vs last exam</th>
                <th className="px-5 py-3">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {STUDENT_SUBJECTS.map((s) => {
                const delta = parseInt(s.trend, 10);
                const tone = s.mine - s.avg >= 5 ? "green" : s.mine - s.avg >= 0 ? "blue" : "amber";
                const label = s.mine - s.avg >= 5 ? "Above average" : s.mine - s.avg >= 0 ? "On par" : "Below average";
                return (
                  <tr key={s.subject} className="hover:bg-secondary/30">
                    <td className="px-5 py-3 text-sm font-medium">{s.subject}</td>
                    <td className="px-3 py-3 text-sm text-right tabular-nums">{s.mine}</td>
                    <td className="px-3 py-3 text-sm text-right tabular-nums text-muted-foreground">{s.avg}</td>
                    <td className={`px-3 py-3 text-sm text-right tabular-nums font-medium ${delta >= 0 ? "text-emerald-600" : "text-destructive"}`}>{s.trend}</td>
                    <td className="px-5 py-3"><Tag tone={tone as "green" | "blue" | "amber"}>{label}</Tag></td>
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
