import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

export default function RolesPage() {
  const { user, can } = useAuth();
  const toast = useToast();
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [checked, setChecked] = useState([]);

  const canManageSelectedRole = can("role.update") && selected?.slug !== "super_admin";

  async function load() {
    const [r, p] = await Promise.all([
      api.get("/api/roles"),
      api.get("/api/permissions"),
    ]);
    setRoles(r.data);
    setPermissions(p.data);
    if (!selected && r.data[0]) select(r.data[0], r.data);
  }

  function select(role, list = roles) {
    const current = list.find((item) => item.id === role.id) || role;
    setSelected(current);
    setChecked(current.permissions?.map((rp) => rp.permissionId) || []);
  }

  useEffect(() => {
    load().catch((err) => toast.push(err.message, "error"));
  }, []);

  function toggle(id) {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  async function save() {
    if (!selected || !canManageSelectedRole) return;
    try {
      await api.put(`/api/roles/${selected.id}/permissions`, { permissionIds: checked });
      toast.push("Permissions saved");
      await load();
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  const groups = permissions.reduce((acc, permission) => {
    acc[permission.groupName] = acc[permission.groupName] || [];
    acc[permission.groupName].push(permission);
    return acc;
  }, {});

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Roles & permissions</h1>
          <p>Granular RBAC for RCT staff and administrators.</p>
        </div>
      </div>
      <div className="split">
        <section className="card">
          {roles.map((role) => (
            <button
              key={role.id}
              type="button"
              className={`role-item ${selected?.id === role.id ? "active" : ""}`}
              onClick={() => select(role)}
            >
              <strong>{role.name}</strong>
              <small>{role._count?.users || 0} accounts</small>
            </button>
          ))}
        </section>
        <section className="card">
          {selected && (
            <>
              <h2>{selected.name}</h2>
              {!canManageSelectedRole && (
                <p className="muted">
                  {selected.slug === "super_admin"
                    ? "The Super Admin role is protected."
                    : "You do not have permission to change role permissions."}
                </p>
              )}
              {Object.entries(groups).map(([group, items]) => (
                <fieldset key={group} className="perm-group">
                  <legend>{group}</legend>
                  {items.map((permission) => (
                    <label key={permission.id} className="check">
                      <input
                        type="checkbox"
                        checked={checked.includes(permission.id)}
                        disabled={!canManageSelectedRole}
                        onChange={() => toggle(permission.id)}
                      />
                      {permission.name}
                      <code>{permission.key}</code>
                    </label>
                  ))}
                </fieldset>
              ))}
              {canManageSelectedRole && (
                <button className="btn primary" type="button" onClick={save}>
                  Save permissions
                </button>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
