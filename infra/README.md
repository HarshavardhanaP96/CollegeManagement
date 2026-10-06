# EdgePoint Infrastructure

Infrastructure files are grouped here so deployment assets live in one place.

| Path | Purpose |
|---|---|
| `docker/` | Docker Compose files and Docker-only service config. |
| `k8s/base` | Common backend/frontend/db Deployments + the shared DB seed. |
| `k8s/overlays/{local,test,prod}` | Per-environment patches (replicas, ddl-auto, image tags, per-env secrets). |
| `k8s/logging` | Cluster-shared ELK + Filebeat DaemonSet (one deployment, not per environment). |
| `k8s/monitoring` | Cluster-shared Prometheus + Grafana. |
| `argocd/` | ArgoCD Application manifests — `college-mgmt-{test,prod,logging,monitoring}`. |

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
