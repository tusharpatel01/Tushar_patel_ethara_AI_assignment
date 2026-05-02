import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getUsers, updateUserRole } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Users = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      toast.success('Role updated successfully');
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const admins = filtered.filter(u => u.role === 'admin');
  const members = filtered.filter(u => u.role === 'member');

  return (
    <Layout
      title="Manage Users"
      subtitle={`${users.length} registered user${users.length !== 1 ? 's' : ''}`}
    >
      <div className="filters-bar" style={{ marginBottom: 20 }}>
        <div className="search-input-wrap" style={{ maxWidth: 400 }}>
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="stat-card" style={{ padding: '10px 16px' }}>
            <span style={{ fontSize: 18 }}>👑</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{admins.length}</div>
              <div style={{ fontSize: 11, color: 'var(--gray)' }}>Admins</div>
            </div>
          </div>
          <div className="stat-card" style={{ padding: '10px 16px' }}>
            <span style={{ fontSize: 18 }}>👤</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{members.length}</div>
              <div style={{ fontSize: 11, color: 'var(--gray)' }}>Members</div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loader-container"><div className="spinner" /></div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--gray)', padding: 32 }}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map(u => (
                    <tr key={u._id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="user-avatar" style={{ width: 34, height: 34, fontSize: 12, flexShrink: 0 }}>
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14 }}>
                              {u.name}
                              {u._id === currentUser?._id && (
                                <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--primary)', fontWeight: 700 }}>
                                  (You)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--gray)' }}>{u.email}</td>
                      <td>
                        <span className={`badge badge-${u.role}`}>
                          {u.role === 'admin' ? '👑' : '👤'} {u.role}
                        </span>
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {format(new Date(u.createdAt), 'MMM d, yyyy')}
                      </td>
                      <td>
                        {u._id !== currentUser?._id ? (
                          <select
                            value={u.role}
                            onChange={e => handleRoleChange(u._id, e.target.value)}
                            className="filter-select"
                            style={{ fontSize: 12 }}
                          >
                            <option value="member">Member</option>
                            <option value="admin">Admin</option>
                          </select>
                        ) : (
                          <span style={{ color: 'var(--gray)', fontSize: 12 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Users;
