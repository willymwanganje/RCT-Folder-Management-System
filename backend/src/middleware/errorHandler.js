const ApiError = require("../utils/ApiError");

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err.name === "ZodError") {
    return res.status(400).json({
      success: false,
      message: err.issues?.[0]?.message || "Validation failed",
      errors: err.issues,
    });
  }

  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with that value already exists",
    });
  }

  if (err.code === "P2003") {
    return res.status(400).json({
      success: false,
      message: "Related record not found or cannot be modified because of existing references",
    });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ success: false, message: "File is too large" });
  }

  const status = err.statusCode || 500;
  const message =
    status >= 500 && process.env.NODE_ENV === "production"
      ? "An unexpected error occurred"
      : err.message || "An unexpected error occurred";

  if (status >= 500) {
    console.error(err);
  }

  return res.status(status).json({
    success: false,
    message,
  });
}

function notFound(req, res) {
  res.status(404).json({ success: false, message: "Route not found" });
}

module.exports = { errorHandler, notFound, ApiError };
