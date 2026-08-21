const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const { hashPassword, validatePasswordStrength } = require("../utils/password");
const { writeAudit } = require("./auditService");
const {
  findUserById,
  toPublicUser,
  assertNotPrimarySuperAdmin,
  isAdminRole,
  applyPermissionOverrides,
  userSafeInclude,
} = require("./userService");
const { ROLE_SLUGS } = require("../config/permissions");

function listWhere({ q, isActive, adminOnly, usersOnly }) {
  const where = {};
  if (q) {
    where.OR = [
      { fullName: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }
  if (isActive === "true") where.isActive = true;
  if (isActive === "false") where.isActive = false;
  if (adminOnly) {
    where.role = { slug: { in: [ROLE_SLUGS.ADMIN, ROLE_SLUGS.SUPER_ADMIN] } };
  }
  if (usersOnly) {
    where.role = { slug: ROLE_SLUGS.USER };
  }
  return where;
}

async function listUsers({ q, isActive, page = 1, pageSize = 20, adminOnly, usersOnly }) {
  const where = listWhere({ q, isActive, adminOnly, usersOnly });
  const skip = (Number(page) - 1) * Number(pageSize);
  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: userSafeInclude,
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(pageSize),
    }),
  ]);
  const data = await Promise.all(rows.map((u) => toPublicUser(u)));
  return { data, meta: { total, page: Number(page), pageSize: Number(pageSize) } };
}

async function createAccount({ payload, actor, ip, asAdmin }) {
  const strength = validatePasswordStrength(payload.password);
  if (strength) throw new ApiError(400, strength);

  const targetSlug = asAdmin ? ROLE_SLUGS.ADMIN : ROLE_SLUGS.USER;
  let role;
  if (payload.roleId) {
    role = await prisma.role.findUnique({ where: { id: payload.roleId } });
    if (!role) throw new ApiError(400, "Role not found");
    if (role.slug === ROLE_SLUGS.SUPER_ADMIN && !actor.isSuperAdmin) {
      throw new ApiError(403, "Only the SUPER ADMIN can assign the SUPER ADMIN role");
    }
    if (asAdmin && !isAdminRole(role)) {
      throw new ApiError(400, "Administrator accounts must use an administrator role");
    }
    if (!asAdmin && isAdminRole(role) && !actor.permissions?.includes("admin.create")) {
      throw new ApiError(403, "You cannot assign an administrator role here");
    }
  } else {
    role = await prisma.role.findUnique({ where: { slug: targetSlug } });
  }

  const user = await prisma.user.create({
    data: {
      fullName: payload.fullName.trim(),
      email: payload.email.toLowerCase().trim(),
      phone: payload.phone || null,
      passwordHash: await hashPassword(payload.password),
      roleId: role.id,
    },
    include: userSafeInclude,
  });

  if (payload.permissionOverrides) {
    await applyPermissionOverrides(user.id, payload.permissionOverrides);
  }

  const action = asAdmin ? "admin.create" : "user.create";
  await writeAudit({
    actorId: actor.id,
    action,
    resourceType: "User",
    resourceId: user.id,
    ipAddress: ip,
    metadata: { email: user.email },
  });
  return toPublicUser(await findUserById(user.id));
}

async function updateAccount({ id, payload, actor, ip, asAdmin }) {
  const target = await findUserById(id);
  if (!target) throw new ApiError(404, "User not found");
  if (asAdmin && !isAdminRole(target.role)) throw new ApiError(400, "This account is not an administrator");
  if (!asAdmin && isAdminRole(target.role)) throw new ApiError(400, "Use administrator management for this account");

  if (payload.roleId) {
    const role = await prisma.role.findUnique({ where: { id: payload.roleId } });
    if (!role) throw new ApiError(400, "Role not found");
    if (target.isSuperAdmin && role.slug !== ROLE_SLUGS.SUPER_ADMIN) {
      throw new ApiError(403, "The primary SUPER ADMIN role cannot be changed");
    }
    if (role.slug === ROLE_SLUGS.SUPER_ADMIN && !actor.isSuperAdmin) {
      throw new ApiError(403, "Only the SUPER ADMIN can assign the SUPER ADMIN role");
    }
  }

  const data = {};
  if (payload.fullName) data.fullName = payload.fullName.trim();
  if (payload.email) data.email = payload.email.toLowerCase().trim();
  if (payload.phone !== undefined) data.phone = payload.phone;
  if (payload.roleId) data.roleId = payload.roleId;
  if (typeof payload.isActive === "boolean") {
    if (payload.isActive === false) {
      assertNotPrimarySuperAdmin(target, "deactivated");
      if (target.id === actor.id) throw new ApiError(400, "You cannot deactivate your own account");
    }
    data.isActive = payload.isActive;
  }

  await prisma.user.update({ where: { id }, data });
  if (payload.permissionOverrides) {
    assertNotPrimarySuperAdmin(target, "stripped of privileges");
    await applyPermissionOverrides(id, payload.permissionOverrides);
  }

  let action = asAdmin ? "admin.update" : "user.update";
  if (typeof payload.isActive === "boolean") {
    action = payload.isActive
      ? asAdmin
        ? "admin.activate"
        : "user.activate"
      : asAdmin
        ? "admin.deactivate"
        : "user.deactivate";
  }
  await writeAudit({
    actorId: actor.id,
    action,
    resourceType: "User",
    resourceId: id,
    ipAddress: ip,
  });
  return toPublicUser(await findUserById(id));
}

async function deleteAccount({ id, actor, ip, asAdmin }) {
  const target = await findUserById(id);
  if (!target) throw new ApiError(404, "User not found");
  assertNotPrimarySuperAdmin(target, "deleted");
  if (target.id === actor.id) throw new ApiError(400, "You cannot delete your own account");
  if (asAdmin && !isAdminRole(target.role)) throw new ApiError(400, "This account is not an administrator");
  if (!asAdmin && isAdminRole(target.role)) throw new ApiError(400, "Use administrator management for this account");

  const docs = await prisma.document.count({ where: { uploadedById: id } });
  if (docs > 0) {
    throw new ApiError(
      409,
      "This account has uploaded documents and cannot be deleted. Deactivate it instead."
    );
  }

  await prisma.user.delete({ where: { id } });
  await writeAudit({
    actorId: actor.id,
    action: asAdmin ? "admin.delete" : "user.delete",
    resourceType: "User",
    resourceId: id,
    ipAddress: ip,
    metadata: { email: target.email },
  });
}

async function setActive({ id, isActive, actor, ip, asAdmin }) {
  return updateAccount({ id, payload: { isActive }, actor, ip, asAdmin });
}

async function adminResetPassword({ id, newPassword, actor, ip }) {
  const target = await findUserById(id);
  if (!target) throw new ApiError(404, "User not found");
  const strength = validatePasswordStrength(newPassword);
  if (strength) throw new ApiError(400, strength);
  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  await writeAudit({
    actorId: actor.id,
    action: "user.password_reset",
    resourceType: "User",
    resourceId: id,
    ipAddress: ip,
  });
}

async function getUserDocuments(userId, { page = 1, pageSize = 20 }) {
  const skip = (Number(page) - 1) * Number(pageSize);
  const where = { uploadedById: userId };
  const [total, data] = await Promise.all([
    prisma.document.count({ where }),
    prisma.document.findMany({
      where,
      include: {
        category: true,
        folder: true,
        uploadedBy: { select: { id: true, fullName: true, profilePhotoUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(pageSize),
    }),
  ]);
  return { data, meta: { total, page: Number(page), pageSize: Number(pageSize) } };
}

module.exports = {
  listUsers,
  createAccount,
  updateAccount,
  deleteAccount,
  setActive,
  adminResetPassword,
  getUserDocuments,
};
