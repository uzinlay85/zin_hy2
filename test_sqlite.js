const sqlite3 = require('./backend/node_modules/sqlite3').verbose();
const db = new sqlite3.Database('./backend/hysteria.db');
db.get("SELECT value FROM settings WHERE key='admin_path'", (err, row) => {
    if (row) console.log(row.value);
});
