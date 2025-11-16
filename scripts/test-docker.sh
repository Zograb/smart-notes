#!/bin/bash

# Script to test Docker build and deployment locally
# This helps verify the Docker setup before pushing to GCP

set -e

echo "🔨 Building Docker image..."
docker build -t nexly-api:test -f Dockerfile .

echo "✅ Docker image built successfully!"

echo ""
echo "📦 Image size:"
docker images nexly-api:test --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "🧪 Testing with docker-compose..."
echo "Press Ctrl+C to stop the services when ready"
echo ""

# Copy .env.example if .env doesn't exist
if [ ! -f apps/api/.env ]; then
    echo "⚠️  No .env file found. Creating from .env.example..."
    cp apps/api/.env.example apps/api/.env
    echo "⚠️  Please update apps/api/.env with your actual credentials!"
fi

docker-compose -f docker-compose.prod.yml up --build






