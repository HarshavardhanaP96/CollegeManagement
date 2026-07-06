import { createFileRoute, Link } from "@tanstack/react-router";
import { ROLES } from "@/lib/mock-data";
import { setStoredRole } from "@/lib/session";
import { useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, GraduationCap, BookOpen, User } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EdgePoint — Multi-tenant College ERP" },
      { name: "description", content: "Run your institution end-to-end: admissions, attendance, gradebook, fees and analytics — on one platform." },
      { property: "og:title", content: "EdgePoint — Multi-tenant College ERP" },
      { property: "og:description", content: "Run your institution end-to-end on one platform." },
    ],
  }),
  component: Landing,
});

const ICONS = { superadmin: Building2, admin: GraduationCap, teacher: BookOpen, student: User } as const;

function Landing() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="h-14 border-b border-border flex items-center justify-between px-8">
        <div className="flex items-center gap-2">
          <div className="size-7 bg-primary rounded-sm grid place-items-center">
            <div className="size-3 border-2 border-primary-foreground rounded-full" />
          </div>
          <span className="font-semibold tracking-tight">EdgePoint</span>
          <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground ml-2">Institutional ERP</span>
        </div>
        <Link to="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">Sign in</Link>
      </header>

      <section className="px-8 pt-20 pb-16 max-w-5xl mx-auto">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-5">
          Multi-tenant · Row-level isolated · Built for scale
        </p>
        <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-balance">
          One ledger for the whole institution.
        </h1>
        <p className="mt-5 text-lg text-muted-foreground max-w-2xl text-balance">
          EdgePoint runs admissions, attendance, gradebooks, fees and analytics across every campus you operate —
          with a calm, data-dense interface built for registrars, faculty and families.
        </p>
        <div className="mt-8 flex items-center gap-3">
          <Link to="/login" className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
            Open the console <ArrowRight className="size-4" />
          </Link>
          <a href="#roles" className="inline-flex items-center gap-2 px-4 py-2.5 bg-card ring-1 ring-black/5 rounded-md text-sm font-medium hover:bg-secondary">
            Explore as a role
          </a>
        </div>
      </section>

      <section id="roles" className="px-8 pb-24 max-w-5xl mx-auto">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-4">
          Try a workspace
        </p>
        <div className="grid md:grid-cols-2 gap-3">
          {ROLES.map((r) => {
            const Icon = ICONS[r.id];
            return (
              <button
                key={r.id}
                onClick={() => { setStoredRole(r.id); navigate({ to: r.id === "superadmin" ? "/app/superadmin" : r.id === "admin" ? "/app/admin" : r.id === "teacher" ? "/app/teacher" : "/app/student" }); }}
                className="group text-left p-5 bg-card ring-1 ring-black/5 rounded-xl hover:ring-foreground/20 transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="size-9 rounded-md bg-secondary grid place-items-center">
                    <Icon className="size-5 text-foreground" />
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mt-4">{r.sub}</p>
                <h3 className="text-base font-semibold mt-1">{r.label}</h3>
                <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
              </button>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border px-8 py-6 text-xs text-muted-foreground flex items-center justify-between max-w-5xl mx-auto">
        <span>© EdgePoint Systems · Demo build</span>
        <span className="font-mono">v0.1 · 2026</span>
      </footer>
    </div>
  );
}
