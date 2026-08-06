const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  getTodayAttendance,
  checkIn,
  startLunch,
  endLunch,
  checkOut,
  getAdminDashboard,
} = require('../controllers/attendanceController');

router.get('/today', protect, getTodayAttendance);
router.post('/checkin', protect, checkIn);
router.post('/lunch/start', protect, startLunch);
router.post('/lunch/end', protect, endLunch);
router.post('/checkout', protect, checkOut);
router.get('/admin', protect, admin, getAdminDashboard);

module.exports = router;
