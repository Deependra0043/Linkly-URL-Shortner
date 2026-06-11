// Centralized error handling hub. Prevents raw stack traces from leaking to clients.
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log everything for internal debugging
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // Handle Mongoose malformed ObjectId (e.g., /api/urls/invalid-id)
  if (err.name === 'CastError') {
    const message = `Resource not found with id of ${err.value}`;
    error = { message, statusCode: 404 };
  }

  // Handle MongoDB duplicate key errors (e.g., trying to use an existing custom shortCode)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `That ${field} is already taken. Please choose another one.`;
    error = { message, statusCode: 400 };
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // Fallback to standard 500 internal server error
  const statusCode = error.statusCode || err.statusCode || 500;
  const clientMessage = error.message || 'An unexpected server error occurred';

  res.status(statusCode).json({
    success: false,
    error: clientMessage,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Catch-all utility for unhandled 404 endpoints
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found - ${req.originalUrl}`
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};