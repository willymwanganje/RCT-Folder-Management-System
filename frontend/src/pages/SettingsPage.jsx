import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function SettingsPage() {
  const { can, user } = useAuth();
  const toast = useToast();
  const [settings, setSettings] = useState(null);

  useEffect(() => {
    api
      .get("/api/settings")
      .then((r) => setSettings(r.data))
      .catch((err) => toast.push(err.message, "error"));
  }, []);

  async function save(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const res = await api.put("/api/settings", {
        allowedFileTypes: fd.get("allowedFileTypes"),
        maxFileSizeMb: Number(fd.get("maxFileSizeMb")),
      });
      setSettings(res.data);
      toast.push("Settings saved");
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  if (!settings) return null;

  return (
    <div className="narrow">
      <div className="page-head">
        <div>
          <h1>Settings</h1>
          <p>File policy and account preferences.</p>
        </div>
      </div>
      <section className="card">
        <h2>Account</h2>
        <p>
          Signed in as <strong>{user.fullName}</strong> ({user.email}). Use Profile to update your photo and password.
        </p>
      </section>
      {can("settings.update") ? (
        <form className="card form-grid" onSubmit={save}>
          <h2 className="full">File policy</h2>
          <label className="full">
            Allowed file types
            <input name="allowedFileTypes" defaultValue={settings.allowedFileTypes.join(",")} />
          </label>
          <label>
            Max file size (MB)
            <input type="number" name="maxFileSizeMb" min="1" defaultValue={settings.maxFileSizeMb} />
          </label>
          <p className="muted full">Storage provider: {settings.storageProvider}</p>
          <div className="form-actions full">
            <button className="btn primary" type="submit">
              Save settings
            </button>
          </div>
        </form>
      ) : (
        <section className="card">
          <p className="muted">Allowed types: {settings.allowedFileTypes.join(", ")}</p>
          <p className="muted">Maximum size: {settings.maxFileSizeMb} MB</p>
        </section>
      )}
    </div>
  );
}
