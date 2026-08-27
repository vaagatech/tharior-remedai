#!/usr/bin/env bash
# ==============================================================================
# Deploy Autonomous Coding Engineer (Remedai) UI to AWS (S3 + CloudFront)
# ==============================================================================
set -euo pipefail

# Configuration Defaults (Override via environment variables)
AWS_REGION="${AWS_REGION:-us-east-1}"
AWS_S3_BUCKET_NAME="${AWS_S3_BUCKET_NAME:-remedai-dev-ui-static-hosting}"
CLOUDFRONT_DISTRIBUTION_ID="${CLOUDFRONT_DISTRIBUTION_ID:-}"
VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://your-gcp-api-gateway-url.com}"
COGNITO_USER_POOL_ID="${COGNITO_USER_POOL_ID:-}"
COGNITO_CLIENT_ID="${COGNITO_CLIENT_ID:-}"

echo "=============================================================================="
echo " Deploying UI to AWS (S3 + CloudFront)"
echo " Bucket: s3://$AWS_S3_BUCKET_NAME"
echo " Region: $AWS_REGION"
echo " API Base URL: $VITE_API_BASE_URL"
echo "=============================================================================="

# 1. Build React/Vite UI
echo "[1/3] Building Web Desk UI with Cognito configuration..."
export VITE_API_BASE_URL="$VITE_API_BASE_URL"
export VITE_AWS_REGION="$AWS_REGION"
export VITE_COGNITO_USER_POOL_ID="$COGNITO_USER_POOL_ID"
export VITE_COGNITO_CLIENT_ID="$COGNITO_CLIENT_ID"

npm run build --workspace=apps/web-desk

# 2. Sync to S3 Bucket
echo "[2/3] Syncing built assets to S3..."
aws s3 sync apps/web-desk/dist/ "s3://${AWS_S3_BUCKET_NAME}" \
  --region "$AWS_REGION" \
  --delete \
  --cache-control "max-age=31536000,public" \
  --exclude "index.html"

# Upload index.html without cache for instant SPA updates
aws s3 cp apps/web-desk/dist/index.html "s3://${AWS_S3_BUCKET_NAME}/index.html" \
  --region "$AWS_REGION" \
  --cache-control "no-cache, no-store, must-revalidate"

# 3. Invalidate CloudFront Cache
if [ -n "$CLOUDFRONT_DISTRIBUTION_ID" ]; then
  echo "[3/3] Invalidating CloudFront cache for distribution $CLOUDFRONT_DISTRIBUTION_ID..."
  aws cloudfront create-invalidation \
    --distribution-id "$CLOUDFRONT_DISTRIBUTION_ID" \
    --paths "/*"
else
  echo "[3/3] CLOUDFRONT_DISTRIBUTION_ID not set. Skipping cache invalidation."
fi

echo "UI successfully deployed to AWS!"
