# DevOps Documentation

This document describes the local setup and CI/CD pipeline for the College Management System.

## 1. Local Database Setup (Docker)

To start the local database and seed it with test data, run:

```bash
docker-compose up -d
```

### Database Details:
- **Database Name**: `college_management`
- **Username**: `postgres`
- **Password**: `postgres`
- **Port**: `5432`

### Seeded Users (Password: `password123` for all):
| Username | Role | Full Name |
|----------|------|-----------|
| `admin` | ADMIN | System Admin |
| `cadmin` | COLLEGE_ADMIN | College Admin |
| `hod_cse` | HOD | HOD CSE |
| `teacher1` | TEACHER | John Doe |
| `student1` | STUDENT | Jane Smith |

### Tools:
- **pgAdmin**: Accessible at `http://localhost:5050` (Login: `admin@admin.com` / `admin`)

---

## 2. CI/CD with Jenkins

A `Jenkinsfile` is provided in the root directory. It performs the following steps:
1. **Build**: Builds the Spring Boot backend (JAR) and the Vite frontend.
2. **Dockerize**: Builds Docker images for both services and pushes them to a registry.
3. **GitOps Update**: Updates the image tags in the Kubernetes manifests.
4. **Deploy**: Commits the changes to trigger ArgoCD.

### Prerequisites for Jenkins:
- Jenkins installed with Docker and Pipeline plugins.
- Docker Registry credentials stored in Jenkins as `docker-credentials-id`.
- K8s manifests stored in the same repository for GitOps.

---

## 3. Kubernetes Deployment (ArgoCD)

The project uses **Kustomize** for environment management.

### Structure:
- `k8s/base`: Common deployment and service definitions.
- `k8s/overlays/test`: Specific configurations for the testing environment (e.g., lower replicas).
- `k8s/overlays/prod`: Specific configurations for production (e.g., higher replicas).

### ArgoCD Setup:
Apply the application manifests to your ArgoCD cluster:

```bash
kubectl apply -f argocd/application.yaml
```

ArgoCD will automatically monitor the `k8s/overlays/test` and `k8s/overlays/prod` paths and sync them with your cluster.

---

## 4. Entity & API Security
All seeded users have **hashed passwords** stored in the database. The application uses `BCryptPasswordEncoder` for validation.
When adding new users through the API or seed scripts, ensure the `password_hash` field is populated with a strong BCrypt hash.
