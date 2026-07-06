import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Kpi, Panel, Btn } from "@/components/ui-kit";
import { TEACHER_CLASSES } from "@/lib/mock-data";
import { ArrowRight, Clock, MapPin, Users } from "lucide-react";

export const Route = createFileRoute("/app/teacher/")({ component: TeacherClasses });

function TeacherClasses() {
  return (
    <>
      <AppHeader crumbs={["Faculty", "My Classes"]} />
      <PageContainer>
        <PageTitle title="Command Center" subtitle={`Welcome back, Marcus · ${TEACHER_CLASSES.length} active sections this term`} action={<Btn variant="primary">Start session</Btn>} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi label="Sessions today" value="2" delta="Next at 10:00" deltaTone="muted" />
          <Kpi label="Pending grading" value="36" delta="Across 2 subjects" deltaTone="muted" />
          <Kpi label="Avg attendance" value="89%" delta="+1.2%" deltaTone="up" />
          <Kpi label="Needs attention" value="3" delta="Students flagged" deltaTone="down" />
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {TEACHER_CLASSES.map((c) => (
            <Link key={c.id} to="/app/teacher/class/$classId" params={{ classId: c.id }} className="group block p-5 bg-card ring-1 ring-black/5 rounded-xl hover:ring-foreground/20 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{c.section}</p>
                  <h3 className="text-lg font-semibold mt-1">{c.subject}</h3>
                </div>
                <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground"><Users className="size-3.5" /><span className="tabular-nums">{c.students} students</span></div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><Clock className="size-3.5" /><span>{c.nextSession}</span></div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><MapPin className="size-3.5" /><span>{c.room}</span></div>
              </div>
            </Link>
          ))}
        </div>

        <Panel title="Needs attention">
          <ul className="divide-y divide-border -mx-5">
            {[
              { name: "Noor Hassan",   reason: "Marks dropped 24% from last assessment", subj: "Algorithms" },
              { name: "Elara Vance",   reason: "Attendance below 75% threshold",         subj: "Databases" },
              { name: "Marcus Chen",   reason: "Missed 2 consecutive submissions",       subj: "Data Structures" },
            ].map((s) => (
              <li key={s.name} className="px-5 py-3 flex items-center gap-4 text-sm">
                <div className="size-7 rounded-full bg-secondary grid place-items-center text-[10px] font-semibold">{s.name.split(" ").map(x => x[0]).join("")}</div>
                <div className="flex-1"><div className="font-medium">{s.name} <span className="text-muted-foreground font-normal">· {s.subj}</span></div><div className="text-xs text-muted-foreground">{s.reason}</div></div>
                <Btn>Open profile</Btn>
              </li>
            ))}
          </ul>
        </Panel>
      </PageContainer>
    </>
  );
}
