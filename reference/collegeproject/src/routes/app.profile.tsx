import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppHeader } from "@/components/app-shell";
import { PageContainer, PageTitle, Panel, Btn } from "@/components/ui-kit";
import { useRole } from "@/lib/session";
import { ROLE_USERS } from "@/lib/mock-data";

export const Route = createFileRoute("/app/profile")({ component: Profile });

function Profile() {
  const role = useRole();
  const user = role ? ROLE_USERS[role] : null;
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user ? `${user.name.toLowerCase().replace(/[^a-z]+/g, ".")}@stjudes.edu` : "");
  const [savedName, setSavedName] = useState<string | null>(null);
  const [pwd, setPwd] = useState({ current: "", next: "", confirm: "" });
  const [pwdMsg, setPwdMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedName(name);
  };

  const savePwd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pwd.current || !pwd.next) return setPwdMsg({ tone: "err", text: "Fill all fields." });
    if (pwd.next.length < 8) return setPwdMsg({ tone: "err", text: "New password must be at least 8 characters." });
    if (pwd.next !== pwd.confirm) return setPwdMsg({ tone: "err", text: "Passwords do not match." });
    setPwd({ current: "", next: "", confirm: "" });
    setPwdMsg({ tone: "ok", text: "Password updated successfully." });
  };

  if (!user) return null;

  return (
    <>
      <AppHeader crumbs={["Account", "Profile"]} />
      <PageContainer>
        <PageTitle title="Profile" subtitle="Update your personal information and password" />

        <div className="grid lg:grid-cols-3 gap-6">
          <Panel title="Identity">
            <div className="flex flex-col items-center text-center py-2">
              <div className="size-16 rounded-full bg-secondary ring-1 ring-black/5 grid place-items-center text-lg font-semibold">
                {(savedName ?? name).split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </div>
              <p className="mt-3 text-sm font-medium">{savedName ?? name}</p>
              <p className="text-xs text-muted-foreground">{user.sub}</p>
              <p className="mt-3 text-[10px] uppercase tracking-wider text-muted-foreground">Role</p>
              <p className="text-xs font-mono">{role}</p>
            </div>
          </Panel>

          <div className="lg:col-span-2 space-y-6">
            <Panel title="Personal information">
              <form onSubmit={saveProfile} className="space-y-4">
                <Field label="Display name">
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background ring-1 ring-black/5 rounded-md outline-none focus:ring-ring" />
                </Field>
                <Field label="Email">
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background ring-1 ring-black/5 rounded-md outline-none focus:ring-ring" />
                </Field>
                <div className="flex justify-between items-center">
                  {savedName && <p className="text-xs text-emerald-600">Profile saved.</p>}
                  <Btn type="submit" variant="primary">Save changes</Btn>
                </div>
              </form>
            </Panel>

            <Panel title="Password">
              <form onSubmit={savePwd} className="space-y-4">
                <Field label="Current password">
                  <input type="password" value={pwd.current} onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                    className="w-full px-3 py-2 text-sm bg-background ring-1 ring-black/5 rounded-md outline-none focus:ring-ring" />
                </Field>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Field label="New password">
                    <input type="password" value={pwd.next} onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-background ring-1 ring-black/5 rounded-md outline-none focus:ring-ring" />
                  </Field>
                  <Field label="Confirm new password">
                    <input type="password" value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                      className="w-full px-3 py-2 text-sm bg-background ring-1 ring-black/5 rounded-md outline-none focus:ring-ring" />
                  </Field>
                </div>
                <div className="flex justify-between items-center">
                  {pwdMsg && <p className={`text-xs ${pwdMsg.tone === "ok" ? "text-emerald-600" : "text-destructive"}`}>{pwdMsg.text}</p>}
                  <Btn type="submit" variant="primary">Update password</Btn>
                </div>
              </form>
            </Panel>
          </div>
        </div>
      </PageContainer>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
