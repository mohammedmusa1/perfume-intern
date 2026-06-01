#!/bin/bash
# Full Health Check for AuraPerfume DevOps + GitOps Infrastructure
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

check_status() {
    if [ $? -eq 0 ]; then
        echo -e "[ PASS ] $1"
    else
        echo -e "[ FAIL ] $1"
        FAILURES=$((FAILURES+1))
    fi
}

FAILURES=0
echo "======================================"
echo " AuraPerfume Infrastructure Health "
echo "======================================"

# 1. K3s Nodes
kubectl get nodes | grep -q "Ready"
check_status "K3s Node is Ready"

# 2. Helm Releases
helm list -A | grep -q "jenkins"
check_status "Jenkins Helm Release deployed"
helm list -A | grep -q "argocd"
check_status "ArgoCD Helm Release deployed"
helm list -A | grep -q "monitoring"
check_status "Monitoring Helm Release deployed"

# 3. Pods Health
UNHEALTHY_PODS=$(kubectl get pods -A \
 --field-selector=status.phase!=Running,status.phase!=Succeeded \
 --no-headers 2>/dev/null | wc -l)

if [ "$UNHEALTHY_PODS" -eq 0 ]; then
    check_status "All Kubernetes Pods are Running"
else
    kubectl get pods -A --field-selector=status.phase!=Running,status.phase!=Succeeded
    check_status "All Kubernetes Pods are Running (Found unhealthy pods)"
fi

# 4. ArgoCD App Sync
kubectl get app auraperfume -n argocd -o jsonpath='{.status.sync.status}' | grep -q "Synced"
check_status "ArgoCD App 'auraperfume' is Synced"

# 5. External Endpoint Availability Check (Assuming executed from within EC2)
PUBLIC_IP=$(curl -s ifconfig.me)
curl -s --connect-timeout 5 http://127.0.0.1:30081 > /dev/null
check_status "Jenkins Service Accessible (Port 30081)"

curl -s --connect-timeout 5 http://127.0.0.1:32382 > /dev/null
check_status "ArgoCD Service Accessible (Port 32382)"

curl -s --connect-timeout 5 http://127.0.0.1:30300 > /dev/null
check_status "Grafana Service Accessible (Port 30300)"

echo "======================================"
if [ "$FAILURES" -eq 0 ]; then
    echo "STATUS: ALL SYSTEMS PASS!"
else
    echo "STATUS: FAIL ($FAILURES checks failed)"
fi
echo "======================================"
