# Frontend Access Control: Query / Action / Route Strategies

This document covers the three strategy layers that decide, per logged-in role,
**what data a page fetches**, **what actions the UI offers**, and **which URLs
are reachable** — plus how they combine to drive role-based conditional
rendering. It's written for three audiences: skip to the section that's yours.

- [For developers](#for-developers) — how the three strategies work, how to extend them
- [For devops / security](#for-devops--security) — what this does and does not protect
- [For users / support](#for-users--support) — what each role can actually see and do

All three strategies live under `frontend/src/`:

```
strategies/roleStrategy.ts   → the permission matrix + nav/dashboard config (source of truth)
hooks/usePermissions.ts      → Action Strategy: usePermissions() hook
hooks/Can.tsx                → Action Strategy: <Can> declarative JSX gate
components/common/ProtectedRoute.tsx → Route Access Strategy: per-request guard
api/queryKeys.ts             → Query Strategy: the query-key factory
```

---

## For developers

### Why this exists

Before this layer, three things were each solved ad hoc, in a different place,
inconsistently:

1. **Data fetching** — every page wrote its own inline TanStack Query key
   (`queryKey: ['courses']`) and its own inline invalidation target
   (`invalidateQueries({ queryKey: ['courses'] })`). Nothing checked the two
   matched, so a typo in either one silently breaks cache invalidation — a
   mutation succeeds but the list page never refetches.
2. **Actions** — `canPerform(roleName, action, resource)` already existed in
   `roleStrategy.ts` with a real per-role permission matrix, but nothing in the
   UI ever called it. Every "Create" button was unconditionally visible to
   every role that could reach the page.
3. **Routes** — `routes/index.tsx` filtered which routes to register using its
   own local `Set`-of-allowed-paths logic, separate from the `isRouteAllowed()`
   function already sitting in `roleStrategy.ts`, and gated each route with a
   `RoleGate` component that only checked "is someone logged in" — not "is
   *this role* allowed on *this path*". A `ProtectedRoute` component existed
   that did the role check properly, but was never imported anywhere.

All three gaps had the same shape: the right piece existed, nothing used it.
This layer wires them in and gives them one obvious home each.

### Query Strategy — `api/queryKeys.ts`

A single object, one entry per resource, following TanStack Query's
recommended key-factory shape:

```ts
export const queryKeys = {
  courses: { all: ['courses'] as const },
  studentMarks: {
    all: ['student-marks'] as const,
    bySemester: (semester?: number) => ['student-marks', semester] as const,
  },
  // ...
};
```

- `resource.all` — the unfiltered list fetch, **and** the invalidation target
  after create/update/delete (TanStack matches by prefix, so invalidating
  `.all` also invalidates any parameterized query nested under it).
- `resource.bySomething(x)` — a specific parameterized fetch.

**Adding a new resource or query:** add the key here first, then use it from
the page. Don't inline a `queryKey: [...]` array literal in a page component —
if you find yourself doing that, the key belongs in this file instead.

### Action Strategy — `usePermissions()` / `<Can>`

`canPerform(roleName, action, resource)` in `roleStrategy.ts` is the actual
permission matrix (per role: which of `create` / `read` / `update` / `delete`
it has on each resource). `usePermissions()` binds that to the logged-in user:

```tsx
const { can } = usePermissions();
if (can('delete', 'students')) { /* ... */ }
```

For JSX, prefer the declarative `<Can>` gate instead of an `if`:

```tsx
<Can action="create" resource="courses">
  <Button onClick={() => navigate('/courses/new')}>New Course</Button>
</Can>
```

It's currently wired onto the "Create" button of every list page (Colleges,
Departments, Courses, Subjects, Teachers, Students, Classes) and the "Edit
Profile" button on the student profile page.

**Important — this is a UX layer, not the security boundary.** `<Can>` hides
actions the UI shouldn't offer; it does not and cannot stop a network request.
The backend's `@PreAuthorize` annotations are the actual enforcement. See
[For devops / security](#for-devops--security).

**Why nothing looks different yet:** as of today, every role that can reach a
resource's list page already has full CRUD on it in `roleStrategy.ts`'s
permission matrix — there's no role today with, say, read-only access to a
resource it can navigate to. So gating by `canPerform` doesn't currently hide
anything for any real user; it's the enforced pattern for the next time a role
needs narrower access, without touching the page again.

### Route Access Strategy — `<ProtectedRoute>` / `isRouteAllowed()`

`isRouteAllowed(roleName, path)` (in `roleStrategy.ts`) is the single rule for
"can this role reach this URL" — it checks whether the path's first segment
matches the root of any of that role's `navItems`. `ProtectedRoute` wraps
every routed page and applies it on every request:

```tsx
<Route path={path} element={<ProtectedRoute><Component /></ProtectedRoute>} />
```

1. Not authenticated → redirect to `/login`.
2. Authenticated but `isRouteAllowed` says no → redirect to `/unauthorized`.
3. Otherwise → render.

`routes/index.tsx` also uses the same `isRouteAllowed()` call to decide which
routes to register at all, so an unreachable route doesn't even exist in the
router — `ProtectedRoute` is what catches a direct URL hit (typed, bookmarked,
or reached before a role change takes effect) for a route that *is*
registered for the current role's session but has since become disallowed.

This is the same function the Sidebar uses to build nav links, so "can I see a
link to X" and "can I actually load X by URL" are guaranteed to agree — there
is only one source of truth (`roleStrategy.ts`'s `navItems`), not two.

### Adding a new resource end to end

1. Add the resource's permissions to each relevant role's `permissions` map in
   `roleStrategy.ts`.
2. Add its nav entry (`navItems`) with an icon key from
   `components/layout/navIconMap.tsx` (add a new icon there if needed).
3. Add its query key(s) to `api/queryKeys.ts`.
4. Register its route(s) in `routes/index.tsx`'s `routeComponentMap` —
   `ProtectedRoute` and the allow-list filter apply automatically.
5. Gate its create/edit/delete affordances with `<Can>`.

---

## For devops / security

- **The three strategies above are entirely client-side UX.** They control
  what a logged-in user sees and can click; they do not authorize API calls.
  Every endpoint's real authorization is the `@PreAuthorize` annotation on its
  Spring controller (see `backend/src/main/java/com/edgepoint/**/controller/`).
  If a role should never be able to perform an action, it must be denied
  there — the frontend hiding a button is a convenience, not a control.
- **Confirmed backend/frontend authorization mismatch, fixed in this pass:**
  `ClassController` is annotated `@PreAuthorize("hasAnyRole('SUPERADMIN',
  'COLLEGEADMIN', 'HOD')")`, but `ClassManagementServiceImpl.getAllClasses()`
  unconditionally required the caller to be an HOD of some department,
  throwing for the two other explicitly-authorized roles. Fixed to scope by
  college for SUPERADMIN/COLLEGEADMIN (matching the existing
  `DepartmentServiceImpl.getAllDepartments()` convention) and by department
  for HOD. Worth an audit pass over other multi-role endpoints for the same
  "authorized at the controller, not implemented at the service" gap.
- **`BadRequestException` had no `@ExceptionHandler`** in
  `GlobalExceptionHandler` and was falling through to the generic 500 handler
  — any caller-facing validation error thrown as `BadRequestException`
  anywhere in the codebase was returning 500 instead of 400. Added the
  missing handler (returns 400, matching every other typed exception's
  pattern in that class).
- **No environment-specific config here** — this layer doesn't read env vars
  or touch deployment. See `docs/ProjectStructure.md` for the real env var
  list and `docker/postgres/init-db.sql` for the demo seed data / credentials
  used in local dev (do not reuse those credentials anywhere but local dev).

---

## For users / support

Per-role visibility today (from `roleStrategy.ts`); all of these are full
create/read/update/delete unless noted:

| Role | Can see / manage |
|---|---|
| **Super Admin** | Dashboard, Intelligence (analytics), Colleges, Departments, Courses, Subjects, Students, Teachers, Classes, Attendance, Marks |
| **College Admin** | Dashboard, Intelligence, Departments, Courses, Subjects, Students, Teachers, Classes |
| **HOD** | Dashboard, Analytics, Subjects, Students, Teachers, Classes (read-only on Departments) |
| **Teacher** | Dashboard, Attendance (mark), Marks (enter) — read-only on Students/Subjects/Classes |
| **Student** | Dashboard, My Profile (view + update contact/parent details), My Marks, My Attendance (all read-only except profile) |

If a role is missing a page it should have, or can see something it
shouldn't, the fix is a one-line change to that role's entry in
`frontend/src/strategies/roleStrategy.ts` — nothing else needs to change (see
[Adding a new resource end to end](#adding-a-new-resource-end-to-end) above
for the full picture when it's a new *resource*, not just a permission
change on an existing one).

---

## Known gaps (found while building this, not fixed here)

Scoped out because each is a real feature-build, not part of the access-
control layer — flagging so they don't look like silent regressions:

- **Per-row "Manage" / "Details" buttons on every list page navigate to a
  detail route that doesn't exist** (e.g. `/courses/:id`, `/departments/:id`,
  `/students/:id`, `/teachers/:id`, `/subjects/:id`, `/classes/:id`) — none of
  these detail/edit pages have been built, so clicking one 404s. Only the list
  and `/new` create routes exist per resource today.
- **`TeacherAttendancePage`'s "Submit Attendance" flow is unfinished** — the
  page never fetches or renders the per-student roster to actually mark, so
  `attendanceRecords` state stays empty and the submit button stays disabled.
  The comment already in that file ("Student list will be loaded from the
  backend when marking attendance") describes the missing piece.
- **`api/institution.ts` calls `/institutions` and `/institutions/:id`, which
  have no matching backend controller at all.** It's currently only referenced
  from `components/edgepoint/*`, a disconnected prototype tree not reachable
  from any route (see `frontend/src/routes/index.tsx` — nothing there imports
  from `components/edgepoint/`), so this doesn't affect the live app, but it
  will 404 immediately if that tree is ever wired up or reused.
- **Duplicate DTO classes** with the same simple name exist in different
  packages (`com.edgepoint.student.dto.StudentMarkDTO` vs
  `com.edgepoint.academic.dto.StudentMarkDTO`, similarly for
  `StudentAttendanceDTO`) — they're unrelated types that happen to share a
  name, which is confusing when grepping. The one actually wired to
  `/student-marks/my-marks` is `com.edgepoint.student.dto.StudentMarkDTO`
  (confirmed against `academic.controller.StudentMarkController`); fixed
  `frontend/src/api/marks.ts`'s type to match this pass (it previously
  claimed fields — `credits`, `teacherName`, `totalMarksObtained`,
  `overallPercentage` per-subject, `examTypeId` — that don't exist on the
  real response, which crashed `StudentMarksPage` for any student with data).
