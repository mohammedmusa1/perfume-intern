#!/bin/bash
set -e

echo "Starting AuraPerfume EC2 Bootstrap..."

# 1. Update and install dependencies
apt-get update -y
apt-get install -y \
  curl \
  unzip \
  jq \
  git \
  docker.io \
  openjdk-21-jre-headless \
  apt-transport-https \
  ca-certificates \
  coreutils

# 2. Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# 3. Install Helm
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3
bash get_helm.sh

# 4. Install K3s (Single Node)
curl -sfL https://get.k3s.io | sh -s - server --write-kubeconfig-mode 644 --disable traefik --disable servicelb
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

# Wait for K3s node to be ready
echo "Waiting for K3s node to be Ready..."
until kubectl get node | grep -q ' Ready'; do sleep 5; done

# 5. Configure kubeconfig for ubuntu user
mkdir -p /home/ubuntu/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
PUBLIC_IP=$(curl -s ifconfig.me)
sed -i "s/127.0.0.1/${PUBLIC_IP}/g" /home/ubuntu/.kube/config
chown -R ubuntu:ubuntu /home/ubuntu/.kube
chmod 600 /home/ubuntu/.kube/config

# 6. Create Namespaces
kubectl create namespace auraperfume || true
kubectl create namespace jenkins || true
kubectl create namespace argocd || true
kubectl create namespace monitoring || true

# 7. Add Helm Repositories
helm repo add jenkins https://charts.jenkins.io
helm repo add argo https://argoproj.github.io/argo-helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# 8. Install ArgoCD
helm upgrade --install argocd argo/argo-cd -n argocd \
  --set server.service.type=NodePort \
  --set server.service.nodePorts.http=32382

# 9. Apply ArgoCD Application Manifest
curl -sL https://raw.githubusercontent.com/mohammedmusa1/perfume-intern/main/infrastructure/argocd/application.yaml | kubectl apply -f - || true

# 10. Install Jenkins
curl -sL https://raw.githubusercontent.com/mohammedmusa1/perfume-intern/main/infrastructure/k8s/jenkins/values.yaml > /tmp/jenkins-values.yaml
helm upgrade --install jenkins jenkins/jenkins -n jenkins -f /tmp/jenkins-values.yaml

kubectl rollout status \
 deployment/jenkins \
 -n jenkins \
 --timeout=600s

# 11. Install Prometheus & Grafana Monitoring Stack
helm upgrade --install monitoring prometheus-community/kube-prometheus-stack -n monitoring \
  --set prometheus.service.type=NodePort \
  --set prometheus.service.nodePort=30090 \
  --set grafana.service.type=NodePort \
  --set grafana.service.nodePort=30300

# 12. Setup Jenkins Auto Recovery
curl -sL https://raw.githubusercontent.com/mohammedmusa1/perfume-intern/main/infrastructure/scripts/jenkins-recovery.sh -o /usr/local/bin/jenkins-recovery.sh
chmod +x /usr/local/bin/jenkins-recovery.sh

curl -sL https://raw.githubusercontent.com/mohammedmusa1/perfume-intern/main/infrastructure/scripts/jenkins-recovery.service -o /etc/systemd/system/jenkins-recovery.service
curl -sL https://raw.githubusercontent.com/mohammedmusa1/perfume-intern/main/infrastructure/scripts/jenkins-recovery.timer -o /etc/systemd/system/jenkins-recovery.timer

systemctl daemon-reload
systemctl enable --now jenkins-recovery.timer

echo "Bootstrap completed successfully!"
