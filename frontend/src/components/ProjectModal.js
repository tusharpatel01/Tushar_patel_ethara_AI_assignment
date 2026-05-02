import React, { useState, useEffect } from 'react';
import { createProject, updateProject, getUsers } from '../utils/api';
import toast from 'react-hot-toast';

const ProjectModal = ({ project, onClose, onSaved }) => {
  const isEdit = !!project;

  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
    deadline: project?.deadline ? project.deadline.slice(0, 10) : '',
    members: project?.members?.map(m => m._id || m) || [],
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUsers().then(r => setUsers(r.data)).catch(() => {});
  }, []);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const toggleMember = (userId) => {
    setForm(f => ({
      ...f,
      members: f.members.includes(userId)
        ? f.members.filter(m => m !== userId)
        : [...f.members, userId],
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Project name is required');

    setLoading(true);
    try {
      const payload = {
        ...form,
        deadline: form.deadline || null,
      };

      if (isEdit) {
        await updateProject(project._id, payload);
        toast.success('Project updated!');
      } else {
        await createProject(payload);
        toast.success('Project created!');
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h3>{isEdit ? '✏️ Edit Project' : '🚀 New Project'}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter project name"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className="form-control"
                placeholder="What is this project about?"
                rows={3}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="form-control">
                  <option value="active">Active</option>
                  <option value="on-hold">On Hold</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Team Members</label>
              <div style={{ maxHeight: 180, overflowY: 'auto', border: '1.5px solid var(--border)', borderRadius: 8, padding: 8 }}>
                {users.map(u => (
                  <label key={u._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={form.members.includes(u._id)}
                      onChange={() => toggleMember(u._id)}
                    />
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</span>
                    <span style={{ color: 'var(--gray)', fontSize: 12 }}>{u.email}</span>
                    <span className={`badge badge-${u.role}`} style={{ marginLeft: 'auto' }}>{u.role}</span>
                  </label>
                ))}
                {users.length === 0 && <p style={{ color: 'var(--gray)', fontSize: 13, padding: 8 }}>No users found</p>}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;
