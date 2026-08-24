const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const { getEffectivePermissions } = require("./rbacService");
const { ROLE_SLUGS } = require("../config/permissions");
const { createSignedDownloadUrl } = require("./storageService");

const userSafeInclude = {
  role: {
    include: {
      permissions: { include: { permission: true } },
    },
  },
  userPermissions: { include: { permission: true } },
};

function stripSecrets(user, permissions) {
  if (!user) return null;
  const { passwordHash, passwordResets, role, userPermissions, ...rest } = user;
  return {
    ...rest,
    role: role
      ? { id: role.id, name: role.name, slug: role.slug, description: role.description }
      : null,
    permissions,
  };
}

async function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: userSafeInclude,
  });
}

async function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    include: userSafeInclude,
  });
}

async function toPublicUser(user) {
  if (!user) return null;
  const permissions = await getEffectivePermissions(user);
  const publicUser = stripSecrets(user, permissions);

  // Generate signed URL kwa profile photo
  if (
    publicUser.profilePhotoUrl &&
    !publicUser.profilePhotoUrl.startsWith("http")
  ) {
    try {
      publicUser.profilePhotoUrl = await createSignedDownloadUrl(
        publicUser.profilePhotoUrl,
        60 * 60 // saa 1
      );
    } catch (err) {
      console.error("Failed to generate signed URL for avatar:", err.message);
      publicUser.profilePhotoUrl = null;
    }
  }

  return publicUser;
}

function assertNotPrimarySuperAdmin(target, actionLabel) {
  if (target.isSuperAdmin) {
    throw new ApiError(403, `The primary SUPER ADMIN account cannot be ${actionLabel}`);
  }
}

function isAdminRole(role) {
  return role?.slug === ROLE_SLUGS.ADMIN || role?.slug === ROLE_SLUGS.SUPER_ADMIN;
}

async function applyPermissionOverrides(userId, overrides) {
  if (!Array.isArray(overrides)) return;
  await prisma.userPermission.deleteMany({ where: { userId } });
  if (!overrides.length) return;
  await prisma.userPermission.createMany({
    data: overrides.map((o) => ({
      userId,
      permissionId: o.permissionId,
      granted: o.granted !== false,
    })),
  });
}

module.exports = {
  userSafeInclude,
  findUserByEmail,
  findUserById,
  toPublicUser,
  assertNotPrimarySuperAdmin,
  isAdminRole,
  applyPermissionOverrides,
};