const express = require('express');
const router = express.Router();
const { authUser, logoutUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', authUser);
router.post('/logout', protect, logoutUser);

module.exports = router;
