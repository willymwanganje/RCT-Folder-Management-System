const path = require("path");
const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const { writeAudit } = require("./auditService");
const { saveFile, removeFile, MIME_BY_EXT, createSignedDownloadUrl } = require("./storageService");
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

function assertCanManageDocument(existing, actor) {
  const isOwner = Number(existing.uploadedById) === Number(actor.id);
  const isAdmin = ["admin", "super_admin"].includes(actor.role);

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You can only edit or delete your own documents");
  }
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

async function enrichDocument(doc) {
  if (!doc) return null;

  if (doc.storageKey && doc.storageProvider === "supabase") {
    try {
      doc.previewUrl = await createSignedDownloadUrl(doc.storageKey, 60 * 60);
    } catch (err) {
      console.error("Failed to generate preview URL:", err.message);
      doc.previewUrl = null;
    }
  }

  if (doc.uploadedBy?.profilePhotoUrl && !doc.uploadedBy.profilePhotoUrl.startsWith("http")) {
    try {
      doc.uploadedBy.profilePhotoUrl = await createSignedDownloadUrl(
        doc.uploadedBy.profilePhotoUrl,
        60 * 60
      );
    } catch (err) {
      console.error("Failed to generate uploader avatar URL:", err.message);
      doc.uploadedBy.profilePhotoUrl = null;
    }
  }

  return doc;
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

  const enriched = await Promise.all(data.map(enrichDocument));
  return { data: enriched, meta: { total, page, pageSize } };
}

async function getDocument(id) {
  const doc = await prisma.document.findUnique({ where: { id }, include: documentInclude() });
  if (!doc) throw new ApiError(404, "Document not found");
  return enrichDocument(doc);
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

  return enrichDocument(doc);
}

async function updateDocument({ id, payload, actor, ip }) {
  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Document not found");

  assertCanManageDocument(existing, actor);

  const data = {};
  if (payload.name !== undefined) {
    const name = String(payload.name).trim();
    if (!name) throw new ApiError(400, "Document name cannot be empty");
    data.name = name;
  }
  if (payload.description !== undefined) {
    data.description = payload.description === null ? null : String(payload.description);
  }
  if (payload.categoryId !== undefined) {
    data.categoryId = payload.categoryId === null ? null : Number(payload.categoryId);
  }
  if (payload.folderId !== undefined) {
    data.folderId = payload.folderId === null ? null : Number(payload.folderId);
  }
  if (Object.keys(data).length === 0) {
    throw new ApiError(400, "No document fields supplied for update");
  }

  const doc = await prisma.document.update({
    where: { id },
    data,
    include: documentInclude(),
  });

  await writeAudit({
    actorId: actor.id,
    action: "document.update",
    resourceType: "Document",
    resourceId: id,
    ipAddress: ip,
    metadata: { fields: Object.keys(data) },
  });

  return enrichDocument(doc);
}

async function deleteDocument({ id, actor, ip }) {
  const existing = await prisma.document.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Document not found");

  assertCanManageDocument(existing, actor);

  await removeFile(existing.storageProvider, existing.storageKey);
  await prisma.document.delete({ where: { id } });

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
  const doc = await prisma.document.findUnique({
    where: { id },
    include: documentInclude(),
  });
  if (!doc) throw new ApiError(404, "Document not found");

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
