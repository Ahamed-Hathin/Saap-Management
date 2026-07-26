const express = require('express');
const router = express.Router();
const {
  getStacks,
  createStack,
  updateStack,
  deleteStack,
  uploadStackImage,
} = require('../controllers/stackController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(protect, getStacks)
  .post(protect, admin, createStack);

router.route('/:id')
  .put(protect, admin, updateStack)
  .delete(protect, admin, deleteStack);

router.route('/:id/upload')
  .post(protect, admin, upload.single('image'), uploadStackImage);

module.exports = router;
