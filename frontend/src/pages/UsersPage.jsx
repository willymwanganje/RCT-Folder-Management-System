import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Avatar from "../components/Avatar";
import Pagination from "../components/Pagination";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

export default function UsersPage({ adminMode }) {
  const { can } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [roles, setRoles] = useState([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null);
  const [pending, setPending] = useState(null);

  const base = adminMode ? "/api/admins" : "/api/users";
  const canCreate = adminMode ? can("admin.create") : can("user.create");
  const canUpdate = adminMode ? can("admin.update") : can("user.update");
  const canDelete = adminMode ? can("admin.delete") : can("user.delete");

  async function load() {
    const res = await api.get(`${base}?q=${encodeURIComponent(q)}&page=${page}&pageSize=12`);
    setRows(res.data.data);
    setMeta(res.data.meta);
  }

  useEffect(() => {
    load().catch((err) => toast.push(err.message, "error"));
  }, [q, page, adminMode]);

  useEffect(() => {
    if (can("role.view")) {
      api.get("/api/roles").then((r) => setRoles(r.data)).catch(() => {});
    }
  }, [can]);

  async function create(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.post(base, {
        fullName: fd.get("fullName"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        password: fd.get("password"),
        roleId: fd.get("roleId") || undefined,
      });
      toast.push(adminMode ? "Administrator created" : "User created");
      setCreating(false);
      load();
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  async function update(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.put(`${base}/${editing.id}`, {
        fullName: fd.get("fullName"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        roleId: fd.get("roleId") || undefined,
      });
      toast.push("Account updated");
      setEditing(null);
      load();
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  async function toggle(row) {
    const path = row.isActive ? `${base}/${row.id}/deactivate` : `${base}/${row.id}/activate`;
    try {
      await api.post(path);
      toast.push(row.isActive ? "Account deactivated" : "Account activated");
      load();
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  async function resetPassword(e) {
    e.preventDefault();
    try {
      await api.post(`${base}/${editing.id}/reset-password`, {
        newPassword: new FormData(e.target).get("newPassword"),
      });
      toast.push("Password reset");
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  async function remove() {
    try {
      await api.del(`${base}/${pending.id}`);
      toast.push("Account deleted");
      setPending(null);
      load();
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{adminMode ? "Administrators" : "Users"}</h1>
          <p>{adminMode ? "Manage privileged RCT administrators." : "Manage staff accounts, roles and access."}</p>
        </div>
        {canCreate && (
          <button className="btn primary" type="button" onClick={() => setCreating(true)}>
            {adminMode ? "New administrator" : "New user"}
          </button>
        )}
      </div>
      <form
        className="filters card"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQ(new FormData(e.target).get("q"));
        }}
      >
        <input name="q" placeholder="Search name, email or phone" />
        <button className="btn primary" type="submit">
          Search
        </button>
      </form>
      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Person</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="cell-user">
                    <Avatar user={u} />
                    <Link to={`/users/${u.id}`}>{u.fullName}</Link>
                  </div>
                </td>
                <td>{u.email}</td>
                <td>{u.role?.name}</td>
                <td>{u.isActive ? "Active" : "Deactivated"}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="row-actions">
                  {canUpdate && (
                    <button className="btn ghost sm" type="button" onClick={() => setEditing(u)}>
                      Edit
                    </button>
                  )}
                  {canUpdate && (
                    <button className="btn ghost sm" type="button" onClick={() => toggle(u)}>
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  )}
                  {canDelete && (
                    <button className="btn ghost sm" type="button" onClick={() => setPending(u)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination meta={meta} onPage={setPage} />
      </div>

      {creating && (
        <Modal title={adminMode ? "Create administrator" : "Create user"} onClose={() => setCreating(false)}>
          <form className="form-grid" onSubmit={create}>
            <label>
              Full name
              <input name="fullName" required />
            </label>
            <label>
              Email
              <input type="email" name="email" required />
            </label>
            <label>
              Phone
              <input name="phone" />
            </label>
            <label>
              Temporary password
              <input name="password" type="password" required minLength={10} />
            </label>
            {roles.length > 0 && (
              <label className="full">
                Role
                <select name="roleId">
                  <option value="">Default</option>
                  {roles
                    .filter((r) => (adminMode ? r.slug !== "user" : true))
                    .map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                </select>
              </label>
            )}
            <div className="form-actions full">
              <button className="btn primary" type="submit">
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title="Update account" onClose={() => setEditing(null)} wide>
          <form className="form-grid" onSubmit={update}>
            <label>
              Full name
              <input name="fullName" defaultValue={editing.fullName} required />
            </label>
            <label>
              Email
              <input type="email" name="email" defaultValue={editing.email} required />
            </label>
            <label>
              Phone
              <input name="phone" defaultValue={editing.phone || ""} />
            </label>
            {roles.length > 0 && (
              <label>
                Role
                <select name="roleId" defaultValue={editing.role?.id}>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="form-actions full">
              <button className="btn primary" type="submit">
                Save
              </button>
            </div>
          </form>
          <form className="form-grid" onSubmit={resetPassword}>
            <label className="full">
              Reset password
              <input name="newPassword" type="password" minLength={10} required />
            </label>
            <div className="form-actions full">
              <button className="btn ghost" type="submit">
                Reset password
              </button>
            </div>
          </form>
        </Modal>
      )}

      {pending && (
        <ConfirmDialog
          title="Delete account"
          message="Accounts with uploaded documents cannot be deleted. Deactivate them instead."
          danger
          onClose={() => setPending(null)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}
