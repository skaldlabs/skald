#!/bin/bash

# Test script for Skald
# Runs pytest with proper configuration and uses skald2_test database

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Database configuration (can be overridden by env vars)
DB_NAME="${TEST_DB_NAME:-skald2_test}"
DB_USER="${DB_USER:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-12345678}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
export USE_SQS="${USE_SQS:-false}"

echo -e "${BLUE}Running Skald tests...${NC}"
echo -e "${BLUE}Using database: ${DB_NAME}${NC}"
echo ""

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Check if database exists
echo -e "${YELLOW}Checking if test database exists...${NC}"
DB_EXISTS=$(PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" 2>/dev/null || echo "")

if [ -z "$DB_EXISTS" ]; then
    echo -e "${YELLOW}Creating test database: ${DB_NAME}${NC}"
    PGPASSWORD=$DB_PASSWORD createdb -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME

    echo -e "${YELLOW}Creating pgvector extension...${NC}"
    PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS vector;"

    echo -e "${GREEN}✓ Test database created${NC}"
else
    echo -e "${GREEN}✓ Test database exists${NC}"
fi

# Run migrations
echo -e "${YELLOW}Running migrations...${NC}"
DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}" python manage.py migrate --noinput
echo -e "${GREEN}✓ Migrations complete${NC}"
echo ""

# Run pytest with coverage if --coverage flag is passed
if [ "$1" = "--coverage" ] || [ "$1" = "-c" ]; then
    echo -e "${BLUE}Running with coverage report...${NC}"
    DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}" pytest --cov=skald --cov-report=term-missing --cov-report=html tests/
elif [ -n "$1" ]; then
    # Run specific test file or path
    echo -e "${BLUE}Running tests: $@${NC}"
    DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}" pytest "$@"
else
    # Run all tests with verbose output
    DATABASE_URL="postgres://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}" pytest -v tests/
fi

# Capture exit code
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✓ All tests passed!${NC}"
else
    echo ""
    echo -e "${RED}✗ Some tests failed${NC}"
fi

exit $EXIT_CODE
