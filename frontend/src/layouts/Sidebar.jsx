import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import rctLogo from "../assets/rct-logo.jpg";
import "../Sidebar.css";
const ADMIN_NAV = [
  { to: "/", label: "Dashboard", icon: "bi-grid-1x2-fill", end: true },
  { to: "/documents", label: "All Documents", icon: "bi-file-earmark-text", permission: "document.view" },
  { to: "/documents/upload", label: "Upload Document", icon: "bi-cloud-arrow-up", permission: "document.create" },
  { to: "/folders", label: "Folders", icon: "bi-folder2-open", permission: "folder.view" },
  { to: "/categories", label: "Categories", icon: "bi-collection", permission: "category.view" },
  { to: "/users", label: "Users", icon: "bi-people", permission: "user.view" },
  { to: "/administrators", label: "Administrators", icon: "bi-shield-check", permission: "admin.view" },
  { to: "/roles", label: "Roles & Permissions", icon: "bi-key", permission: "role.view" },
  { to: "/audit-logs", label: "Audit Logs", icon: "bi-clock-history", permission: "audit.view" },
  { to: "/settings", label: "Settings", icon: "bi-gear", permission: "settings.view" },
  { to: "/profile", label: "Profile", icon: "bi-person-circle" },
];

const USER_NAV = [
  { to: "/", label: "Dashboard", icon: "bi-grid-1x2-fill", end: true },
  { to: "/documents", label: "Documents", icon: "bi-file-earmark-text", permission: "document.view" },
  { to: "/documents/mine", label: "My Documents", icon: "bi-file-person", permission: "document.view" },
  { to: "/folders", label: "Folders", icon: "bi-folder2-open", permission: "folder.view" },
  { to: "/documents/upload", label: "Upload Document", icon: "bi-cloud-arrow-up", permission: "document.create" },
  { to: "/profile", label: "Profile", icon: "bi-person-circle" },
  { to: "/settings", label: "Settings", icon: "bi-gear" },
];

export default function Sidebar({ open, onClose }) {
  const { user, can } = useAuth();
  const isAdmin = ["super_admin", "admin"].includes(user?.role?.slug);
  const items = (isAdmin ? ADMIN_NAV : USER_NAV).filter(
    (item) => !item.permission || can(item.permission)
  );

  return (
    <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Main navigation">
      <div className="brand brand-clean">
        <img
          src={rctLogo}
          alt="Rice Council of Tanzania"
          className="brand-logo"
        />
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onClose}
            className="sidebar-link"
          >
            <i className={`bi ${item.icon}`} aria-hidden="true"></i>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
