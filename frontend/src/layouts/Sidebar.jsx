import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import rctLogo from "../assets/rct-logo.png";
import "../Sidebar.css";

const NAV = [
  { to: "/", label: "Dashboard", icon: "bi-house-door-fill", end: true },
  { to: "/documents", label: "All Documents", icon: "bi-file-earmark-text", permission: "document.view" },
  { to: "/categories", label: "Categories", icon: "bi-folder2-open", permission: "category.view" },
  { to: "/users", label: "Users", icon: "bi-people", permission: "user.view" },
  { to: "/administrators", label: "Administrators", icon: "bi-shield-check", permission: "admin.view" },
  { to: "/roles", label: "Roles & Permissions", icon: "bi-shield-check", permission: "role.view" },
  { to: "/audit-logs", label: "Audit Logs", icon: "bi-clock-history", permission: "audit.view" },
  { to: "/settings", label: "Settings", icon: "bi-gear", permission: "settings.view" },
];

export default function Sidebar({ open, onClose }) {
  const { user, can } = useAuth();
  const items = NAV.filter((item) => !item.permission || can(item.permission));

  return (
    <aside className={`sidebar ${open ? "open" : ""}`} aria-label="Main navigation">
      <div className="brand brand-clean">
        <img src={rctLogo} alt="Rice Council of Tanzania" className="brand-logo" />
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose} className="sidebar-link">
            <i className={`bi ${item.icon}`} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        ))}
        <NavLink to="/profile" onClick={onClose} className="sidebar-link">
          <i className="bi bi-person-circle" aria-hidden="true" /><span>Profile</span>
        </NavLink>
      </nav>
      <div className="sidebar-help">
        <div className="help-icon"><i className="bi bi-question-circle" /></div>
        <div><strong>Need Help?</strong><small>Contact system administrator</small></div>
        <i className="bi bi-chevron-right help-arrow" />
      </div>
      <span className="sidebar-user-role" aria-hidden="true">{user?.role?.name || "RCT User"}</span>
    </aside>
  );
}