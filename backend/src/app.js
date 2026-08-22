const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { errorHandler, notFound } = require("./middleware/errorHandler");

const {
  authRoutes,
  userRoutes,
  adminRoutes,
  categoryRoutes,
  folderRoutes,
  documentRoutes,
  miscRoutes,
} = require("./routes");

const app = express();

app.set("trust proxy", 1);

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://rct-folder-management-system-cepf-ten.vercel.app",
];

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no Origin header
      // e.g. direct browser/API requests, Postman, server-to-server
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(`CORS blocked origin: ${origin}`)
      );
    },
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"))
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    success: true,
    message: "RCT Folder Management System API is running",
  });
});

// API routes
app.use("/api/auth", authRoutes());
app.use("/api/users", userRoutes());
app.use("/api/admins", adminRoutes());
app.use("/api/categories", categoryRoutes());
app.use("/api/folders", folderRoutes());
app.use("/api/documents", documentRoutes());
app.use("/api", miscRoutes());

// 404
app.use(notFound);

// Error handler
app.use(errorHandler);

module.exports = app;