const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  updateTaskStatus,
  deleteTask
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getTasks)
  .post(protect, createTask);

router.route('/:id')
  .delete(protect, deleteTask);

router.route('/:id/status')
  .put(protect, updateTaskStatus);

module.exports = router;
