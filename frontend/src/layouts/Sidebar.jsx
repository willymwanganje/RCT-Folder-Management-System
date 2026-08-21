import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import rctLogo from "../assets/rct-logo.png";

const ADMIN_NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/documents", label: "All Documents", permission: "document.view" },
  { to: "/documents/upload", label: "Upload Document", permission: "document.create" },
  { to: "/folders", label: "Folders", permission: "folder.view" },
  { to: "/categories", label: "Categories", permission: "category.view" },
  { to: "/users", label: "Users", permission: "user.view" },
  { to: "/administrators", label: "Administrators", permission: "admin.view" },
  { to: "/roles", label: "Roles & Permissions", permission: "role.view" },
  { to: "/audit-logs", label: "Audit Logs", permission: "audit.view" },
  { to: "/settings", label: "Settings", permission: "settings.view" },
  { to: "/profile", label: "Profile" },
];

const USER_NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/documents", label: "Documents", permission: "document.view" },
  { to: "/documents/mine", label: "My Documents", permission: "document.view" },
  { to: "/folders", label: "Folders", permission: "folder.view" },
  { to: "/documents/upload", label: "Upload Document", permission: "document.create" },
  { to: "/profile", label: "Profile" },
  { to: "/settings", label: "Settings" },
];

export default function Sidebar({ open, onClose }) {
  const { user, can } = useAuth();

  const isAdmin = ["super_admin", "admin"].includes(user?.role?.slug);

  const items = (isAdmin ? ADMIN_NAV : USER_NAV).filter(
    (item) => !item.permission || can(item.permission)
  );

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <div className="brand">
        <img
          src={rctLogo}
          alt="Rice Council of Tanzania Logo"
          className="brand-logo"
        />

        <div>
          <strong>Rice Council of Tanzania</strong>
          <small>Folder Management</small>
        </div>
      </div>

      <nav>
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}