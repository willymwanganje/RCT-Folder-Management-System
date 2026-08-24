const REQUIRED_IN_PRODUCTION = ["DATABASE_URL", "JWT_SECRET"];

function loadEnv() {
  if (process.env.NODE_ENV === "production") {
    for (const key of REQUIRED_IN_PRODUCTION) {
      if (!process.env[key]) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    if (process.env.JWT_SECRET === "change-me-in-production") {
      throw new Error("JWT_SECRET must be changed in production");
    }
  }
}

const env = {
  nodeEnv: process.env.NODE_ENV || "development",

  port: Number(process.env.PORT) || 5000,

  databaseUrl: process.env.DATABASE_URL,

  jwtSecret:
    process.env.JWT_SECRET || "dev-only-jwt-secret",

  jwtExpiresIn:
    process.env.JWT_EXPIRES_IN || "8h",

  frontendUrl:
    process.env.FRONTEND_URL || "http://localhost:5173",

  corsOrigins:
    process.env.CORS_ORIGINS || "",

  storageProvider:
    process.env.STORAGE_PROVIDER || "local",

  maxFileSizeMb:
    Number(process.env.MAX_FILE_SIZE_MB) || 25,

  allowedFileTypes:
    process.env.ALLOWED_FILE_TYPES ||
    "pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,jpg,jpeg,png",

  initialAdminEmail:
    process.env.INITIAL_ADMIN_EMAIL,

  initialAdminPassword:
    process.env.INITIAL_ADMIN_PASSWORD,

  initialAdminName:
    process.env.INITIAL_ADMIN_NAME ||
    "RCT Super Admin",

  // Supabase Storage
  supabase: {
    url: process.env.SUPABASE_URL,

    serviceRoleKey:
      process.env.SUPABASE_SERVICE_ROLE_KEY,

    bucket:
      process.env.SUPABASE_BUCKET ||
      "rct-documents",
  },

  // Cloudinary - kept temporarily
  cloudinary: {
    cloudName:
      process.env.CLOUDINARY_CLOUD_NAME,

    apiKey:
      process.env.CLOUDINARY_API_KEY,

    apiSecret:
      process.env.CLOUDINARY_API_SECRET,
  },

  smtp: {
    host:
      process.env.SMTP_HOST,

    port:
      Number(process.env.SMTP_PORT) || 587,

    user:
      process.env.SMTP_USER,

    pass:
      process.env.SMTP_PASS,

    from:
      process.env.SMTP_FROM ||
      "RCT Folder Management <noreply@localhost>",
  },
};

module.exports = {
  loadEnv,
  env,
};