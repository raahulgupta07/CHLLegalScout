#!/bin/bash
# ============================================================
# Weizza Dash - Production Installer
# ============================================================
# Usage: ./install.sh
#
# This script will:
# 1. Check prerequisites (Docker, Docker Compose)
# 2. Create necessary directories
# 3. Setup environment variables
# 4. Start all services
# 5. Show access URLs
# ============================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="weizza-dash"
INSTALL_DIR="/opt/weizza-dash"
DOMAIN="localhost"
PORT=80

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Weizza Dash - Production Installer${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${YELLOW}Warning: Not running as root. Some operations may require sudo.${NC}"
fi

# Check Docker
echo -e "${YELLOW}Checking prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker compose &> /dev/null && ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    echo "Please install Docker Compose first: https://docs.docker.com/compose/install/"
    exit 1
fi

# Use docker compose (v2) or docker-compose (v1)
if command -v docker compose &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

echo -e "${GREEN}Docker: OK${NC}"
echo -e "${GREEN}Docker Compose: OK${NC}"

# Get installation directory
if [ -d "$INSTALL_DIR" ]; then
    echo -e "${YELLOW}Weizza Dash already installed at $INSTALL_DIR${NC}"
    read -p "Do you want to reinstall? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Installation cancelled."
        exit 0
    fi
else
    echo -e "${YELLOW}Creating installation directory...${NC}"
    sudo mkdir -p "$INSTALL_DIR"
fi

# Copy files
echo -e "${YELLOW}Copying application files...${NC}"
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
sudo cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR/" 2>/dev/null || cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR/"

cd "$INSTALL_DIR"

# Setup environment
echo -e "${YELLOW}Setting up environment...${NC}"
if [ ! -f .env ]; then
    if [ -f .env.production ]; then
        cp .env.production .env
        echo -e "${GREEN}Created .env from template${NC}"
    else
        echo -e "${RED}Error: .env.production not found${NC}"
        exit 1
    fi
fi

# Create directories
echo -e "${YELLOW}Creating data directories...${NC}"
mkdir -p documents/legal/{data,templates,output,knowledge}
mkdir -p logs

# Check .env has valid API keys
source .env
if [ "$OPENAI_API_KEY" = "your_openai_api_key_here" ] || [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${RED}Error: Please edit .env and add your OPENAI_API_KEY${NC}"
    echo "Location: $INSTALL_DIR/.env"
    exit 1
fi

if [ "$OPENROUTER_API_KEY" = "your_openrouter_api_key_here" ] || [ -z "$OPENROUTER_API_KEY" ]; then
    echo -e "${RED}Error: Please edit .env and add your OPENROUTER_API_KEY${NC}"
    echo "Location: $INSTALL_DIR/.env"
    exit 1
fi

# Build and start
echo -e "${YELLOW}Building Docker images (this may take a few minutes)...${NC}"
$DOCKER_COMPOSE build

echo -e "${YELLOW}Starting services...${NC}"
$DOCKER_COMPOSE up -d

# Wait for services
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check status
echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  Installation Complete!${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Get IP address
if command -v hostname &> /dev/null; then
    SERVER_IP=$(hostname -I | awk '{print $1}')
else
    SERVER_IP="localhost"
fi

echo -e "Access URLs:"
echo -e "  ${GREEN}Dashboard:${NC}  http://$SERVER_IP:8001/dashboard"
echo -e "  ${GREEN}Chat:${NC}        http://$SERVER_IP:8001/chat"
echo -e "  ${GREEN}API:${NC}         http://$SERVER_IP:8001/api/dashboard/data"
echo ""

echo -e "Service Status:"
$DOCKER_COMPOSE ps

echo ""
echo -e "${YELLOW}To manage the service:${NC}"
echo -e "  Start:   cd $INSTALL_DIR && $DOCKER_COMPOSE start"
echo -e "  Stop:    cd $INSTALL_DIR && $DOCKER_COMPOSE stop"
echo -e "  Logs:    cd $INSTALL_DIR && $DOCKER_COMPOSE logs -f"
echo -e "  Restart: cd $INSTALL_DIR && $DOCKER_COMPOSE restart"
echo ""

echo -e "${GREEN}Installation complete!${NC}"
