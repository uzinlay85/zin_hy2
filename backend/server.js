const express = require('express');
const cors = require('cors');
const db = require('./database');
const jwt = require('jsonwebtoken');

// Helper to get settings from database
const getSetting = (key) => {
  return new Promise((resolve, reject) => {
    db.get('SELECT value FROM settings WHERE key = ?', [key], (err, row) => {
      if (err) reject(err);
      else resolve(row ? row.value : null);
    });
  });
};

// Middleware to authenticate JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token == null) return res.sendStatus(401);

  try {
    const secret = await getSetting('jwt_secret');
    jwt.verify(token, secret, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } catch (err) {
    res.sendStatus(500);
  }
};

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// ==========================================
// Hysteria2 HTTP Auth Endpoint
// ==========================================
// Hysteria2 sends a POST request here when a client tries to connect.
// Payload example: { "addr": "1.2.3.4:56789", "auth": "username:password", "tx": 1234, "rx": 4321 }
app.post('/auth', (req, res) => {
  const { auth } = req.body || {};
  
  if (!auth) {
    return res.json({ ok: false });
  }

  // Expecting auth to be "username:password"
  const [username, password] = auth.split(':');

  if (!username || !password) {
    return res.json({ ok: false });
  }

  // Check the database
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) {
      console.error('Auth Database Error:', err);
      return res.json({ ok: false });
    }
    
    if (row) {
      // Check status
      if (row.status !== 'active') {
        return res.json({ ok: false });
      }
      // Authentication successful
      return res.json({ ok: true, id: auth }); // Use 'auth' as ID for traffic API mapping
    } else {
      // Authentication failed
      return res.json({ ok: false });
    }
  });
});

// ==========================================
// Admin Authentication Endpoints
// ==========================================

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body || {};
  
  try {
    const dbUser = await getSetting('admin_username');
    const dbPass = await getSetting('admin_password');
    const secret = await getSetting('jwt_secret');
    
    if (username === dbUser && password === dbPass) {
      const token = jwt.sign({ username }, secret, { expiresIn: '24h' });
      return res.json({ ok: true, token });
    }
    
    return res.status(401).json({ error: 'Invalid username or password' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/admin/change-password', authenticateToken, async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }
  
  db.run('UPDATE settings SET value = ? WHERE key = "admin_username"', [username]);
  db.run('UPDATE settings SET value = ? WHERE key = "admin_password"', [password], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    const usernamePrefix = await getSetting('username_prefix') || '';
    res.json({ username_prefix: usernamePrefix });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

app.post('/api/admin/settings', authenticateToken, async (req, res) => {
  const { username_prefix } = req.body || {};
  if (username_prefix === undefined) {
    return res.status(400).json({ error: 'Username prefix is required' });
  }
  
  // Update or insert the setting
  db.run('INSERT INTO settings (key, value) VALUES ("username_prefix", ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [username_prefix], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true });
  });
});

// ==========================================
// Web UI Management API Endpoints (Protected)
// ==========================================

// Get all users
app.get('/api/users', authenticateToken, (req, res) => {
  db.all('SELECT id, username, password, created_at, data_limit_gb, expiry_days, expiry_date, data_used_bytes, status, last_active_time FROM users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create a new user
app.post('/api/users', authenticateToken, (req, res) => {
  const { username, password, data_limit_gb, expiry_days } = req.body || {};
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const limit = data_limit_gb ? parseInt(data_limit_gb) : null;
  const days = expiry_days ? parseInt(expiry_days) : null;
  let expiry_date = null;
  if (days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    expiry_date = d.toISOString();
  }

  db.run('INSERT INTO users (username, password, data_limit_gb, expiry_days, expiry_date) VALUES (?, ?, ?, ?, ?)', 
    [username, password, limit, days, expiry_date], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Username already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.json({ id: this.lastID, username, password });
  });
});

// Delete a user
app.delete('/api/users/:id', authenticateToken, (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM users WHERE id = ?', id, function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ deleted: this.changes > 0 });
  });
});

// ==========================================
// Serve Frontend Static Files
// ==========================================
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// ==========================================
// Traffic Monitor (Runs every 30 seconds)
// ==========================================
setInterval(async () => {
  try {
    const res = await fetch('http://127.0.0.1:4000/traffic?clear=1');
    if (res.ok) {
      const traffic = await res.json();
      for (const [auth, usage] of Object.entries(traffic)) {
        if (!auth) continue;
        const [username, password] = auth.split(':');
        const usedBytes = usage.tx + usage.rx;
        if (usedBytes > 0 && username && password) {
          db.run("UPDATE users SET data_used_bytes = data_used_bytes + ?, last_active_time = datetime('now') WHERE username = ? AND password = ?", [usedBytes, username, password]);
        }
      }
    }
  } catch (e) {
    // Traffic API not reachable, ignore quietly
  }

  // Update statuses based on limits
  db.all('SELECT * FROM users WHERE status = "active"', [], (err, rows) => {
    if (err) return;
    for (const user of rows) {
      let expired = false;
      let limit_exceeded = false;
      if (user.expiry_date && new Date() > new Date(user.expiry_date)) {
        expired = true;
      }
      if (user.data_limit_gb !== null && user.data_used_bytes >= (user.data_limit_gb * 1024 * 1024 * 1024)) {
        limit_exceeded = true;
      }
      if (expired || limit_exceeded) {
        const newStatus = expired ? 'expired' : 'limit_exceeded';
        db.run('UPDATE users SET status = ? WHERE id = ?', [newStatus, user.id]);
      }
    }
  });
}, 30000);

// Start the server
app.listen(PORT, () => {
  console.log(`Hysteria2 Auth & Management API is running on http://localhost:${PORT}`);
});
