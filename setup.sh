#!/bin/bash

# =============================================================================
# IELTS PLATFORM - AUTOMATED SETUP SCRIPT
# =============================================================================
# This script will set up the entire IELTS platform from scratch
# Suitable for: New developers, fresh installations, after git pull
# =============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logo
echo -e "${CYAN}"
cat << "EOF"
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   ██╗███████╗██╗  ████████╗███████╗                         ║
║   ██║██╔════╝██║  ╚══██╔══╝██╔════╝                         ║
║   ██║█████╗  ██║     ██║   ███████╗                         ║
║   ██║██╔══╝  ██║     ██║   ╚════██║                         ║
║   ██║███████╗███████╗██║   ███████║                         ║
║   ╚═╝╚══════╝╚══════╝╚═╝   ╚══════╝                         ║
║                                                               ║
║              PLATFORM AUTOMATED SETUP                         ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}STEP 1: PREREQUISITES CHECK${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker installed${NC}"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose not found. Please install Docker Compose first.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose installed${NC}"

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker daemon is not running. Please start Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker daemon is running${NC}"

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}STEP 2: ENVIRONMENT SETUP${NC}"
echo -e "${BLUE}=========================================${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from template...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ Created .env file from .env.example${NC}"
        echo -e "${YELLOW}📝 Please review .env file and update values if needed${NC}"
    else
        echo -e "${YELLOW}⚠️  .env.example not found. Creating default .env...${NC}"
        cat > .env << 'ENVEOF'
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-2025
JWT_EXPIRATION=86400

# Database Configuration
POSTGRES_USER=ielts_admin
POSTGRES_PASSWORD=ielts_password_2025

# Redis Configuration
REDIS_PASSWORD=ielts_redis_password

# RabbitMQ Configuration
RABBITMQ_DEFAULT_USER=ielts_user
RABBITMQ_DEFAULT_PASS=ielts_rabbitmq_password

# PgAdmin Configuration
PGADMIN_DEFAULT_EMAIL=admin@ielts.com
PGADMIN_DEFAULT_PASSWORD=admin123

# Google OAuth (Optional - configure if needed)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URL=http://localhost:8080/api/v1/auth/google/callback
ENVEOF
        echo -e "${GREEN}✅ Created default .env file${NC}"
    fi
else
    echo -e "${GREEN}✅ .env file exists${NC}"
fi

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}STEP 3: CLEANUP OLD CONTAINERS${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "${YELLOW}Stopping and removing old containers...${NC}"
docker-compose down -v 2>/dev/null || true
echo -e "${GREEN}✅ Cleanup completed${NC}"

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}STEP 4: BUILD DOCKER IMAGES${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "${YELLOW}Building Docker images (this may take 3-5 minutes)...${NC}"
docker-compose build --no-cache

echo -e "${GREEN}✅ Docker images built successfully${NC}"

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}STEP 5: START INFRASTRUCTURE${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "${YELLOW}Starting PostgreSQL, Redis, RabbitMQ...${NC}"
docker-compose up -d postgres redis rabbitmq

echo -e "${YELLOW}Waiting for databases to be ready (30 seconds)...${NC}"
sleep 30

echo -e "${GREEN}✅ Infrastructure started${NC}"

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}STEP 6: RUN DATABASE MIGRATIONS${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose up migrations

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations completed successfully${NC}"
else
    echo -e "${RED}❌ Migrations failed${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}STEP 7: START ALL SERVICES${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "${YELLOW}Starting all microservices...${NC}"
docker-compose up -d

echo -e "${YELLOW}Waiting for services to be ready (20 seconds)...${NC}"
sleep 20

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}STEP 8: CONFIGURE MINIO STORAGE${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "${YELLOW}Configuring MinIO bucket for audio storage...${NC}"
echo -e "${CYAN}Setting up MinIO alias...${NC}"
docker exec ielts_minio mc alias set myminio http://localhost:9000 ielts_admin ielts_minio_password_2025 2>/dev/null || true

echo -e "${CYAN}Creating ielts-audio bucket...${NC}"
docker exec ielts_minio mc mb myminio/ielts-audio --ignore-existing 2>/dev/null || true

echo -e "${CYAN}Setting bucket policy to allow downloads...${NC}"
docker exec ielts_minio mc anonymous set download myminio/ielts-audio 2>/dev/null || true

echo -e "${GREEN}✅ MinIO storage configured${NC}"

echo ""
echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}STEP 9: VERIFY SERVICES${NC}"
echo -e "${BLUE}=========================================${NC}"

echo -e "${YELLOW}Checking service health...${NC}"
docker-compose ps

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║              🎉 SETUP COMPLETED SUCCESSFULLY! 🎉          ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${CYAN}📋 Service URLs:${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🌐 API Gateway:      ${NC}http://localhost:8080"
echo -e "${GREEN}🔐 Auth Service:     ${NC}http://localhost:8081"
echo -e "${GREEN}👤 User Service:     ${NC}http://localhost:8082"
echo -e "${GREEN}📚 Course Service:   ${NC}http://localhost:8083"
echo -e "${GREEN}📝 Exercise Service: ${NC}http://localhost:8084"
echo -e "${GREEN}🔔 Notification:     ${NC}http://localhost:8085"
echo -e "${GREEN}🗄️  PgAdmin:          ${NC}http://localhost:5050"
echo -e "${GREEN}🐰 RabbitMQ:         ${NC}http://localhost:15672"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo -e "${CYAN}📖 Next Steps:${NC}"
echo -e "  1. Test API: ${GREEN}curl http://localhost:8080/health${NC}"
echo -e "  2. View logs: ${GREEN}docker-compose logs -f${NC}"
echo -e "  3. Run tests: ${GREEN}./scripts/test-all.sh${NC}"
echo -e "  4. Stop all: ${GREEN}docker-compose down${NC}"

echo ""
echo -e "${CYAN}🔧 Useful Commands:${NC}"
echo -e "  • View specific service logs: ${GREEN}docker logs -f <service_name>${NC}"
echo -e "  • Restart a service: ${GREEN}docker-compose restart <service_name>${NC}"
echo -e "  • Rebuild a service: ${GREEN}docker-compose up -d --build <service_name>${NC}"
echo -e "  • Access database: ${GREEN}docker exec -it ielts_postgres psql -U ielts_admin -d <db_name>${NC}"

echo ""
echo -e "${GREEN}✨ Happy coding! ✨${NC}"
