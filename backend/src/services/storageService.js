const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");
const { env } = require("../config/env");

const LOCAL_DIR = path.join(__dirname, "../../uploads");

const MIME_BY_EXT = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  txt: "text/plain",
  csv: "text/csv",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
};

async function saveLocal(buffer, folder, ext) {
  const dir = path.join(LOCAL_DIR, folder);
  await fs.mkdir(dir, { recursive: true });
  const key = `${folder}/${crypto.randomUUID()}.${ext}`;
  await fs.writeFile(path.join(LOCAL_DIR, key), buffer);
  return {
    provider: "local",
    key,
    url: `/uploads/${key}`,
  };
}

async function removeLocal(key) {
  try {
    await fs.unlink(path.join(LOCAL_DIR, key));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

let cloudinary;
function getCloudinary() {
  if (!cloudinary) {
    cloudinary = require("cloudinary").v2;
    cloudinary.config({
      cloud_name: env.cloudinary.cloudName,
      api_key: env.cloudinary.apiKey,
      api_secret: env.cloudinary.apiSecret,
    });
  }
  return cloudinary;
}

function saveCloudinary(buffer, folder, ext) {
  const cld = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = cld.uploader.upload_stream(
      {
        folder: `rct-folder-management/${folder}`,
        resource_type: "auto",
        filename_override: `${crypto.randomUUID()}.${ext}`,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          provider: "cloudinary",
          key: result.public_id,
          url: result.secure_url,
        });
      }
    );
    stream.end(buffer);
  });
}

async function removeCloudinary(key) {
  const cld = getCloudinary();
  await cld.uploader.destroy(key, { resource_type: "image" }).catch(() => {});
  await cld.uploader.destroy(key, { resource_type: "raw" }).catch(() => {});
}

async function saveFile(buffer, { folder, ext }) {
  const provider = env.storageProvider;
  if (provider === "cloudinary") {
    if (!env.cloudinary.cloudName || !env.cloudinary.apiKey || !env.cloudinary.apiSecret) {
      throw new Error("Cloudinary credentials are not configured");
    }
    return saveCloudinary(buffer, folder, ext);
  }
  return saveLocal(buffer, folder, ext);
}

async function removeFile(provider, key) {
  if (!key) return;
  if (provider === "cloudinary") return removeCloudinary(key);
  return removeLocal(key);
}

module.exports = { saveFile, removeFile, MIME_BY_EXT, LOCAL_DIR };
