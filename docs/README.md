# EdgePoint Documentation

This folder is consolidated into the main documents below.

| Document | Purpose |
|---|---|
| [API.md](API.md) | REST API contracts and response shapes. |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Developer setup, project structure, database notes, and frontend implementation notes. |
| [OPERATIONS.md](OPERATIONS.md) | Docker Compose, Kubernetes, ArgoCD, local Kind, CI/CD, and production operations. |
| [TESTING.md](TESTING.md) | Testing strategy and test execution guide. |
| [USER_GUIDE.md](USER_GUIDE.md) | Role-oriented product usage guide. |
| [ACCESS_CONTROL.md](ACCESS_CONTROL.md) | Frontend role-based access control: query/action/route strategies, permission matrix, known gaps. |
| [PRIVACY.md](PRIVACY.md) | DPDP privacy workflows: notice and consent, data-principal requests, retention and erasure, configuration, extension point, known limitations. |
| [OBSERVABILITY.md](OBSERVABILITY.md) | API versioning, structured logs, Prometheus metrics, and Discord alerting (frequent failures, slow requests, support submissions). |
| [DatabaseMigration.md](DatabaseMigration.md) | Flyway migrations V1–V9 and how to write a new one. |

## Design and status

| Document | Purpose |
|---|---|
| [foundations/](foundations/) | Vision, requirements, architecture and decision log, data and API contracts, test and rollout. The source of truth for decisions. |
| [roadmap/](roadmap/README.md) | What is done, what is pending, enhancements, next features and longer-term ideas. Updated 2026-11-01 after all feature branches were merged. |
| [reviews/](reviews/) | Point-in-time reviews, e.g. the 2026-10-19 spec-gap review. |
| [superpowers/](superpowers/) | Design specs and implementation plans for the Knowledge Base and DPDP privacy features. |

Infrastructure manifests now live under `../infra/`.
