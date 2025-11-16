#!/bin/bash

# Script to test GCP deployment locally using gcloud CLI
# Prerequisites: gcloud CLI installed and authenticated

set -e

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"your-project-id"}
SERVICE_NAME="nexly-api"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

echo "🔐 Authenticating with Google Cloud..."
gcloud auth login

echo "📋 Setting project to: ${PROJECT_ID}"
gcloud config set project ${PROJECT_ID}

echo "🔨 Building Docker image..."
docker build -t ${IMAGE_NAME}:local -f Dockerfile .

echo "🔐 Configuring Docker for GCR..."
gcloud auth configure-docker

echo "📤 Pushing image to Google Container Registry..."
docker push ${IMAGE_NAME}:local

echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${IMAGE_NAME}:local \
  --region ${REGION} \
  --platform managed \
  --allow-unauthenticated \
  --port 3001 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars="NODE_ENV=production,PORT=3001"

echo "✅ Deployment complete!"

echo ""
echo "📝 Getting service URL..."
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} \
  --region ${REGION} \
  --format 'value(status.url)')

echo ""
echo "🎉 Service deployed to: ${SERVICE_URL}"
echo ""
echo "Test with:"
echo "curl ${SERVICE_URL}"





