const express = require("express");
const rateLimit = require("express-rate-limit");
const { authenticate } = require("../middleware/authenticate");
const { requirePermission } = require("../middleware/authorize");
const { validate, loginSchema, forgotSchema, resetSchema, changePasswordSchema, userCreateSchema, userUpdateSchema, idParam, categorySchema, folderSchema } = require("../validators/schemas");
const { upload } = require("../middleware/upload");
const auth = require("../controllers/authController");
const users = require("../controllers/userController");
const admins = require("../controllers/adminController");
const resources = require("../controllers/resourceController");

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again later." },
});

function authRoutes() {
  const r = express.Router();
  r.post("/login", authLimiter, validate(loginSchema), auth.login);
  r.post("/forgot-password", authLimiter, validate(forgotSchema), auth.forgotPassword);
  r.post("/reset-password", authLimiter, validate(resetSchema), auth.resetPassword);
  r.post("/logout", authenticate, auth.logout);
  r.get("/me", authenticate, auth.me);
  r.post("/change-password", authenticate, validate(changePasswordSchema), auth.changePassword);
  return r;
}

function userRoutes() {
  const r = express.Router();
  r.use(authenticate);
  r.get("/", requirePermission("user.view"), users.list);
  r.post("/", requirePermission("user.create"), validate(userCreateSchema), users.create);
  r.get("/:id", requirePermission("user.view"), validate(idParam), users.get);
  r.put("/:id", requirePermission("user.update"), validate(userUpdateSchema), users.update);
  r.delete("/:id", requirePermission("user.delete"), validate(idParam), users.remove);
  r.post("/:id/activate", requirePermission("user.activate"), validate(idParam), users.activate);
  r.post("/:id/deactivate", requirePermission("user.deactivate"), validate(idParam), users.deactivate);
  r.post("/:id/reset-password", requirePermission("user.reset_password"), validate(idParam), users.resetPassword);
  r.get("/:id/documents", requirePermission("user.view"), validate(idParam), users.documents);
  return r;
}

function adminRoutes() {
  const r = express.Router();
  r.use(authenticate);
  r.get("/", requirePermission("admin.view"), admins.list);
  r.post("/", requirePermission("admin.create"), validate(userCreateSchema), admins.create);
  r.get("/:id", requirePermission("admin.view"), validate(idParam), admins.get);
  r.put("/:id", requirePermission("admin.update"), validate(userUpdateSchema), admins.update);
  r.delete("/:id", requirePermission("admin.delete"), validate(idParam), admins.remove);
  r.post("/:id/activate", requirePermission("admin.activate"), validate(idParam), admins.activate);
  r.post("/:id/deactivate", requirePermission("admin.deactivate"), validate(idParam), admins.deactivate);
  r.post("/:id/reset-password", requirePermission("admin.update"), validate(idParam), admins.resetPassword);
  return r;
}

function categoryRoutes() {
  const r = express.Router();
  r.use(authenticate);
  r.get("/", requirePermission("category.view"), resources.listCategories);
  r.post("/", requirePermission("category.create"), validate(categorySchema), resources.createCategory);
  r.put("/:id", requirePermission("category.update"), validate(idParam), resources.updateCategory);
  r.delete("/:id", requirePermission("category.delete"), validate(idParam), resources.deleteCategory);
  return r;
}

function folderRoutes() {
  const r = express.Router();
  r.use(authenticate);
  r.get("/", requirePermission("folder.view"), resources.listFolders);
  r.get("/tree", requirePermission("folder.view"), resources.folderTree);
  r.get("/:id", requirePermission("folder.view"), validate(idParam), resources.getFolder);
  r.post("/", requirePermission("folder.create"), validate(folderSchema), resources.createFolder);
  r.put("/:id", requirePermission("folder.update"), validate(idParam), resources.updateFolder);
  r.delete("/:id", requirePermission("folder.delete"), validate(idParam), resources.deleteFolder);
  return r;
}

function documentRoutes() {
  const r = express.Router();
  r.use(authenticate);
  r.get("/", requirePermission("document.view"), resources.listDocuments);
  r.get("/mine", requirePermission("document.view"), resources.myDocuments);
  r.get("/:id", requirePermission("document.view"), validate(idParam), resources.getDocument);
  r.post("/", requirePermission("document.create"), upload.single("file"), resources.createDocument);
  r.put("/:id", requirePermission("document.update"), validate(idParam), resources.updateDocument);
  r.delete("/:id", requirePermission("document.delete"), validate(idParam), resources.deleteDocument);
  r.get("/:id/download", requirePermission("document.download"), validate(idParam), resources.downloadDocument);
  return r;
}

function miscRoutes() {
  const r = express.Router();
  r.use(authenticate);
  r.get("/roles", requirePermission("role.view"), resources.listRoles);
  r.put("/roles/:id/permissions", requirePermission("role.update"), resources.updateRolePermissions);
  r.get("/permissions", requirePermission("role.view"), resources.listPermissions);
  r.get("/audit-logs", requirePermission("audit.view"), resources.auditLogs);
  r.get("/dashboard/admin", requirePermission("dashboard.admin"), resources.adminDashboard);
  r.get("/dashboard/me", resources.userDashboard);
  r.get("/profile", resources.getProfile);
  r.put("/profile", resources.updateProfile);
  r.post("/profile/photo", upload.single("file"), resources.updatePhoto);
  r.delete("/profile/photo", resources.removePhoto);
  r.get("/settings", resources.getSettings);
  r.put("/settings", requirePermission("settings.update"), resources.updateSettings);
  return r;
}

module.exports = {
  authRoutes,
  userRoutes,
  adminRoutes,
  categoryRoutes,
  folderRoutes,
  documentRoutes,
  miscRoutes,
};
