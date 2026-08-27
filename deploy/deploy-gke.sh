#!/usr/bin/env bash
# ==============================================================================
# Deploy Autonomous Coding Engineer (Remedai) Backend to GKE
# ==============================================================================
set -euo pipefail

# Configuration Defaults (Override via environment variables)
GCP_PROJECT_ID="${GCP_PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo '')}"
GCP_REGION="${GCP_REGION:-us-central1}"
GKE_CLUSTER_NAME="${GKE_CLUSTER_NAME:-dev-spot-gke}"
ARTIFACT_REGISTRY_REPO="${ARTIFACT_REGISTRY_REPO:-remedai-docker}"
IMAGE_NAME="remedai-api"
IMAGE_TAG="${1:-$(git rev-parse --short HEAD 2>/dev/null || date +%s)}"
NAMESPACE="remedai"

if [ -z "$GCP_PROJECT_ID" ]; then
  echo "Error: GCP_PROJECT_ID must be set."
  exit 1
fi

REGISTRY_URL="${GCP_REGION}-docker.pkg.dev/${GCP_PROJECT_ID}/${ARTIFACT_REGISTRY_REPO}"
FULL_IMAGE="${REGISTRY_URL}/${IMAGE_NAME}:${IMAGE_TAG}"

echo "=============================================================================="
echo " Deploying Backend to GKE"
echo " Image: $FULL_IMAGE"
echo " Cluster: $GKE_CLUSTER_NAME ($GCP_REGION)"
echo " Namespace: $NAMESPACE"
echo "=============================================================================="

# 1. Authenticate Docker with Artifact Registry
echo "[1/4] Configuring Docker authentication for Google Artifact Registry..."
gcloud auth configure-docker "${GCP_REGION}-docker.pkg.dev" --quiet

# 2. Build Container Image
echo "[2/4] Building FastAPI Docker image..."
docker build -t "$FULL_IMAGE" -t "${REGISTRY_URL}/${IMAGE_NAME}:latest" -f apps/api-gateway/Dockerfile apps/api-gateway

# 3. Push Container Image
echo "[3/4] Pushing Docker image to Artifact Registry..."
docker push "$FULL_IMAGE"
docker push "${REGISTRY_URL}/${IMAGE_NAME}:latest"

# 4. Connect to GKE and Deploy with Helm
echo "[4/4] Getting GKE credentials and deploying Helm release..."
gcloud container clusters get-credentials "$GKE_CLUSTER_NAME" --region "$GCP_REGION" --project "$GCP_PROJECT_ID"

CHART_PATH="deploy/k8s/resilient-app"
if [ ! -d "$CHART_PATH" ]; then
  CHART_PATH="../gke-deployment/templates/resilient-app"
fi

helm upgrade --install remedai-api "$CHART_PATH" \
  -f app-config.yaml \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --set global.image="$FULL_IMAGE" \
  --set app.image="$FULL_IMAGE" \
  --wait --timeout 5m

echo "Backend successfully deployed to GKE with KEDA autoscaling and Session Isolation!"

