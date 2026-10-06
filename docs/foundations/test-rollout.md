# Test Strategy & Rollout

Deep detail already lives in [docs/Testing_Strategy.md](../Testing_Strategy.md),
[docs/TESTING.md](../TESTING.md), [docs/TestExecutionGuide.md](../TestExecutionGuide.md)
(test strategy), and [docs/OPERATIONS.md](../OPERATIONS.md),
[docs/Ops-Guide.md](../Ops-Guide.md),
[docs/LOCAL_K8S_DEPLOYMENT_RUNBOOK.md](../LOCAL_K8S_DEPLOYMENT_RUNBOOK.md),
[docs/DEVOPS.md](../DEVOPS.md) (rollout/ops). This doc is the one-screen
summary + the rule for keeping new role/API work covered.

## Test strategy
- **Unit:** JUnit 5 + Mockito, target 90%+ on service layer (business logic
  lives there, not in controllers). `backend/src/test/java/com/edgepoint/`
  mirrors the main package structure.
- **Integration:** Spring Test + `IntegrationTestBase`/`TestConfig`/
  `TestDataBuilder`/`@WithMockCustomUser` fixtures
  (`backend/src/test/java/com/edgepoint/config/`), target 85%+ on
  controllers. Covers the `@PreAuthorize` boundary directly — this is where
  a new endpoint's role guard gets proven, not just the happy path.
- **End-to-end:** not currently automated against the React frontend; manual
  verification only. Revisit if/when the frontend test setup lands.
- **Rule for new work:** any new or modified endpoint from
  [requirements.md](requirements.md)'s per-role FR list ships with (a) a
  service-layer unit test for the business rule, and (b) a controller
  integration test asserting the correct roles get 200/201 and the wrong
  ones get 403 — mirroring the `ClassController`/`ClassManagementServiceImpl`
  bug in [architecture.md](architecture.md), which existed precisely because
  no test asserted SUPERADMIN/COLLEGEADMIN could actually call the endpoint
  their `@PreAuthorize` claimed to allow.

## Rollout plan
- **Local dev:** Docker Compose (`docker-compose.dev.yml`) — Postgres, pgAdmin,
  backend (`mvn spring-boot:run`, port 8080), frontend (Vite, port 5173).
- **Staging/prod:** Kubernetes via ArgoCD (`infra/k8s`, `infra/argocd`) — see
  the k8s runbook linked above for the actual deploy sequence and overlay
  structure (`infra/k8s/overlays`).
- **Schema changes:** baseline schema is fixed
  (`docker/postgres/init-db.sql`, applied once); every schema change after
  that is an incremental Flyway migration under
  `backend/src/main/resources/db/migration/`. Never edit the baseline file
  for an already-deployed environment — add a new `V{n}__*.sql` instead.
- **New-role-capability rollout order** (for the "many APIs to add/modify"
  work this doc set exists to prepare for): land the backend endpoint +
  `@PreAuthorize` + tests first, confirm it in `docs/contracts.md`'s
  endpoint table, then wire the frontend (`roleStrategy.ts` permissions +
  nav entry → query key → route → `<Can>` gate, in that order per
  `docs/ACCESS_CONTROL.md`'s "Adding a new resource end to end"). Backend
  authorization is the control; frontend is UX — never ship the frontend
  gate as a substitute for the backend guard.

## Rollback / monitoring
- **Logs:** ELK stack (Elasticsearch/Logstash/Kibana), structured logging —
  see [docs/OBSERVABILITY.md](../OBSERVABILITY.md).
- **Alerting:** Discord webhook on elevated failure rate or slow requests
  (`DiscordAlertService`, `FailureRateMonitor`, `SlowRequestInterceptor`) —
  this is the first signal a bad rollout shows up on.
- **Build identification:** `GET /api/v1/actuator/info` exposes
  `apiVersion` + `build.version` (Maven project version), surfaced in the
  frontend sidebar footer — use this to confirm which build is live before
  deciding whether an issue is the new deploy or a pre-existing one.
- **Rollback:** redeploy the previous image tag via ArgoCD; Flyway
  migrations are forward-only in this codebase today — a rollback that
  needs a schema revert requires a hand-written down-migration, there is no
  automatic down-migration path.
