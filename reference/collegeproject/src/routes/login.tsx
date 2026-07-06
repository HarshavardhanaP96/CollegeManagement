import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ROLES, type Role } from "@/lib/mock-data";
import { setStoredRole } from "@/lib/session";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — EdgePoint" }, { name: "description", content: "Sign in to your EdgePoint workspace." }] }),
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("admin");
  const [email, setEmail] = useState("priya.raman@stjudes.edu");
  const [password, setPassword] = useState("••••••••");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredRole(role);
    navigate({ to: role === "superadmin" ? "/app/superadmin" : role === "admin" ? "/app/admin" : role === "teacher" ? "/app/teacher" : "/app/student" });
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground">
        <Link to="/" className="flex items-center gap-2 w-fit">
          <div className="size-7 bg-primary-foreground/10 rounded-sm grid place-items-center ring-1 ring-primary-foreground/20">
            <div className="size-3 border-2 border-primary-foreground rounded-full" />
          </div>
          <span className="font-semibold tracking-tight">EdgePoint</span>
        </Link>
        <div className="space-y-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] opacity-60">Workspace · St. Jude's University</p>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            "We migrated 14 campuses in a single term. Registrars finally got a quiet morning back."
          </h2>
          <div className="text-sm opacity-70">
            <div className="font-medium text-primary-foreground">Dr. Aris Thorne</div>
            <div>Chief Academic Officer · St. Jude's</div>
          </div>
        </div>
        <div className="text-[10px] font-mono opacity-50 uppercase tracking-widest">SOC 2 · FERPA · ISO 27001</div>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Sign in</p>
            <h1 className="text-2xl font-semibold tracking-tight mt-1">Enter the console</h1>
            <p className="text-sm text-muted-foreground mt-1">Demo build — pick a role to enter the matching workspace.</p>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground/80">Workspace role</label>
            <div className="mt-1.5 grid grid-cols-2 gap-1.5">
              {ROLES.map((r) => (
                <button
                  type="button"
                  key={r.id}
                  onClick={() => setRole(r.id)}
                  className={[
                    "px-3 py-2 text-xs rounded-md ring-1 text-left transition-colors",
                    role === r.id ? "bg-primary text-primary-foreground ring-primary" : "bg-card ring-black/5 hover:bg-secondary",
                  ].join(" ")}
                >
                  <div className="font-medium">{r.label}</div>
                  <div className={role === r.id ? "text-primary-foreground/70 text-[10px]" : "text-muted-foreground text-[10px]"}>{r.sub}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground/80">Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" className="mt-1 w-full px-3 py-2 bg-card ring-1 ring-black/5 rounded-md text-sm outline-none focus:ring-ring" />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground/80">Password</label>
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" className="mt-1 w-full px-3 py-2 bg-card ring-1 ring-black/5 rounded-md text-sm outline-none focus:ring-ring" />
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90">
            Continue to {ROLES.find((r) => r.id === role)?.label}
          </button>
          <p className="text-[10px] text-muted-foreground text-center">
            By continuing you agree to the EdgePoint Acceptable Use Policy.
          </p>
        </form>
      </div>
    </div>
  );
}
