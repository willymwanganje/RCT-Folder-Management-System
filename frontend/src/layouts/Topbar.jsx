import { useAuth } from "../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function goBack() {
    if (location.key !== "default") navigate(-1);
    else navigate("/");
  }

  return (
    <header className="topbar">
      <button
        type="button"
        className="back-btn"
        onClick={goBack}
        aria-label="Go back"
        title="Go back"
        disabled={location.pathname === "/"}
      >
        <i className="bi bi-arrow-left" />
        <span>Back</span>
      </button>
      <button type="button" className="menu-btn" onClick={onMenu} aria-label="Open menu">
        <i className="bi bi-list" />
      </button>
      <div className="topbar-title">Enterprise Document Control</div>
      <div className="topbar-actions">
        <div className="topbar-user">
          <Avatar user={user} size={42} />
          <div><strong>{user?.fullName || "RCT User"}</strong><small>{user?.role?.name || "User"}</small></div>
          <i className="bi bi-chevron-down user-chevron" />
        </div>
        <button type="button" className="btn ghost sm topbar-signout" onClick={logout}>Sign out</button>
      </div>
    </header>
  );
}
