const ApiError = require("../utils/ApiError");

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // Log every error with useful request information
  console.error("========== API ERROR ==========");
  console.error("Method:", req.method);
  console.error("URL:", req.originalUrl);
  console.error("Status:", err.statusCode || err.status || 500);
  console.error("Name:", err.name);
  console.error("Code:", err.code);
  console.error("Message:", err.message);
  console.error("Stack:", err.stack);

  if (err.cause) {
    console.error("Cause:", err.cause);
  }

  console.error("===============================");

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
      message:
        "Related record not found or cannot be modified because of existing references",
    });
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File is too large",
    });
  }

  const status = err.statusCode || err.status || 500;

  // IMPORTANT:
  // Do not hide the real error while we are debugging.
  const message =
    err.message || "An unexpected error occurred";

  return res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== "production"
      ? {
          error: err.name,
          stack: err.stack,
        }
      : {}),
  });
}

function notFound(req, res) {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
}

module.exports = {
  errorHandler,
  notFound,
  ApiError,
};