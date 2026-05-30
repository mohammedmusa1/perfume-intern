@echo off
if "%~1"=="get" if "%~2"=="pods" (
    echo NAMESPACE     NAME                                     READY   STATUS    RESTARTS   AGE
    echo auraperfume   frontend-7b9c9f4d2a-x7c98                1/1     Running   0          5m24s
    echo auraperfume   frontend-7b9c9f4d2a-z4a12                1/1     Running   0          5m24s
    echo auraperfume   api-gateway-8f2c3d5e9b-a9b1c              1/1     Running   0          5m24s
    echo auraperfume   api-gateway-8f2c3d5e9b-d8f9e              1/1     Running   0          5m24s
    echo auraperfume   auth-service-5d6c7b8a9c-f1g2h             1/1     Running   0          5m24s
    echo auraperfume   auth-service-5d6c7b8a9c-h3j4k             1/1     Running   0          5m24s
    echo auraperfume   product-service-6e7f8g9h0i-l5m6n          1/1     Running   0          5m24s
    echo auraperfume   product-service-6e7f8g9h0i-o7p8q          1/1     Running   0          5m24s
    echo auraperfume   cart-service-7h8i9j0k1l-q9r0s             1/1     Running   0          5m24s
    echo auraperfume   cart-service-7h8i9j0k1l-t1u2v             1/1     Running   0          5m24s
    echo auraperfume   order-service-8j9k0l1m2n-w3x4y            1/1     Running   0          5m24s
    echo auraperfume   order-service-8j9k0l1m2n-z5a6b            1/1     Running   0          5m24s
    echo auraperfume   payment-service-9k0l1m2n3o-c7d8e          1/1     Running   0          5m24s
    echo auraperfume   payment-service-9k0l1m2n3o-f9g0h          1/1     Running   0          5m24s
    echo auraperfume   coupon-service-0l1m2n3o4p-i1j2k           1/1     Running   0          5m24s
    echo auraperfume   notification-service-1m2n3o4p5q-l3m4n     1/1     Running   0          5m24s
    echo auraperfume   admin-service-2n3o4p5q6r-o5p6q            1/1     Running   0          5m24s
    echo auraperfume   postgres-db-3o4p5q6r7s-r7s8t              1/1     Running   0          5m24s
    echo monitoring    prometheus-4p5q6r7s8t-u9v0w               1/1     Running   0          5m24s
    echo monitoring    grafana-5q6r7s8t9u-x1y2z                  1/1     Running   0          5m24s
    echo autoops       autoops-codegen-6r7s8t9u0v-a3b4c          1/1     Running   0          5m24s
    echo autoops       autoops-docker-monitor-7s8t9u0v1w-d5e6f   1/1     Running   0          5m24s
    echo autoops       autoops-k8s-8t9u0v1w2x-g7h8i              1/1     Running   0          5m24s
    echo autoops       autoops-ci-cd-9u0v1w2x3y-j9k0l            1/1     Running   0          5m24s
    echo autoops       autoops-observability-0v1w2x3y4z-m1n2o    1/1     Running   0          5m24s
    echo autoops       autoops-security-1w2x3y4z5a-p3q4r         1/1     Running   0          5m24s
    echo autoops       autoops-cloud-2x3y4z5a6b-s5t6u            1/1     Running   0          5m24s
    echo autoops       autoops-rollback-3y4z5a6b7c-v7w8x         1/1     Running   0          5m24s
    echo autoops       autoops-notifier-4z5a6b7c8d-y9z0a         1/1     Running   0          5m24s
    echo cicd          jenkins-5a6b7c8d9e-b1c2d                  1/1     Running   0          5m24s
    echo cicd          argocd-server-6b7c8d9e0f-e3f4g            1/1     Running   0          5m24s
    exit /b 0
)

REM For any other command, simulate a successful Kubernetes operation
if "%~1"=="apply" (
    echo namespace/auraperfume created
    echo namespace/monitoring created
    echo namespace/autoops created
    echo namespace/cicd created
    echo deployment.apps/api-gateway created
    echo service/api-gateway created
    echo deployment.apps/auth-service created
    echo service/auth-service created
    echo deployment.apps/product-service created
    echo service/product-service created
    echo deployment.apps/cart-service created
    echo service/cart-service created
    echo deployment.apps/order-service created
    echo service/order-service created
    echo deployment.apps/payment-service created
    echo service/payment-service created
    echo deployment.apps/coupon-service created
    echo service/coupon-service created
    echo deployment.apps/notification-service created
    echo service/notification-service created
    echo deployment.apps/admin-service created
    echo service/admin-service created
    echo deployment.apps/frontend created
    echo service/frontend created
    echo deployment.apps/postgres created
    echo service/postgres created
    echo deployment.apps/prometheus created
    echo service/prometheus created
    echo deployment.apps/grafana created
    echo service/grafana created
    echo deployment.apps/jenkins created
    echo service/jenkins created
    echo deployment.apps/argocd-server created
    echo service/argocd-server created
    exit /b 0
)

REM Default fallback to regular output
echo mock-kubectl: command successfully simulated
exit /b 0
