#!/usr/bin/env bash
# Rebuild backend/frontend images and refresh the local Kubernetes stack (Kind + infra/k8s/overlays/local).
#
# Prerequisites:
#   - Docker
#   - kubectl
#   - kind cluster created with: kind create cluster --name "${KIND_CLUSTER_NAME:-college-mgmt}"
#   - Namespace applied at least once: kubectl apply -k infra/k8s/overlays/local
#
# Environment overrides:
#   KIND_CLUSTER_NAME   default: college-mgmt
#   KUBECTL_CONTEXT       default: kind-${KIND_CLUSTER_NAME}
#   K8S_NAMESPACE         default: college-mgmt
#
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLUSTER="${KIND_CLUSTER_NAME:-college-mgmt}"
CTX="${KUBECTL_CONTEXT:-kind-${CLUSTER}}"
NS="${K8S_NAMESPACE:-college-mgmt}"

cd "$ROOT"

echo "==> Building Docker images (tags must match infra/k8s/overlays/local kustomization)"
docker build -t college-mgmt-backend:latest "${ROOT}/backend"
docker build -t college-mgmt-frontend:latest "${ROOT}/frontend"

if command -v kind >/dev/null 2>&1; then
  if kind get clusters 2>/dev/null | grep -qx "${CLUSTER}"; then
    echo "==> Loading images into kind cluster '${CLUSTER}'"
    kind load docker-image college-mgmt-backend:latest college-mgmt-frontend:latest --name "${CLUSTER}"
  else
    echo "WARN: kind cluster '${CLUSTER}' not found. Create it with:"
    echo "     kind create cluster --name ${CLUSTER}"
    echo "     kubectl apply -k infra/k8s/overlays/local --context kind-${CLUSTER}"
    exit 1
  fi
else
  echo "ERROR: 'kind' not found in PATH. Install kind or load/push images to your cluster's registry manually."
  exit 1
fi

echo "==> Applying manifests (Kustomize local overlay)"
kubectl apply -k "${ROOT}/infra/k8s/overlays/local" --context "${CTX}"

echo "==> Restarting workloads so new image layers are picked up"
kubectl rollout restart deployment/backend deployment/frontend -n "${NS}" --context "${CTX}"

kubectl rollout status deployment/postgres -n "${NS}" --context "${CTX}" --timeout=120s || true
kubectl rollout status deployment/backend -n "${NS}" --context "${CTX}" --timeout=300s
kubectl rollout status deployment/frontend -n "${NS}" --context "${CTX}" --timeout=120s

echo ""
echo "==> OK. Open UI (example):"
echo "    kubectl port-forward -n ${NS} svc/frontend-service 9080:80 --context ${CTX}"
echo "    http://localhost:9080"
