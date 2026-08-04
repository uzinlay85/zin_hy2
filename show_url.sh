#!/bin/bash

# Hysteria 2 - Show Secret Admin URL
# This script reads the auto-generated secret admin URL from the database

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Error: 'backend' directory not found."
    echo "Please make sure you are running this script from the 'zin_hy2' directory."
    exit 1
fi

# Change into backend dir so Node.js can find node_modules (sqlite3, etc.)
cd "$BACKEND_DIR" && node show_url.js
