const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const { writeAudit } = require("./auditService");
const { ROLE_SLUGS } = require("../config/permissions");

async function listRoles() {
  return prisma.role.findMany({
    orderBy: { name: "asc" },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });
}

async function listPermissions() {
  return prisma.permission.findMany({ orderBy: [{ groupName: "asc" }, { key: "asc" }] });
}

async function updateRolePermissions({ roleId, permissionIds, actor, ip }) {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new ApiError(404, "Role not found");
  if (role.slug === ROLE_SLUGS.SUPER_ADMIN) {
    throw new ApiError(403, "SUPER ADMIN permissions cannot be reduced");
  }
  const unique = [...new Set(permissionIds || [])];
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    prisma.rolePermission.createMany({
      data: unique.map((permissionId) => ({ roleId, permissionId })),
    }),
  ]);
  await writeAudit({
    actorId: actor.id,
    action: "role.permissions_update",
    resourceType: "Role",
    resourceId: roleId,
    ipAddress: ip,
  });
  return prisma.role.findUnique({
    where: { id: roleId },
    include: { permissions: { include: { permission: true } } },
  });
}

module.exports = { listRoles, listPermissions, updateRolePermissions };
