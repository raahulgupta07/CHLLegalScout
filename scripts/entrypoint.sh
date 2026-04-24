#!/bin/bash

############################################################################
#
#    Agno Container Entrypoint
#
############################################################################

# Colors
ORANGE='\033[38;5;208m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${ORANGE}"
cat << 'BANNER'
     █████╗  ██████╗ ███╗   ██╗ ██████╗
    ██╔══██╗██╔════╝ ████╗  ██║██╔═══██╗
    ███████║██║  ███╗██╔██╗ ██║██║   ██║
    ██╔══██║██║   ██║██║╚██╗██║██║   ██║
    ██║  ██║╚██████╔╝██║ ╚████║╚██████╔╝
    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═══╝ ╚═════╝
BANNER
echo -e "${NC}"

# ---------------------------------------------------------------------------
# Fix bind-mount permissions (runs once as root, then drops to app)
# ---------------------------------------------------------------------------
echo -e "    ${DIM}Ensuring /documents permissions...${NC}"
mkdir -p /documents/legal/templates /documents/legal/data /documents/legal/output \
         /documents/legal/uploads /documents/legal/previews /documents/legal/knowledge \
         /documents/legal/extracts
chown -R 61000:61000 /documents
mkdir -p /app/logs && chown -R 61000:61000 /app/logs
echo -e "    ${BOLD}Permissions ready.${NC}"
echo ""

# ---------------------------------------------------------------------------
# Wait for database + run migrations (as app user)
# ---------------------------------------------------------------------------
if [[ "$PRINT_ENV_ON_LOAD" = true || "$PRINT_ENV_ON_LOAD" = True ]]; then
    echo -e "    ${DIM}Environment:${NC}"
    printenv | sed 's/^/    /'
    echo ""
fi

if [[ "$WAIT_FOR_DB" = true || "$WAIT_FOR_DB" = True ]]; then
    echo -e "    ${DIM}Waiting for database at ${DB_HOST}:${DB_PORT}...${NC}"
    gosu app dockerize -wait tcp://$DB_HOST:$DB_PORT -timeout 300s
    echo -e "    ${BOLD}Database ready.${NC}"
    echo ""

    # Run pending database migrations
    echo -e "    ${DIM}Checking for pending database migrations...${NC}"
    gosu app python -m db.migrate 2>&1 | sed 's/^/    /'
    echo ""
fi

# ---------------------------------------------------------------------------
# Exec the main process as app user (PID 1 via exec)
# ---------------------------------------------------------------------------
echo -e "    ${DIM}Starting: $@${NC}"
echo ""
exec gosu app "$@"
