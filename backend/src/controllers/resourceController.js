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

const {
  createSignedDownloadUrl,
} = require("../services/storageService");

const ApiError = require("../utils/ApiError");

// ============================================================
// CATEGORIES
// ============================================================

exports.listCategories = asyncHandler(async (req, res) => {
  const includeInactive =
    req.authUser?.permissions?.includes("category.update") || false;

  const categories = await categoryService.listCategories({
    includeInactive,
  });

  success(res, categories);
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
  await categoryService.deleteCategory({
    id: req.params.id,
    actor: req.user,
    ip: clientIp(req),
  });

  success(res, null, "Category deleted");
});

// ============================================================
// FOLDERS
// ============================================================

exports.listFolders = asyncHandler(async (req, res) => {
  const folders = await folderService.listFolders(req.query);

  success(res, folders);
});

exports.folderTree = asyncHandler(async (req, res) => {
  const tree = await folderService.getFolderTree();

  success(res, tree);
});

exports.getFolder = asyncHandler(async (req, res) => {
  const folder = await folderService.getFolder(req.params.id);

  success(res, folder);
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
  await folderService.deleteFolder({
    id: req.params.id,
    actor: req.user,
    ip: clientIp(req),
  });

  success(res, null, "Folder deleted");
});

// ============================================================
// DOCUMENTS
// ============================================================

exports.listDocuments = asyncHandler(async (req, res) => {
  const documents = await documentService.listDocuments(req.query);

  success(res, documents);
});

exports.myDocuments = asyncHandler(async (req, res) => {
  const documents = await documentService.listDocuments(req.query, {
    mine: true,
    userId: req.user.id,
  });

  success(res, documents);
});

exports.getDocument = asyncHandler(async (req, res) => {
  const document = await documentService.getDocument(req.params.id);

  success(res, document);
});

/**
 * Upload document
 *
 * Frontend -> Backend -> documentService -> storageService -> Supabase
 */
exports.createDocument = asyncHandler(async (req, res) => {
  console.log("==========================================");
  console.log("DOCUMENT UPLOAD REQUEST");
  console.log("User:", req.user?.id);
  console.log("File exists:", Boolean(req.file));

  if (req.file) {
    console.log("Original name:", req.file.originalname);
    console.log("MIME type:", req.file.mimetype);
    console.log("Size:", req.file.size, "bytes");
  }

  console.log("==========================================");

  if (!req.file) {
    throw new ApiError(
      400,
      "No file was uploaded. Please select a file and try again."
    );
  }

  const item = await documentService.createDocument({
    file: req.file,
    body: req.body,
    actor: req.user,
    ip: clientIp(req),
  });

  console.log("DOCUMENT UPLOAD SUCCESS");
  console.log("Document ID:", item?.id);

  success(res, item, "Document uploaded successfully", 201);
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
  await documentService.deleteDocument({
    id: req.params.id,
    actor: req.user,
    ip: clientIp(req),
  });

  success(res, null, "Document deleted");
});

/**
 * Download document from Supabase private bucket.
 *
 * Flow:
 *
 * Frontend
 *    ↓
 * Backend
 *    ↓
 * recordDownload()
 *    ↓
 * Supabase createSignedUrl()
 *    ↓
 * temporary signed URL
 *    ↓
 * redirect user to file
 */
exports.downloadDocument = asyncHandler(async (req, res) => {
  console.log("==========================================");
  console.log("DOCUMENT DOWNLOAD REQUEST");
  console.log("Document ID:", req.params.id);
  console.log("User:", req.user?.id);
  console.log("==========================================");

  const doc = await documentService.recordDownload({
    id: req.params.id,
    actor: req.user,
    ip: clientIp(req),
  });

  console.log("Document retrieved successfully");
  console.log("Storage provider:", doc?.storageProvider);
  console.log("Storage key:", doc?.storageKey);

  if (!doc) {
    throw new ApiError(
      404,
      "Document not found"
    );
  }

  if (doc.storageProvider !== "supabase") {
    console.error(
      "Invalid storage provider:",
      doc.storageProvider
    );

    throw new ApiError(
      400,
      `This document is not stored in Supabase. Current provider: ${doc.storageProvider}`
    );
  }

  if (!doc.storageKey) {
    console.error(
      "Document has no storage key:",
      doc.id
    );

    throw new ApiError(
      404,
      "Document storage file not found"
    );
  }

  console.log("Generating Supabase signed URL...");

  let signedUrl;

  try {
    signedUrl = await createSignedDownloadUrl(
      doc.storageKey,
      60 * 10
    );
  } catch (error) {
    console.error("==========================================");
    console.error("SUPABASE SIGNED URL GENERATION FAILED");
    console.error("Document ID:", doc.id);
    console.error("Storage key:", doc.storageKey);
    console.error("Error message:", error.message);
    console.error("Error name:", error.name);
    console.error("Stack:", error.stack);
    console.error("==========================================");

    throw new ApiError(
      500,
      `Unable to generate download URL: ${error.message}`
    );
  }

  if (!signedUrl) {
    console.error(
      "Supabase returned an empty signed URL"
    );

    throw new ApiError(
      404,
      "File is no longer available in Supabase storage"
    );
  }

  console.log("Signed URL generated successfully");
  console.log("Redirecting user to Supabase file...");

  return res.redirect(signedUrl);
});

// ============================================================
// ROLES & PERMISSIONS
// ============================================================

exports.listRoles = asyncHandler(async (req, res) => {
  const roles = await roleService.listRoles();

  success(res, roles);
});

exports.listPermissions = asyncHandler(async (req, res) => {
  const permissions = await roleService.listPermissions();

  success(res, permissions);
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

// ============================================================
// DASHBOARD
// ============================================================

exports.adminDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.adminStats();

  success(res, stats);
});

exports.userDashboard = asyncHandler(async (req, res) => {
  const stats = await dashboardService.userStats(
    req.user.id
  );

  success(res, stats);
});

exports.auditLogs = asyncHandler(async (req, res) => {
  const logs = await dashboardService.listAuditLogs(
    req.query
  );

  success(res, logs);
});

// ============================================================
// PROFILE
// ============================================================

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
  console.log("==========================================");
  console.log("PROFILE PHOTO UPDATE");
  console.log("User:", req.user?.id);
  console.log("File exists:", Boolean(req.file));

  if (req.file) {
    console.log("Original name:", req.file.originalname);
    console.log("MIME:", req.file.mimetype);
    console.log("Size:", req.file.size);
  }

  console.log("==========================================");

  if (!req.file) {
    throw new ApiError(
      400,
      "No profile photo was uploaded"
    );
  }

  const user = await profileService.updatePhoto({
    userId: req.user.id,
    file: req.file,
    ip: clientIp(req),
  });

  success(res, user, "Profile photo updated");
});

exports.removePhoto = asyncHandler(async (req, res) => {
  const user = await profileService.removePhoto({
    userId: req.user.id,
    ip: clientIp(req),
  });

  success(res, user, "Profile photo removed");
});

// ============================================================
// SETTINGS
// ============================================================

exports.getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();

  success(res, settings);
});

exports.updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(
    req.body
  );

  success(
    res,
    settings,
    "Settings updated"
  );
});