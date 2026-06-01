#!/bin/bash
set -euo pipefail
EC2_IP="13.235.51.146"

echo "============================================================"
echo " AuraPerfume - k3s Bootstrap & Full Deployment"
echo " Target: ubuntu@${EC2_IP}"
echo "============================================================"

# ── Install docker, kubectl, k3s ──────────────────────────────
sudo apt-get update -y
sudo apt-get install -y curl wget git apt-transport-https ca-certificates gnupg lsb-release

# Docker
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker ubuntu
  sudo systemctl enable docker --now
fi

# k3s (lightweight Kubernetes – single node, installs kubectl automatically)
if ! command -v k3s &>/dev/null; then
  curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="--tls-san ${EC2_IP} --tls-san localhost" sh -
  sudo systemctl enable k3s --now
fi

# Wait for node to be Ready
echo "⏳ Waiting for k3s node to be Ready..."
for i in $(seq 1 30); do
  STATUS=$(sudo k3s kubectl get nodes --no-headers 2>/dev/null | awk '{print $2}' | head -1)
  [[ "$STATUS" == "Ready" ]] && break
  sleep 5
done

# Fix kubeconfig permissions so ubuntu user can use it
sudo chmod 644 /etc/rancher/k3s/k3s.yaml
mkdir -p /home/ubuntu/.kube
sudo cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
# Replace 127.0.0.1 with real EC2 IP so remote clients can connect
sudo sed -i "s/127.0.0.1/${EC2_IP}/g" /home/ubuntu/.kube/config
sudo chown ubuntu:ubuntu /home/ubuntu/.kube/config

echo "✅ k3s node status:"
sudo k3s kubectl get nodes

# ── Create Namespaces ─────────────────────────────────────────
sudo k3s kubectl create namespace auraperfume  --dry-run=client -o yaml | sudo k3s kubectl apply -f -
sudo k3s kubectl create namespace monitoring   --dry-run=client -o yaml | sudo k3s kubectl apply -f -
sudo k3s kubectl create namespace autoops      --dry-run=client -o yaml | sudo k3s kubectl apply -f -
sudo k3s kubectl create namespace cicd         --dry-run=client -o yaml | sudo k3s kubectl apply -f -

echo "✅ Namespaces created"

# ── Apply all K8s manifests from the repo ─────────────────────
# Clone / pull the repo
REPO_DIR="/home/ubuntu/perfume-intern"
if [ -d "$REPO_DIR" ]; then
  cd "$REPO_DIR" && git pull origin main
else
  git clone https://github.com/mohammedmusa1/perfume-intern.git "$REPO_DIR"
fi

cd "$REPO_DIR"
echo "✅ Repo ready at $REPO_DIR"

# Apply namespaces + all manifests
sudo k3s kubectl apply -f infrastructure/k8s/namespaces.yaml
sudo k3s kubectl apply -f infrastructure/k8s/auraperfume/
sudo k3s kubectl apply -f infrastructure/k8s/monitoring/
sudo k3s kubectl apply -f infrastructure/k8s/autoops/
sudo k3s kubectl apply -f infrastructure/k8s/cicd/

echo "✅ All manifests applied"

# ── Wait for pods ─────────────────────────────────────────────
echo "⏳ Waiting 30s for pods to start..."
sleep 30

echo "============================================================"
echo " kubectl get pods -A"
echo "============================================================"
sudo k3s kubectl get pods -A

# ── Print cluster-info ────────────────────────────────────────
echo "============================================================"
echo " kubectl cluster-info"
echo "============================================================"
sudo k3s kubectl cluster-info

echo "============================================================"
echo " kubeconfig (redacted - copy from /home/ubuntu/.kube/config)"
echo "============================================================"
echo "Done! The kubeconfig is at: /home/ubuntu/.kube/config"
echo "EC2 Public IP: ${EC2_IP}"
echo "k3s API: https://${EC2_IP}:6443"
