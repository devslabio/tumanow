#!/bin/bash

# Deployment Script for TumaNow System
# Run this on the devslab server

set -e

echo "🚀 Starting TumaNow System Deployment..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_DIR="/opt/tumanow"
BACKEND_PORT=3006
FRONTEND_PORT=3007

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}Please run as root${NC}"
  exit 1
fi

# Navigate to project directory
if [ ! -d "$PROJECT_DIR" ]; then
  echo -e "${YELLOW}Project directory not found. Cloning from GitHub...${NC}"
  mkdir -p /opt
  cd /opt
  git clone https://github.com/devslabio/tumanow.git
fi

cd $PROJECT_DIR

echo -e "${GREEN}✅ Project directory ready${NC}"

# Check port availability
echo -e "${YELLOW}Checking port availability...${NC}"
if command -v netstat > /dev/null 2>&1; then
  if netstat -tuln | grep -q ":$BACKEND_PORT "; then
    echo -e "${RED}❌ Port $BACKEND_PORT is already in use!${NC}"
    echo "Please check what's using this port:"
    netstat -tuln | grep ":$BACKEND_PORT "
    exit 1
  fi
elif command -v ss > /dev/null 2>&1; then
  if ss -tuln | grep -q ":$BACKEND_PORT "; then
    echo -e "${RED}❌ Port $BACKEND_PORT is already in use!${NC}"
    echo "Please check what's using this port:"
    ss -tuln | grep ":$BACKEND_PORT "
    exit 1
  fi
fi

# Check Docker containers
if docker ps --format "{{.Ports}}" | grep -q ":$BACKEND_PORT"; then
  echo -e "${RED}❌ Port $BACKEND_PORT is used by a Docker container!${NC}"
  docker ps --format "table {{.Names}}\t{{.Ports}}" | grep ":$BACKEND_PORT"
  exit 1
fi

echo -e "${GREEN}✅ Port $BACKEND_PORT is available${NC}"

# Pull latest code
echo -e "${YELLOW}Pulling latest code...${NC}"
git pull origin main

# Ensure database exists
echo -e "${YELLOW}Checking database...${NC}"
docker exec -it devslab-postgres psql -U devslab_admin -d postgres -c "CREATE DATABASE tumanow;" 2>/dev/null || echo "Database may already exist"

# Build and deploy backend
echo -e "${YELLOW}Building backend...${NC}"
cd backend
docker build -t tumanow-backend:latest .

# Stop existing container if running
docker stop tumanow-backend 2>/dev/null || true
docker rm tumanow-backend 2>/dev/null || true

# Start backend container
echo -e "${YELLOW}Starting backend container...${NC}"
cd ..
docker compose -f docker-compose.devlabs.yml up -d backend

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
sleep 10

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker exec -it tumanow-backend pnpm prisma migrate deploy

# Run seed (optional)
echo -e "${YELLOW}Seeding database (optional)...${NC}"
docker exec -it tumanow-backend pnpm prisma:seed || echo "Seed may have already run or is optional"

# Check backend health
echo -e "${YELLOW}Checking backend health...${NC}"
sleep 5
if curl -f http://localhost:${BACKEND_PORT}/api > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Backend is running on port ${BACKEND_PORT}${NC}"
else
  echo -e "${RED}❌ Backend health check failed${NC}"
  docker logs tumanow-backend --tail 50
  exit 1
fi

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "Backend API: http://159.198.65.38:${BACKEND_PORT}"
echo "API Docs: http://159.198.65.38:${BACKEND_PORT}/api/docs"

