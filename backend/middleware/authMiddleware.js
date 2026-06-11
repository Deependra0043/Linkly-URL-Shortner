const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Pull token from Authorization header (Standard Bearer pattern)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied. No authorization token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Hydrate request with the user data, stripping the password hash out
    req.user = await User.findById(decoded.id).select('-password');
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'The user belonging to this token no longer exists.'
      });
    }

    next();
  } catch (error) {
    let message = 'Not authorized to access this resource';
    
    if (error.name === 'TokenExpiredError') {
      message = 'Your session has expired. Please log in again.';
    }

    return res.status(401).json({
      success: false,
      error: message
    });
  }
};

// Role-based authorization guard for administrative metrics
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. You do not have permission to view this resource.'
      });
    }
    next();
  };
};

module.exports = { protect, authorize };