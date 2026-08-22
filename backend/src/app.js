const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const { env } = require("./config/env");
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

const defaultOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://rct-folder-management-system-cepf-ten.vercel.app",
];

const envOrigins = [env.frontendUrl, env.corsOrigins]
  .filter(Boolean)
  .flatMap((value) =>
    String(value)
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  );

const allowedOrigins = new Set([...defaultOrigins, ...envOrigins]);

function isAllowedOrigin(origin) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }
    // Vercel production + preview deployments for this project
    if (
      hostname.endsWith(".vercel.app") &&
      hostname.includes("rct-folder-management-system")
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

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
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }
      // Reject without throwing — a thrown error becomes a 500 and the
      // browser reports it as a network failure ("Unable to connect").
      return callback(null, false);
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