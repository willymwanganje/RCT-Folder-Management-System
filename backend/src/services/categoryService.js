const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const { slugify } = require("../utils/slug");
const { writeAudit } = require("./auditService");

async function listCategories({ includeInactive = false } = {}) {
  return prisma.category.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: { name: "asc" },
    include: { _count: { select: { documents: true, folders: true } } },
  });
}

async function createCategory({ name, description, actor, ip }) {
  const slug = slugify(name);
  const category = await prisma.category.create({
    data: { name: name.trim(), slug, description: description || null },
  });
  await writeAudit({
    actorId: actor.id,
    action: "category.create",
    resourceType: "Category",
    resourceId: category.id,
    ipAddress: ip,
  });
  return category;
}

async function updateCategory({ id, payload, actor, ip }) {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Category not found");
  const data = {};
  if (payload.name) {
    data.name = payload.name.trim();
    data.slug = slugify(payload.name);
  }
  if (payload.description !== undefined) data.description = payload.description;
  if (typeof payload.isActive === "boolean") data.isActive = payload.isActive;
  const category = await prisma.category.update({ where: { id }, data });
  await writeAudit({
    actorId: actor.id,
    action: "category.update",
    resourceType: "Category",
    resourceId: id,
    ipAddress: ip,
  });
  return category;
}

async function deleteCategory({ id, actor, ip }) {
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { documents: true } } },
  });
  if (!existing) throw new ApiError(404, "Category not found");
  if (existing._count.documents > 0) {
    throw new ApiError(409, "Category has documents and cannot be deleted. Deactivate it instead.");
  }
  await prisma.category.delete({ where: { id } });
  await writeAudit({
    actorId: actor.id,
    action: "category.delete",
    resourceType: "Category",
    resourceId: id,
    ipAddress: ip,
    metadata: { name: existing.name },
  });
}

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };
