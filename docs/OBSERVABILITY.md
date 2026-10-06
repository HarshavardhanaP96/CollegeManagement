# Observability: Versioning, Logs, Metrics, Alerting

This document covers four related pieces added together: API/app versioning, structured
logging, metrics, and Discord alerting. Audience: developers and devops.

## API versioning

The backend currently serves one version, `v1`, via `server.servlet.context-path: /api/v1`
(`backend/src/main/resources/application.yml`). Every controller is mapped with a bare path
(e.g. `@RequestMapping("/classes")`) and inherits `/api/v1` from the context path.

**Convention for a future breaking change (`v2`):** don't change the context path (that would
break every existing route for every client at once). Instead:

1. Add a second `DispatcherServlet`-style prefix only on the controllers that actually changed,
   e.g. `@RequestMapping("/v2/classes")`, so the full path becomes `/api/v1/v2/classes`... which
   reads oddly. The cleaner option used here: introduce a **new context path per version** by
   running a second `server.servlet.context-path`-style mapping is not supported by Spring Boot
   out of the box, so in practice: bump `app.api-version` and the context path together
   (`/api/v2`) only when the *entire* API moves to v2, and keep old clients pointed at a
   previous deployed instance/tag during the migration window. This project has no versioned
   client contracts yet (frontend and backend deploy together), so a full-context-path bump is
   the simplest correct choice when it's actually needed.
2. Until then, `app.api-version` (see `application.yml`) is the single source of truth for
   "what version is this build" and is surfaced at `GET /api/v1/actuator/info` under
   `apiVersion` (`ApiVersionInfoContributor`), alongside `build.version` (the Maven project
   version, populated automatically by the `spring-boot-maven-plugin`'s `build-info` goal).

The frontend reads this endpoint (`frontend/src/api/version.ts`) and shows it in the sidebar
footer, so you can always tell which build is running in a given environment.

## Structured logs

`backend/src/main/resources/logback-spring.xml` writes JSON (via `logstash-logback-encoder`'s
`LogstashEncoder`) to stdout. The app itself never talks to a log-shipping server directly — this
replaced a previous `LogstashTcpSocketAppender` that required a reachable Logstash host and
otherwise logged a connection-failure warning on a retry loop. In k8s, a Filebeat DaemonSet
(`infra/k8s/logging/filebeat.yaml`) reads that stdout off every node (`/var/log/containers`) and
ships it to Logstash → Elasticsearch, with Kibana on top (`infra/k8s/logging/elk.yaml`) — as of
2026-10-06 this is actually wired into its own ArgoCD Application (`college-mgmt-logging`);
before that, `elk.yaml` existed but was deployed by nothing and fed by nothing. Outside k8s (bare
`docker logs`/`kubectl logs`, local dev), the stdout JSON is still there for any ad-hoc collector.

Each line includes `app_name`, standard fields (`level`, `logger_name`, `message`, `timestamp`,
`thread_name`), and stack traces for exceptions. Adjust log level per-package under `logging.level`
in `application.yml`.

## Metrics

`spring-boot-starter-actuator` + `micrometer-registry-prometheus` expose Prometheus-format
metrics at `GET /api/v1/actuator/prometheus` (JVM memory/GC, HTTP request timings, Hikari pool
stats, etc. — all auto-instrumented by Micrometer's Spring Boot integration). As of 2026-10-06,
`infra/k8s/monitoring` deploys Prometheus (scraping any pod annotated
`prometheus.io/scrape: "true"` — set on the backend Deployment in
`infra/k8s/base/backend/backend.yaml`) and Grafana on top, pre-wired with a Prometheus
datasource. Deployed via its own ArgoCD Application (`college-mgmt-monitoring`), once per
cluster — not per test/prod overlay.

`/actuator/health`, `/actuator/info`, and `/actuator/metrics` are also exposed. All
`/actuator/**` paths are permitted without authentication in `WebSecurityConfig` — this is
required for k8s liveness/readiness probes and Prometheus scraping to work at all, since neither
sends a JWT. Treat this surface as internal-only (it isn't routed through the public ingress in
this project's k8s manifests); if that ever changes, put it behind a network policy or a separate
management port instead of relaxing this further.

## Discord alerting

`core/alerting/DiscordAlertService` posts embeds to a Discord incoming webhook URL
(`app.discord.webhook-url`, env var `DISCORD_WEBHOOK_URL`). If unset, it logs a warning and does
nothing — safe default for local dev/CI. To enable: create a webhook in your Discord channel's
integration settings and set `DISCORD_WEBHOOK_URL` (see `infra/k8s/overlays/test/secrets-test.yaml`
and `infra/k8s/overlays/prod/secrets-prod.yaml` — each environment now has its own placeholder
`discord-secret` instead of sharing one via `infra/k8s/base/secrets.yaml`; replace with the real
per-environment URL, never commit a real webhook URL to git).

Three triggers, tunable under `app.alerting.*` in `application.yml`:

| Alert | Trigger | Source |
|---|---|---|
| Frequent failures | `error-threshold-count` (default 5) unhandled 5xx errors within `error-threshold-window-seconds` (default 60s) | `FailureRateMonitor`, fed by `GlobalExceptionHandler`'s catch-all `Exception` handler |
| Very slow requests | any request slower than `slow-request-threshold-ms` (default 3000ms) | `SlowRequestInterceptor`, a `HandlerInterceptor` timing every request |
| Support query submitted | any `POST /support` submission | `SupportController` |

`app.alerting.cooldown-seconds` (default 300) rate-limits the slow-request alert per route so a
sustained slow endpoint doesn't flood the channel; the failure-rate check resets its counter each
window rather than needing a cooldown.

## Support form

`POST /support` (any authenticated user, any role) accepts `{ subject, message }` and forwards it
straight to Discord via `DiscordAlertService` — nothing is persisted to the database (matches the
simple/no-ticketing-system scope this was built to). The frontend page is at `/support`, reachable
from every role's sidebar under "Support".
