// 404 — route not found (place before errorHandler in server.js)
const notFound = (req, res, next) => {
  const err = new Error(`Route not found: ${req.originalUrl}`);
  err.status = 404;
  next(err);
};

// Global error handler — catches anything passed to next(err)
const errorHandler = (err, req, res, next) => {
  const statusCode = err.status || 500;

  // Mongoose validation error — give a readable message
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: messages,
    });
  }

  // Mongoose bad ObjectId (e.g. /api/stories/not-an-id)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `Invalid ID format: ${err.value}`,
    });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal server error",
    // Only show stack trace in development
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = { notFound, errorHandler };