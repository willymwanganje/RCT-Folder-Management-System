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
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(
  cors({
    origin: env.frontendUrl.split(",").map((v) => v.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    success: true,
    message: "RCT Folder Management System API is running",
  });
});

app.use("/api/auth", authRoutes());
app.use("/api/users", userRoutes());
app.use("/api/admins", adminRoutes());
app.use("/api/categories", categoryRoutes());
app.use("/api/folders", folderRoutes());
app.use("/api/documents", documentRoutes());
app.use("/api", miscRoutes());

app.use(notFound);
app.use(errorHandler);

module.exports = app;
