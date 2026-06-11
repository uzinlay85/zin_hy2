const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');

let domain = 'your-domain.com';
try {
    const nginxConfig = fs.readFileSync('/etc/nginx/sites-available/default', 'utf8');
    const match = nginxConfig.match(/server_name\s+([a-zA-Z0-9.-]+)/);
    if (match && match[1] && match[1] !== '_' && match[1] !== 'your-domain.com') {
        domain = match[1].trim();
    }
} catch (e) {}

const dbPath = path.resolve(__dirname, 'hysteria.db');
const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
    if (err) {
        console.error("❌ Database not found or cannot be opened.");
        process.exit(1);
    }
});

db.get("SELECT value FROM settings WHERE key='admin_path'", (err, row) => {
    if (err || !row) {
        console.error("❌ Secret URL not found in the database.");
        console.error("The backend might not have started yet. Please run 'pm2 restart hysteria-ui' and try again.");
        process.exit(1);
    }
    
    console.log("");
    console.log("======================================================");
    console.log(" 🔒 YOUR SECRET ADMIN PANEL URL ");
    console.log("======================================================");
    console.log(` 👉 https://${domain}${row.value}`);
    console.log("======================================================");
    console.log(" Keep this URL safe! Anyone visiting the normal domain will be blocked.");
    console.log("");
    db.close();
});
