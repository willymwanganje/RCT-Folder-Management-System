const prisma = require("../config/prisma");
const { saveFile, removeFile } = require("./storageService");
const ApiError = require("../utils/ApiError");
const { toPublicUser, findUserById } = require("./userService");
const { writeAudit } = require("./auditService");

async function updateProfile({ userId, payload, ip }) {
  const data = {};
  if (payload.fullName) data.fullName = payload.fullName.trim();
  if (payload.phone !== undefined) data.phone = payload.phone;
  await prisma.user.update({ where: { id: userId }, data });
  await writeAudit({
    actorId: userId,
    action: "user.update",
    resourceType: "User",
    resourceId: userId,
    ipAddress: ip,
    metadata: { self: true },
  });
  return toPublicUser(await findUserById(userId));
}

async function updatePhoto({ userId, file, ip }) {
  if (!file) throw new ApiError(400, "A photo is required");
  const ext = (file.originalname.split(".").pop() || "jpg").toLowerCase();
  if (!["jpg", "jpeg", "png"].includes(ext)) {
    throw new ApiError(400, "Profile photo must be JPG or PNG");
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const stored = await saveFile(file.buffer, { folder: "avatars", ext });
  await prisma.user.update({
    where: { id: userId },
    data: { profilePhotoUrl: stored.url },
  });
  if (user.profilePhotoUrl && user.profilePhotoUrl.startsWith("/uploads/")) {
    await removeFile("local", user.profilePhotoUrl.replace("/uploads/", ""));
  }
  await writeAudit({
    actorId: userId,
    action: "user.photo_update",
    resourceType: "User",
    resourceId: userId,
    ipAddress: ip,
  });
  return toPublicUser(await findUserById(userId));
}

async function removePhoto({ userId, ip }) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user.profilePhotoUrl && user.profilePhotoUrl.startsWith("/uploads/")) {
    await removeFile("local", user.profilePhotoUrl.replace("/uploads/", ""));
  }
  await prisma.user.update({ where: { id: userId }, data: { profilePhotoUrl: null } });
  await writeAudit({
    actorId: userId,
    action: "user.photo_remove",
    resourceType: "User",
    resourceId: userId,
    ipAddress: ip,
  });
  return toPublicUser(await findUserById(userId));
}

module.exports = { updateProfile, updatePhoto, removePhoto };
