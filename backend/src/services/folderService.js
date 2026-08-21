const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const { writeAudit } = require("./auditService");

async function ensureUniqueName(name, parentId, excludeId) {
  const existing = await prisma.folder.findFirst({
    where: {
      name: { equals: name.trim(), mode: "insensitive" },
      parentId: parentId || null,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });
  if (existing) throw new ApiError(409, "A folder with this name already exists in the same location");
}

async function listFolders({ parentId, categoryId }) {
  const where = {};
  if (parentId === "root") where.parentId = null;
  else if (parentId) where.parentId = parentId;
  if (categoryId) where.categoryId = categoryId;
  return prisma.folder.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      category: true,
      _count: { select: { children: true, documents: true } },
    },
  });
}

async function getFolderTree() {
  const folders = await prisma.folder.findMany({
    orderBy: { name: "asc" },
    include: {
      category: true,
      _count: { select: { documents: true, children: true } },
    },
  });
  const byParent = new Map();
  for (const f of folders) {
    const key = f.parentId || "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push({ ...f, children: [] });
  }
  function attach(node) {
    node.children = byParent.get(node.id) || [];
    node.children.forEach(attach);
    return node;
  }
  return (byParent.get("root") || []).map(attach);
}

async function getFolder(id) {
  const folder = await prisma.folder.findUnique({
    where: { id },
    include: {
      category: true,
      parent: true,
      children: { orderBy: { name: "asc" }, include: { _count: { select: { documents: true, children: true } } } },
      documents: {
        orderBy: { createdAt: "desc" },
        include: {
          uploadedBy: { select: { id: true, fullName: true, profilePhotoUrl: true } },
          category: true,
        },
      },
    },
  });
  if (!folder) throw new ApiError(404, "Folder not found");
  return folder;
}

async function createFolder({ name, parentId, categoryId, actor, ip }) {
  if (parentId) {
    const parent = await prisma.folder.findUnique({ where: { id: parentId } });
    if (!parent) throw new ApiError(400, "Parent folder not found");
  }
  await ensureUniqueName(name, parentId);
  const folder = await prisma.folder.create({
    data: {
      name: name.trim(),
      parentId: parentId || null,
      categoryId: categoryId || null,
      createdById: actor.id,
    },
    include: { category: true },
  });
  await writeAudit({
    actorId: actor.id,
    action: "folder.create",
    resourceType: "Folder",
    resourceId: folder.id,
    ipAddress: ip,
  });
  return folder;
}

async function updateFolder({ id, payload, actor, ip }) {
  const existing = await prisma.folder.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Folder not found");
  if (payload.parentId === id) throw new ApiError(400, "A folder cannot be its own parent");
  if (payload.name || payload.parentId !== undefined) {
    await ensureUniqueName(payload.name || existing.name, payload.parentId !== undefined ? payload.parentId : existing.parentId, id);
  }
  const folder = await prisma.folder.update({
    where: { id },
    data: {
      name: payload.name ? payload.name.trim() : undefined,
      parentId: payload.parentId === undefined ? undefined : payload.parentId || null,
      categoryId: payload.categoryId === undefined ? undefined : payload.categoryId || null,
    },
    include: { category: true },
  });
  await writeAudit({
    actorId: actor.id,
    action: "folder.update",
    resourceType: "Folder",
    resourceId: id,
    ipAddress: ip,
  });
  return folder;
}

async function deleteFolder({ id, actor, ip }) {
  const existing = await prisma.folder.findUnique({
    where: { id },
    include: { _count: { select: { children: true, documents: true } } },
  });
  if (!existing) throw new ApiError(404, "Folder not found");
  if (existing._count.children > 0 || existing._count.documents > 0) {
    throw new ApiError(409, "Folder is not empty and cannot be deleted");
  }
  await prisma.folder.delete({ where: { id } });
  await writeAudit({
    actorId: actor.id,
    action: "folder.delete",
    resourceType: "Folder",
    resourceId: id,
    ipAddress: ip,
    metadata: { name: existing.name },
  });
}

module.exports = { listFolders, getFolderTree, getFolder, createFolder, updateFolder, deleteFolder };
