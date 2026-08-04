#!/bin/bash

# Hysteria 2 - Show Secret Admin URL
# This script reads the auto-generated secret admin URL from the database

# Always resolve relative to this script's location, not the caller's cwd
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Error: 'backend' directory not found at $BACKEND_DIR"
    echo "Please make sure you are running this script from the 'zin_hy2' directory."
    exit 1
fi

if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    echo "⚠️  node_modules not found. Running npm install first..."
    cd "$BACKEND_DIR" && npm install --quiet
fi

# Run from inside backend/ so Node.js resolves node_modules correctly
cd "$BACKEND_DIR" && node show_url.js
