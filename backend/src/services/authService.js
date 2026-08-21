const prisma = require("../config/prisma");
const ApiError = require("../utils/ApiError");
const { hashPassword, verifyPassword, validatePasswordStrength } = require("../utils/password");
const { signAccessToken } = require("../utils/jwt");
const { sha256, randomToken } = require("../utils/crypto");
const { sendPasswordResetEmail } = require("../utils/mailer");
const { env } = require("../config/env");
const { writeAudit } = require("./auditService");
const { findUserByEmail, findUserById, toPublicUser } = require("./userService");

async function login({ email, password, ip }) {
  const user = await findUserByEmail(email);
  if (!user) {
    await writeAudit({ action: "auth.login_failed", resourceType: "Auth", ipAddress: ip, metadata: { email } });
    throw new ApiError(401, "Invalid email or password");
  }
  if (!user.isActive) {
    await writeAudit({
      actorId: user.id,
      action: "auth.login_failed",
      resourceType: "Auth",
      ipAddress: ip,
      metadata: { reason: "inactive" },
    });
    throw new ApiError(403, "This account has been deactivated");
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    await writeAudit({ actorId: user.id, action: "auth.login_failed", resourceType: "Auth", ipAddress: ip });
    throw new ApiError(401, "Invalid email or password");
  }

  const publicUser = await toPublicUser(user);
  const token = signAccessToken({ sub: user.id, email: user.email });
  await writeAudit({ actorId: user.id, action: "auth.login", resourceType: "Auth", ipAddress: ip });
  return { token, user: publicUser };
}

async function logout({ userId, ip }) {
  await writeAudit({ actorId: userId, action: "auth.logout", resourceType: "Auth", ipAddress: ip });
}

async function changePassword({ userId, currentPassword, newPassword, ip }) {
  const err = validatePasswordStrength(newPassword);
  if (err) throw new ApiError(400, err);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const ok = await verifyPassword(currentPassword, user.passwordHash);
  if (!ok) throw new ApiError(400, "Current password is incorrect");
  const passwordHash = await hashPassword(newPassword);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
  await writeAudit({ actorId: userId, action: "auth.password_change", resourceType: "User", resourceId: userId, ipAddress: ip });
}

async function forgotPassword({ email, ip }) {
  const user = await findUserByEmail(email);
  const generic = { message: "If that email exists, a reset link has been sent" };
  if (!user || !user.isActive) {
    return generic;
  }
  const token = randomToken();
  const tokenHash = sha256(token);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });
  const resetUrl = `${env.frontendUrl.replace(/\/$/, "")}/reset-password?token=${token}`;
  const mail = await sendPasswordResetEmail(user.email, resetUrl);
  await writeAudit({
    actorId: user.id,
    action: "auth.password_reset_requested",
    resourceType: "User",
    resourceId: user.id,
    ipAddress: ip,
  });
  const payload = { ...generic };
  if (env.nodeEnv !== "production" && !mail.delivered) {
    payload.devResetUrl = resetUrl;
  }
  return payload;
}

async function resetPassword({ token, newPassword, ip }) {
  const err = validatePasswordStrength(newPassword);
  if (err) throw new ApiError(400, err);
  const tokenHash = sha256(token);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw new ApiError(400, "Invalid or expired reset token");
  }
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
  await writeAudit({
    actorId: record.userId,
    action: "auth.password_reset",
    resourceType: "User",
    resourceId: record.userId,
    ipAddress: ip,
  });
}

async function me(userId) {
  const user = await findUserById(userId);
  if (!user || !user.isActive) throw new ApiError(401, "Unauthorized");
  return toPublicUser(user);
}

module.exports = { login, logout, changePassword, forgotPassword, resetPassword, me };
