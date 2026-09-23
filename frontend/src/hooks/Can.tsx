import type { ReactNode } from 'react';
import { usePermissions } from './usePermissions';
import type { Action, Resource } from '../strategies/roleStrategy';

interface CanProps {
  action: Action;
  resource: Resource;
  children: ReactNode;
  /** Rendered instead of `children` when the check fails. Defaults to nothing. */
  fallback?: ReactNode;
}

/**
 * Declarative permission gate for JSX — the Action Strategy's UI-facing
 * half (see `usePermissions.ts` for the underlying check). Wrap anything —
 * a button, a whole section — that should only render when the current
 * user's role is allowed to perform `action` on `resource`.
 *
 * @example
 * <Can action="create" resource="courses">
 *   <Button onClick={...}>New Course</Button>
 * </Can>
 */
export function Can({ action, resource, children, fallback = null }: CanProps) {
  const { can } = usePermissions();
  return <>{can(action, resource) ? children : fallback}</>;
}
