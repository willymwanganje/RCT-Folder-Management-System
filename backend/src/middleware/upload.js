const multer = require("multer");
const { env } = require("../config/env");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: (Number(env.maxFileSizeMb) || 25) * 1024 * 1024 },
});

module.exports = { upload };
