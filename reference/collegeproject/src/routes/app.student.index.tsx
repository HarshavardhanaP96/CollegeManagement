import { createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Kpi, Panel, Tag } from "@/components/ui-kit";
import { STUDENT_TIMELINE } from "@/lib/mock-data";
import { Award, CalendarDays, Receipt, Bell } from "lucide-react";

export const Route = createFileRoute("/app/student/")({ component: StudentToday });

const ICON = { mark: Award, attendance: CalendarDays, fee: Receipt, notice: Bell } as const;

function StudentToday() {
  return (
    <>
      <AppHeader crumbs={["Portal", "Today"]} />
      <PageContainer>
        <PageTitle title="Today, Julianne" subtitle="Wednesday · 13 May 2026 · BSc Computer Science · Year 3" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Kpi label="Term GPA" value="3.92" delta="+0.08 vs last term" deltaTone="up" />
          <Kpi label="Attendance" value="96%" delta="Top 12% of class" deltaTone="up" />
          <Kpi label="Outstanding fees" value="$0" delta="All paid" deltaTone="up" />
          <Kpi label="New marks" value="2" delta="Released today" deltaTone="muted" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Panel title="Story timeline">
              <ol className="relative border-l border-border ml-2 space-y-5">
                {STUDENT_TIMELINE.map((e, i) => {
                  const Icon = ICON[e.type as keyof typeof ICON];
                  return (
                    <li key={i} className="ml-5">
                      <span className="absolute -left-[9px] mt-1 size-4 rounded-full bg-card ring-1 ring-black/10 grid place-items-center">
                        <Icon className="size-2.5 text-foreground" />
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{e.title}</span>
                        <Tag tone={e.type === "mark" ? "green" : e.type === "fee" ? "blue" : e.type === "attendance" ? "neutral" : "amber"}>{e.type}</Tag>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{e.detail}</p>
                      <p className="text-[10px] text-muted-foreground/80 mt-1 font-mono uppercase tracking-wider">{e.when}</p>
                    </li>
                  );
                })}
              </ol>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel title="Today's schedule">
              <ul className="space-y-3">
                {[
                  { time: "10:00", subj: "Algorithms",     room: "B-204" },
                  { time: "12:00", subj: "Lunch break",    room: "—" },
                  { time: "14:00", subj: "Databases",      room: "B-211" },
                  { time: "16:00", subj: "Project clinic", room: "Lab 3" },
                ].map((s) => (
                  <li key={s.time} className="flex gap-3 text-sm">
                    <span className="font-mono text-xs text-muted-foreground tabular-nums w-12 mt-0.5">{s.time}</span>
                    <div><div className="font-medium">{s.subj}</div><div className="text-xs text-muted-foreground">{s.room}</div></div>
                  </li>
                ))}
              </ul>
            </Panel>
            <div className="p-6 bg-primary text-primary-foreground rounded-xl">
              <p className="text-[10px] font-semibold uppercase tracking-widest opacity-70">Streak</p>
              <p className="text-3xl font-semibold tabular-nums mt-2">14 days</p>
              <p className="text-xs opacity-80 mt-1">Of full attendance. Personal best.</p>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
