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
  getMonthlyAttendance,
  getAllMonthlyAttendance,
  pauseTracking,
  resumeTracking,
} = require('../controllers/attendanceController');

router.get('/today', protect, getTodayAttendance);
router.post('/checkin', protect, checkIn);
router.post('/lunch/start', protect, startLunch);
router.post('/lunch/end', protect, endLunch);
router.post('/checkout', protect, checkOut);
router.post('/pause', protect, pauseTracking);
router.post('/resume', protect, resumeTracking);
router.get('/admin', protect, admin, getAdminDashboard);
router.get('/monthly-all', protect, admin, getAllMonthlyAttendance);
router.get('/monthly/:employeeId', protect, admin, getMonthlyAttendance);

module.exports = router;
