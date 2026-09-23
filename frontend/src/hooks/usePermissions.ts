import { useAuthStore } from '../store/authStore';
import { canPerform, isRouteAllowed } from '../strategies/roleStrategy';
import type { Action, Resource } from '../strategies/roleStrategy';

/**
 * Action Strategy — the single place UI code asks "is the current user
 * allowed to do X to Y". Backed by `canPerform()` in roleStrategy.ts, which
 * already defines the permission matrix per role; this hook just binds it
 * to the logged-in user so components don't have to read `user.roleName`
 * themselves.
 *
 * This is a UX convenience layer, not the security boundary — it hides
 * actions the user isn't meant to take so the UI doesn't offer them, but
 * the backend's `@PreAuthorize` checks are what actually enforce access.
 * Never treat a passing `can()` check here as proof a request will
 * succeed; the API call can still be rejected and callers should handle
 * that (see `getErrorMessage`).
 *
 * For declarative JSX gating, use the `<Can>` component in `./Can.tsx`
 * instead of calling this hook directly (kept in a separate file so this
 * one exports only the hook — mixing a hook and a component in one file
 * defeats React Fast Refresh).
 */
export function usePermissions() {
  const user = useAuthStore((s) => s.user);

  return {
    /** Can the current user perform `action` on `resource`? False if logged out. */
    can: (action: Action, resource: Resource): boolean =>
      !!user && canPerform(user.roleName, action, resource),
    /** Can the current user's role navigate to `path`? False if logged out. */
    canAccessRoute: (path: string): boolean =>
      !!user && isRouteAllowed(user.roleName, path),
    roleName: user?.roleName,
  };
}
