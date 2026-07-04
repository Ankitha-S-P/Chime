#!/bin/bash
# Run this on the VM to deploy/update Chime
set -e

echo "==> Pulling latest code..."
git pull origin main

echo "==> Building and starting services..."
docker compose -f docker-compose.prod.yml --env-file .env up -d --build

echo "==> Cleaning up dangling images..."
docker image prune -f

echo "==> Running containers:"
docker compose -f docker-compose.prod.yml ps
