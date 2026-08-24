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

const SUPABASE_BUCKET = env.supabase?.bucket || "rct-documents";

let supabase;

function getSupabase() {
  if (!supabase) {
    if (!env.supabase?.url || !env.supabase?.serviceRoleKey) {
      console.error("========== SUPABASE CONFIG ERROR ==========");
      console.error("SUPABASE_URL exists:", Boolean(env.supabase?.url));
      console.error(
        "SUPABASE_SERVICE_ROLE_KEY exists:",
        Boolean(env.supabase?.serviceRoleKey)
      );
      console.error("SUPABASE_BUCKET:", SUPABASE_BUCKET);
      console.error("============================================");

      throw new Error(
        "Supabase storage credentials are not configured"
      );
    }

    console.log("========== SUPABASE CONFIG ==========");
    console.log("Supabase URL:", env.supabase.url);
    console.log("Supabase service role key exists:", true);
    console.log("Supabase bucket:", SUPABASE_BUCKET);
    console.log("=====================================");

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
  console.log("========== SUPABASE UPLOAD START ==========");
  console.log("Folder:", folder);
  console.log("Extension:", ext);
  console.log("File size:", buffer?.length || 0, "bytes");
  console.log("Bucket:", SUPABASE_BUCKET);

  try {
    const client = getSupabase();

    const filename = `${crypto.randomUUID()}.${ext}`;
    const key = `${folder}/${filename}`;

    console.log("Generated storage key:", key);
    console.log(
      "Content-Type:",
      mimeType || MIME_BY_EXT[ext] || "application/octet-stream"
    );

    const { data, error } = await client.storage
      .from(SUPABASE_BUCKET)
      .upload(key, buffer, {
        contentType:
          mimeType ||
          MIME_BY_EXT[ext] ||
          "application/octet-stream",
        upsert: false,
      });

    if (error) {
      console.error("========== SUPABASE UPLOAD ERROR ==========");
      console.error("Message:", error.message);
      console.error("Name:", error.name);
      console.error("Status:", error.status);
      console.error("StatusCode:", error.statusCode);
      console.error("Error object:", error);
      console.error("Bucket:", SUPABASE_BUCKET);
      console.error("Key:", key);
      console.error("============================================");

      throw new Error(
        `Supabase upload failed: ${error.message}`
      );
    }

    console.log("========== SUPABASE UPLOAD SUCCESS ==========");
    console.log("Bucket:", SUPABASE_BUCKET);
    console.log("Key:", key);
    console.log("Upload data:", data);
    console.log("=============================================");

    return {
      provider: "supabase",
      key,
      url: key,
    };
  } catch (error) {
    console.error("========== STORAGE UPLOAD EXCEPTION ==========");
    console.error("Message:", error.message);
    console.error("Name:", error.name);
    console.error("Stack:", error.stack);
    console.error("===============================================");

    throw error;
  }
}

/**
 * Delete file from Supabase private bucket.
 */
async function removeSupabase(key) {
  console.log("========== SUPABASE DELETE START ==========");
  console.log("Bucket:", SUPABASE_BUCKET);
  console.log("Key:", key);

  try {
    const client = getSupabase();

    const { data, error } = await client.storage
      .from(SUPABASE_BUCKET)
      .remove([key]);

    if (error) {
      console.error("========== SUPABASE DELETE ERROR ==========");
      console.error("Message:", error.message);
      console.error("Name:", error.name);
      console.error("Status:", error.status);
      console.error("StatusCode:", error.statusCode);
      console.error("Error object:", error);
      console.error("============================================");

      throw new Error(
        `Supabase delete failed: ${error.message}`
      );
    }

    console.log("========== SUPABASE DELETE SUCCESS ==========");
    console.log("Delete data:", data);
    console.log("=============================================");

    return data;
  } catch (error) {
    console.error("========== STORAGE DELETE EXCEPTION ==========");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("===============================================");

    throw error;
  }
}

/**
 * Generate temporary signed URL for private file.
 */
async function createSignedDownloadUrl(key, expiresIn = 600) {
  console.log("========== SUPABASE SIGNED URL ==========");
  console.log("Bucket:", SUPABASE_BUCKET);
  console.log("Key:", key);
  console.log("Expires in:", expiresIn, "seconds");

  try {
    if (!key) {
      throw new Error("Storage key is required");
    }

    const client = getSupabase();

    const { data, error } = await client.storage
      .from(SUPABASE_BUCKET)
      .createSignedUrl(key, expiresIn);

    if (error) {
      console.error("========== SIGNED URL ERROR ==========");
      console.error("Message:", error.message);
      console.error("Name:", error.name);
      console.error("Status:", error.status);
      console.error("StatusCode:", error.statusCode);
      console.error("Error object:", error);
      console.error("=======================================");

      throw new Error(
        `Supabase signed URL failed: ${error.message}`
      );
    }

    if (!data || !data.signedUrl) {
      console.error("Supabase returned no signed URL.");
      console.error("Response data:", data);

      throw new Error(
        "Supabase did not return a signed URL"
      );
    }

    console.log("Signed URL generated successfully.");

    return data.signedUrl;
  } catch (error) {
    console.error("========== SIGNED URL EXCEPTION ==========");
    console.error("Message:", error.message);
    console.error("Stack:", error.stack);
    console.error("==========================================");

    throw error;
  }
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

  // Old local/cloudinary files are intentionally
  // not deleted during migration.
}

module.exports = {
  saveFile,
  removeFile,
  createSignedDownloadUrl,
  MIME_BY_EXT,
};