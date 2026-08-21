const prisma = require("../config/prisma");
const { ROLE_SLUGS } = require("../config/permissions");

async function adminStats() {
  const [
    totalUsers,
    activeUsers,
    deactivatedUsers,
    totalAdmins,
    totalCategories,
    totalFolders,
    totalDocuments,
    recentUploads,
    recentActivity,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.count({
      where: { role: { slug: { in: [ROLE_SLUGS.ADMIN, ROLE_SLUGS.SUPER_ADMIN] } } },
    }),
    prisma.category.count(),
    prisma.folder.count(),
    prisma.document.count(),
    prisma.document.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: { select: { id: true, fullName: true, profilePhotoUrl: true } },
        category: true,
      },
    }),
    prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { actor: { select: { id: true, fullName: true } } },
    }),
  ]);

  return {
    totals: {
      users: totalUsers,
      activeUsers,
      deactivatedUsers,
      administrators: totalAdmins,
      categories: totalCategories,
      folders: totalFolders,
      documents: totalDocuments,
    },
    recentUploads,
    recentActivity,
  };
}

async function userStats(userId) {
  const [myDocuments, recentDocuments, folderCount, accessibleDocuments] = await Promise.all([
    prisma.document.count({ where: { uploadedById: userId } }),
    prisma.document.findMany({
      where: { uploadedById: userId },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { category: true, folder: true },
    }),
    prisma.folder.count(),
    prisma.document.count(),
  ]);
  return {
    totals: {
      myDocuments,
      accessibleDocuments,
      folders: folderCount,
    },
    recentDocuments,
  };
}

async function listAuditLogs(query) {
  const page = Number(query.page) || 1;
  const pageSize = Number(query.pageSize) || 25;
  const where = {};
  if (query.action) where.action = { contains: query.action, mode: "insensitive" };
  if (query.resourceType) where.resourceType = query.resourceType;
  if (query.actorId) where.actorId = query.actorId;
  if (query.q) {
    where.OR = [
      { action: { contains: query.q, mode: "insensitive" } },
      { resourceType: { contains: query.q, mode: "insensitive" } },
      { actor: { fullName: { contains: query.q, mode: "insensitive" } } },
    ];
  }
  const [total, data] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: { actor: { select: { id: true, fullName: true, email: true, profilePhotoUrl: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  return { data, meta: { total, page, pageSize } };
}

module.exports = { adminStats, userStats, listAuditLogs };
