const prisma = require("../config/prisma");
const { env } = require("../config/env");

const DEFAULT_TYPES = env.allowedFileTypes
  .split(",")
  .map((t) => t.trim().toLowerCase())
  .filter(Boolean);

async function getSettings() {
  const rows = await prisma.systemSetting.findMany();
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  const allowed = (map.allowed_file_types || DEFAULT_TYPES.join(","))
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  const maxMb = Number(map.max_file_size_mb || env.maxFileSizeMb);
  return {
    allowedFileTypes: allowed,
    maxFileSizeMb: maxMb,
    maxFileSizeBytes: maxMb * 1024 * 1024,
    storageProvider: env.storageProvider,
  };
}

async function updateSettings(payload) {
  const ops = [];
  if (payload.allowedFileTypes) {
    const value = Array.isArray(payload.allowedFileTypes)
      ? payload.allowedFileTypes.join(",")
      : String(payload.allowedFileTypes);
    ops.push(
      prisma.systemSetting.upsert({
        where: { key: "allowed_file_types" },
        update: { value },
        create: { key: "allowed_file_types", value },
      })
    );
  }
  if (payload.maxFileSizeMb) {
    const value = String(payload.maxFileSizeMb);
    ops.push(
      prisma.systemSetting.upsert({
        where: { key: "max_file_size_mb" },
        update: { value },
        create: { key: "max_file_size_mb", value },
      })
    );
  }
  await Promise.all(ops);
  return getSettings();
}

module.exports = { getSettings, updateSettings };
