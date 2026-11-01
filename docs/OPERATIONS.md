# Operations

Local setup, CI/CD and Kubernetes/ArgoCD for the College Management System (EdgePoint). This
file absorbed the former `DEVOPS.md` and `devsetup.md` so each topic lives in one place.

| Topic | Where |
|---|---|
| Local Docker Compose, seeded users, tools | [§1 below](#1-local-setup-docker-compose) |
| CI/CD (Jenkins) | [§2 below](#2-cicd-with-jenkins) |
| Kubernetes/ArgoCD structure | [§3 below](#3-kubernetes-deployment-argocd) |
| Local Kubernetes (Kind): build, load, deploy, smoke-test, teardown | [LOCAL_K8S_DEPLOYMENT_RUNBOOK.md](LOCAL_K8S_DEPLOYMENT_RUNBOOK.md) |
| API versioning, structured logs, Prometheus metrics, Discord alerting | [OBSERVABILITY.md](OBSERVABILITY.md) |
| Generic on-prem (non-current-stack) hardware/Nginx/systemd reference | [reference/legacy-onprem-ops-guide.md](../reference/legacy-onprem-ops-guide.md) *(legacy — see its own banner)* |

See also [docs/foundations/test-rollout.md](foundations/test-rollout.md) for the one-screen
rollout/rollback summary and [infra/README.md](../infra/README.md) for the infra directory map.

---

## 1. Local setup (Docker Compose)

Everything runs through the root `Makefile` (`make help` lists every target). Compose files and
their `.env` live in `infra/docker/`.

```bash
make doctor   # creates infra/docker/.env from .env.example, checks Docker, ports, .env keys
make up       # Postgres only
make dev      # Postgres + backend + frontend from source with hot reload
make down     # stop everything (including the obs/tools profiles)
```

Other targets: `make obs` (Elasticsearch/Logstash/Kibana, Kibana on :5601 — see
[OBSERVABILITY.md](OBSERVABILITY.md); optional for plain backend/frontend development),
`make test`, `make lint`, `make build`, `make scan` (gitleaks, semgrep, trivy via Docker),
`make dast` (ZAP baseline, local only), `make deploy ENV=local` (Kind). Backend targets honour
`JAVA_HOME=...` when the default `java` can't compile for 17. pgAdmin is in the `tools`
profile: `docker compose -f infra/docker/docker-compose.yml --profile tools up -d`.

Host ports bind to `127.0.0.1` only. Postgres/Elasticsearch/Logstash publish no host port by
default; add the debug override when a host tool needs them:

```bash
docker compose -f infra/docker/docker-compose.yml -f infra/docker/compose.debug.yaml up -d
```

### Database details (as created by this compose stack)
- **Database Name**: `college_management`
- **Username**: `postgres`
- **Password**: `postgres`
- **Host port**: none by default. Add `infra/docker/compose.debug.yaml` to publish it on
  `127.0.0.1:5433` (container port `5432`; the dev-container backend reaches Postgres on the
  internal Docker network at `postgres:5432`, so this only matters for host tools)

This is deliberately different from the app's own bare-metal/k8s default
(`edgepoint`/`5432` in `backend/src/main/resources/application.yml`) — if you run the backend
directly on the host (`mvn spring-boot:run`, no dev-container) against this compose Postgres
instead of using `docker-compose.dev.yml`, override `SPRING_DATASOURCE_URL`/`_USERNAME`/
`_PASSWORD` to match (`jdbc:postgresql://localhost:5433/college_management`), or just use the
`dev` Spring profile (`SPRING_PROFILES_ACTIVE=dev`) for a Docker-free H2 in-memory run instead.

### Seeded users (password: `password123` for all, from `infra/k8s/base/db/init-db.sql`)
| Username | Role | Full Name |
|----------|------|-----------|
| `admin` | SUPERADMIN | System Admin |
| `cadmin` | COLLEGEADMIN | College Admin |
| `hod_cse` | HOD | HOD CSE |
| `teacher1` | TEACHER | John Doe |
| `student1` | STUDENT | Jane Smith |

### Tools
- **pgAdmin** (`--profile tools`): `http://localhost:5050` (login from `PGADMIN_DEFAULT_EMAIL` / `PGADMIN_DEFAULT_PASSWORD` in `infra/docker/.env`)
- **Kibana** (if the logging services are up): `http://localhost:5601`

---

## 2. CI/CD with Jenkins

The root `Jenkinsfile`:
1. **Build**: Spring Boot backend (JAR, JUnit + JaCoCo) and Vite frontend.
2. **Dockerize**: builds both images, pushes to `DOCKER_REGISTRY` (placeholder — set to your
   real registry before this pipeline can push anywhere).
3. **Promote**: on `main`, updates the image tag in `infra/k8s/overlays/test` and commits —
   ArgoCD's `college-mgmt-test` Application picks it up. Promoting the *same* already-tested
   tag to prod is a separate, explicit step (not automatic on every `main` build) — see the
   Jenkinsfile's `Promote to prod` stage, which only runs when triggered with `PROMOTE_TO_PROD`
   (manual approval, not a push-triggered side effect).

### Prerequisites for Jenkins
- Jenkins with Docker and Pipeline plugins.
- Docker Registry credentials stored in Jenkins as `docker-credentials-id`.
- K8s manifests stored in the same repository for GitOps.

---

## 3. Kubernetes Deployment (ArgoCD)

The project uses **Kustomize** for environment management.

### Structure
- `infra/k8s/base`: common deployment/service definitions.
- `infra/k8s/overlays/local`: Kind/local-cluster convenience overlay (`imagePullPolicy: Never`,
  `ddl-auto: update` for fast iteration). Not deployed via ArgoCD — see
  [LOCAL_K8S_DEPLOYMENT_RUNBOOK.md](LOCAL_K8S_DEPLOYMENT_RUNBOOK.md).
- `infra/k8s/overlays/test`: testing environment (1 replica, `test-` name prefix, its own
  placeholder secrets via `secrets-test.yaml`).
- `infra/k8s/overlays/prod`: production (3 backend / 2 frontend replicas, resource
  requests/limits, `prod-` name prefix, its own placeholder secrets via `secrets-prod.yaml`).
- `infra/k8s/logging`: cluster-shared ELK + Filebeat DaemonSet (one deployment, not per
  overlay — every environment's logs land in the same ELK, distinguished by namespace).
- `infra/k8s/monitoring`: cluster-shared Prometheus + Grafana (same reasoning).

### ArgoCD setup
```bash
kubectl apply -f infra/argocd/application.yaml
```
This creates four `Application` objects: `college-mgmt-test`, `college-mgmt-prod`,
`college-mgmt-logging`, `college-mgmt-monitoring`. All sync automatically (`prune`/`selfHeal`)
from `infra/k8s/overlays/{test,prod}` and `infra/k8s/{logging,monitoring}` respectively.

---

## 4. Entity & API Security
All seeded users have **hashed passwords** stored in the database. The application uses
`BCryptPasswordEncoder` for validation. When adding new users through the API or seed scripts,
ensure `password_hash` is populated with a strong BCrypt hash.
