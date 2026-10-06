# DevOps Documentation

This document describes local setup and CI/CD for the College Management System (EdgePoint).

## 1. Local Database Setup (Docker)

```bash
docker compose -f infra/docker/docker-compose.yml up -d
```

This starts Postgres + pgAdmin (plus Elasticsearch/Logstash/Kibana if you want to exercise the
full logging pipeline locally — see [OBSERVABILITY.md](OBSERVABILITY.md); they're optional for
plain backend/frontend development). To run the backend/frontend themselves in containers too
(hot-reload, no local Java/Node install needed):

```bash
docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml up -d
```

### Database Details (as created by this compose stack):
- **Database Name**: `college_management`
- **Username**: `postgres`
- **Password**: `postgres`
- **Host port**: `5433` (container's internal port is the standard `5432`; the dev-container
  backend service reaches Postgres via the Docker network at `postgres:5432`, so this only
  matters if you're connecting a tool from the host machine)

This is deliberately different from the app's own bare-metal/k8s default
(`edgepoint`/`5432` in `backend/src/main/resources/application.yml`) — if you run the backend
directly on the host (`mvn spring-boot:run`, no dev-container) against this compose Postgres
instead of using `docker-compose.dev.yml`, override `SPRING_DATASOURCE_URL`/`_USERNAME`/
`_PASSWORD` to match (`jdbc:postgresql://localhost:5433/college_management`), or just use the
`dev` Spring profile (`SPRING_PROFILES_ACTIVE=dev`) for a Docker-free H2 in-memory run instead.

### Seeded Users (Password: `password123` for all, from `infra/k8s/base/db/init-db.sql`):
| Username | Role | Full Name |
|----------|------|-----------|
| `admin` | SUPERADMIN | System Admin |
| `cadmin` | COLLEGEADMIN | College Admin |
| `hod_cse` | HOD | HOD CSE |
| `teacher1` | TEACHER | John Doe |
| `student1` | STUDENT | Jane Smith |

### Tools:
- **pgAdmin**: `http://localhost:5050` (Login: `admin@admin.com` / `admin`)
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

### Prerequisites for Jenkins:
- Jenkins with Docker and Pipeline plugins.
- Docker Registry credentials stored in Jenkins as `docker-credentials-id`.
- K8s manifests stored in the same repository for GitOps.

---

## 3. Kubernetes Deployment (ArgoCD)

The project uses **Kustomize** for environment management.

### Structure:
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

### ArgoCD Setup:
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
