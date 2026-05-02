import React from 'react';
import { format, isPast } from 'date-fns';

const priorityColors = { low: '#16a34a', medium: '#d97706', high: '#dc2626' };

const TaskCard = ({ task, onClick }) => {
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'done';
  const initials = task.assignee?.name
    ? task.assignee.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : null;

  return (
    <div
      className={`task-card${isOverdue ? ' overdue' : ''}${task.status === 'done' ? ' done' : ''}`}
      onClick={() => onClick && onClick(task)}
    >
      <div className="task-card-header">
        <span className={`task-title${task.status === 'done' ? ' done' : ''}`}>{task.title}</span>
        <span style={{
          width: 8, height: 8, borderRadius: '50%',
          background: priorityColors[task.priority] || '#94a3b8',
          flexShrink: 0, marginTop: 4,
        }} title={`Priority: ${task.priority}`} />
      </div>

      {task.description && (
        <p style={{ fontSize: 12, color: 'var(--gray)', marginBottom: 6,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {task.description}
        </p>
      )}

      {task.project?.name && (
        <div style={{ fontSize: 11, color: 'var(--primary)', fontWeight: 600, marginBottom: 6 }}>
          📁 {task.project.name}
        </div>
      )}

      <div className="task-meta">
        <span className={`badge badge-${task.priority}`}>{task.priority}</span>

        {task.assignee && (
          <span className="task-assignee">
            <span className="assignee-avatar">{initials}</span>
            {task.assignee.name.split(' ')[0]}
          </span>
        )}

        {task.dueDate && (
          <span className={`task-due${isOverdue ? ' overdue' : ''}`}>
            📅 {isOverdue ? '⚠️ ' : ''}{format(new Date(task.dueDate), 'MMM d')}
          </span>
        )}

        {task.tags?.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--gray)' }}>
            🏷️ {task.tags.slice(0, 2).join(', ')}
          </span>
        )}
      </div>
    </div>
  );
};

export default TaskCard;
