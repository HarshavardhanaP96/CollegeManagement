import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Panel, Btn } from "@/components/ui-kit";
import { COURSES } from "@/lib/mock-data";
import { GripVertical, Plus } from "lucide-react";

export const Route = createFileRoute("/app/admin/curriculum")({ component: Curriculum });

function Curriculum() {
  return (
    <>
      <AppHeader crumbs={["Registry", "Curriculum Builder"]} />
      <PageContainer>
        <PageTitle
          title="Curriculum Builder"
          subtitle="Map subjects to programs · drag to re-order, click to edit"
          action={<div className="flex gap-2"><Btn>Discard</Btn><Btn variant="primary">Save changes</Btn></div>}
        />

        <div className="grid lg:grid-cols-2 gap-4">
          {COURSES.map((c) => (
            <Panel key={c.id} title={c.name} action={<span className="text-[10px] font-mono text-muted-foreground">{c.id}</span>}>
              <ul className="space-y-1.5">
                {c.subjects.map((s, i) => (
                  <li key={s} className="flex items-center gap-2 px-2 py-2 rounded-md ring-1 ring-black/5 bg-background hover:bg-secondary/40 group">
                    <GripVertical className="size-3.5 text-muted-foreground/60 cursor-grab" />
                    <span className="text-[10px] font-mono text-muted-foreground w-6 tabular-nums">#{i + 1}</span>
                    <span className="text-sm flex-1">{s}</span>
                    <span className="text-[10px] font-medium text-muted-foreground">{Math.floor(30 + Math.random() * 30)} hrs</span>
                  </li>
                ))}
                <button className="w-full flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium text-muted-foreground border border-dashed border-border hover:border-foreground/30 hover:text-foreground">
                  <Plus className="size-3.5" /> Add subject
                </button>
              </ul>
            </Panel>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
