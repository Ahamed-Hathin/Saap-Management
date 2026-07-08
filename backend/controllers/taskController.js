const Task = require('../models/Task');

// @desc    Get all tasks for Admin or specific tasks for Employee
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    let tasks;
    if (req.user.role === 'Admin') {
      // Admin sees all tasks
      tasks = await Task.find().populate('assignedTo', 'name email').populate('assignedBy', 'name').sort({ createdAt: -1 });
    } else {
      // Employee sees only their tasks
      tasks = await Task.find({ assignedTo: req.user._id }).populate('assignedBy', 'name').sort({ createdAt: -1 });
    }
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error: error.message });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (Admin only)
const createTask = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to create tasks' });
    }

    const { title, description, assignedTo, dueDate } = req.body;
    
    if (!title || !assignedTo) {
      return res.status(400).json({ message: 'Title and Assigned To are required' });
    }

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user._id,
      dueDate
    });

    const createdTask = await task.save();
    res.status(201).json(createdTask);
  } catch (error) {
    res.status(500).json({ message: 'Error creating task', error: error.message });
  }
};

// @desc    Update task status
// @route   PUT /api/tasks/:id/status
// @access  Private
const updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check authorization: must be admin or the assigned employee
    if (req.user.role !== 'Admin' && task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    task.status = req.body.status;
    const updatedTask = await task.save();

    res.json(updatedTask);
  } catch (error) {
    res.status(500).json({ message: 'Error updating task', error: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (Admin only)
const deleteTask = async (req, res) => {
  try {
    if (req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to delete tasks' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    await task.deleteOne();
    res.json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask
};
