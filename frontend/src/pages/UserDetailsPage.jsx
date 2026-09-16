import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Avatar from "../components/Avatar";
import FileIcon from "../components/FileIcon";
import Spinner from "../components/Spinner";

export default function UserDetailsPage() {
  const { id } = useParams();
  const { can } = useAuth();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [docs, setDocs] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [saving, setSaving] = useState(false);

  async function loadUser() {
    try {
      const response = await api.get(`/api/users/${id}`);
      return response.data;
    } catch {
      const response = await api.get(`/api/admins/${id}`);
      return response.data;
    }
  }

  useEffect(() => {
    loadUser().then((nextUser) => {
      setUser(nextUser);
      setOverrides(Object.fromEntries((nextUser.permissionOverrides || []).map((item) => [item.permissionId, item.granted ? "grant" : "deny"])));
    }).catch((err) => toast.push(err.message, "error"));
    api.get(`/api/users/${id}/documents`).then((r) => setDocs(r.data.data)).catch(() => {});
    if (can("user.assign_permission")) {
      api.get("/api/permissions").then((r) => setPermissions(r.data)).catch((err) => toast.push(err.message, "error"));
    }
  }, [id, can]);

  async function savePermissions() {
    setSaving(true);
    try {
      const permissionOverrides = Object.entries(overrides)
        .filter(([, value]) => value !== "default")
        .map(([permissionId, value]) => ({ permissionId, granted: value === "grant" }));
      const base = user.role?.slug === "admin" || user.role?.slug === "super_admin" ? "/api/admins" : "/api/users";
      const response = await api.put(`${base}/${id}/permissions`, { permissionOverrides });
      setUser(response.data);
      toast.push("User-specific permissions saved");
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setSaving(false);
    }
  }

  if (!user) return <Spinner />;
  const groups = permissions.reduce((acc, permission) => {
    (acc[permission.groupName] ||= []).push(permission);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-head">
        <div className="cell-user"><Avatar user={user} size={56} /><div><h1>{user.fullName}</h1><p>{user.email} · {user.role?.name} · {user.isActive ? "Active" : "Deactivated"}</p></div></div>
      </div>
      <section className="card">
        <h2>Uploaded documents</h2>
        <ul className="activity">{docs.map((d) => <li key={d.id}><FileIcon type={d.fileType} /><Link to={`/documents/${d.id}`}>{d.name}</Link></li>)}</ul>
      </section>
      {can("user.assign_permission") && permissions.length > 0 && (
        <section className="card" style={{ marginTop: 20 }}>
          <h2>Permissions for this user</h2>
          <p className="muted">These overrides affect only <strong>{user.fullName}</strong>. “Default” follows the assigned role; Grant or Deny overrides it for this user only.</p>
          {Object.entries(groups).map(([group, items]) => (
            <fieldset key={group} className="perm-group"><legend>{group}</legend>
              {items.map((permission) => (
                <label key={permission.id} className="check">
                  <select value={overrides[permission.id] || "default"} onChange={(e) => setOverrides((prev) => ({ ...prev, [permission.id]: e.target.value }))}>
                    <option value="default">Default role</option><option value="grant">Grant</option><option value="deny">Deny</option>
                  </select>
                  {permission.name} <code>{permission.key}</code>
                </label>
              ))}
            </fieldset>
          ))}
          <button className="btn primary" type="button" disabled={saving} onClick={savePermissions}>{saving ? "Saving…" : "Save user permissions"}</button>
        </section>
      )}
    </div>
  );
}