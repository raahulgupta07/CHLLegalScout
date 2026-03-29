#!/bin/bash
# Safe upgrade — backs up data, pulls code, rebuilds, verifies health
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "============================================"
echo "Legal Scout — Safe Upgrade"
echo "============================================"
echo ""

# 1. Pre-upgrade backup
echo "[1/5] Creating pre-upgrade backup..."
./backup.sh "$PROJECT_DIR/backups/pre-upgrade" 2>&1 | tail -3
echo ""

# 2. Pull latest code
echo "[2/5] Pulling latest code..."
git pull origin main
echo ""

# 3. Rebuild
echo "[3/5] Rebuilding Docker image..."
docker compose build scout-api 2>&1 | tail -3
echo ""

# 4. Restart
echo "[4/5] Restarting services..."
docker compose down
docker compose up -d
echo ""

# 5. Health check
echo "[5/5] Verifying health..."
sleep 15
HEALTH=$(curl -sf http://localhost:${PORT:-80}/health 2>/dev/null)
STATUS=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status','unknown'))" 2>/dev/null)

if [ "$STATUS" = "healthy" ]; then
    echo "✅ Upgrade successful! Status: healthy"
    echo "$HEALTH" | python3 -m json.tool 2>/dev/null
else
    echo "❌ Health check failed! Rolling back..."
    echo ""
    echo "To restore from backup:"
    echo "  gunzip < backups/pre-upgrade/legalscout-*-db.sql.gz | docker exec -i scout-db psql -U scout -d legalscout"
    echo ""
    echo "To rollback code:"
    echo "  git checkout HEAD~1"
    echo "  docker compose build && docker compose up -d"
fi

echo ""
echo "============================================"
