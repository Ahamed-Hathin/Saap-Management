const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  uploadDesignImage,
  getDashboardStats,
  deleteOrder,
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/').post(protect, createOrder).get(protect, getOrders);
router.route('/dashboard-stats').get(protect, getDashboardStats);
router.route('/:id').get(protect, getOrderById).put(protect, updateOrderStatus).delete(protect, admin, deleteOrder);
router.route('/:id/upload').post(protect, upload.single('image'), uploadDesignImage);

module.exports = router;
