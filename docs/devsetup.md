# Dev Environment Setup

Stop the local stack:
```bash
docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml down
```

Start the local stack (Postgres, pgAdmin, backend, frontend):
```bash
docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml up -d
```

See [DEVOPS.md](DEVOPS.md) for ports/credentials and [LOCAL_K8S_DEPLOYMENT_RUNBOOK.md](LOCAL_K8S_DEPLOYMENT_RUNBOOK.md) for the Kubernetes (Kind) alternative.