const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password').lean();
      if (!req.user) {
        return res.status(401).json({ message: 'User not found or deleted. Please login again.' });
      }
      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'Admin') {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as an admin' });
  }
};

const stockAccess = (req, res, next) => {
  if (
    req.user &&
    (req.user.role === 'Admin' ||
      (Array.isArray(req.user.accessiblePages) &&
        (req.user.accessiblePages.includes('Stock Management') ||
          req.user.accessiblePages.includes('Manage Stock'))))
  ) {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized for stock management' });
  }
};

module.exports = { protect, admin, stockAccess };
