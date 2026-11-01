# Dev Environment Setup

Everything runs through the root `Makefile` (`make help` lists every target). Compose files and
their `.env` live in `infra/docker/`.

```bash
make doctor   # creates infra/docker/.env from .env.example, checks Docker, ports, .env keys
make dev      # Postgres + backend + frontend from source with hot reload
make down     # stop everything (including the obs/tools profiles)
```

Other targets: `make up` (Postgres only), `make obs` (ELK, Kibana on :5601), `make test`,
`make lint`, `make build`, `make scan` (gitleaks, semgrep, trivy via Docker), `make dast`
(ZAP baseline, local only), `make deploy ENV=local` (Kind). Backend targets honour
`JAVA_HOME=...` when the default `java` can't compile for 17.

Host ports bind to `127.0.0.1` only. Postgres/Elasticsearch/Logstash publish no host port by
default; add the debug override when a host tool needs them:

```bash
docker compose -f infra/docker/docker-compose.yml -f infra/docker/compose.debug.yaml up -d
```

pgAdmin is in the `tools` profile: `docker compose -f infra/docker/docker-compose.yml --profile tools up -d`.

See [DEVOPS.md](DEVOPS.md) for ports/credentials and [LOCAL_K8S_DEPLOYMENT_RUNBOOK.md](LOCAL_K8S_DEPLOYMENT_RUNBOOK.md) for the Kubernetes (Kind) alternative.
