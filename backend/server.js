const express = require('express');
const cors = require('cors');
const db = require('./database');

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
  const { auth } = req.body;
  
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
      // Authentication successful
      return res.json({ ok: true, id: username });
    } else {
      // Authentication failed
      return res.json({ ok: false });
    }
  });
});

// ==========================================
// Web UI Management API Endpoints
// ==========================================

// Get all users
app.get('/api/users', (req, res) => {
  db.all('SELECT id, username, password, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Create a new user
app.post('/api/users', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function(err) {
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
app.delete('/api/users/:id', (req, res) => {
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

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Hysteria2 Auth & Management API is running on http://localhost:${PORT}`);
});
