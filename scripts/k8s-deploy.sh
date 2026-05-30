#!/usr/bin/env bash
# ============================================================
# AuraPerfume — Kubernetes Deploy Script
# ============================================================
set -euo pipefail

echo ""
echo "🌹 AuraPerfume — Kubernetes Deployment"
echo "========================================"

# 1. Namespaces
echo ""
echo "📁 Creating namespaces..."
kubectl apply -f infrastructure/k8s/namespaces.yaml

# 2. Install NGINX Ingress Controller (if not installed)
echo ""
echo "🌐 Installing NGINX Ingress Controller..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.0/deploy/static/provider/cloud/deploy.yaml || true
echo "   Waiting for ingress controller..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s || echo "   Ingress controller not ready yet, continuing..."

# 3. auraperfume namespace
echo ""
echo "🛒 Deploying AuraPerfume ecommerce services..."
kubectl apply -f infrastructure/k8s/auraperfume/

# 4. monitoring namespace
echo ""
echo "📊 Deploying monitoring stack..."
kubectl apply -f infrastructure/k8s/monitoring/

# 5. autoops namespace
echo ""
echo "🤖 Deploying AutoOps agents..."
kubectl apply -f infrastructure/k8s/autoops/

# 6. cicd namespace
echo ""
echo "🔧 Deploying CI/CD tools..."
kubectl apply -f infrastructure/k8s/cicd/

# 7. Install ArgoCD
echo ""
echo "🚀 Installing ArgoCD..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f - || true
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml || true

# 8. Patch ArgoCD server to NodePort
kubectl patch svc argocd-server -n argocd \
  -p '{"spec": {"type": "NodePort", "ports": [{"name":"https","port":443,"targetPort":8080,"nodePort":30081}]}}' 2>/dev/null || true

echo ""
echo "✅ Deployment complete!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Service URLs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Frontend:   http://localhost"
echo "  API:        http://localhost/api"
echo "  Prometheus: http://localhost:9090  (NodePort 30090)"
echo "  Grafana:    http://localhost:3100  (NodePort 31000)"
echo "  Jenkins:    http://localhost:8080  (NodePort 30080)"
echo "  ArgoCD:     https://localhost:8081 (NodePort 30081)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Verify pods"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
kubectl get pods -A
