import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import Avatar from "../components/Avatar";

function PasswordField({ label, name, visible, onToggle, minLength }) {
  return (
    <label className="password-field">
      <span>{label}</span>
      <span className="password-input-wrap">
        <input
          type={visible ? "text" : "password"}
          name={name}
          minLength={minLength}
          required
          autoComplete={name === "currentPassword" ? "current-password" : "new-password"}
        />
        <button
          className="password-toggle"
          type="button"
          onClick={onToggle}
          aria-label={visible ? `Hide ${label}` : `Show ${label}`}
          title={visible ? "Hide password" : "Show password"}
        >
          <i className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
        </button>
      </span>
    </label>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  async function save(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const res = await api.put("/api/profile", {
        fullName: fd.get("fullName"),
        phone: fd.get("phone"),
      });
      setUser(res.data);
      toast.push("Profile updated");
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  async function changePassword(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.post("/api/auth/change-password", {
        currentPassword: fd.get("currentPassword"),
        newPassword: fd.get("newPassword"),
      });
      e.target.reset();
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      toast.push("Password changed");
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  async function uploadPhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    setBusy(true);
    try {
      const res = await api.postForm("/api/profile/photo", fd);
      setUser(res.data);
      toast.push("Photo updated");
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto() {
    try {
      const res = await api.del("/api/profile/photo");
      setUser(res.data);
      toast.push("Photo removed");
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  return (
    <div className="narrow">
      <div className="page-head">
        <div>
          <h1>Profile</h1>
          <p>Your RCT identity and security settings.</p>
        </div>
      </div>

      <section className="card profile-hero">
        <Avatar user={user} size={72} />
        <div>
          <h2>{user.fullName}</h2>
          <p>
            {user.email} · {user.role?.name} · {user.isActive ? "Active" : "Deactivated"}
          </p>
          <div className="row-actions">
            <label className="btn ghost sm">
              {busy ? "Uploading…" : "Change photo"}
              <input type="file" accept="image/png,image/jpeg" hidden onChange={uploadPhoto} />
            </label>
            {user.profilePhotoUrl && (
              <button className="btn ghost sm" type="button" onClick={removePhoto}>
                Remove photo
              </button>
            )}
          </div>
        </div>
      </section>

      <form className="card form-grid" onSubmit={save}>
        <label>
          Full name
          <input name="fullName" defaultValue={user.fullName} required />
        </label>
        <label>
          Phone
          <input name="phone" defaultValue={user.phone || ""} />
        </label>
        <label>
          Email
          <input value={user.email} disabled />
        </label>
        <div className="form-actions full">
          <button className="btn primary" type="submit">
            Save profile
          </button>
        </div>
      </form>

      <form className="card form-grid" onSubmit={changePassword}>
        <h2 className="full">Change password</h2>
        <PasswordField
          label="Current password"
          name="currentPassword"
          visible={showCurrentPassword}
          onToggle={() => setShowCurrentPassword((value) => !value)}
        />
        <PasswordField
          label="New password"
          name="newPassword"
          minLength={10}
          visible={showNewPassword}
          onToggle={() => setShowNewPassword((value) => !value)}
        />
        <div className="form-actions full">
          <button className="btn primary" type="submit">
            Update password
          </button>
        </div>
      </form>
    </div>
  );
}
