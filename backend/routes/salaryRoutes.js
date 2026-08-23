const express = require('express');
const router = express.Router();
const { getSalarySetting, updateSalarySetting, calculateSalary } = require('../controllers/salaryController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/settings/:employeeId').get(protect, admin, getSalarySetting);
router.route('/settings').post(protect, admin, updateSalarySetting);
router.route('/calculate/:employeeId/:month').get(protect, admin, calculateSalary);

module.exports = router;
