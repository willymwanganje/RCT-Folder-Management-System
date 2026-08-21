const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/response");
const { clientIp } = require("../services/auditService");
const authService = require("../services/authService");

exports.login = asyncHandler(async (req, res) => {
  const result = await authService.login({
    email: req.body.email,
    password: req.body.password,
    ip: clientIp(req),
  });
  success(res, result, "Signed in");
});

exports.logout = asyncHandler(async (req, res) => {
  await authService.logout({ userId: req.user.id, ip: clientIp(req) });
  success(res, null, "Signed out");
});

exports.me = asyncHandler(async (req, res) => {
  success(res, req.authUser);
});

exports.forgotPassword = asyncHandler(async (req, res) => {
  const data = await authService.forgotPassword({ email: req.body.email, ip: clientIp(req) });
  success(res, data, data.message);
});

exports.resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword({
    token: req.body.token,
    newPassword: req.body.newPassword,
    ip: clientIp(req),
  });
  success(res, null, "Password has been reset");
});

exports.changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword({
    userId: req.user.id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
    ip: clientIp(req),
  });
  success(res, null, "Password updated");
});
