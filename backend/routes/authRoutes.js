const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Apply tight security throttling rules to registration and login vectors
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Session state validation checkpoint
router.get('/me', protect, getMe);

module.exports = router;