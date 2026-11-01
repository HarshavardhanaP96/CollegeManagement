# Enhancements to Existing Code

Improvements to what already exists. Priority: **P0** blocks production, **P1** should land in v1.0,
**P2** nice to have. Updated 2026-11-01; done items keep their row so the history stays readable.

## 1. Security

| # | Item | State |
|---|---|---|
| S1 | CORS allowed any origin | [x] allow-list from `APP_CORS_ALLOWED_ORIGINS` |
| S2 | `/actuator/**` public, health details always shown | [x] only `health`/`info` public; prometheus blocked at the frontend nginx |
| S3 | Swagger public | [x] `dev` profile only |
| S4/S5 | Hard-coded JWT secret and DB password fallbacks | [x] startup fails without them; dev/test use a random per-run key |
| S6 | Refresh tokens could not be revoked | [x] server-side store, rotation, reuse detection, revoke on logout/password change |
| S6b | Refresh token accepted as an access token | [x] `typ=access` claim checked by `JwtAuthenticationFilter` |
| S6c | `TenantContext` leaked into the next request on a pooled thread | [x] cleared in a `finally` per request |
| S7 | No login rate limit | [x] 5 per account / 20 per IP per 15 min, generic 429 |
| S10 | Error responses might leak internals | [x] tests pin it; unknown paths now 404 instead of 500 |
| S11 | Security headers | [x] CSP, HSTS (HTTPS), frame-ancestors, Referrer-Policy |
| S12 | **P0** Committed AES `encryption-key` values in `infra/k8s` secrets (on GitHub) | [ ] rotate, move to a secret manager, purge or accept history |
| S13 | **P0** `ENCRYPTION_KEY` hard-coded fallback in `application.yml:86` | [ ] same treatment as S4/S5 |
| S14 | **P1** Dockerfiles lack `USER`; k8s manifests lack `securityContext`/read-only root (~40 trivy/semgrep findings) | [ ] fix so the Jenkins scan stage passes |
| S15 | **P1** `/auth/login` says "No account found…" (account enumeration) | [ ] one generic message for unknown user and bad password |
| S16 | **P1** No `server.forward-headers-strategy`: per-IP limit sees the proxy IP, HSTS not sent behind nginx | [ ] set it and trust only the ingress |
| S17 | **P1** Anonymous requests get 403 instead of 401 (no authentication entry point) | [ ] add an entry point returning 401 |
| S18 | **P1** Login limiter counters are per instance (`shortcut:` comment) | [ ] move to Redis/DB before running >1 replica |
| S8 | **P1** Tenant scoping uneven across services | [ ] repository-level tenant filter or a test per endpoint |
| S9 | **P1** No IDOR/BOLA tests (college A reading college B by id) | [ ] one parameterised test per controller |

## 2. Correctness & data (P1)

- [ ] Notification dispatcher is fire-and-forget: a failed send is lost. Persisted outbox with
      retry, backoff, dead-letter and an idempotency key.
- [ ] WhatsApp business-initiated messages need approved templates per event type.
- [ ] Only `ATTENDANCE_ABSENCE` has a trigger; `MARKS_PUBLISHED`, `FEE_REMINDER`, `ANNOUNCEMENT` don't.
- [ ] Optimistic locking (`@Version`) on entities edited by several people (marks, students, classes).
- [ ] Audit gap: `AuditServiceImpl` drops entries when the actor has no college, so SUPERADMIN edits
      (e.g. Knowledge Base articles) leave no audit row. Needs a platform-level audit scope.
- [ ] Audit has no `outcome` column; rolled-back attempts leave no `FAILED` entry.
- [ ] Core tables still come from external `init-db.sql`; fold into a Flyway baseline.
- [ ] Flyway is forward-only; document restore steps for risky migrations.
- [ ] Dev compose still sets `SPRING_JPA_HIBERNATE_DDL_AUTO=update`, contradicting Flyway ownership.
- [ ] Duplicate DTO names across packages (`StudentMarkDTO`, `StudentAttendanceDTO`).
- [ ] Unused Redis, Kafka and Stripe config in `application.yml`.
- [x] Orphaned `api/institution.ts` and the `components/edgepoint/` tree removed.

## 3. Performance & API efficiency (P1)

- [ ] Per-screen call budget in `docs/foundations/contracts.md` and a Playwright request-count test.
- [ ] Pagination and field selection on every list endpoint (16 files use `Pageable` today).
- [ ] SQL query-count tests on rosters, dashboards, mark summaries.
- [ ] One aggregate endpoint per role dashboard.
- [ ] TanStack Query `staleTime` per key; `Cache-Control`/`ETag` on read-mostly endpoints.
- [ ] Load test a large-class bulk attendance save now that audit writes are batched.

## 4. Ops, CI & quality (P1)

- [x] Makefile (`help/setup/dev/up/down/test/lint/build/scan/dast/logs/obs/doctor/deploy/rollback/version`)
      and `scripts/preflight.py` behind `make doctor`.
- [x] Jenkins security stage (gitleaks, semgrep, trivy fs/config, image scan before push) and frontend lint.
- [x] Docker Compose hardening: limits, non-root, `cap_drop`, internal network, no DB/ES host ports
      (`compose.debug.yaml` when needed), profiles `tools`/`obs`.
- [ ] Jenkins scan stage passes (blocked by S12–S14).
- [ ] Run trivy `fs`/`image` and ZAP (`make dast`) for real; only config-validated so far.
- [ ] vitest in CI; frontend still has 19 older type errors (12 are duplicate `ApiResponse`
      exports in `api/index.ts`) and 14 lint problems.
- [ ] Playwright smoke per role.
- [ ] OpenTelemetry tracing and a correlation id in audit rows and logs.
- [ ] Liveness/readiness groups wired to k8s probes.
- [ ] Runbook per alert (failure rate, slow requests, retention job failure).
- [ ] RPO/RTO, backup schedule and a restore drill for Postgres.
- [ ] `DEVELOPMENT.md` still has MySQL examples from the old guide; rewrite for PostgreSQL.
- [x] Overlapping docs merged into one per topic.

## 5. UX (P2)

- [ ] Confirm every entity has a working edit page (backend has `PUT`).
- [ ] Reuse the attendance register pattern: bulk enroll, bulk marks grid, bulk teacher assignment.
- [ ] Attendance: show who marked and when; same-day correction with reason (audited).
- [ ] Consistent empty/error/loading states.
- [ ] Accessibility pass (keyboard use of the register grid, focus order, contrast).
- [ ] Mobile layout for teacher attendance.
- [ ] Per-college branding; Knowledge Base markdown rendering and category rename in the UI.
