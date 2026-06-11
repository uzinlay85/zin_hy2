#!/bin/bash

# Hysteria 2 - Show Secret Admin URL
# This script reads the auto-generated secret admin URL from the database

DB_PATH="backend/hysteria.db"

if [ ! -f "$DB_PATH" ]; then
    echo "❌ Error: Database not found at $DB_PATH."
    echo "Please make sure you are running this script from the 'zin_hy2' directory."
    exit 1
fi

ADMIN_PATH=$(sqlite3 "$DB_PATH" "SELECT value FROM settings WHERE key='admin_path';" 2>/dev/null)

if [ -z "$ADMIN_PATH" ]; then
    echo "❌ Secret URL not found in the database."
    echo "The backend might not have started yet. Please run 'pm2 restart hysteria-ui' and try again."
    exit 1
fi

echo ""
echo "======================================================"
echo " 🔒 YOUR SECRET ADMIN PANEL URL "
echo "======================================================"
echo " 👉 https://your-domain.com$ADMIN_PATH"
echo "======================================================"
echo " Keep this URL safe! Anyone visiting the normal domain will be blocked."
echo ""
