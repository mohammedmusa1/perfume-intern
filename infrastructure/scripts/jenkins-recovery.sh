#!/bin/bash
# Auto-recovery system for Jenkins
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml
LOG_FILE="/var/log/jenkins-recovery.log"
UNHEALTHY=0

echo "$(date) - Running Jenkins health check..." >> $LOG_FILE

POD_NAME=$(kubectl get pods -n jenkins -l app.kubernetes.io/component=jenkins-controller -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ -z "$POD_NAME" ]; then
    echo "$(date) - No Jenkins pod found. Proceeding with reinstall..." >> $LOG_FILE
    UNHEALTHY=1
else
    POD_STATUS=$(kubectl get pod $POD_NAME -n jenkins -o jsonpath='{.status.phase}')
    POD_REASON=$(kubectl get pod $POD_NAME -n jenkins -o jsonpath='{.status.containerStatuses[0].state.waiting.reason}')
    
    if [[ "$POD_STATUS" == "Failed" || "$POD_STATUS" == "Unknown" || "$POD_REASON" == "CrashLoopBackOff" || "$POD_REASON" == "ImagePullBackOff" || "$POD_REASON" == "ErrImagePull" ]]; then
        echo "$(date) - Jenkins pod $POD_NAME is unhealthy (Status: $POD_STATUS, Reason: $POD_REASON)" >> $LOG_FILE
        kubectl describe pod $POD_NAME -n jenkins >> $LOG_FILE
        UNHEALTHY=1
    fi
fi

if [ "$UNHEALTHY" == "1" ]; then
    RETRY_COUNT=0
    MAX_RETRIES=3

    while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
        echo "$(date) - Attempting recovery (Try $((RETRY_COUNT+1))/$MAX_RETRIES)..." >> $LOG_FILE
        
        # 1. Stop broken release
        helm uninstall jenkins -n jenkins --wait || true
        
        # 2. Wait cleanup
        sleep 10
        
        # 3. Delete stuck PVCs if corrupted (Optional - currently skipping to preserve data unless strictly necessary)
        # kubectl delete pvc -n jenkins --all
        
        # 4. Refresh repo
        helm repo update
        
        # 5. Reinstall Jenkins
        curl -sL https://raw.githubusercontent.com/mohammedmusa1/perfume-intern/main/infrastructure/k8s/jenkins/values.yaml > /tmp/jenkins-values.yaml
        helm upgrade --install jenkins jenkins/jenkins -n jenkins -f /tmp/jenkins-values.yaml
        
        kubectl rollout status \
         deployment/jenkins \
         -n jenkins \
         --timeout=600s
        
        # 6. Verify pod running
        sleep 30
        NEW_POD=$(kubectl get pods -n jenkins -l app.kubernetes.io/component=jenkins-controller -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
        NEW_STATUS=$(kubectl get pod $NEW_POD -n jenkins -o jsonpath='{.status.phase}')
        
        if [ "$NEW_STATUS" == "Running" ] || [ "$NEW_STATUS" == "Pending" ]; then
            echo "$(date) - Jenkins successfully recovered." >> $LOG_FILE
            exit 0
        fi
        
        RETRY_COUNT=$((RETRY_COUNT+1))
    done
    
    echo "$(date) - CRITICAL: Jenkins failed to recover after $MAX_RETRIES attempts." >> $LOG_FILE
fi
