const express = require('express');
const router = express.Router();
const {
  getStacks,
  createStack,
  updateStack,
  deleteStack,
  uploadStackImage,
} = require('../controllers/stackController');
const { protect, stockAccess } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/')
  .get(protect, stockAccess, getStacks)
  .post(protect, stockAccess, createStack);

router.route('/:id')
  .put(protect, stockAccess, updateStack)
  .delete(protect, stockAccess, deleteStack);

router.route('/:id/upload')
  .post(protect, stockAccess, upload.single('image'), uploadStackImage);

module.exports = router;
