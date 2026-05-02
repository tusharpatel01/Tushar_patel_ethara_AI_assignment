import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { getTasks, getProjects, deleteTask } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '', priority: '', project: '', my: false, overdue: false,
  });
  const [search, setSearch] = useState('');

  const fetchTasks = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.project) params.project = filters.project;
      if (filters.my) params.my = 'true';
      if (filters.overdue) params.overdue = 'true';

      const res = await getTasks(params);
      setTasks(res.data);
    } catch {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getProjects().then(r => setProjects(r.data)).catch(() => {});
  }, []);

  useEffect(() => { fetchTasks(); }, [filters]);

  const handleDeleteTask = async (e, taskId) => {
    e.stopPropagation();
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      toast.success('Task deleted');
      fetchTasks();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const setFilter = (key, value) => setFilters(f => ({ ...f, [key]: value }));

  const filteredTasks = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout
      title="All Tasks"
      subtitle={`${filteredTasks.length} task${filteredTasks.length !== 1 ? 's' : ''}`}
      actions={
        <button className="btn btn-primary" onClick={() => { setSelectedTask(null); setShowModal(true); }}>
          + New Task
        </button>
      }
    >
      <div className="filters-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select className="filter-select" value={filters.status} onChange={e => setFilter('status', e.target.value)}>
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>

        <select className="filter-select" value={filters.priority} onChange={e => setFilter('priority', e.target.value)}>
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select className="filter-select" value={filters.project} onChange={e => setFilter('project', e.target.value)}>
          <option value="">All Projects</option>
          {projects.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={filters.my} onChange={e => setFilter('my', e.target.checked)} />
          My Tasks
        </label>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer' }}>
          <input type="checkbox" checked={filters.overdue} onChange={e => setFilter('overdue', e.target.checked)} />
          Overdue
        </label>

        {(filters.status || filters.priority || filters.project || filters.my || filters.overdue) && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setFilters({ status: '', priority: '', project: '', my: false, overdue: false })}
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading ? (
        <div className="loader-container"><div className="spinner" /></div>
      ) : filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <h3>No tasks found</h3>
          <p>Try changing your filters or create a new task</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowModal(true)}>
            Create Task
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
          {filteredTasks.map(task => (
            <div key={task._id} style={{ position: 'relative' }}>
              <TaskCard
                task={task}
                onClick={() => { setSelectedTask(task); setShowModal(true); }}
              />
              <button
                className="btn btn-danger btn-sm"
                style={{ position: 'absolute', top: 10, right: 10, opacity: 0.7 }}
                onClick={e => handleDeleteTask(e, task._id)}
                title="Delete"
              >🗑️</button>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <TaskModal
          task={selectedTask}
          onClose={() => { setShowModal(false); setSelectedTask(null); }}
          onSaved={fetchTasks}
        />
      )}
    </Layout>
  );
};

export default Tasks;
