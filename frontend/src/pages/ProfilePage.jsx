import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import Avatar from "../components/Avatar";

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function save(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const res = await api.put("/api/profile", { fullName: fd.get("fullName"), phone: fd.get("phone") });
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
        <label>
          Current password
          <input type="password" name="currentPassword" required />
        </label>
        <label>
          New password
          <input type="password" name="newPassword" minLength={10} required />
        </label>
        <div className="form-actions full">
          <button className="btn primary" type="submit">
            Update password
          </button>
        </div>
      </form>
    </div>
  );
}
