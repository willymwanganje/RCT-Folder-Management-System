const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 12;

async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

function validatePasswordStrength(password) {
  if (!password || password.length < 10) {
    return "Password must be at least 10 characters long";
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return "Password must include uppercase, lowercase, and a number";
  }
  return null;
}

module.exports = { hashPassword, verifyPassword, validatePasswordStrength };
