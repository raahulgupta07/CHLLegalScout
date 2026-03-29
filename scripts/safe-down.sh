#!/bin/bash
# Safe shutdown — stops containers WITHOUT deleting data
# Use this instead of "docker compose down -v"

echo "Stopping Legal Scout..."

if [[ "$1" == "-v" || "$1" == "--volumes" ]]; then
    echo ""
    echo "⚠️  WARNING: -v flag will DELETE ALL DATA (database, backups, everything)"
    echo ""
    read -p "Are you sure? Type 'DELETE' to confirm: " confirm
    if [ "$confirm" != "DELETE" ]; then
        echo "Cancelled."
        exit 0
    fi
    echo "Deleting volumes..."
    docker compose down -v
else
    docker compose down
fi

echo "Done. Data is safe."
echo "Start again with: docker compose up -d"
