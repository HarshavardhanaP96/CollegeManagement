import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { AppSidebar } from "@/components/app-shell";
import { useRole } from "@/lib/session";
import { getStoredRole } from "@/lib/session";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && !getStoredRole()) {
      throw redirect({ to: "/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const role = useRole();
  if (!role) return null;
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <AppSidebar role={role} />
      <main className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
