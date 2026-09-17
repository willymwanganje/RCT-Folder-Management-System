import { useAuth } from "../context/AuthContext";
import Avatar from "../components/Avatar";

export default function Topbar({ onMenu }) {
  const { user, logout } = useAuth();
  return (
    <header className="topbar">
      <button type="button" className="menu-btn" onClick={onMenu} aria-label="Open menu">
        ☰
      </button>
      <div className="topbar-title">
        <span>Enterprise Document Control</span>
      </div>
      <div className="topbar-user">
        <Avatar user={user} size={34} />
        <div>
          <strong>{user?.fullName}</strong>
          <small>{user?.role?.name}</small>
        </div>
        <button type="button" className="btn ghost sm" onClick={logout}>
          Sign out
        </button>
      </div>
    </header>
  );
}
