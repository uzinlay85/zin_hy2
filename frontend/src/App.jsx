import { useState, useEffect } from 'react';
import { Trash2, Copy, Plus, Server, User, Key, Check } from 'lucide-react';

function App() {
  const [users, setUsers] = useState([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [newLink, setNewLink] = useState('');
  const [dataLimit, setDataLimit] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const serverDomain = 'delux.truehand.top';

  useEffect(() => {
    fetchUsers();
    const interval = setInterval(fetchUsers, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
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
    if (!username || !password) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password,
          data_limit_gb: dataLimit ? parseInt(dataLimit) : null,
          expiry_days: expiryDays ? parseInt(expiryDays) : null
        })
      });
      if (res.ok) {
        const link = `hysteria2://${username}:${password}@${serverDomain}:443/?sni=${serverDomain}&mport=20000-50000#${username}`;
        setNewLink(link);
        setUsername('');
        setPassword('');
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
        method: 'DELETE'
      });
      if (res.ok) {
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to delete user', err);
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

  return (
    <div className="container">
      <div className="header">
        <h1>Hysteria2 Portal</h1>
        <p>Manage your VPN access keys seamlessly</p>
      </div>

      <div className="glass-panel">
        <h2><Plus size={18} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} /> Create New Key</h2>
        <form onSubmit={handleAddUser} className="form-group">
          <input
            type="text"
            className="input-field"
            placeholder="Username (e.g. ko_aung)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Password (e.g. Aung2026)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
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
            Add Key
          </button>
        </form>

        {newLink && (
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
        <div className="table-container">
          <table>
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
                    <td>{user.username}</td>
                    <td>
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
                    <td>
                      <button 
                        className="btn btn-primary" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                        onClick={() => handleCopy(`hysteria2://${user.username}:${user.password}@${serverDomain}:443/?sni=${serverDomain}&mport=20000-50000#${user.username}`, `link_${user.id}`)}
                      >
                        {copiedId === `link_${user.id}` ? <Check size={14} /> : <Copy size={14} />} Copy Link
                      </button>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                        {formatBytes(user.data_used_bytes)} / {user.data_limit_gb ? `${user.data_limit_gb} GB` : '∞'}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontSize: '0.75rem', 
                          fontWeight: 'bold',
                          color: '#fff',
                          textAlign: 'center',
                          backgroundColor: user.status === 'active' ? '#10b981' : user.status === 'expired' ? '#ef4444' : '#f59e0b'
                        }}>
                          {user.status ? user.status.toUpperCase() : 'ACTIVE'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', textAlign: 'center' }}>
                          {user.expiry_date ? new Date(user.expiry_date).toLocaleDateString() : 'No Expiry'}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button 
                        className="btn btn-danger" 
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 size={16} />
                      </button>
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
