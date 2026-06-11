const rateLimit = require('express-rate-limit');

// General API protection rule
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000, // Fallback to 15 mins
  max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100, // Fallback to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    error: 'Too many requests originating from this IP. Please try again after 15 minutes.'
  }
});

// Stricter rate limiting for authentication endpoints to prevent brute-force vectors
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // Tight restriction: max 15 login/register attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many authentication attempts. Please step away and retry in 15 minutes.'
  }
});

module.exports = {
  apiLimiter,
  authLimiter
};