const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const { PERMISSIONS, ROLE_SLUGS, USER_DEFAULT_PERMISSIONS } = require("../src/config/permissions");

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Policy", description: "Organizational policies and procedures" },
  { name: "Gallery", description: "Photos and visual records" },
  { name: "Program", description: "Programme and project documentation" },
  { name: "IDH", description: "IDH programme files" },
  { name: "IRVC", description: "IRVC programme files" },
];

function slugify(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

async function main() {
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { key: perm.key },
      update: { name: perm.name, groupName: perm.groupName },
      create: perm,
    });
  }

  const allPermissions = await prisma.permission.findMany();
  const byKey = Object.fromEntries(allPermissions.map((p) => [p.key, p]));

  const superAdmin = await prisma.role.upsert({
    where: { slug: ROLE_SLUGS.SUPER_ADMIN },
    update: { name: "Super Admin", isSystem: true },
    create: {
      name: "Super Admin",
      slug: ROLE_SLUGS.SUPER_ADMIN,
      description: "Full system control",
      isSystem: true,
    },
  });

  const admin = await prisma.role.upsert({
    where: { slug: ROLE_SLUGS.ADMIN },
    update: { name: "Admin", isSystem: true },
    create: {
      name: "Admin",
      slug: ROLE_SLUGS.ADMIN,
      description: "Organizational administrator",
      isSystem: true,
    },
  });

  const user = await prisma.role.upsert({
    where: { slug: ROLE_SLUGS.USER },
    update: { name: "User", isSystem: true },
    create: {
      name: "User",
      slug: ROLE_SLUGS.USER,
      description: "Standard document user",
      isSystem: true,
    },
  });

  async function syncRole(roleId, keys) {
    await prisma.rolePermission.deleteMany({ where: { roleId } });
    await prisma.rolePermission.createMany({
      data: keys.map((key) => ({ roleId, permissionId: byKey[key].id })),
    });
  }

  await syncRole(
    superAdmin.id,
    allPermissions.map((p) => p.key)
  );
  await syncRole(
    admin.id,
    allPermissions.map((p) => p.key)
  );
  await syncRole(user.id, USER_DEFAULT_PERMISSIONS);

  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { slug: slugify(cat.name) },
      update: { name: cat.name, description: cat.description },
      create: { name: cat.name, slug: slugify(cat.name), description: cat.description },
    });
    const existingFolder = await prisma.folder.findFirst({
      where: { name: cat.name, parentId: null },
    });
    if (!existingFolder) {
      await prisma.folder.create({
        data: { name: cat.name, categoryId: category.id },
      });
    }
  }

  await prisma.systemSetting.upsert({
    where: { key: "allowed_file_types" },
    update: {},
    create: {
      key: "allowed_file_types",
      value: "pdf,doc,docx,xls,xlsx,ppt,pptx,txt,csv,jpg,jpeg,png",
    },
  });
  await prisma.systemSetting.upsert({
    where: { key: "max_file_size_mb" },
    update: {},
    create: { key: "max_file_size_mb", value: "25" },
  });

  const email = process.env.INITIAL_ADMIN_EMAIL;
  const password = process.env.INITIAL_ADMIN_PASSWORD;
  const fullName = process.env.INITIAL_ADMIN_NAME || "RCT Super Admin";

  if (!email || !password) {
    console.warn("INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD not set — skipping super admin user seed.");
  } else {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!existing) {
      const passwordHash = await bcrypt.hash(password, 12);
      await prisma.user.create({
        data: {
          fullName,
          email: email.toLowerCase(),
          passwordHash,
          isSuperAdmin: true,
          isActive: true,
          roleId: superAdmin.id,
        },
      });
      console.log(`Seeded SUPER ADMIN: ${email}`);
    } else {
      console.log(`SUPER ADMIN already exists: ${email}`);
    }
  }

  console.log("Seed completed.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
