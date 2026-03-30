#!/bin/bash

# MindBridge Development Helper Script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 MindBridge Development Helper"
echo "==============================="

# Function to check service
check_service() {
  local service=$1
  local port=$2
  
  echo -e "\n${YELLOW}Checking $service on port $port...${NC}"
  
  if command -v curl &> /dev/null; then
    if curl -s http://localhost:$port/api/health > /dev/null 2>&1 || curl -s http://localhost:$port > /dev/null 2>&1; then
      echo -e "${GREEN}✓ $service is running${NC}"
      return 0
    fi
  fi
  
  echo -e "${RED}✗ $service is NOT running${NC}"
  return 1
}

# Function to check database
check_db() {
  echo -e "\n${YELLOW}Checking PostgreSQL...${NC}"
  
  if docker ps | grep -q mindbridge-postgres; then
    echo -e "${GREEN}✓ PostgreSQL container is running${NC}"
    return 0
  else
    echo -e "${RED}✗ PostgreSQL container is NOT running${NC}"
    echo -e "  Run: ${YELLOW}docker-compose -f backend/docker-compose.yml up -d${NC}"
    return 1
  fi
}

case "$1" in
  "start")
    echo -e "\n${YELLOW}Starting MindBridge development environment...${NC}"
    
    # Start backend
    echo -e "\n${YELLOW}Starting backend...${NC}"
    cd "$SCRIPT_DIR/backend"
    npm run dev &
    BACKEND_PID=$!
    
    # Start frontend
    echo -e "\n${YELLOW}Starting frontend...${NC}"
    cd "$SCRIPT_DIR/frontend"
    npm run dev &
    FRONTEND_PID=$!
    
    echo -e "\n${GREEN}Backend PID: $BACKEND_PID${NC}"
    echo -e "${GREEN}Frontend PID: $FRONTEND_PID${NC}"
    echo -e "\n${GREEN}Access your app at:${NC}"
    echo -e "  Frontend: http://localhost:8080"
    echo -e "  Backend: http://localhost:3001"
    echo -e "  Database: http://localhost:5050 (pgAdmin)"
    ;;
    
  "stop")
    echo -e "\n${YELLOW}Stopping all services...${NC}"
    pkill -f "npm run dev"
    echo -e "${GREEN}Stopped${NC}"
    ;;
    
  "status")
    echo -e "\n${YELLOW}System Status${NC}"
    echo "=============="
    
    check_service "Backend" 3001
    check_service "Frontend" 8080
    check_db
    
    echo -e "\n${YELLOW}Services Running:${NC}"
    docker-compose -f backend/docker-compose.yml ps
    ;;
    
  "db-up")
    echo -e "\n${YELLOW}Starting database...${NC}"
    cd "$SCRIPT_DIR/backend"
    docker-compose up -d
    echo -e "${GREEN}Database started${NC}"
    echo -e "  pgAdmin: http://localhost:5050"
    ;;
    
  "db-down")
    echo -e "\n${YELLOW}Stopping database...${NC}"
    cd "$SCRIPT_DIR/backend"
    docker-compose down
    echo -e "${GREEN}Database stopped${NC}"
    ;;
    
  "db-logs")
    echo -e "\n${YELLOW}Database logs...${NC}"
    cd "$SCRIPT_DIR/backend"
    docker-compose logs -f postgres
    ;;
    
  "migrate")
    echo -e "\n${YELLOW}Running database migration...${NC}"
    cd "$SCRIPT_DIR/backend"
    npx prisma migrate dev --name "$2"
    echo -e "${GREEN}Migration complete${NC}"
    ;;
    
  "studio")
    echo -e "\n${YELLOW}Opening Prisma Studio...${NC}"
    cd "$SCRIPT_DIR/backend"
    npx prisma studio
    ;;
    
  "reset-db")
    echo -e "\n${RED}WARNING: This will DELETE all database data!${NC}"
    read -p "Continue? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      cd "$SCRIPT_DIR/backend"
      npx prisma migrate reset
      echo -e "${GREEN}Database reset${NC}"
    fi
    ;;
    
  "install")
    echo -e "\n${YELLOW}Installing dependencies...${NC}"
    
    echo -e "\n${YELLOW}Backend:${NC}"
    cd "$SCRIPT_DIR/backend"
    npm install
    
    echo -e "\n${YELLOW}Frontend:${NC}"
    cd "$SCRIPT_DIR/frontend"
    npm install
    
    echo -e "\n${GREEN}Dependencies installed${NC}"
    ;;
    
  "health")
    echo -e "\n${YELLOW}Health Check${NC}"
    echo "============"
    
    echo -e "\n${YELLOW}Backend:${NC}"
    curl -s http://localhost:3001/api/health | jq . || echo "Failed to connect"
    
    echo -e "\n${YELLOW}Database:${NC}"
    if docker ps | grep -q mindbridge-postgres; then
      docker exec mindbridge-postgres pg_isready -U postgres && echo "PostgreSQL ready" || echo "PostgreSQL not ready"
    else
      echo "PostgreSQL container not running"
    fi
    ;;
    
  "logs")
    echo -e "\n${YELLOW}Recent logs...${NC}"
    
    echo -e "\n${YELLOW}Backend (last 50 lines):${NC}"
    tail -50 backend/npm-debug.log || echo "No logs found"
    ;;
    
  *)
    echo -e "\n${YELLOW}Usage:${NC}"
    echo "  ./dev.sh start              Start all services"
    echo "  ./dev.sh stop               Stop all services"
    echo "  ./dev.sh status             Check services status"
    echo "  ./dev.sh db-up              Start database"
    echo "  ./dev.sh db-down            Stop database"
    echo "  ./dev.sh db-logs            Show database logs"
    echo "  ./dev.sh migrate [name]     Run database migration"
    echo "  ./dev.sh studio             Open Prisma Studio"
    echo "  ./dev.sh reset-db           Reset database (⚠️ deletes data)"
    echo "  ./dev.sh install            Install all dependencies"
    echo "  ./dev.sh health             Check service health"
    echo "  ./dev.sh logs               Show recent logs"
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  ./dev.sh start"
    echo "  ./dev.sh db-up"
    echo "  ./dev.sh migrate add_users_table"
    ;;
esac
