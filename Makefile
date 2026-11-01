# Standard command interface (ops-baseline). Run `make` or `make help`.
# Compose files and their .env live in infra/docker; backend is Maven, frontend is npm.

# Backend needs a JDK 17+ javac. Override when the default java can't build, e.g.
#   make test JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
comma := ,
MVN := $(if $(JAVA_HOME),JAVA_HOME=$(JAVA_HOME) )mvn

COMPOSE     := docker compose -f infra/docker/docker-compose.yml
COMPOSE_DEV := $(COMPOSE) -f infra/docker/docker-compose.dev.yml

GIT_VERSION := $(shell git describe --always --dirty --exclude='*' 2>/dev/null || echo dev)
VERSION ?= $(GIT_VERSION)
BACKEND_IMAGE  ?= college-mgmt-backend
FRONTEND_IMAGE ?= college-mgmt-frontend

APP_URL ?= http://localhost:8080/api/v1
# ZAP runs in a container, so localhost means the host.
DAST_URL = $(subst ://localhost,://host.docker.internal,$(subst ://127.0.0.1,://host.docker.internal,$(APP_URL)))

# Pinned on purpose (scanner images have been hijacked before); bump deliberately.
GITLEAKS_IMAGE ?= ghcr.io/gitleaks/gitleaks:v8.30.1
TRIVY_IMAGE    ?= aquasec/trivy:0.75.0
SEMGREP_IMAGE  ?= semgrep/semgrep:1.179.0
ZAP_IMAGE      ?= zaproxy/zap-stable:2.17.0
GITLEAKS = docker run --rm -v "$(CURDIR):/repo" $(GITLEAKS_IMAGE)
TRIVY    = docker run --rm -v trivy-cache:/root/.cache/trivy -v /var/run/docker.sock:/var/run/docker.sock \
           -v "$(CURDIR):/repo" $(TRIVY_IMAGE)
SEMGREP  = docker run --rm -v "$(CURDIR):/src" $(SEMGREP_IMAGE) semgrep scan --metrics=off --quiet --error
# reference/ is a copied design reference (never built or shipped); generated and vendored dirs are noise.
SCAN_SKIP = node_modules,target,reference,graphify-out,.claude
TRIVY_SKIP = **/node_modules,**/target,reference,graphify-out,.claude

# deploy/rollback: local = Kind (docs/LOCAL_K8S_DEPLOYMENT_RUNBOOK.md). test/prod are GitOps:
# Jenkins promotes image tags into infra/k8s/overlays and ArgoCD syncs (docs/OPERATIONS.md).
ENVS := local test prod
K8S_CONTEXT ?= kind-college-mgmt
K8S_NAMESPACE ?= college-mgmt
require_env = $(if $(filter $(ENV),$(ENVS)),,$(error ENV must be one of: $(ENVS) (got '$(ENV)')))

.DEFAULT_GOAL := help
.PHONY: help setup dev up down test lint build scan scan-src scan-image dast logs obs doctor deploy rollback version

help: ## List available commands
	@grep -hE '^[a-zA-Z_-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN{FS=":.*?## "}{printf "  %-11s %s\n", $$1, $$2}'

setup: ## Create infra/docker/.env, install frontend deps, resolve backend deps
	@test -f infra/docker/.env || { cp infra/docker/.env.example infra/docker/.env && echo "created infra/docker/.env"; }
	cd frontend && npm ci
	cd backend && $(MVN) -q -DskipTests compile

dev: ## Postgres + backend + frontend from source with hot reload (Docker)
	$(COMPOSE_DEV) up -d
	@echo "API: http://localhost:8080/api/v1  Web: http://localhost:5173  (first start downloads deps: make logs)"

up: ## Start Postgres and wait until healthy (pgAdmin: add --profile tools)
	$(COMPOSE) up -d --wait

down: ## Stop every local service, including the obs and tools profiles
	$(COMPOSE_DEV) --profile "*" down

test: ## Backend test suite (+ frontend tests when a test script exists)
	cd backend && $(MVN) test
	cd frontend && npm run test --if-present

lint: ## Frontend ESLint and type check
	cd frontend && npm run lint
	cd frontend && npx tsc -b

build: ## Build backend and frontend images tagged with the version
	docker build -t $(BACKEND_IMAGE):$(VERSION) backend
	docker build -t $(FRONTEND_IMAGE):$(VERSION) frontend

scan: scan-src build scan-image ## All static security scans: source + built images

scan-src: ## Secrets (history + tree), SAST, dependencies, IaC — no build needed
	$(GITLEAKS) git /repo --no-banner
	$(GITLEAKS) dir /repo --no-banner
	$(SEMGREP) --config p/owasp-top-ten --config p/java --config p/typescript \
		$(foreach d,$(subst $(comma), ,$(SCAN_SKIP)),--exclude $(d)) /src
	$(TRIVY) fs --quiet --exit-code 1 --severity HIGH,CRITICAL --skip-dirs "$(TRIVY_SKIP)" /repo
	$(TRIVY) config --quiet --exit-code 1 --severity HIGH,CRITICAL --skip-dirs "$(TRIVY_SKIP)" /repo

scan-image: ## Vulnerability scan of already-built images (make build first)
	$(TRIVY) image --quiet --exit-code 1 --severity HIGH,CRITICAL --ignore-unfixed $(BACKEND_IMAGE):$(VERSION)
	$(TRIVY) image --quiet --exit-code 1 --severity HIGH,CRITICAL --ignore-unfixed $(FRONTEND_IMAGE):$(VERSION)

dast: ## ZAP baseline scan of APP_URL (local or a test/staging host you own only)
	@case "$(APP_URL)" in \
	  http://localhost:*|http://localhost/*|http://127.0.0.1:*|http://127.0.0.1/*) ;; \
	  https://staging.*|https://*.staging.*|https://*-staging.*|https://test.*|https://*.test.*|https://*-test.*) ;; \
	  *) echo "refusing DAST against $(APP_URL): local or test/staging hosts only"; exit 1;; \
	esac
	@mkdir -p .zap && chmod a+w .zap
	docker run --rm --add-host host.docker.internal:host-gateway -v "$(CURDIR)/.zap:/zap/wrk" $(ZAP_IMAGE) \
		zap-baseline.py -t $(DAST_URL) -r report.html -J report.json $(if $(wildcard .zap/rules.tsv),-c rules.tsv)

logs: ## Tail local logs (SERVICE=backend by default)
	$(COMPOSE_DEV) logs -f --tail=200 $(or $(SERVICE),backend)

obs: ## Start local ELK (Kibana: http://localhost:5601)
	$(COMPOSE) --profile obs up -d --wait
	@echo "Kibana: http://localhost:5601  (Prometheus/Grafana run in k8s only: infra/k8s/monitoring)"

doctor: ## Diagnose: .env, Docker, ports, tools, backend health
	python3 scripts/preflight.py --root infra/docker
	@for t in git docker java mvn node npm; do \
	  if command -v $$t >/dev/null; then echo "  ok      $$t"; else echo "  MISSING $$t"; fi; \
	done
	@curl -fsS $(APP_URL)/actuator/health 2>/dev/null && echo || echo "  backend not reachable at $(APP_URL)/actuator/health"

deploy: ## Deploy (ENV=local rebuilds into Kind; test/prod go through Jenkins)
	$(require_env)
	@if [ "$(ENV)" = local ]; then scripts/k8s-local-rebuild.sh; \
	else echo "$(ENV) deploys via Jenkins: main builds promote to test; run with PROMOTE_TO_PROD=true for prod (docs/OPERATIONS.md)"; exit 1; fi

rollback: ## Roll back (ENV=local undoes the last Kind rollout; test/prod via ArgoCD)
	$(require_env)
	@if [ "$(ENV)" = local ]; then \
	  for d in backend frontend; do kubectl rollout undo deployment/$$d -n $(K8S_NAMESPACE) --context $(K8S_CONTEXT) || exit 1; done; \
	else echo "$(ENV): revert the image-tag commit in infra/k8s/overlays/$(ENV)/kustomization.yaml, or roll back in ArgoCD (docs/OPERATIONS.md)"; exit 1; fi

version: ## Print the version tag used for images
	@echo $(VERSION)

