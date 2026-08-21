const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const { clientIp } = require("../services/auditService");
const categoryService = require("../services/categoryService");
const folderService = require("../services/folderService");
const documentService = require("../services/documentService");
const roleService = require("../services/roleService");
const dashboardService = require("../services/dashboardService");
const profileService = require("../services/profileService");
const settingsService = require("../services/settingsService");
const path = require("path");
const fs = require("fs");
const { LOCAL_DIR } = require("../services/storageService");
const ApiError = require("../utils/ApiError");

exports.listCategories = asyncHandler(async (req, res) => {
  const includeInactive = req.authUser.permissions.includes("category.update");
  success(res, await categoryService.listCategories({ includeInactive }));
});

exports.createCategory = asyncHandler(async (req, res) => {
  const item = await categoryService.createCategory({
    name: req.body.name,
    description: req.body.description,
    actor: req.user,
    ip: clientIp(req),
  });
  success(res, item, "Category created", 201);
});

exports.updateCategory = asyncHandler(async (req, res) => {
  const item = await categoryService.updateCategory({
    id: req.params.id,
    payload: req.body,
    actor: req.user,
    ip: clientIp(req),
  });
  success(res, item, "Category updated");
});

exports.deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory({ id: req.params.id, actor: req.user, ip: clientIp(req) });
  success(res, null, "Category deleted");
});

exports.listFolders = asyncHandler(async (req, res) => {
  success(res, await folderService.listFolders(req.query));
});

exports.folderTree = asyncHandler(async (req, res) => {
  success(res, await folderService.getFolderTree());
});

exports.getFolder = asyncHandler(async (req, res) => {
  success(res, await folderService.getFolder(req.params.id));
});

exports.createFolder = asyncHandler(async (req, res) => {
  const item = await folderService.createFolder({
    ...req.body,
    actor: req.user,
    ip: clientIp(req),
  });
  success(res, item, "Folder created", 201);
});

exports.updateFolder = asyncHandler(async (req, res) => {
  const item = await folderService.updateFolder({
    id: req.params.id,
    payload: req.body,
    actor: req.user,
    ip: clientIp(req),
  });
  success(res, item, "Folder updated");
});

exports.deleteFolder = asyncHandler(async (req, res) => {
  await folderService.deleteFolder({ id: req.params.id, actor: req.user, ip: clientIp(req) });
  success(res, null, "Folder deleted");
});

exports.listDocuments = asyncHandler(async (req, res) => {
  success(res, await documentService.listDocuments(req.query));
});

exports.myDocuments = asyncHandler(async (req, res) => {
  success(res, await documentService.listDocuments(req.query, { mine: true, userId: req.user.id }));
});

exports.getDocument = asyncHandler(async (req, res) => {
  success(res, await documentService.getDocument(req.params.id));
});

exports.createDocument = asyncHandler(async (req, res) => {
  const item = await documentService.createDocument({
    file: req.file,
    body: req.body,
    actor: req.user,
    ip: clientIp(req),
  });
  success(res, item, "Document uploaded", 201);
});

exports.updateDocument = asyncHandler(async (req, res) => {
  const item = await documentService.updateDocument({
    id: req.params.id,
    payload: req.body,
    actor: req.user,
    ip: clientIp(req),
  });
  success(res, item, "Document updated");
});

exports.deleteDocument = asyncHandler(async (req, res) => {
  await documentService.deleteDocument({ id: req.params.id, actor: req.user, ip: clientIp(req) });
  success(res, null, "Document deleted");
});

exports.downloadDocument = asyncHandler(async (req, res) => {
  const doc = await documentService.recordDownload({
    id: req.params.id,
    actor: req.user,
    ip: clientIp(req),
  });
  if (doc.storageProvider === "local") {
    const filePath = path.join(LOCAL_DIR, doc.storageKey);
    if (!fs.existsSync(filePath)) throw new ApiError(404, "File is no longer available");
    return res.download(filePath, doc.originalName);
  }
  return res.redirect(doc.storageUrl);
});

exports.listRoles = asyncHandler(async (req, res) => {
  success(res, await roleService.listRoles());
});

exports.listPermissions = asyncHandler(async (req, res) => {
  success(res, await roleService.listPermissions());
});

exports.updateRolePermissions = asyncHandler(async (req, res) => {
  const role = await roleService.updateRolePermissions({
    roleId: req.params.id,
    permissionIds: req.body.permissionIds,
    actor: req.user,
    ip: clientIp(req),
  });
  success(res, role, "Role permissions updated");
});

exports.adminDashboard = asyncHandler(async (req, res) => {
  success(res, await dashboardService.adminStats());
});

exports.userDashboard = asyncHandler(async (req, res) => {
  success(res, await dashboardService.userStats(req.user.id));
});

exports.auditLogs = asyncHandler(async (req, res) => {
  success(res, await dashboardService.listAuditLogs(req.query));
});

exports.getProfile = asyncHandler(async (req, res) => {
  success(res, req.authUser);
});

exports.updateProfile = asyncHandler(async (req, res) => {
  const user = await profileService.updateProfile({
    userId: req.user.id,
    payload: req.body,
    ip: clientIp(req),
  });
  success(res, user, "Profile updated");
});

exports.updatePhoto = asyncHandler(async (req, res) => {
  const user = await profileService.updatePhoto({
    userId: req.user.id,
    file: req.file,
    ip: clientIp(req),
  });
  success(res, user, "Profile photo updated");
});

exports.removePhoto = asyncHandler(async (req, res) => {
  const user = await profileService.removePhoto({ userId: req.user.id, ip: clientIp(req) });
  success(res, user, "Profile photo removed");
});

exports.getSettings = asyncHandler(async (req, res) => {
  success(res, await settingsService.getSettings());
});

exports.updateSettings = asyncHandler(async (req, res) => {
  success(res, await settingsService.updateSettings(req.body), "Settings updated");
});
