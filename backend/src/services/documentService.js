const path = require("path");
const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const { writeAudit } = require("./auditService");
const { saveFile, removeFile, MIME_BY_EXT } = require("./storageService");
const { getSettings } = require("./settingsService");

function extensionOf(filename) {
  return path.extname(filename || "").replace(".", "").toLowerCase();
}

async function validateUpload(file) {
  const settings = await getSettings();
  if (!file) throw new ApiError(400, "A file is required");
  const ext = extensionOf(file.originalname);
  if (!settings.allowedFileTypes.includes(ext)) {
    throw new ApiError(400, `File type .${ext} is not allowed`);
  }
  if (file.size > settings.maxFileSizeBytes) {
    throw new ApiError(400, `File exceeds the ${settings.maxFileSizeMb} MB size limit`);
  }
  return { ext, settings };
}

function documentInclude() {
  return {
    category: true,
    folder: true,
    uploadedBy: { select: { id: true, fullName: true, profilePhotoUrl: true } },
  };
}

function buildWhere(query, { mine, userId } = {}) {
  const where = {};
  if (mine) where.uploadedById = userId;
  const q = query.q || query.search;
  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
      { fileType: { contains: q, mode: "insensitive" } },
      { category: { name: { contains: q, mode: "insensitive" } } },
      { folder: { name: { contains: q, mode: "insensitive" } } },
      { uploadedBy: { fullName: { contains: q, mode: "insensitive" } } },
    ];
  }
  if (query.categoryId) where.categoryId = query.categoryId;
  if (query.folderId) where.folderId = query.folderId;
  if (query.uploaderId) where.uploadedById = query.uploaderId;
  if (query.fileType) where.fileType = query.fileType.toLowerCase();
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) where.createdAt.lte = new Date(query.to);
  }
  return where;
}

async function listDocuments(query, opts) {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 20;
  const where = buildWhere(query, opts);
  const [total, data] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      include: documentInclude(),
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { data, meta: { total, page, pageSize } };
}

async function getDocument(id) {
  const doc = await prisma.document.findUnique({
    where: { id },
    include: documentInclude(),
  });
  if (!doc) throw new ApiError(404, "Document not found");
  return doc;
}

async function createDocument({ file, body, actor, ip }) {
  if (!body.name || !body.categoryId || !body.folderId) {
    throw new ApiError(400, "Document name, category, and folder are required");
  }
  const { ext } = await validateUpload(file);
  const category = await prisma.category.findUnique({ where: { id: body.categoryId } });
  if (!category || !category.isActive) throw new ApiError(400, "Category is invalid or inactive");
  const folder = await prisma.folder.findUnique({ where: { id: body.folderId } });
  if (!folder) throw new ApiError(400, "Folder not found");

  const stored = await saveFile(file.buffer, { folder: "documents", ext });
  const doc = await prisma.document.create({
    data: {
      name: body.name.trim(),
      description: body.description || null,
      originalName: file.originalname,
      mimeType: file.mimetype || MIME_BY_EXT[ext] || "application/octet-stream",
      fileType: ext,
      fileSize: file.size,
      storageKey: stored.key,
      storageUrl: stored.url,
      storageProvider: stored.provider,
      categoryId: body.categoryId,
      folderId: body.folderId,
      uploadedById: actor.id,
    },
    include: documentInclude(),
  });
  await writeAudit({
    actorId: actor.id,
    action: "document.upload",
    resourceType: "Document",
    resourceId: doc.id,
    ipAddress: ip,
    metadata: { name: doc.name, fileType: ext },
  });
  return doc;
}

async function updateDocument({ id, payload, actor, ip }) {
  const existing = await getDocument(id);
  const data = {};
  if (payload.name) data.name = payload.name.trim();
  if (payload.description !== undefined) data.description = payload.description;
  if (payload.categoryId) data.categoryId = payload.categoryId;
  if (payload.folderId) data.folderId = payload.folderId;
  const doc = await prisma.document.update({
    where: { id: existing.id },
    data,
    include: documentInclude(),
  });
  await writeAudit({
    actorId: actor.id,
    action: "document.update",
    resourceType: "Document",
    resourceId: id,
    ipAddress: ip,
  });
  return doc;
}

async function deleteDocument({ id, actor, ip }) {
  const existing = await getDocument(id);
  await prisma.document.delete({ where: { id } });
  await removeFile(existing.storageProvider, existing.storageKey);
  await writeAudit({
    actorId: actor.id,
    action: "document.delete",
    resourceType: "Document",
    resourceId: id,
    ipAddress: ip,
    metadata: { name: existing.name },
  });
}

async function recordDownload({ id, actor, ip }) {
  const doc = await getDocument(id);
  await writeAudit({
    actorId: actor.id,
    action: "document.download",
    resourceType: "Document",
    resourceId: id,
    ipAddress: ip,
  });
  return doc;
}

module.exports = {
  listDocuments,
  getDocument,
  createDocument,
  updateDocument,
  deleteDocument,
  recordDownload,
};
