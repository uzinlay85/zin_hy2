#!/bin/bash

# Hysteria 2 - Show Secret Admin URL
# This script reads the auto-generated secret admin URL from the database

if [ ! -d "backend" ]; then
    echo "❌ Error: 'backend' directory not found."
    echo "Please make sure you are running this script from the 'zin_hy2' directory."
    exit 1
fi

node backend/show_url.js
