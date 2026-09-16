const ApiError = require("../utils/ApiError");
const prisma = require("../config/prisma");
const { hasPermission } = require("../services/rbacService");

function requirePermission(...keys) {
  return (req, res, next) => {
    const permissions = req.authUser?.permissions || [];
    if (!hasPermission(permissions, keys)) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }
    next();
  };
}

function requireAnyPermission(...keys) {
  return (req, res, next) => {
    const permissions = req.authUser?.permissions || [];
    if (req.authUser?.isSuperAdmin || keys.some((key) => permissions.includes(key))) return next();
    next(new ApiError(403, "You do not have permission to perform this action"));
  };
}

function requireAdminRole(req, res, next) {
  const role = req.authUser?.role?.slug;
  if (req.authUser?.isSuperAdmin || role === "super_admin" || role === "admin") return next();
  next(new ApiError(403, "Only an administrator can manage folders"));
}

function requireDocumentPermission(permission) {
  return async (req, res, next) => {
    try {
      const permissions = req.authUser?.permissions || [];
      if (req.authUser?.isSuperAdmin || permissions.includes(permission)) return next();
      const document = await prisma.document.findUnique({
        where: { id: req.params.id },
        select: { uploadedById: true },
      });
      if (document?.uploadedById === req.user?.id) return next();
      return next(new ApiError(403, "You can only manage documents that you uploaded"));
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireAdminRole,
  requireDocumentPermission,
};