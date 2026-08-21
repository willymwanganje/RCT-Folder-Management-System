const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const { clientIp } = require("../services/auditService");
const { findUserById, toPublicUser } = require("../services/userService");
const accountService = require("../services/accountService");

function actor(req) {
  return { ...req.user, permissions: req.authUser.permissions };
}

exports.list = asyncHandler(async (req, res) => {
  const result = await accountService.listUsers({
    q: req.query.q || req.query.search,
    isActive: req.query.isActive,
    page: req.query.page,
    pageSize: req.query.pageSize,
    adminOnly: true,
  });
  success(res, result);
});

exports.get = asyncHandler(async (req, res) => {
  const user = await findUserById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "Administrator not found" });
  success(res, await toPublicUser(user));
});

exports.create = asyncHandler(async (req, res) => {
  const user = await accountService.createAccount({
    payload: req.body,
    actor: actor(req),
    ip: clientIp(req),
    asAdmin: true,
  });
  success(res, user, "Administrator created", 201);
});

exports.update = asyncHandler(async (req, res) => {
  const user = await accountService.updateAccount({
    id: req.params.id,
    payload: req.body,
    actor: actor(req),
    ip: clientIp(req),
    asAdmin: true,
  });
  success(res, user, "Administrator updated");
});

exports.remove = asyncHandler(async (req, res) => {
  await accountService.deleteAccount({
    id: req.params.id,
    actor: actor(req),
    ip: clientIp(req),
    asAdmin: true,
  });
  success(res, null, "Administrator deleted");
});

exports.activate = asyncHandler(async (req, res) => {
  const user = await accountService.setActive({
    id: req.params.id,
    isActive: true,
    actor: actor(req),
    ip: clientIp(req),
    asAdmin: true,
  });
  success(res, user, "Administrator activated");
});

exports.deactivate = asyncHandler(async (req, res) => {
  const user = await accountService.setActive({
    id: req.params.id,
    isActive: false,
    actor: actor(req),
    ip: clientIp(req),
    asAdmin: true,
  });
  success(res, user, "Administrator deactivated");
});

exports.resetPassword = asyncHandler(async (req, res) => {
  await accountService.adminResetPassword({
    id: req.params.id,
    newPassword: req.body.newPassword,
    actor: actor(req),
    ip: clientIp(req),
  });
  success(res, null, "Password reset");
});
