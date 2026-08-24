const crypto = require("crypto");
const { createClient } = require("@supabase/supabase-js");
const { env } = require("../config/env");

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

const SUPABASE_BUCKET = env.supabase.bucket || "rct-documents";

let supabase;

function getSupabase() {
  if (!supabase) {
    if (!env.supabase.url || !env.supabase.serviceRoleKey) {
      throw new Error("Supabase storage credentials are not configured");
    }

    supabase = createClient(
      env.supabase.url,
      env.supabase.serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );
  }

  return supabase;
}

/**
 * Upload file to Supabase private bucket.
 */
async function saveSupabase(buffer, folder, ext, mimeType) {
  const client = getSupabase();

  const filename = `${crypto.randomUUID()}.${ext}`;
  const key = `${folder}/${filename}`;

  const { error } = await client.storage
    .from(SUPABASE_BUCKET)
    .upload(key, buffer, {
      contentType:
        mimeType ||
        MIME_BY_EXT[ext] ||
        "application/octet-stream",
      upsert: false,
    });

  if (error) {
    throw new Error(
      `Supabase upload failed: ${error.message}`
    );
  }

  return {
    provider: "supabase",
    key,
    url: key,
  };
}

/**
 * Delete file from Supabase private bucket.
 */
async function removeSupabase(key) {
  if (!key) return;

  const client = getSupabase();

  const { error } = await client.storage
    .from(SUPABASE_BUCKET)
    .remove([key]);

  if (error) {
    throw new Error(
      `Supabase delete failed: ${error.message}`
    );
  }
}

/**
 * Generate temporary signed URL for private file.
 *
 * expiresIn = seconds.
 */
async function createSignedDownloadUrl(
  key,
  expiresIn = 600
) {
  if (!key) {
    throw new Error("Storage key is required");
  }

  const client = getSupabase();

  const { data, error } = await client.storage
    .from(SUPABASE_BUCKET)
    .createSignedUrl(key, expiresIn);

  if (error) {
    throw new Error(
      `Supabase signed URL failed: ${error.message}`
    );
  }

  if (!data || !data.signedUrl) {
    throw new Error(
      "Supabase did not return a signed URL"
    );
  }

  return data.signedUrl;
}

/**
 * Main file upload function.
 */
async function saveFile(
  buffer,
  { folder, ext, mimeType }
) {
  return saveSupabase(
    buffer,
    folder,
    ext,
    mimeType
  );
}

/**
 * Main file delete function.
 */
async function removeFile(provider, key) {
  if (!key) return;

  if (provider === "supabase") {
    return removeSupabase(key);
  }

  /*
   * Old local/cloudinary files are intentionally
   * not deleted by the new Supabase storage layer.
   *
   * This protects existing files during migration.
   */
}

module.exports = {
  saveFile,
  removeFile,
  createSignedDownloadUrl,
  MIME_BY_EXT,
};