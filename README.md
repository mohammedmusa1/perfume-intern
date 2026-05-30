# 🌟 AuraPerfume — Luxury Perfume E-Commerce Platform

A production-ready, microservices-based perfume e-commerce platform built with modern scalable architecture.

## 🏗️ Architecture

```
Frontend (Next.js) → API Gateway → Microservices → PostgreSQL
                                  ├── Auth Service
                                  ├── Product Service
                                  ├── Cart Service
                                  ├── Order Service
                                  ├── Payment Service (Razorpay)
                                  ├── Coupon Service
                                  ├── Notification Service (Resend)
                                  └── Admin Service
```

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express, TypeScript (strict) |
| Database | PostgreSQL 16 |
| Payments | Razorpay (UPI, Cards, Net Banking) |
| Email | Resend |
| Containers | Docker, Docker Compose |
| Orchestration | Kubernetes |
| GitOps | ArgoCD |
| IaC | Terraform (AWS + GCP) |
| CI/CD | GitHub Actions |
| Monitoring | Prometheus + Grafana |
| Security | JWT, bcrypt, Helmet, rate limiting, RBAC |

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- PostgreSQL 16+ (or Docker)

### 1. Clone and setup environment
```bash
cp .env.example .env
# Edit .env with your database credentials, Razorpay keys, Resend API key
```

### 2. Start the frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:3000
```

### 3. Start backend services
```bash
# In separate terminals:
cd services/auth-service && npm install && npm run dev
cd services/product-service && npm install && npm run dev
cd services/cart-service && npm install && npm run dev
cd services/order-service && npm install && npm run dev
cd services/payment-service && npm install && npm run dev
cd services/coupon-service && npm install && npm run dev
cd services/notification-service && npm install && npm run dev
cd services/admin-service && npm install && npm run dev
cd services/api-gateway && npm install && npm run dev
```

### 4. Run database migrations
```bash
psql -U auraperfume_user -d auraperfume -f database/migrations/001_initial_schema.sql
psql -U auraperfume_user -d auraperfume -f database/seeds/001_seed_data.sql
```

## 🐳 Docker Compose (Recommended)
```bash
cp .env.example .env
docker-compose up --build
```
- Frontend: http://localhost:4000
- API Gateway: http://localhost:3000
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3100 (admin/admin)

## ☁️ AWS Deployment
```bash
cd infrastructure/terraform/aws
terraform init
terraform plan
terraform apply
```

## ☁️ GCP Migration
```bash
cd infrastructure/terraform/gcp
terraform init
terraform plan
terraform apply
```

## 📁 Project Structure
```
├── frontend/              # Next.js frontend
├── services/
│   ├── api-gateway/       # Request routing, rate limiting
│   ├── auth-service/      # JWT auth, signup, login
│   ├── product-service/   # Perfume CRUD, search, reviews
│   ├── cart-service/      # Shopping cart
│   ├── order-service/     # Orders, checkout
│   ├── payment-service/   # Razorpay integration
│   ├── coupon-service/    # Coupon CRUD, apply, tracking
│   ├── notification-service/ # Resend emails
│   └── admin-service/     # Dashboard, analytics
├── packages/shared/       # Shared types, validators
├── database/              # Migrations, seeds
├── infrastructure/
│   ├── kubernetes/        # K8s manifests
│   ├── terraform/aws/     # AWS infrastructure
│   ├── terraform/gcp/     # GCP infrastructure
│   ├── argocd/            # GitOps config
│   └── monitoring/        # Prometheus + Grafana
├── .github/workflows/     # CI/CD pipelines
├── docker-compose.yml
└── .env.example
```

## 🔐 Default Credentials
- Admin: admin@auraperfume.com / Admin@123456
- Customer: customer@example.com / Customer@123
- Coupons: WELCOME20, FLAT500, LUXURY15

## 📄 License
MIT
