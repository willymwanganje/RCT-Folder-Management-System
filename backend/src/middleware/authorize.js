const ApiError = require("../utils/ApiError");
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

module.exports = { requirePermission };
