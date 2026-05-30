# 🌹 AuraPerfume — Autonomous E-Commerce Platform

A production-grade, self-healing microservices platform with autonomous DevOps agents, Kubernetes orchestration, GitOps via ArgoCD, and full observability.

---

## 📁 Project Structure

```
D:\perfume
├── agents/                    # 9 AutoOps autonomous agents
├── frontend/                  # Next.js e-commerce frontend
├── services/                  # 9 microservices
│   ├── api-gateway
│   ├── auth-service
│   ├── product-service
│   ├── cart-service
│   ├── order-service
│   ├── payment-service
│   ├── coupon-service
│   ├── notification-service
│   └── admin-service
├── database/                  # SQL migrations + seeds
├── infrastructure/
│   ├── k8s/                   # All Kubernetes manifests
│   │   ├── namespaces.yaml
│   │   ├── auraperfume/       # E-commerce services
│   │   ├── monitoring/        # Prometheus + Grafana
│   │   ├── autoops/           # AutoOps agents
│   │   └── cicd/              # Jenkins + ArgoCD
│   ├── monitoring/
│   └── terraform/             # AWS + GCP IaC
├── .github/workflows/         # GitHub Actions CI/CD
├── docker-compose.yml         # Local Docker stack
└── scripts/k8s-deploy.sh      # One-shot K8s deploy
```

---

## 🚀 Quick Start

### Docker (Local)

```bash
cd D:\perfume
docker compose up -d --build
docker compose ps
```

### Kubernetes

```bash
# Deploy everything
bash scripts/k8s-deploy.sh

# Or manually
kubectl apply -f infrastructure/k8s/namespaces.yaml
kubectl apply -f infrastructure/k8s/auraperfume/
kubectl apply -f infrastructure/k8s/monitoring/
kubectl apply -f infrastructure/k8s/autoops/
kubectl apply -f infrastructure/k8s/cicd/

# Verify
kubectl get pods -A
```

---

## 🌐 Service URLs

### Docker Stack (local)

| Service | URL |
|---|---|
| Frontend | http://localhost:4000 |
| API Gateway | http://localhost:3000 |
| Grafana | http://localhost:3100 |
| Prometheus | http://localhost:9090 |
| Notifier (manual report) | `curl -X POST http://localhost:8009/report/send` |

### Kubernetes Stack

| Service | URL |
|---|---|
| Frontend | http://localhost |
| API Gateway | http://localhost/api |
| Prometheus | http://localhost:9090 (NodePort 30090) |
| Grafana | http://localhost:3100 (NodePort 31000) |
| Jenkins | http://localhost:8080 (NodePort 30080) |
| ArgoCD | https://localhost:8081 (NodePort 30081) |

---

## 🤖 AutoOps Agents

| Agent | Port | Responsibility |
|---|---|---|
| codegen | 8001 | Generate/update configs |
| docker-monitor | 8002 | Monitor & restart unhealthy containers |
| k8s | 8003 | Watch pods, auto-recreate CrashLoopBackOff |
| ci-cd | 8004 | Monitor GitHub Actions & Jenkins builds |
| observability | 8005 | Collect Prometheus target metrics |
| security | 8006 | Scan service security headers |
| cloud | 8007 | AWS + GCP infrastructure health |
| rollback | 8008 | `kubectl rollout undo` on failure |
| notifier | 8009 | 12-hour email reports via SMTP |

### Agent Endpoints

```bash
# Health check
curl http://localhost:<port>/health

# Metrics (Prometheus format)
curl http://localhost:<port>/metrics

# Execute agent task
curl -X POST http://localhost:<port>/execute

# Send email report now
curl -X POST http://localhost:8009/report/send
```

---

## 🔧 Jenkins

### Access

```
URL: http://localhost:8080
User: admin
Pass: admin123
```

### Pipeline

The Jenkinsfile builds Docker images on push, pushes to Docker Hub, and triggers ArgoCD sync.

---

## 🔄 ArgoCD

### Install (if not via deploy script)

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl patch svc argocd-server -n argocd -p '{"spec":{"type":"NodePort"}}'
```

### Access

```bash
# Get initial password
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d

# Port forward (alternative)
kubectl port-forward svc/argocd-server -n argocd 8081:443
```

URL: https://localhost:8081  
User: `admin`

### GitOps Sync

ArgoCD automatically syncs changes pushed to `main` branch at `infrastructure/k8s/`.

---

## 📊 Monitoring

### Prometheus

URL: http://localhost:9090

Scrapes all services and agents every 15 seconds.

### Grafana

URL: http://localhost:3100  
Credentials: `admin` / `admin`

**Dashboards:**
- Pod health and restart counts
- Container CPU / RAM usage
- Service request rates
- Agent execution metrics

---

## 🔒 Secrets

Secrets are managed via:
- **Local**: `.env` file (never committed)
- **Kubernetes**: `kubectl create secret` or `infrastructure/k8s/*/secrets.yaml`
- **GitHub Actions**: Repository Secrets (`DOCKER_USERNAME`, `DOCKER_PASSWORD`, `ARGOCD_SERVER`, `ARGOCD_TOKEN`)

---

## 🏗️ CI/CD Pipeline

```
Push to main
    │
    ▼
GitHub Actions (.github/workflows/ci-cd.yml)
    │
    ├─ Build all 19 Docker images (parallel matrix)
    ├─ Push to Docker Hub (mohammedmusa1/perfume-*)
    └─ Trigger ArgoCD sync
           │
           ▼
    ArgoCD applies infrastructure/k8s/
           │
           ▼
    Kubernetes cluster updated
           │
           ▼
    AutoOps agents monitor health
```

---

## 📧 Email Reports

The notifier agent sends a 12-hour infrastructure report automatically.

Manual trigger:
```bash
curl -X POST http://localhost:8009/report/send
# or in Kubernetes:
curl -X POST http://agent-notifier.autoops:8009/report/send
```

---

## 🗄️ Database

PostgreSQL 16 with migrations auto-applied on startup.

```bash
# Connect locally
psql -h localhost -p 5433 -U auraperfume_user -d auraperfume

# Connect in Kubernetes
kubectl exec -it deployment/postgres -n auraperfume -- \
  psql -U auraperfume_user -d auraperfume
```

---

## 📦 GitHub Repository

**URL:** https://github.com/mohammedmusa1/perfume-intern  
**Branch:** main
