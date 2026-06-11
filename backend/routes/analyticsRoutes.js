const express = require('express');
const { getUrlAnalytics, getAdminStats } = require('../controllers/analyticsController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

// Enforce authentication across all telemetry analysis endpoints
router.use(protect);
router.use(apiLimiter);

// Specific link performance tracker endpoint
router.get('/:urlId', getUrlAnalytics);

// Protected admin statistics rollup dashboard route
router.get('/admin/stats', authorize('admin'), getAdminStats);

module.exports = router;