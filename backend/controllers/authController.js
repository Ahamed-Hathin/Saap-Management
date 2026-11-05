const User = require('../models/User');
const jwt = require('jsonwebtoken');
const notifyAdmins = require('../utils/notifyAdmins');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const authUser = async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  if (user && (await user.matchPassword(password))) {
    // When staff/employee logs in, notify admins
    if (user.role === 'Employee') {
      await notifyAdmins({
        senderId: user._id,
        type: 'employee',
        title: 'Staff Logged In',
        message: `${user.name} logged into the system.`,
        link: '/admin/attendance',
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      username: user.username,
      role: user.role,
      accessiblePages: user.accessiblePages,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid username or password' });
  }
};

const logoutUser = async (req, res) => {
  try {
    if (req.user && req.user.role === 'Employee') {
      await notifyAdmins({
        senderId: req.user._id,
        type: 'employee',
        title: 'Staff Logged Out',
        message: `${req.user.name} logged out.`,
        link: '/admin/attendance',
      });
    }
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error logging out', error: error.message });
  }
};

module.exports = { authUser, logoutUser };
