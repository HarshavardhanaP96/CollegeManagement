import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Panel, Tag, Btn } from "@/components/ui-kit";
import { RESULT_BATCHES } from "@/lib/mock-data";

export const Route = createFileRoute("/app/admin/results")({ component: Results });

function Results() {
  const [batches, setBatches] = useState(RESULT_BATCHES);
  const toggle = (id: string) => setBatches((b) => b.map((x) => x.id === id ? { ...x, published: !x.published, releasedAt: !x.published ? new Date().toISOString().slice(0, 10) : null } : x));
  const released = batches.filter((b) => b.published).length;
  return (
    <>
      <AppHeader crumbs={["Registry", "Results Publishing"]} />
      <PageContainer>
        <PageTitle
          title="Publishing Hub"
          subtitle="Master toggle for releasing marks to the student portal"
          action={<div className="flex gap-2"><Btn>Preview release</Btn><Btn variant="primary">Publish all complete</Btn></div>}
        />

        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-card ring-1 ring-black/5 rounded-lg">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Batches</p>
            <p className="text-2xl font-semibold tabular-nums mt-1">{batches.length}</p>
          </div>
          <div className="p-4 bg-card ring-1 ring-black/5 rounded-lg">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Released</p>
            <p className="text-2xl font-semibold tabular-nums mt-1 text-emerald-600">{released}</p>
          </div>
          <div className="p-4 bg-primary text-primary-foreground rounded-lg">
            <p className="text-[10px] uppercase tracking-wider opacity-70">Hold</p>
            <p className="text-2xl font-semibold tabular-nums mt-1">{batches.length - released}</p>
          </div>
        </div>

        <Panel title="Result batches" padded={false}>
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-secondary/40">
                <th className="px-5 py-3">Section</th>
                <th className="px-3 py-3">Subject</th>
                <th className="px-3 py-3">Entry progress</th>
                <th className="px-3 py-3">Released</th>
                <th className="px-5 py-3 text-right">Master toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {batches.map((b) => {
                const pct = Math.round((b.entered / b.total) * 100);
                const ready = b.entered === b.total;
                return (
                  <tr key={b.id} className="hover:bg-secondary/30">
                    <td className="px-5 py-3 text-sm font-medium">{b.section}</td>
                    <td className="px-3 py-3 text-sm">{b.subject}</td>
                    <td className="px-3 py-3 w-56">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className={`h-full ${ready ? "bg-emerald-500" : "bg-amber-500"}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs tabular-nums text-muted-foreground">{b.entered}/{b.total}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3"><Tag tone={b.published ? "green" : "neutral"}>{b.published ? `Released · ${b.releasedAt}` : "Hold"}</Tag></td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => toggle(b.id)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${b.published ? "bg-emerald-500" : "bg-secondary ring-1 ring-black/10"}`}
                      >
                        <span className={`inline-block size-4 transform rounded-full bg-white transition-transform ${b.published ? "translate-x-4" : "translate-x-0.5"}`} />
                      </button>
                    </td>
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
