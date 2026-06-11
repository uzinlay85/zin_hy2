#!/bin/bash

# Hysteria 2 VPN - Migration Script
# Usage: ./migration.sh backup  |  ./migration.sh restore

DB_PATH="backend/hysteria.db"
BACKUP_FILE="hysteria_backup.db"

if [ "$1" == "backup" ]; then
    echo "Creating backup of the database..."
    if [ -f "$DB_PATH" ]; then
        cp "$DB_PATH" "$BACKUP_FILE"
        echo "✅ Backup successfully created at: $(pwd)/$BACKUP_FILE"
        echo "You can now download this file to your computer using WinSCP/FileZilla."
        echo "Or you can use the Web UI to download the backup much easier!"
    else
        echo "❌ Error: Database not found at $DB_PATH"
    fi
elif [ "$1" == "restore" ]; then
    echo "Restoring database..."
    if [ -f "$BACKUP_FILE" ]; then
        cp "$BACKUP_FILE" "$DB_PATH"
        echo "✅ Database restored successfully!"
        echo "Restarting UI service..."
        sudo pm2 restart hysteria-ui || echo "Please restart pm2 manually: sudo pm2 restart hysteria-ui"
        echo "Done!"
    else
        echo "❌ Error: Backup file not found at $(pwd)/$BACKUP_FILE"
        echo "Please upload your backup file here and name it '$BACKUP_FILE'."
    fi
else
    echo "Usage: ./migration.sh [backup | restore]"
    echo ""
    echo "Example:"
    echo "  ./migration.sh backup    -> Creates a backup of the current users"
    echo "  ./migration.sh restore   -> Restores users from hysteria_backup.db"
fi
