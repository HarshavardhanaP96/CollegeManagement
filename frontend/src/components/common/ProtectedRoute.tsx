import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { isRouteAllowed } from '../../strategies/roleStrategy';

interface ProtectedRouteProps {
  children: ReactNode;
}

/**
 * Route Access Strategy — the single guard every routed page goes through.
 *
 * Two checks, in order:
 *  1. Authenticated at all? If not, bounce to /login.
 *  2. Is the current user's role allowed on this path, per
 *     `isRouteAllowed()` in roleStrategy.ts (the same source of truth the
 *     Sidebar uses to decide which links to show)? If not, bounce to
 *     /unauthorized.
 *
 * Previously `routes/index.tsx` filtered which routes to even register
 * using its own local Set-of-allowed-paths logic, and used a separate
 * `RoleGate` component that only checked #1 — so a route the Sidebar
 * wouldn't link to for a role was still directly reachable by URL if a
 * user typed/bookmarked it. This component is the fix: it's the one place
 * route-level access control happens, reusing the exact same
 * `isRouteAllowed` rule as the nav.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!isRouteAllowed(user.roleName, location.pathname)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
