require("dotenv").config();

// DEBUG - ondoa baada ya kutatua tatizo
console.log("=== ENV DEBUG ===");
console.log("SUPABASE_URL:", process.env.SUPABASE_URL);
console.log("SUPABASE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "EXISTS" : "MISSING");
console.log("STORAGE_PROVIDER:", process.env.STORAGE_PROVIDER);
console.log("=================");

const { loadEnv, env } = require("./src/config/env");
loadEnv();

const app = require("./src/app");

app.listen(env.port, () => {
  console.log(`RCT Folder Management System API running on port ${env.port}`);
});