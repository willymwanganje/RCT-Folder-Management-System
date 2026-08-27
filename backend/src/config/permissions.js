const PERMISSIONS = [
  { key: "user.create", name: "Create users", groupName: "Users" },
  { key: "user.view", name: "View users", groupName: "Users" },
  { key: "user.update", name: "Update users", groupName: "Users" },
  { key: "user.delete", name: "Delete users", groupName: "Users" },
  { key: "user.activate", name: "Activate users", groupName: "Users" },
  { key: "user.deactivate", name: "Deactivate users", groupName: "Users" },
  { key: "user.reset_password", name: "Reset user passwords", groupName: "Users" },
  { key: "user.assign_role", name: "Assign user roles", groupName: "Users" },
  { key: "user.assign_permission", name: "Assign user permissions", groupName: "Users" },

  { key: "admin.create", name: "Create administrators", groupName: "Administrators" },
  { key: "admin.view", name: "View administrators", groupName: "Administrators" },
  { key: "admin.update", name: "Update administrators", groupName: "Administrators" },
  { key: "admin.delete", name: "Delete administrators", groupName: "Administrators" },
  { key: "admin.activate", name: "Activate administrators", groupName: "Administrators" },
  { key: "admin.deactivate", name: "Deactivate administrators", groupName: "Administrators" },

  { key: "role.view", name: "View roles", groupName: "Roles" },
  { key: "role.update", name: "Update role permissions", groupName: "Roles" },

  { key: "category.create", name: "Create categories", groupName: "Categories" },
  { key: "category.view", name: "View categories", groupName: "Categories" },
  { key: "category.update", name: "Update categories", groupName: "Categories" },
  { key: "category.delete", name: "Delete categories", groupName: "Categories" },

  { key: "folder.create", name: "Create folders", groupName: "Folders" },
  { key: "folder.view", name: "View folders", groupName: "Folders" },
  { key: "folder.update", name: "Update folders", groupName: "Folders" },
  { key: "folder.delete", name: "Delete folders", groupName: "Folders" },

  { key: "document.create", name: "Upload documents", groupName: "Documents" },
  { key: "document.view", name: "View documents", groupName: "Documents" },
  { key: "document.update", name: "Update documents", groupName: "Documents" },
  { key: "document.delete", name: "Delete documents", groupName: "Documents" },
  { key: "document.download", name: "Download documents", groupName: "Documents" },

  { key: "audit.view", name: "View audit logs", groupName: "Audit" },
  { key: "dashboard.admin", name: "View admin dashboard", groupName: "Dashboard" },
  { key: "settings.view", name: "View settings", groupName: "Settings" },
  { key: "settings.update", name: "Update settings", groupName: "Settings" },
];

const ROLE_SLUGS = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  USER: "user",
};

const USER_DEFAULT_PERMISSIONS = [
  "document.view",
  "document.create",
  "document.download",
  "folder.view",
  "category.view",
];

// These are not granted to a normal admin by default.
// Existing database assignments must still be removed once in Roles & Permissions.
const ADMIN_EXCLUDED_PERMISSIONS = [
  "admin.create",
  "admin.view",
  "admin.update",
  "admin.delete",
  "admin.activate",
  "admin.deactivate",
  "role.update",
  "user.assign_role",
  "user.assign_permission",
  "audit.view",
  "settings.update",
];

module.exports = {
  PERMISSIONS,
  ROLE_SLUGS,
  USER_DEFAULT_PERMISSIONS,
  ADMIN_EXCLUDED_PERMISSIONS,
};