const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/jwt");
const { findUserById, toPublicUser } = require("../services/userService");

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
      throw new ApiError(401, "Unauthorized");
    }
    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new ApiError(401, "Invalid or expired token");
    }
    const user = await findUserById(payload.sub);
    if (!user || !user.isActive) {
      throw new ApiError(401, "Unauthorized");
    }
    req.user = user;
    req.authUser = await toPublicUser(user);
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };
