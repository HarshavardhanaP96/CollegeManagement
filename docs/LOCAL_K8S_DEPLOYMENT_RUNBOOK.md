# College Management System - Local Kubernetes (Kind) Runbook

**Version:** 1.1 (updated 2026-07-06)
**Target:** Local build, test and teardown after code updates
**Includes:** build, load, deploy, smoke-test, stop

---

## 0. Prerequisites

- Docker daemon running
- `kind` v0.26+
- `kubectl` v1.32+
- Kind cluster created: `kind-college-mgmt` (or run step 2.1 first)

**Repo defaults**
| Setting | Value |
|---------|-------|
| Kind cluster name | `college-mgmt` |
| kubectl context | `kind-college-mgmt` |
| Kubernetes namespace | `college-mgmt` |
| Backend image tag | `college-mgmt-backend:latest` |
| Frontend image tag | `college-mgmt-frontend:latest` |
| Backend API context path | `/api/v1` |

---

## 1. Build Docker Images

### 1.1 Backend (Maven multi-stage)

```bash
docker build -t college-mgmt-backend:latest backend
```

Build time: ~5–6 min on first run (Maven dep download), ~2 min with cache.

### 1.2 Frontend (Vite, skipping tsc type-check)

> **Note:** The frontend Dockerfile uses `npx vite build` directly, bypassing the `tsc -b`
> type-check step. The codebase has known pre-existing TypeScript type errors that do not
> affect runtime. The `RUN npm run build` form (which runs `tsc -b && vite build`) **will fail**.

```bash
docker build -t college-mgmt-frontend:latest frontend
```

Build time: ~1 min.

---

## 2. Start (first-time cluster setup)

### 2.1 Create the Kind cluster *(once)*

```bash
kind create cluster --name college-mgmt
```

### 2.2 Load images into the Kind node

```bash
kind load docker-image college-mgmt-backend:latest college-mgmt-frontend:latest \
  --name college-mgmt
```

### 2.3 Apply the local Kustomize overlay

```bash
kubectl apply -k infra/k8s/overlays/local --context kind-college-mgmt
```

Expected output: namespace, secrets, configmap, deployments, and services created/configured.

### 2.4 Verify pods are Running

```bash
kubectl get pods -n college-mgmt --context kind-college-mgmt
```

```
NAME                       READY   STATUS    RESTARTS   AGE
backend-xxxxxxxxx-xxxxx    1/1     Running   0          2m
frontend-xxxxxxxxx-xxxxx   1/1     Running   0          2m
postgres-xxxxxxxxx-xxxxx   1/1     Running   0          2m
```

> **Expected warning:** Logstash TCP connection errors appear in backend logs
> (`UnknownHostException: logstash.logging.svc.cluster.local`). This is normal —
> the ELK stack is not deployed in the local env. The app functions correctly.
>
> **Backend startup time:** Spring Boot takes ~90 seconds to start (Flyway migrations + Hibernate).
> Wait for `Started ProductionApplication` in logs before testing.

---

## 3. Redeploy After Code Changes

### Option A — Script (recommended)

```bash
bash scripts/k8s-local-rebuild.sh
```

This script builds both images, loads them into Kind, applies the overlay, restarts
backend/frontend deployments, and waits for rollout.

### Option B — Manual

```bash
# 1. Rebuild images
docker build -t college-mgmt-backend:latest backend
docker build -t college-mgmt-frontend:latest frontend

# 2. Load into Kind
kind load docker-image college-mgmt-backend:latest college-mgmt-frontend:latest \
  --name college-mgmt

# 3. Apply overlay (picks up any ConfigMap/Secret changes)
kubectl apply -k infra/k8s/overlays/local --context kind-college-mgmt

# 4. Restart deployments
kubectl rollout restart deployment/backend deployment/frontend \
  -n college-mgmt --context kind-college-mgmt

# 5. Wait for rollout
kubectl rollout status deployment/backend \
  -n college-mgmt --context kind-college-mgmt --timeout=300s
kubectl rollout status deployment/frontend \
  -n college-mgmt --context kind-college-mgmt --timeout=120s
```

---

## 4. Restart Only (no image rebuild)

```bash
kubectl rollout restart deployment/backend deployment/frontend \
  -n college-mgmt --context kind-college-mgmt
kubectl rollout status deployment/backend \
  -n college-mgmt --context kind-college-mgmt --timeout=300s
kubectl rollout status deployment/frontend \
  -n college-mgmt --context kind-college-mgmt --timeout=120s
```

---

## 5. Test the Application

### 5.1 Frontend (browser)

```bash
kubectl port-forward -n college-mgmt svc/frontend-service 9080:80 --context kind-college-mgmt
```

Open: http://localhost:9080

> Hard-refresh (Ctrl+Shift+R) after redeploy to clear stale JS bundles.

### 5.2 Backend API smoke tests

Open a port-forward in one terminal:

```bash
kubectl port-forward -n college-mgmt svc/backend-service 8080:8080 --context kind-college-mgmt
```

**Actuator health:**
```bash
curl http://localhost:8080/api/v1/actuator/health
```

**Auth login (admin):**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJ...",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    ...
  }
}
```

### 5.3 Pod health check

```bash
kubectl get pods -n college-mgmt --context kind-college-mgmt
# All should be 1/1 Running

kubectl logs -n college-mgmt deployment/backend --context kind-college-mgmt --tail=20
# Look for: "Started ProductionApplication in XX seconds"
```

---

## 6. Stop the Application

### Option A — Scale to zero *(fastest, cluster preserved)*

```bash
kubectl scale deployment backend frontend postgres \
  --replicas=0 -n college-mgmt --context kind-college-mgmt
```

Restart later:
```bash
kubectl scale deployment backend frontend postgres \
  --replicas=1 -n college-mgmt --context kind-college-mgmt
```

### Option B — Delete namespace *(all resources removed, cluster remains)*

```bash
kubectl delete namespace college-mgmt --context kind-college-mgmt
```

Re-deploy: `kubectl apply -k infra/k8s/overlays/local --context kind-college-mgmt`

### Option C — Delete Kind cluster *(full teardown)*

```bash
kind delete cluster --name college-mgmt
```

---

## 7. Troubleshooting

| Symptom | Cause / Fix |
|---------|-------------|
| Frontend shows old JS/CSS after redeploy | Hard-refresh (Ctrl+Shift+R); ensure you restarted the frontend deployment |
| Backend pod CrashLoopBackOff | Check `kubectl logs deployment/backend ...`; verify DB secret and postgres pod are up |
| Backend `1/1 Running` but port-forward fails | Pod is still starting. Wait for `Started ProductionApplication` in logs (~90s) |
| `ContainerCreating` stuck | Run `kubectl describe pod <pod> -n college-mgmt`; check for image pull or resource issues |
| Logstash TCP errors in backend logs | Expected — no ELK in local env. Does not affect app functionality |
| Frontend Docker build fails with tsc errors | The Dockerfile must use `RUN npx vite build`, not `RUN npm run build` |
