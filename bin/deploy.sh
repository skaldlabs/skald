#!/bin/bash

set -e

echo "================================================"
echo "  Skald Self-Hosted Deployment Setup"
echo "================================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."
if ! command_exists docker; then
    echo -e "${RED}Error: Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
    echo -e "${RED}Error: Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Detect if using docker-compose or docker compose
if command_exists docker-compose; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"
echo ""

# Prompt for domain names
echo "Domain Configuration"
echo "--------------------"
echo ""
echo "For Skald to work properly, you need to setup DNS records for two domains: one for the Skald API, and the other for the Skald UI."
echo "To do so, before entering them here, set up an A record for each pointing to the IP address of this machine."
echo "We will automatically provision SSL certificates for these domains."
echo ""
read -p "Enter your API domain (e.g., skald-api.<your_domain>.com): " API_DOMAIN
read -p "Enter your UI domain (e.g., skald.<your_domain>.com): " UI_DOMAIN

if [ -z "$API_DOMAIN" ] || [ -z "$UI_DOMAIN" ]; then
    echo -e "${RED}Error: Both API and UI domains are required.${NC}"
    exit 1
fi

echo ""

# Prompt for email (required for Let's Encrypt)
read -p "Enter your email address (for SSL certificate notifications): " ACME_EMAIL

if [ -z "$ACME_EMAIL" ]; then
    echo -e "${RED}Error: Email is required for SSL certificate generation.${NC}"
    exit 1
fi

echo ""

# Prompt for optional API keys
echo "Optional API Keys"
echo "-----------------"
read -p "Enter your VOYAGE_API_KEY (press Enter to skip): " VOYAGE_API_KEY
read -p "Enter your OPENAI_API_KEY (press Enter to skip): " OPENAI_API_KEY

echo ""

# Function to check DNS record
check_dns() {
    local domain=$1
    echo -n "Checking DNS for $domain... "

    # Try to resolve the domain
    if host "$domain" >/dev/null 2>&1; then
        local ip=$(host "$domain" | grep "has address" | head -n1 | awk '{print $4}')
        echo -e "${GREEN}✓${NC} Resolves to $ip"
        return 0
    else
        echo -e "${RED}✗${NC} DNS record not found"
        return 1
    fi
}

# Check DNS records
echo "DNS Verification"
echo "----------------"
echo "Verifying that your domains point to this server..."
echo ""

API_DNS_OK=false
UI_DNS_OK=false

if check_dns "$API_DOMAIN"; then
    API_DNS_OK=true
fi

if check_dns "$UI_DOMAIN"; then
    UI_DNS_OK=true
fi

echo ""

if [ "$API_DNS_OK" = false ] || [ "$UI_DNS_OK" = false ]; then
    echo -e "${YELLOW}Warning: One or more DNS records are not configured correctly.${NC}"
    echo "Please ensure your DNS records point to this server's IP address."
    echo ""
    read -p "Do you want to continue anyway? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Deployment cancelled."
        exit 1
    fi
fi

# Generate random passwords/keys if not exists
echo "Generating secure credentials..."

if [ ! -f .env.prod ]; then
    SECRET_KEY=$(openssl rand -hex 32)
    POSTGRES_PASSWORD=$(openssl rand -base64 32)
else
    # Load existing credentials
    source .env.prod
    if [ -z "$SECRET_KEY" ]; then
        SECRET_KEY=$(openssl rand -hex 32)
    fi
    if [ -z "$POSTGRES_PASSWORD" ]; then
        POSTGRES_PASSWORD=$(openssl rand -base64 32)
    fi
fi

echo -e "${GREEN}✓ Credentials generated${NC}"
echo ""

# Create .env.prod file
echo "Creating configuration file..."
cat > .env.prod << EOF
# Domain Configuration
API_DOMAIN=$API_DOMAIN
UI_DOMAIN=$UI_DOMAIN
ACME_EMAIL=$ACME_EMAIL

# Security
SECRET_KEY=$SECRET_KEY

# Database
POSTGRES_DB=skald2
POSTGRES_USER=postgres
POSTGRES_PASSWORD=$POSTGRES_PASSWORD

# API Keys (optional)
VOYAGE_API_KEY=$VOYAGE_API_KEY
OPENAI_API_KEY=$OPENAI_API_KEY

# Deployment
IS_SELF_HOSTED_DEPLOY=true
EOF

echo -e "${GREEN}✓ Configuration saved to .env.prod${NC}"
echo ""

echo "================================================"
echo -e "${GREEN}  Configuration Complete!${NC}"
echo "================================================"
echo ""
echo "To deploy your Skald instance, run the following command:"
echo ""
echo -e "${YELLOW}# Start services${NC}"
echo "  $DOCKER_COMPOSE -f docker-compose.selfhosted.yml --env-file .env.prod up -d"
echo ""
echo "Once deployed, your Skald instance will be available at:"
echo "  - API: https://$API_DOMAIN"
echo "  - UI:  https://$UI_DOMAIN"
echo ""
echo "Note: SSL certificates may take a few minutes to be issued."
echo ""
echo -e "${YELLOW}# Check logs${NC}"
echo "  $DOCKER_COMPOSE -f docker-compose.selfhosted.yml --env-file .env.prod logs -f"
echo ""
echo -e "${YELLOW}# Stop services${NC}"
echo "  $DOCKER_COMPOSE -f docker-compose.selfhosted.yml --env-file .env.prod down"
echo ""
