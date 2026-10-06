# Operations

This used to be a frozen copy-paste of four other docs (each marked with a `<!-- Source: -->`
comment). That drifted: edits landed in the standalone files but not here, or vice versa, so
this file ended up simultaneously stale in some sections and ahead in others — actively
misleading either way. Fixed by removing the duplication instead of re-syncing it: this is now
a short index, and the content lives in exactly one place each.

| Topic | Doc |
|---|---|
| Local Docker Compose, CI/CD (Jenkins), Kubernetes/ArgoCD structure, seeded users | [DEVOPS.md](DEVOPS.md) |
| Local Kubernetes (Kind): build, load, deploy, smoke-test, teardown | [LOCAL_K8S_DEPLOYMENT_RUNBOOK.md](LOCAL_K8S_DEPLOYMENT_RUNBOOK.md) |
| Quick compose up/down commands | [devsetup.md](devsetup.md) |
| API versioning, structured logs, Prometheus metrics, Discord alerting | [OBSERVABILITY.md](OBSERVABILITY.md) |
| Generic on-prem (non-current-stack) hardware/Nginx/systemd reference | [Ops-Guide.md](Ops-Guide.md) *(legacy — see its own banner)* |

See also [docs/foundations/test-rollout.md](foundations/test-rollout.md) for the one-screen
rollout/rollback summary and [infra/README.md](../infra/README.md) for the infra directory map.
