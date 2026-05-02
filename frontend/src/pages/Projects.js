import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ProjectModal from '../components/ProjectModal';
import { getProjects, deleteProject } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Projects = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await getProjects();
      setProjects(res.data);
    } catch (e) {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this project and all its tasks?')) return;
    try {
      await deleteProject(id);
      toast.success('Project deleted');
      fetchProjects();
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <Layout
      title="Projects"
      subtitle={`${projects.length} project${projects.length !== 1 ? 's' : ''}`}
      actions={
        <button className="btn btn-primary" onClick={() => { setEditProject(null); setShowModal(true); }}>
          + New Project
        </button>
      }
    >
      <div className="filters-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <div className="loader-container"><div className="spinner" /></div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📁</div>
          <h3>No projects found</h3>
          <p>Create a new project to get started</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
            Create Project
          </button>
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map(project => {
            const progress = project.taskCounts?.total > 0
              ? Math.round((project.taskCounts.done / project.taskCounts.total) * 100)
              : 0;
            const isOwnerOrAdmin =
              user?.role === 'admin' || project.owner?._id === user?._id;

            return (
              <div
                key={project._id}
                className="project-card"
                onClick={() => navigate(`/projects/${project._id}`)}
              >
                <div className="project-card-header">
                  <div>
                    <div className="project-name">{project.name}</div>
                    <span className={`badge badge-${project.status}`} style={{ marginTop: 4 }}>
                      {project.status}
                    </span>
                  </div>
                  {isOwnerOrAdmin && (
                    <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                      <button
                        className="btn btn-icon btn-sm"
                        onClick={e => { e.stopPropagation(); setEditProject(project); setShowModal(true); }}
                        title="Edit"
                      >✏️</button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={e => handleDelete(e, project._id)}
                        title="Delete"
                      >🗑️</button>
                    </div>
                  )}
                </div>

                {project.description && (
                  <p className="project-desc">{project.description}</p>
                )}

                <div className="project-progress">
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="progress-text">
                    {project.taskCounts?.done || 0}/{project.taskCounts?.total || 0} tasks done
                    {project.taskCounts?.overdue > 0 && (
                      <span style={{ color: 'var(--danger)', marginLeft: 8 }}>
                        ⚠️ {project.taskCounts.overdue} overdue
                      </span>
                    )}
                  </div>
                </div>

                <div className="project-footer">
                  <div className="member-avatars">
                    {project.members?.slice(0, 5).map(m => (
                      <div key={m._id} className="member-avatar" title={m.name}>
                        {m.name?.slice(0, 2).toUpperCase()}
                      </div>
                    ))}
                    {project.members?.length > 5 && (
                      <div className="member-avatar" style={{ background: 'var(--gray)' }}>
                        +{project.members.length - 5}
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--gray)' }}>
                    {project.deadline
                      ? `📅 Due ${format(new Date(project.deadline), 'MMM d')}`
                      : `📅 ${format(new Date(project.createdAt), 'MMM d, yyyy')}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <ProjectModal
          project={editProject}
          onClose={() => { setShowModal(false); setEditProject(null); }}
          onSaved={fetchProjects}
        />
      )}
    </Layout>
  );
};

export default Projects;
