# Branches & Pending Work

Updated 2026-11-01. `main` and `dev` are both at `1ec51ce` on GitHub.

## Merged in the roadmap merge

| Branch | What it brought | Migration |
|---|---|---|
| `refactor/audit-batch-capture` | Audit entries written as one JDBC batch inside the business transaction | — |
| `feat/bulk-attendance` | One-click idempotent bulk attendance, checkbox register grid | `V6` unique index |
| `chore/repo-cleanup` | Removed the unused `components/edgepoint/` prototype and scratch files; one doc per topic (`TESTING.md`, `OPERATIONS.md`, `DEVELOPMENT.md`) | — |
| `chore/ops-baseline` | Makefile, `scripts/preflight.py`, Docker-based scans, Jenkins security stage, hardened Compose | — |
| `fix/security-config-hardening` | CORS allow-list, actuator lockdown, Swagger dev-only, no hard-coded secrets, security headers, 404 for unknown paths | — |
| `fix/auth-token-revocation` | Server-side refresh tokens (rotation, reuse detection, revoke on logout/password change), login rate limit, access-token type claim, `TenantContext` cleared per request | `V8` |
| `feat/knowledge-base` | Help articles for every role, SUPERADMIN authoring | `V9` |
| `feature/dpdp-privacy` | DPDP consent, data-principal requests, erasure, retention, privacy admin UI, vitest | `V7` (renamed from `V6`) |

Tests on the merged code: backend 282 run / 0 failed / 1 skipped; frontend vitest 64/64.
All branches above, plus the leftover agent and backup branches, were deleted locally.

## Still open from that work
- [ ] Rotate the committed encryption keys (see 02 §1).
- [ ] `origin/feat/bulk-attendance` still exists on GitHub; delete it when no longer needed.
- [ ] `feature/dpdp-privacy` is still checked out in `../CollegeManagement-privacy`; its work is in
      `main`, so the worktree and branch can be removed.
- [x] The privacy spec and plan now carry an "implemented, shipped as `V7`" status note
      (2026-11-01).
- [x] API.md, DatabaseMigration.md, DEVELOPMENT.md, USER_GUIDE.md and the docs index updated for
      refresh-token rotation, bulk attendance, audit log, privacy and Knowledge Base (2026-11-01).
- [ ] Privacy out-of-scope items carried into [03](03-features-next.md) §7.
- [ ] `V9__knowledge_base.sql` was only checked against H2; verify on PostgreSQL.
- [ ] No frontend tests for the bulk attendance grid or the Knowledge Base pages (vitest exists now).
- [ ] `graphify-out/` was not rebuilt after the merge (`graphify update .`).
