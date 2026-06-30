import { useState, useEffect } from 'react';
import { Trash2, Copy, Plus, Server, User, Key, Check, Settings, LogOut, Lock, Dices, Pause, Play, Edit, Download, Upload, X } from 'lucide-react';

function App() {
  // Auth state
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Settings state
  const [showSettings, setShowSettings] = useState(false);
  const [newAdminUser, setNewAdminUser] = useState('');
  const [newAdminPass, setNewAdminPass] = useState('');
  const [adminPrefixInput, setAdminPrefixInput] = useState('');

  // Main state
  const [globalPrefix, setGlobalPrefix] = useState('');
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [batchCount, setBatchCount] = useState('');
  const [batchLinks, setBatchLinks] = useState([]);
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const generatePassword = () => Math.random().toString(36).slice(-8) + Math.floor(Math.random() * 1000).toString();
  const [password, setPassword] = useState(generatePassword());
  const [copiedId, setCopiedId] = useState(null);
  const [newLink, setNewLink] = useState('');
  const [dataLimit, setDataLimit] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const serverDomain = window.location.hostname;

  // Edit state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editDataLimit, setEditDataLimit] = useState('');
  const [editExpiryDays, setEditExpiryDays] = useState('');

  useEffect(() => {
    if (token) {
      fetchSettings();
      fetchUsers();
      const interval = setInterval(fetchUsers, 10000); // refresh every 10s
      return () => clearInterval(interval);
    }
  }, [token]);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGlobalPrefix(data.username_prefix || '');
        setAdminPrefixInput(data.username_prefix || '');
      }
    } catch (err) {
      console.error('Failed to fetch settings', err);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUser, password: loginPass })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.token);
        setToken(data.token);
        setLoginError('');
      } else {
        setLoginError('Invalid username or password');
      }
    } catch (err) {
      setLoginError('Login failed');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newAdminUser || !newAdminPass) return alert('Fill both fields');
    try {
      const res = await fetch('/api/admin/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: newAdminUser, password: newAdminPass })
      });
      if (res.ok) {
        alert('Admin credentials changed successfully! Please log in again.');
        setShowSettings(false);
        handleLogout();
      } else {
        alert('Failed to change credentials');
      }
    } catch (err) {
      alert('Error changing credentials');
    }
  };

  const handleChangePrefix = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username_prefix: adminPrefixInput })
      });
      if (res.ok) {
        alert('Username prefix updated successfully!');
        fetchSettings();
      } else {
        alert('Failed to update prefix');
      }
    } catch (err) {
      alert('Error updating prefix');
    }
  };

  const handleBackup = async () => {
    try {
      const res = await fetch('/api/admin/backup', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) return handleLogout();
      if (!res.ok) throw new Error('Backup failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hysteria_backup.db';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading backup');
    }
  };

  const handleRestore = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!confirm('WARNING: Restoring will overwrite your current database. Are you sure?')) return;

    const formData = new FormData();
    formData.append('database', file);

    try {
      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.status === 401 || res.status === 403) return handleLogout();
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setTimeout(() => window.location.reload(), 2000);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error uploading backup');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Failed to fetch users', err);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    
    if (isBatchMode) {
      if (!username || !batchCount || parseInt(batchCount) < 1) return;
      const count = parseInt(batchCount);
      const usersToCreate = [];
      for (let i = 1; i <= count; i++) {
        usersToCreate.push({
          username: `${globalPrefix}${username}${i}`,
          password: generatePassword(),
          data_limit_gb: dataLimit ? parseInt(dataLimit) : null,
          expiry_days: expiryDays ? parseInt(expiryDays) : null
        });
      }

      try {
        const res = await fetch('/api/users/batch', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ users: usersToCreate })
        });
        if (res.status === 401 || res.status === 403) return handleLogout();
        if (res.ok) {
          const data = await res.json();
          const links = data.created.map(u => `hysteria2://${u.username}:${u.password}@${serverDomain}:443/?sni=${serverDomain}&mport=20000-50000&obfs=salamander&obfs-password=ThantAndZinObfsPassword123#${u.username}`);
          setBatchLinks(links);
          setUsername('');
          setBatchCount('');
          setDataLimit('');
          setExpiryDays('');
          fetchUsers();
          if (data.errors && data.errors.length > 0) {
            alert(`Batch created with ${data.errors.length} errors. Some usernames might already exist.`);
          }
        }
      } catch (err) {
        console.error('Failed to add batch users', err);
      }
      return;
    }

    if (!username || !password) return;

    const finalUsername = globalPrefix + username;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          username: finalUsername, 
          password,
          data_limit_gb: dataLimit ? parseInt(dataLimit) : null,
          expiry_days: expiryDays ? parseInt(expiryDays) : null
        })
      });
      if (res.status === 401 || res.status === 403) return handleLogout();
      if (res.ok) {
        const link = `hysteria2://${finalUsername}:${password}@${serverDomain}:443/?sni=${serverDomain}&mport=20000-50000&obfs=salamander&obfs-password=ThantAndZinObfsPassword123#${finalUsername}`;
        setNewLink(link);
        setUsername('');
        setPassword(generatePassword());
        setDataLimit('');
        setExpiryDays('');
        fetchUsers();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error}`);
      }
    } catch (err) {
      console.error('Failed to add user', err);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401 || res.status === 403) return handleLogout();
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      const res = await fetch(`/api/users/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.status === 401 || res.status === 403) return handleLogout();
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const openEditModal = (user) => {
    setEditingUser(user.id);
    setEditUsername(user.username);
    setEditPassword(user.password);
    setEditDataLimit(user.data_limit_gb !== null ? user.data_limit_gb : '');
    setEditExpiryDays(user.expiry_days !== null ? user.expiry_days : '');
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/users/${editingUser}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          username: editUsername,
          password: editPassword,
          data_limit_gb: editDataLimit ? parseInt(editDataLimit) : null,
          expiry_days: editExpiryDays ? parseInt(editExpiryDays) : null
        })
      });
      if (res.status === 401 || res.status === 403) return handleLogout();
      if (res.ok) {
        setShowEditModal(false);
        fetchUsers();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error}`);
      }
    } catch (err) {
      console.error('Failed to edit user', err);
    }
  };

  const handleCopy = (text, id) => {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "absolute";
      textArea.style.left = "-999999px";
      document.body.prepend(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
      } catch (error) {
        console.error('Fallback copy failed', error);
      } finally {
        textArea.remove();
      }
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isOnline = (lastActiveTime) => {
    if (!lastActiveTime) return false;
    const lastActive = new Date(lastActiveTime + 'Z').getTime();
    const now = new Date().getTime();
    return (now - lastActive) < 65000;
  };

  const formatLastSeen = (lastActiveTime) => {
    if (!lastActiveTime) return 'Never';
    if (isOnline(lastActiveTime)) return 'Online Now';
    const lastActive = new Date(lastActiveTime + 'Z');
    const mins = Math.floor((new Date().getTime() - lastActive.getTime()) / 60000);
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    return lastActive.toLocaleDateString();
  };

  // Login Screen Render
  if (!token) {
    return (
      <div className="container" style={{ maxWidth: '400px', marginTop: '10vh' }}>
        <div className="header">
          <h1>Admin Login</h1>
          <p>Sign in to manage Hysteria 2</p>
        </div>
        <div className="glass-panel">
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Username"
              value={loginUser}
              onChange={(e) => setLoginUser(e.target.value)}
              required
            />
            <input
              type="password"
              className="input-field"
              placeholder="Password"
              value={loginPass}
              onChange={(e) => setLoginPass(e.target.value)}
              required
            />
            {loginError && <p style={{ color: '#ef4444', fontSize: '0.85rem' }}>{loginError}</p>}
            <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
              <Lock size={18} /> Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Main UI Render
  return (
    <div className="container">
      {/* Settings Modal */}
      {showSettings && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', margin: '1rem', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <button 
              onClick={() => setShowSettings(false)} 
              style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.5rem', borderRadius: '50%' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <X size={20} />
            </button>
            
            <h2 style={{ marginTop: '0.5rem', marginBottom: '1.5rem', paddingRight: '2rem' }}>Settings</h2>
            
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#60a5fa' }}>Admin Credentials</h3>
            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              <input
                type="text"
                className="input-field"
                placeholder="New Username"
                value={newAdminUser}
                onChange={(e) => setNewAdminUser(e.target.value)}
                required
              />
              <input
                type="password"
                className="input-field"
                placeholder="New Password"
                value={newAdminPass}
                onChange={(e) => setNewAdminPass(e.target.value)}
                required
              />
              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                Change Credentials
              </button>
            </form>

            <h3 style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', fontSize: '1.1rem', marginBottom: '1rem', color: '#60a5fa' }}>Username Prefix</h3>
            <form onSubmit={handleChangePrefix} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. ZIN-"
                value={adminPrefixInput}
                onChange={(e) => setAdminPrefixInput(e.target.value)}
              />
              <button type="submit" className="btn btn-primary" style={{ justifyContent: 'center' }}>
                Save Prefix
              </button>
            </form>

            <h3 style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginTop: '1.5rem', fontSize: '1.1rem', marginBottom: '1rem', color: '#60a5fa' }}>Backup & Restore</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
              <button type="button" className="btn" onClick={handleBackup} style={{ justifyContent: 'center', background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.5)' }}>
                <Download size={18} /> Download Backup
              </button>
              
              <label className="btn" style={{ justifyContent: 'center', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.5)', cursor: 'pointer' }}>
                <Upload size={18} /> Upload & Restore
                <input type="file" accept=".db" style={{ display: 'none' }} onChange={handleRestore} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '400px', margin: '1rem' }}>
            <h2>Edit User</h2>
            <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                required
              />
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  required
                />
                <button 
                  type="button" 
                  className="btn" 
                  style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)' }}
                  onClick={() => setEditPassword(generatePassword())}
                  title="Generate New Password"
                >
                  <Dices size={18} />
                </button>
              </div>
              <input
                type="number"
                className="input-field"
                placeholder="Data Limit in GB (Optional)"
                value={editDataLimit}
                onChange={(e) => setEditDataLimit(e.target.value)}
              />
              <input
                type="number"
                className="input-field"
                placeholder="Days Valid (Optional)"
                value={editExpiryDays}
                onChange={(e) => setEditExpiryDays(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="header" style={{ position: 'relative' }}>
        <h1>Hysteria2 Portal</h1>
        <p>Manage your VPN access keys seamlessly</p>
        <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', gap: '0.5rem' }}>
          <button className="copy-btn" onClick={() => setShowSettings(true)} title="Settings" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)' }}>
            <Settings size={20} />
          </button>
          <button className="copy-btn" onClick={handleLogout} title="Logout" style={{ padding: '0.5rem', background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444' }}>
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2><Plus size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} /> Create New {isBatchMode ? 'Keys (Batch)' : 'Key'}</h2>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={`btn ${!isBatchMode ? 'btn-primary' : ''}`} onClick={() => setIsBatchMode(false)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Single</button>
            <button className={`btn ${isBatchMode ? 'btn-primary' : ''}`} onClick={() => setIsBatchMode(true)} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>Batch</button>
          </div>
        </div>
        <form onSubmit={handleAddUser} className="form-group">
          <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
            {globalPrefix && (
              <span style={{ padding: '0.65rem 0.75rem', background: 'rgba(255,255,255,0.05)', color: '#94a3b8', borderRight: '1px solid rgba(255,255,255,0.1)', fontWeight: 'bold' }}>
                {globalPrefix}
              </span>
            )}
            <input
              type="text"
              className="input-field"
              placeholder={isBatchMode ? "Base Username (e.g. vip)" : "Username (e.g. meme)"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ border: 'none', background: 'transparent', margin: 0, width: '100%' }}
            />
          </div>
          
          {isBatchMode ? (
            <input
              type="number"
              className="input-field"
              placeholder="Number of keys to generate (e.g. 10)"
              value={batchCount}
              onChange={(e) => setBatchCount(e.target.value)}
              min="1"
              max="100"
            />
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                className="btn" 
                style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)' }}
                onClick={() => setPassword(generatePassword())}
                title="Generate New Password"
              >
                <Dices size={18} />
              </button>
            </div>
          )}

          <input
            type="number"
            className="input-field"
            placeholder="Data Limit in GB (Optional)"
            value={dataLimit}
            onChange={(e) => setDataLimit(e.target.value)}
          />
          <input
            type="number"
            className="input-field"
            placeholder="Days Valid (Optional)"
            value={expiryDays}
            onChange={(e) => setExpiryDays(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ gridColumn: '1 / -1' }}>
            {isBatchMode ? 'Generate Batch Keys' : 'Add Key'}
          </button>
        </form>

        {batchLinks.length > 0 && isBatchMode && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px' }}>
            <div style={{ marginBottom: '0.75rem', color: '#93c5fd', fontSize: '0.9rem', fontWeight: 500, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><Check size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> {batchLinks.length} Keys generated successfully!</span>
              <button type="button" className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={() => handleCopy(batchLinks.join('\n'), 'batch')}>
                {copiedId === 'batch' ? <Check size={14} /> : <Copy size={14} />} Copy All Links
              </button>
            </div>
            <textarea
              readOnly
              value={batchLinks.join('\n')}
              className="input-field"
              style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#cbd5e1', width: '100%', height: '150px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre' }}
            />
          </div>
        )}

        {newLink && !isBatchMode && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px' }}>
            <p style={{ marginBottom: '0.75rem', color: '#93c5fd', fontSize: '0.9rem', fontWeight: 500 }}>
              <Check size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} />
              Key created successfully! Copy your VPN Link below:
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" readOnly value={newLink} className="input-field" style={{ background: 'rgba(15, 23, 42, 0.8)', color: '#cbd5e1' }} />
              <button type="button" className="btn btn-primary" onClick={() => handleCopy(newLink, 'new')}>
                {copiedId === 'new' ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="glass-panel">
        <h2><Server size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} /> Active Users</h2>
        <div className="table-container user-list-container">
          <table className="user-table">
            <thead>
              <tr>
                <th><User size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Username</th>
                <th><Key size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> Password</th>
                <th>VPN Link</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" className="empty-state">No users found. Create your first key above.</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td data-label="Username">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {user.username}
                        {isOnline(user.last_active_time) && (
                          <span title="Online Now" style={{ width: '8px', height: '8px', backgroundColor: '#10b981', borderRadius: '50%', display: 'inline-block', boxShadow: '0 0 5px #10b981' }}></span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                        Seen: {formatLastSeen(user.last_active_time)}
                      </div>
                    </td>
                    <td data-label="Password">
                      <div className="password-cell">
                        {user.password}
                        <button 
                          className="copy-btn" 
                          onClick={() => handleCopy(user.password, `pass_${user.id}`)}
                          title="Copy Password"
                        >
                          {copiedId === `pass_${user.id}` ? <Check size={16} color="#4ade80" /> : <Copy size={16} />}
                        </button>
                      </div>
                    </td>
                    <td data-label="VPN Link">
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => handleCopy(`hysteria2://${user.username}:${user.password}@${serverDomain}:443/?sni=${serverDomain}&mport=20000-50000&obfs=salamander&obfs-password=ThantAndZinObfsPassword123#${user.username}`, `link_${user.id}`)}
                      >
                        {copiedId === `link_${user.id}` ? <Check size={14} /> : <Copy size={14} />} Copy Link
                      </button>
                    </td>
                    <td data-label="Usage">
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                        {formatBytes(user.data_used_bytes)} / {user.data_limit_gb ? `${user.data_limit_gb} GB` : '∞'}
                      </div>
                    </td>
                    <td data-label="Status">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className={`status-badge ${user.status === 'active' ? 'status-active' : user.status === 'expired' ? 'status-expired' : 'status-suspended'}`}>
                          {user.status ? user.status.toUpperCase() : 'ACTIVE'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                          {user.expiry_date ? new Date(user.expiry_date).toLocaleDateString() : 'No Expiry'}
                        </span>
                      </div>
                    </td>
                    <td data-label="Action">
                      <div className="action-buttons">
                        <button 
                          className="btn-icon" 
                          style={{ color: user.status === 'suspended' ? '#10b981' : '#f59e0b' }}
                          onClick={() => handleToggleStatus(user.id, user.status)}
                          title={user.status === 'suspended' ? 'Resume User' : 'Suspend User'}
                        >
                          {user.status === 'suspended' ? <Play size={18} /> : <Pause size={18} />}
                        </button>
                        <button 
                          className="btn-icon" 
                          style={{ color: '#3b82f6' }}
                          onClick={() => openEditModal(user)}
                          title="Edit User"
                        >
                          <Edit size={18} />
                        </button>
                        <button 
                          className="btn-icon" 
                          style={{ color: '#ef4444' }}
                          onClick={() => handleDeleteUser(user.id)}
                          title="Delete User"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;
