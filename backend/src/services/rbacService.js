const prisma = require("../config/prisma");
const { ROLE_SLUGS } = require("../config/permissions");

async function getEffectivePermissions(user) {
  if (user.isSuperAdmin || user.role?.slug === ROLE_SLUGS.SUPER_ADMIN) {
    const all = await prisma.permission.findMany({ select: { key: true } });
    return all.map((p) => p.key);
  }

  const rolePerms = (user.role?.permissions || []).map((rp) => rp.permission.key);
  const set = new Set(rolePerms);

  for (const up of user.userPermissions || []) {
    const key = up.permission.key;
    if (up.granted) set.add(key);
    else set.delete(key);
  }

  return [...set];
}

function hasPermission(permissionKeys, required) {
  const needed = Array.isArray(required) ? required : [required];
  return needed.every((key) => permissionKeys.includes(key));
}

module.exports = { getEffectivePermissions, hasPermission };
