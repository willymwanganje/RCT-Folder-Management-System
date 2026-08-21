const prisma = require("../config/prisma");

async function writeAudit({ actorId, action, resourceType, resourceId, ipAddress, metadata }) {
  await prisma.auditLog.create({
    data: {
      actorId: actorId || null,
      action,
      resourceType,
      resourceId: resourceId || null,
      ipAddress: ipAddress || null,
      metadata: metadata || undefined,
    },
  });
}

function clientIp(req) {
  return req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || req.socket?.remoteAddress;
}

module.exports = { writeAudit, clientIp };
