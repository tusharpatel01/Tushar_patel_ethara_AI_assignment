const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');

// Helper: check project access
const checkProjectAccess = async (projectId, userId, userRole) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found', status: 404 };

  const isMember = project.members.some((m) => m.toString() === userId.toString());
  const isOwner = project.owner.toString() === userId.toString();
  if (!isMember && !isOwner && userRole !== 'admin') {
    return { error: 'Access denied to this project', status: 403 };
  }
  return { project };
};

// @route   GET /api/tasks
// @desc    Get tasks (with filters: project, assignee, status, priority, overdue)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const { project, assignee, status, priority, overdue, my } = req.query;

    let query = {};

    // If not admin, only show tasks from accessible projects
    if (req.user.role !== 'admin') {
      const accessibleProjects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }],
      }).select('_id');
      query.project = { $in: accessibleProjects.map((p) => p._id) };
    }

    if (project) query.project = project;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (assignee) query.assignee = assignee;
    if (my === 'true') query.assignee = req.user._id;
    if (overdue === 'true') {
      query.dueDate = { $lt: new Date() };
      query.status = { $ne: 'done' };
    }

    const tasks = await Task.find(query)
      .populate('assignee', 'name email role')
      .populate('createdBy', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/tasks/dashboard
// @desc    Get dashboard stats for the logged-in user
// @access  Private
router.get('/dashboard', protect, async (req, res) => {
  try {
    let projectQuery =
      req.user.role === 'admin'
        ? {}
        : { $or: [{ owner: req.user._id }, { members: req.user._id }] };

    const accessibleProjects = await Project.find(projectQuery).select('_id');
    const projectIds = accessibleProjects.map((p) => p._id);

    const [total, todo, inProgress, done, overdue, myTasks] = await Promise.all([
      Task.countDocuments({ project: { $in: projectIds } }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'todo' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'in-progress' }),
      Task.countDocuments({ project: { $in: projectIds }, status: 'done' }),
      Task.countDocuments({
        project: { $in: projectIds },
        status: { $ne: 'done' },
        dueDate: { $lt: new Date() },
      }),
      Task.countDocuments({ assignee: req.user._id }),
    ]);

    const recentTasks = await Task.find({ project: { $in: projectIds } })
      .populate('assignee', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      stats: { total, todo, inProgress, done, overdue, myTasks },
      recentTasks,
      totalProjects: projectIds.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/tasks
// @desc    Create a new task
// @access  Private (project members)
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, project, assignee, status, priority, dueDate, tags } =
      req.body;

    if (!title || !project) {
      return res.status(400).json({ message: 'Title and project are required' });
    }

    const access = await checkProjectAccess(project, req.user._id, req.user.role);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const task = await Task.create({
      title,
      description,
      project,
      assignee: assignee || null,
      createdBy: req.user._id,
      status: status || 'todo',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      tags: tags || [],
    });

    const populated = await Task.findById(task._id)
      .populate('assignee', 'name email role')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get a single task
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email role')
      .populate('createdBy', 'name email')
      .populate('project', 'name description');

    if (!task) return res.status(404).json({ message: 'Task not found' });

    const access = await checkProjectAccess(
      task.project._id,
      req.user._id,
      req.user.role
    );
    if (access.error) return res.status(access.status).json({ message: access.error });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update a task
// @access  Private (project members, creator, or admin)
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const access = await checkProjectAccess(task.project, req.user._id, req.user.role);
    if (access.error) return res.status(access.status).json({ message: access.error });

    const { title, description, assignee, status, priority, dueDate, tags } = req.body;

    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (assignee !== undefined) task.assignee = assignee;
    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (tags !== undefined) task.tags = tags;

    await task.save();

    const updated = await Task.findById(task._id)
      .populate('assignee', 'name email role')
      .populate('createdBy', 'name email')
      .populate('project', 'name');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete a task
// @access  Private (creator or admin or project owner)
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = await Project.findById(task.project);
    const isCreator = task.createdBy.toString() === req.user._id.toString();
    const isProjectOwner = project && project.owner.toString() === req.user._id.toString();

    if (!isCreator && !isProjectOwner && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
