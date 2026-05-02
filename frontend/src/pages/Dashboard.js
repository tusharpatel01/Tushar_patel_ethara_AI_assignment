import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import { getDashboard } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const StatCard = ({ icon, label, value, color }) => (
  <div className="stat-card">
    <div className="stat-icon" style={{ background: color + '20' }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
    </div>
    <div className="stat-info">
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  const fetchDashboard = async () => {
    try {
      const res = await getDashboard();
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) return (
    <Layout title="Dashboard">
      <div className="loader-container"><div className="spinner" /></div>
    </Layout>
  );

  const { stats = {}, recentTasks = [], totalProjects = 0 } = data || {};

  return (
    <Layout
      title="Dashboard"
      subtitle={`${greeting()}, ${user?.name?.split(' ')[0]}! 👋`}
      actions={
        <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}>
          + New Task
        </button>
      }
    >
      {/* Stats */}
      <div className="stats-grid">
        <StatCard icon="📁" label="Total Projects" value={totalProjects} color="#6366f1" />
        <StatCard icon="📋" label="Total Tasks" value={stats.total || 0} color="#0ea5e9" />
        <StatCard icon="🔄" label="In Progress" value={stats.inProgress || 0} color="#f59e0b" />
        <StatCard icon="✅" label="Completed" value={stats.done || 0} color="#10b981" />
        <StatCard icon="⚠️" label="Overdue" value={stats.overdue || 0} color="#ef4444" />
        <StatCard icon="👤" label="Assigned to Me" value={stats.myTasks || 0} color="#8b5cf6" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Tasks */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🕐 Recent Tasks</span>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/tasks')}>
              View All
            </button>
          </div>
          {recentTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <h3>No tasks yet</h3>
              <p>Create your first task to get started</p>
            </div>
          ) : (
            recentTasks.map(task => (
              <TaskCard
                key={task._id}
                task={task}
                onClick={() => { setSelectedTask(task); setShowTaskModal(true); }}
              />
            ))
          )}
        </div>

        {/* Quick Status breakdown */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">📊 Task Breakdown</span>
          </div>

          {[
            { label: 'Todo', value: stats.todo || 0, total: stats.total || 1, color: '#64748b', emoji: '📝' },
            { label: 'In Progress', value: stats.inProgress || 0, total: stats.total || 1, color: '#f59e0b', emoji: '🔄' },
            { label: 'Done', value: stats.done || 0, total: stats.total || 1, color: '#10b981', emoji: '✅' },
            { label: 'Overdue', value: stats.overdue || 0, total: stats.total || 1, color: '#ef4444', emoji: '⚠️' },
          ].map(item => (
            <div key={item.label} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span>{item.emoji} {item.label}</span>
                <span style={{ fontWeight: 700, color: item.color }}>{item.value}</span>
              </div>
              <div className="progress-bar-bg">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.round((item.value / item.total) * 100) || 0}%`,
                    background: item.color,
                  }}
                />
              </div>
            </div>
          ))}

          <div className="divider" />
          <div style={{ fontSize: 13, color: 'var(--gray)', textAlign: 'center' }}>
            Today: {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
      </div>

      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          onClose={() => { setShowTaskModal(false); setSelectedTask(null); }}
          onSaved={fetchDashboard}
        />
      )}
    </Layout>
  );
};

export default Dashboard;
