# EdgePoint Infrastructure

Infrastructure files are grouped here so deployment assets live in one place.

| Path | Purpose |
|---|---|
| `docker/` | Docker Compose files and Docker-only service config. |
| `k8s/` | Kubernetes base manifests, overlays, logging, and the shared DB seed. |
| `argocd/` | ArgoCD Application manifests. |

## Local Docker

```bash
docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml up -d
```

## Local Kubernetes

```bash
bash scripts/k8s-local-rebuild.sh
```

## ArgoCD

```bash
kubectl apply -f infra/argocd/application.yaml
```
