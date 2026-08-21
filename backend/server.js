require("dotenv").config();

const { loadEnv, env } = require("./src/config/env");
loadEnv();

const app = require("./src/app");

app.listen(env.port, () => {
  console.log(`RCT Folder Management System API running on port ${env.port}`);
});
