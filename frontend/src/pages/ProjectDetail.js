import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import ProjectModal from '../components/ProjectModal';
import { getProject, getTasks, deleteTask, updateTask } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const COLUMNS = [
  { key: 'todo', label: 'To Do', emoji: '📝', color: '#64748b' },
  { key: 'in-progress', label: 'In Progress', emoji: '🔄', color: '#f59e0b' },
  { key: 'done', label: 'Done', emoji: '✅', color: '#10b981' },
];

const ProjectDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [view, setView] = useState('kanban');

  const fetchData = async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        getProject(id),
        getTasks({ project: id }),
      ]);
      setProject(pRes.data);
      setTasks(tRes.data);
    } catch {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      toast.success('Task deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      await updateTask(task._id, { status: newStatus });
      toast.success('Status updated');
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const isOwnerOrAdmin =
    user?.role === 'admin' || project?.owner?._id === user?._id;

  const filteredTasks = tasks.filter(t =>
    !priorityFilter || t.priority === priorityFilter
  );

  const tasksByStatus = status => filteredTasks.filter(t => t.status === status);

  if (loading) return (
    <Layout title="Project Details">
      <div className="loader-container"><div className="spinner" /></div>
    </Layout>
  );

  if (!project) return null;

  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <Layout
      title={project.name}
      subtitle={project.description || 'No description'}
      actions={
        <div style={{ display: 'flex', gap: 8 }}>
          {isOwnerOrAdmin && (
            <button className="btn btn-secondary" onClick={() => setShowProjectModal(true)}>
              ✏️ Edit
            </button>
          )}
          <button className="btn btn-primary" onClick={() => { setSelectedTask(null); setShowTaskModal(true); }}>
            + Add Task
          </button>
        </div>
      }
    >
      {/* Project header card */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div>
            <span className={`badge badge-${project.status}`} style={{ fontSize: 12 }}>
              {project.status}
            </span>
          </div>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--gray)' }}>Owner: </span>
            <strong>{project.owner?.name}</strong>
          </div>
          <div style={{ fontSize: 13 }}>
            <span style={{ color: 'var(--gray)' }}>Members: </span>
            <strong>{project.members?.length || 0}</strong>
          </div>
          {project.deadline && (
            <div style={{ fontSize: 13 }}>
              <span style={{ color: 'var(--gray)' }}>Deadline: </span>
              <strong>{format(new Date(project.deadline), 'MMM d, yyyy')}</strong>
            </div>
          )}
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--gray)' }}>Progress</span>
              <strong>{progress}%</strong>
            </div>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        {/* Members row */}
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray)', marginBottom: 8 }}>TEAM</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {project.members?.map(m => (
              <div key={m._id} style={{ display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--light-gray)', padding: '4px 10px', borderRadius: 20 }}>
                <div className="assignee-avatar" style={{ width: 22, height: 22, fontSize: 9 }}>
                  {m.name?.slice(0, 2).toUpperCase()}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600 }}>{m.name}</span>
                <span className={`badge badge-${m.role}`}>{m.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters & view toggle */}
      <div className="filters-bar">
        <select className="filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
          <button
            className={`btn btn-sm ${view === 'kanban' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('kanban')}
          >🗂️ Kanban</button>
          <button
            className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setView('list')}
          >📋 List</button>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <div className="kanban-board">
          {COLUMNS.map(col => {
            const colTasks = tasksByStatus(col.key);
            return (
              <div key={col.key} className="kanban-col">
                <div className="kanban-col-header">
                  <span className="col-title" style={{ color: col.color }}>
                    {col.emoji} {col.label}
                  </span>
                  <span className="col-count">{colTasks.length}</span>
                </div>
                {colTasks.length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--gray)', fontSize: 13, padding: '20px 0' }}>
                    No tasks
                  </div>
                ) : (
                  colTasks.map(task => (
                    <div key={task._id} style={{ position: 'relative' }}>
                      <TaskCard
                        task={task}
                        onClick={() => { setSelectedTask(task); setShowTaskModal(true); }}
                      />
                      <div style={{ display: 'flex', gap: 4, marginTop: -6, marginBottom: 10 }}>
                        {COLUMNS.filter(c => c.key !== col.key).map(c => (
                          <button
                            key={c.key}
                            className="btn btn-secondary btn-sm"
                            style={{ flex: 1, fontSize: 10 }}
                            onClick={() => handleStatusChange(task, c.key)}
                          >→ {c.label}</button>
                        ))}
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ fontSize: 10 }}
                          onClick={() => handleDeleteTask(task._id)}
                        >🗑️</button>
                      </div>
                    </div>
                  ))
                )}
                <button
                  className="btn btn-secondary"
                  style={{ width: '100%', marginTop: 4, fontSize: 13 }}
                  onClick={() => { setSelectedTask(null); setShowTaskModal(true); }}
                >+ Add Task</button>
              </div>
            );
          })}
        </div>
      )}

      {/* List View */}
      {view === 'list' && (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', color: 'var(--gray)', padding: 32 }}>
                      No tasks found
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => (
                    <tr key={task._id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{task.title}</div>
                        {task.description && (
                          <div style={{ fontSize: 12, color: 'var(--gray)' }}>{task.description.slice(0, 60)}...</div>
                        )}
                      </td>
                      <td><span className={`badge badge-${task.status}`}>{task.status}</span></td>
                      <td><span className={`badge badge-${task.priority}`}>{task.priority}</span></td>
                      <td>{task.assignee?.name || <span style={{ color: 'var(--gray)' }}>Unassigned</span>}</td>
                      <td style={{ fontSize: 13 }}>
                        {task.dueDate ? format(new Date(task.dueDate), 'MMM d, yyyy') : '-'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => { setSelectedTask(task); setShowTaskModal(true); }}>✏️</button>
                          <button className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteTask(task._id)}>🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          projectId={id}
          onClose={() => { setShowTaskModal(false); setSelectedTask(null); }}
          onSaved={fetchData}
        />
      )}

      {showProjectModal && (
        <ProjectModal
          project={project}
          onClose={() => setShowProjectModal(false)}
          onSaved={fetchData}
        />
      )}
    </Layout>
  );
};

export default ProjectDetail;
