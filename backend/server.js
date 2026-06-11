require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const urlRoutes = require('./routes/urlRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const { redirectUrl } = require('./controllers/urlController');
const { errorHandler, notFoundHandler } = require('./middleware/errorMiddleware');

// Initialize database connection
connectDB();

const app = express();

// ------------------------------------------------------------------------------
// HTTP Security Headers & Middleware
// ------------------------------------------------------------------------------
app.use(helmet());

// Dynamic CORS configuration mapping to frontend deployments
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server or curl requests without an origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Request body payload parsing limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize inputs to prevent MongoDB Query Injection
app.use(mongoSanitize());

// Sanitize data inputs against Cross-Site Scripting (XSS) vectors
app.use(xss());

// ------------------------------------------------------------------------------
// Core API Route Registration
// ------------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/urls', urlRoutes);
app.use('/api/analytics', analyticsRoutes);

/**
 * High-performance base route interceptor. 
 * Catches 'domain.com/:shortCode' requests directly at root level for immediate 
 * analytics ingestion and 302 client redirections.
 */
app.get('/:shortCode', redirectUrl);

// Health check endpoint for monitoring tools (Render, AWS Route53, UptimeRobot)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// ------------------------------------------------------------------------------
// Catch-All Error Handling Layers
// ------------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

// ------------------------------------------------------------------------------
// Server Bootstrap Sequence
// ------------------------------------------------------------------------------
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`📡 Server up and running in [${process.env.NODE_ENV || 'production'}] mode on port ${PORT}`);
});

// Graceful shutdown handling for production node processes (prevent orphan database links)
process.on('unhandledRejection', (err) => {
  console.error(`[CRITICAL SYSTEM REJECTION] Unhandled Promise Error: ${err.message}`);
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down application gracefully...');
  server.close(() => {
    console.log('💤 Process terminated safely.');
  });
});