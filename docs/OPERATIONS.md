<!-- Source: docs/DEVOPS.md -->
# DevOps Documentation

This document describes the local setup and CI/CD pipeline for the College Management System.

## 1. Local Database Setup (Docker)

To start the local database and seed it with test data, run:

```bash
docker compose -f infra/docker/docker-compose.yml up -d
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
- `infra/k8s/base`: Common deployment and service definitions.
- `infra/k8s/overlays/test`: Specific configurations for the testing environment (e.g., lower replicas).
- `infra/k8s/overlays/prod`: Specific configurations for production (e.g., higher replicas).

### ArgoCD Setup:
Apply the application manifests to your ArgoCD cluster:

```bash
kubectl apply -f infra/argocd/application.yaml
```

ArgoCD will automatically monitor the `infra/k8s/overlays/test` and `infra/k8s/overlays/prod` paths and sync them with your cluster.

### Local Kind cluster (same images as base manifests, no registry)

For development, `infra/k8s/overlays/local` rewrites images to `college-mgmt-backend:latest` and `college-mgmt-frontend:latest` and sets `imagePullPolicy: Never` so a **local Kind** cluster uses Docker images built on your machine.

1. Create the cluster (once): `kind create cluster --name college-mgmt`
2. Rebuild images, load into Kind, apply manifests, and restart deployments:

```bash
bash scripts/k8s-local-rebuild.sh
```

Override defaults if needed: `KIND_CLUSTER_NAME`, `KUBECTL_CONTEXT`, `K8S_NAMESPACE`.

---

## 4. Entity & API Security
All seeded users have **hashed passwords** stored in the database. The application uses `BCryptPasswordEncoder` for validation.
When adding new users through the API or seed scripts, ensure the `password_hash` field is populated with a strong BCrypt hash.

---

<!-- Source: docs/LOCAL_K8S_DEPLOYMENT_RUNBOOK.md -->
# College Management System - Local Kubernetes (Kind) Runbook

**Version:** 1.1 (updated 2026-07-06)
**Target:** Local build, test, and teardown after code updates
**Includes:** build, load, deploy, smoke-test, stop

---

## 0. Assumptions
- You have a working Docker daemon.
- You have `kubectl` installed.
- You have `kind` installed.
- You use the repo’s local overlay: `infra/k8s/overlays/local`.
- The local manifests use `imagePullPolicy: Never` for backend/frontend, and images are expected to be loaded into Kind with the same tags.

**Defaults used in this repo**
- Kind cluster name: `college-mgmt` (context: `kind-college-mgmt`)
- Kubernetes namespace: `college-mgmt`
- Image tags: `college-mgmt-backend:latest` and `college-mgmt-frontend:latest`
- Backend API context path: `/api/v1`

---

## 1. Build Docker Images

### 1.1 Build backend (Maven multi-stage)
```bash
docker build -t college-mgmt-backend:latest backend
```
Build time: ~5–6 min on first run (Maven dep download), ~2 min with cache.

### 1.2 Build frontend (Vite, skipping tsc type-check)
> **Note:** The frontend Dockerfile uses `RUN npx vite build` directly, bypassing `tsc -b`.
> Using `RUN npm run build` (which runs `tsc -b && vite build`) **will fail** due to
> pre-existing TypeScript errors that do not affect runtime correctness.

```bash
docker build -t college-mgmt-frontend:latest frontend
```
Build time: ~1 min.

---

## 2. Start (one-time cluster setup)

### 2.1 Create the Kind cluster *(run once)*
```bash
kind create cluster --name college-mgmt
```

### 2.2 Load images into the Kind node
```bash
kind load docker-image college-mgmt-backend:latest college-mgmt-frontend:latest --name college-mgmt
```

### 2.3 Apply the local overlay (deploy services)
```bash
kubectl apply -k infra/k8s/overlays/local --context kind-college-mgmt
```

### 2.4 Verify pods
```bash
kubectl get pods -n college-mgmt --context kind-college-mgmt
```
Expected: backend, frontend, postgres all `1/1 Running`.

> **Backend startup time:** Spring Boot takes ~90 seconds to start (Flyway migrations + Hibernate).
> Wait for `Started ProductionApplication` in logs before running API tests.
>
> **Expected warning:** Logstash TCP errors (`UnknownHostException: logstash.logging.svc.cluster.local`)
> appear in backend logs — this is normal in local dev (ELK not deployed). App functions correctly.

---

## 3. Redeploy after update (the “new build” flow)

When you change UI/backend code, rebuild images and refresh the running deployments.

### Option A (recommended): use the repo script
```bash
bash scripts/k8s-local-rebuild.sh
```

This script:
- Builds `college-mgmt-backend:latest` and `college-mgmt-frontend:latest`
- Loads them into the Kind cluster
- Applies `infra/k8s/overlays/local`
- Restarts backend/frontend Deployments to pick up the newly built `:latest` images

### Option B: manual (equivalent)
1) Build images:

```bash
docker build -t college-mgmt-backend:latest backend
docker build -t college-mgmt-frontend:latest frontend
```

2) Load into Kind:

```bash
kind load docker-image college-mgmt-backend:latest college-mgmt-frontend:latest --name college-mgmt
```

3) Apply overlay (in case ConfigMaps/patches changed):

```bash
kubectl apply -k infra/k8s/overlays/local --context kind-college-mgmt
```

4) Restart deployments:

```bash
kubectl rollout restart deployment/backend deployment/frontend -n college-mgmt --context kind-college-mgmt
```

5) Wait for rollout:

```bash
kubectl rollout status deployment/backend -n college-mgmt --context kind-college-mgmt
kubectl rollout status deployment/frontend -n college-mgmt --context kind-college-mgmt
```

---

## 4. “Restart only” (no rebuild)
If you suspect cached pods/assets and you only want to restart:

```bash
kubectl rollout restart deployment/backend deployment/frontend -n college-mgmt --context kind-college-mgmt
kubectl rollout status deployment/backend -n college-mgmt --context kind-college-mgmt --timeout=300s
kubectl rollout status deployment/frontend -n college-mgmt --context kind-college-mgmt --timeout=120s
```

---

## 5. Test the Application

### 5.1 Frontend (browser)
```bash
kubectl port-forward -n college-mgmt svc/frontend-service 9080:80 --context kind-college-mgmt
```
Open: http://localhost:9080

Tip: do a hard refresh (Ctrl+Shift+R) after redeploy to avoid stale cached bundles.

### 5.2 Backend API smoke test

Port-forward the backend:
```bash
kubectl port-forward -n college-mgmt svc/backend-service 8080:8080 --context kind-college-mgmt
```

Actuator health:
```bash
curl http://localhost:8080/api/v1/actuator/health
```

Auth login:
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password123"}'
```
Expected: `{"success":true,"message":"Login successful","data":{"accessToken":"..."}}`

### 5.3 Verify pod health
```bash
kubectl get pods -n college-mgmt --context kind-college-mgmt
# All should be 1/1 Running

kubectl logs -n college-mgmt deployment/backend --context kind-college-mgmt --tail=5
# Look for: "Started ProductionApplication in XX seconds"
```

---

## 6. Stop the Application

### Option A — Scale to zero *(fastest; cluster preserved)*
```bash
kubectl scale deployment backend frontend postgres \
  --replicas=0 -n college-mgmt --context kind-college-mgmt
```
Restart later:
```bash
kubectl scale deployment backend frontend postgres \
  --replicas=1 -n college-mgmt --context kind-college-mgmt
```

### Option B — Delete namespace *(all resources removed; cluster intact)*
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

| Symptom | Fix |
|---------|-----|
| Frontend shows old JS/CSS after redeploy | Hard-refresh (Ctrl+Shift+R); restart frontend deployment |
| Backend pod CrashLoopBackOff | `kubectl logs deployment/backend -n college-mgmt --context kind-college-mgmt` |
| Port-forward fails right after restart | Backend needs ~90s; wait for `Started ProductionApplication` in logs |
| `ContainerCreating` stuck | `kubectl describe pod <pod-name> -n college-mgmt --context kind-college-mgmt` |
| Logstash TCP errors in backend logs | Expected — ELK not deployed locally. Does **not** affect app |
| Frontend Docker build fails with TS errors | Dockerfile must use `RUN npx vite build`, not `RUN npm run build` |

For the full standalone runbook see [LOCAL_K8S_DEPLOYMENT_RUNBOOK.md](LOCAL_K8S_DEPLOYMENT_RUNBOOK.md).

---

<!-- Source: docs/devsetup.md -->
```docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml down
```

```docker compose -f infra/docker/docker-compose.yml -f infra/docker/docker-compose.dev.yml up -d
```

---

<!-- Source: docs/Ops-Guide.md -->
# College Management System - Operations Guide

**Version:** 1.0  
**Target Environment:** Production  
**Phase:** 1

---

## 1. System Requirements

### Hardware Requirements (Minimum)

#### Application Server
- **CPU:** 4 cores (8 cores recommended)
- **RAM:** 8 GB (16 GB recommended)
- **Storage:** 50 GB SSD
- **Network:** 1 Gbps

#### Database Server
- **CPU:** 4 cores (8 cores recommended)
- **RAM:** 16 GB (32 GB recommended for 10,000+ users)
- **Storage:** 500 GB SSD (RAID 10 for redundancy)
- **Network:** 1 Gbps

### Software Requirements
- **OS:** Ubuntu 22.04 LTS / RHEL 8+ / Windows Server 2019+
- **Java:** OpenJDK 17 or Oracle JDK 17
- **Database:** MySQL 8.0.28+
- **Web Server:** Nginx 1.18+ (as reverse proxy)
- **SSL Certificate:** Let's Encrypt or commercial CA
- **Monitoring:** Prometheus + Grafana (optional but recommended)

---

## 2. Installation Guide

### Step 1: Java Installation (Ubuntu/Debian)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install OpenJDK 17
sudo apt install openjdk-17-jdk -y

# Verify installation
java -version
# Output should show: openjdk version "17.0.x"
```

### Step 2: MySQL Installation
```bash
# Install MySQL Server
sudo apt install mysql-server -y

# Secure MySQL installation
sudo mysql_secure_installation

# Login to MySQL
sudo mysql -u root -p

# Create database and user
CREATE DATABASE college_mgmt_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'cms_user'@'localhost' IDENTIFIED BY 'StrongPassword123!';
GRANT ALL PRIVILEGES ON college_mgmt_db.* TO 'cms_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: MySQL Configuration (my.cnf)
```ini
[mysqld]
# Connection Settings
max_connections = 500
connect_timeout = 10
wait_timeout = 600
max_allowed_packet = 64M

# Buffer Pool (set to 70% of available RAM)
innodb_buffer_pool_size = 11G
innodb_log_file_size = 512M
innodb_log_buffer_size = 64M

# Query Cache (deprecated in MySQL 8, but shown for reference)
# query_cache_type = 1
# query_cache_size = 128M

# Slow Query Log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow-query.log
long_query_time = 2

# Binary Logging (for replication/backup)
log_bin = /var/log/mysql/mysql-bin.log
binlog_expire_logs_seconds = 604800  # 7 days
max_binlog_size = 100M

# Character Set
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# InnoDB Settings
innodb_flush_log_at_trx_commit = 1
innodb_flush_method = O_DIRECT
```

Restart MySQL:
```bash
sudo systemctl restart mysql
```

### Step 4: Application Deployment
```bash
# Create application directory
sudo mkdir -p /opt/college-mgmt
cd /opt/college-mgmt

# Upload JAR file (example using scp)
# scp target/college-management-system.jar user@server:/opt/college-mgmt/

# Create application properties
sudo nano application-prod.yml
```

**application-prod.yml:**
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/college_mgmt_db?useSSL=true&requireSSL=true
    username: cms_user
    password: ${DB_PASSWORD}  # Set via environment variable
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000

  jpa:
    hibernate:
      ddl-auto: validate  # NEVER use 'update' in production
    show-sql: false
    properties:
      hibernate:
        format_sql: false
        jdbc:
          batch_size: 20
        order_inserts: true
        order_updates: true

  security:
    jwt:
      secret-key: ${JWT_SECRET}  # 256-bit secret
      expiration: 86400000  # 24 hours

server:
  port: 8080
  compression:
    enabled: true
    mime-types: application/json,application/xml,text/html,text/xml,text/plain

logging:
  level:
    root: INFO
    com.company.college: INFO
  file:
    name: /var/log/college-mgmt/application.log
    max-size: 100MB
    max-history: 30
```

### Step 5: Create Systemd Service
```bash
sudo nano /etc/systemd/system/college-mgmt.service
```

**college-mgmt.service:**
```ini
[Unit]
Description=College Management System
After=syslog.target network.target mysql.service

[Service]
Type=simple
User=cms-app
WorkingDirectory=/opt/college-mgmt
ExecStart=/usr/bin/java -jar \
    -Xms2g -Xmx4g \
    -Dspring.profiles.active=prod \
    -Dspring.config.location=/opt/college-mgmt/application-prod.yml \
    /opt/college-mgmt/college-management-system.jar
SuccessExitStatus=143
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal

Environment="DB_PASSWORD=YourSecurePassword"
Environment="JWT_SECRET=YourVeryLongAndSecure256BitSecretKey"

[Install]
WantedBy=multi-user.target
```

Create application user:
```bash
sudo useradd -r -s /bin/false cms-app
sudo chown -R cms-app:cms-app /opt/college-mgmt
sudo mkdir -p /var/log/college-mgmt
sudo chown -R cms-app:cms-app /var/log/college-mgmt
```

Enable and start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable college-mgmt.service
sudo systemctl start college-mgmt.service
sudo systemctl status college-mgmt.service
```

### Step 6: Nginx Configuration (Reverse Proxy)
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/college-mgmt
```

**nginx configuration:**
```nginx
upstream college_mgmt_backend {
    server 127.0.0.1:8080;
    keepalive 32;
}

server {
    listen 80;
    server_name college.example.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name college.example.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/college.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/college.example.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Client upload size
    client_max_body_size 10M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Proxy settings
    location /api/ {
        proxy_pass http://college_mgmt_backend;
        proxy_http_version 1.1;
        
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
    }

    # Frontend (if serving React/Angular from same server)
    location / {
        root /var/www/college-mgmt-frontend;
        try_files $uri $uri/ /index.html;
    }
}
```

Enable site and reload Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/college-mgmt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 7: SSL Certificate (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d college.example.com
```

---

## 3. Database Management

### Initial Schema Setup
```bash
# Login to MySQL
mysql -u cms_user -p college_mgmt_db

# Execute schema file
source /opt/college-mgmt/schema.sql
```

### Backup Strategy

#### Daily Automated Backup
```bash
sudo nano /usr/local/bin/backup-college-db.sh
```

**backup script:**
```bash
#!/bin/bash

BACKUP_DIR="/backup/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="college_mgmt_db"
DB_USER="cms_user"
DB_PASS="YourSecurePassword"

mkdir -p $BACKUP_DIR

# Full backup
mysqldump -u$DB_USER -p$DB_PASS \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  $DB_NAME | gzip > $BACKUP_DIR/${DB_NAME}_${DATE}.sql.gz

# Keep only last 30 days
find $BACKUP_DIR -name "${DB_NAME}_*.sql.gz" -mtime +30 -delete

# Log
echo "Backup completed: ${DATE}" >> /var/log/college-mgmt/backup.log
```

Make executable and schedule:
```bash
sudo chmod +x /usr/local/bin/backup-college-db.sh

# Add to crontab (run daily at 2 AM)
sudo crontab -e
0 2 * * * /usr/local/bin/backup-college-db.sh
```

#### Restore from Backup
```bash
gunzip < /backup/mysql/college_mgmt_db_20241210_020000.sql.gz | \
mysql -u cms_user -p college_mgmt_db
```

---

## 4. Monitoring & Logging

### Application Logs
```bash
# View real-time logs
sudo journalctl -u college-mgmt.service -f

# View logs from last hour
sudo journalctl -u college-mgmt.service --since "1 hour ago"

# View error logs
sudo journalctl -u college-mgmt.service -p err

# Application log file
tail -f /var/log/college-mgmt/application.log
```

### MySQL Slow Query Log
```bash
# View slow queries
sudo tail -f /var/log/mysql/slow-query.log

# Analyze slow queries
sudo mysqldumpslow -s t -t 10 /var/log/mysql/slow-query.log
```

### System Monitoring Commands
```bash
# Check application status
sudo systemctl status college-mgmt.service

# Check port listening
sudo netstat -tulpn | grep 8080

# Check memory usage
free -h

# Check disk usage
df -h

# Check MySQL connections
mysql -u root -p -e "SHOW PROCESSLIST;"

# Check system load
top
htop
```

### Health Check Endpoint
Add to Spring Boot application:
```java
@RestController
@RequestMapping("/actuator")
public class HealthController {
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        status.put("timestamp", LocalDateTime.now().toString());
        return ResponseEntity.ok(status);
    }
}
```

Monitor with cron:
```bash
# Create health check script
sudo nano /usr/local/bin/health-check.sh
```

```bash
#!/bin/bash

HEALTH_URL="https://college.example.com/api/v1/actuator/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -ne 200 ]; then
    echo "Health check failed with status: $RESPONSE" | \
    mail -s "College Management System Health Alert" admin@example.com
fi
```

---

## 5. Security Hardening

### Firewall Configuration (UFW)
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow MySQL (only from localhost)
sudo ufw deny 3306/tcp

# Check status
sudo ufw status verbose
```

### MySQL Security
```bash
# Disable remote root login
mysql -u root -p
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');
FLUSH PRIVILEGES;

# Remove test database
DROP DATABASE IF EXISTS test;

# Set password policy
SET GLOBAL validate_password.policy = STRONG;
SET GLOBAL validate_password.length = 12;
```

### Application Security Checklist
- ✅ JWT secret key rotated quarterly
- ✅ Database passwords stored in environment variables (not in config files)
- ✅ HTTPS enforced (no HTTP access)
- ✅ Security headers configured in Nginx
- ✅ Rate limiting enabled (application or Nginx level)
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (input validation, output encoding)
- ✅ CSRF protection enabled
- ✅ CORS configured properly
- ✅ File upload restrictions in place

---

## 6. Performance Tuning

### JVM Tuning
Adjust in systemd service file:
```ini
ExecStart=/usr/bin/java -jar \
    -Xms2g -Xmx4g \
    -XX:+UseG1GC \
    -XX:MaxGCPauseMillis=200 \
    -XX:+HeapDumpOnOutOfMemoryError \
    -XX:HeapDumpPath=/var/log/college-mgmt/heap_dump.hprof \
    /opt/college-mgmt/college-management-system.jar
```

### Database Connection Pool
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20        # Max connections
      minimum-idle: 5              # Min idle connections
      connection-timeout: 30000    # 30 seconds
      idle-timeout: 600000         # 10 minutes
      max-lifetime: 1800000        # 30 minutes
```

### MySQL Query Optimization
```sql
-- Analyze table
ANALYZE TABLE Users;

-- Check index usage
SHOW INDEX FROM Users;

-- Explain query plan
EXPLAIN SELECT * FROM Users WHERE college_id = 5 AND role_id = 4;
```

---

## 7. Disaster Recovery

### Recovery Time Objective (RTO)
- **Target:** 4 hours
- **Maximum tolerable downtime:** 8 hours

### Recovery Point Objective (RPO)
- **Target:** 24 hours (daily backups)
- **Critical data:** 1 hour (binary logs)

### Disaster Recovery Plan

#### Scenario 1: Database Corruption
```bash
# 1. Stop application
sudo systemctl stop college-mgmt.service

# 2. Restore from latest backup
gunzip < /backup/mysql/latest.sql.gz | mysql -u cms_user -p college_mgmt_db

# 3. Apply binary logs (if needed)
mysqlbinlog /var/log/mysql/mysql-bin.000001 | mysql -u cms_user -p college_mgmt_db

# 4. Start application
sudo systemctl start college-mgmt.service
```

#### Scenario 2: Application Server Failure
```bash
# 1. Deploy on new server (follow installation steps)
# 2. Point DNS to new server
# 3. Verify health checks
curl https://college.example.com/api/v1/actuator/health
```

---

## 8. Scaling Strategy

### Vertical Scaling (Single Server)
- Increase CPU cores (4 → 8 → 16)
- Increase RAM (8GB → 16GB → 32GB)
- Upgrade to SSD RAID 10
- Optimize database queries and indexes

### Horizontal Scaling (Multi-Server)
```
Load Balancer (Nginx/HAProxy)
    ├── App Server 1 (Primary)
    ├── App Server 2 (Secondary)
    └── App Server 3 (Standby)
           ↓
    Database Server (MySQL Master)
           ↓
    Database Replica (Read-only)
```

---

## 9. Maintenance Procedures

### Monthly Maintenance Checklist
- [ ] Review and analyze slow query logs
- [ ] Check disk space on all servers
- [ ] Review application error logs
- [ ] Update system packages (`sudo apt update && sudo apt upgrade`)
- [ ] Verify backup integrity
- [ ] Rotate JWT secret key (quarterly)
- [ ] Review user access and remove inactive accounts
- [ ] Test disaster recovery procedure
- [ ] Review and optimize database indexes
- [ ] Check SSL certificate expiration

### Quarterly Tasks
- [ ] Update Spring Boot version (if security patches available)
- [ ] Review and update dependencies
- [ ] Perform load testing
- [ ] Review and update security policies
- [ ] Audit user permissions

---

## 10. Troubleshooting Guide

### Application Won't Start
```bash
# Check Java version
java -version

# Check service status
sudo systemctl status college-mgmt.service

# Check logs
sudo journalctl -u college-mgmt.service -n 100

# Verify database connectivity
mysql -u cms_user -p -h localhost college_mgmt_db
```

### High Memory Usage
```bash
# Check Java heap
jstat -gc <PID>

# Generate heap dump
jmap -dump:live,format=b,file=/tmp/heap.hprof <PID>

# Analyze heap dump using VisualVM or Eclipse MAT
```

### Slow Queries
```bash
# Enable slow query log (if not enabled)
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

# View slow queries
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;
```

### Database Connection Pool Exhausted
```sql
-- Check current connections
SHOW PROCESSLIST;

-- Kill long-running queries
KILL <connection_id>;
```

---

## 11. Contact & Support

### Emergency Contacts
- **System Admin:** admin@example.com
- **Database Admin:** dba@example.com
- **On-Call Engineer:** +1-234-567-8900

### Escalation Path
1. **Level 1:** On-call engineer (0-2 hours)
2. **Level 2:** Senior DevOps (2-4 hours)
3. **Level 3:** CTO/Tech Lead (4+ hours)

---

**Next Document:** USER_GUIDE.md for end-user documentation.
