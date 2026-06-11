const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create or connect to the SQLite database
const dbPath = path.resolve(__dirname, 'hysteria.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    // Initialize the tables
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      data_limit_gb INTEGER DEFAULT NULL,
      expiry_days INTEGER DEFAULT NULL,
      expiry_date DATETIME DEFAULT NULL,
      data_used_bytes INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      last_active_time DATETIME DEFAULT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )`, () => {
      // Insert default credentials if they don't exist
      db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('admin_username', 'admin')`);
      db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('admin_password', 'admin')`);
      db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('username_prefix', '')`);
      // Create a random JWT secret if it doesn't exist
      const crypto = require('crypto');
      const secret = crypto.randomBytes(64).toString('hex');
      db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES ('jwt_secret', ?)`, [secret]);
    });
    
    // Add columns for existing databases (ignore errors if columns already exist)
    db.run(`ALTER TABLE users ADD COLUMN data_limit_gb INTEGER DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN expiry_days INTEGER DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN expiry_date DATETIME DEFAULT NULL`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN data_used_bytes INTEGER DEFAULT 0`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'active'`, () => {});
    db.run(`ALTER TABLE users ADD COLUMN last_active_time DATETIME DEFAULT NULL`, () => {});
  }
});

module.exports = db;
