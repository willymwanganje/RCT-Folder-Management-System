import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

export default function CategoriesPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(null);

  async function load() {
    const res = await api.get("/api/categories");
    setRows(res.data);
  }

  useEffect(() => {
    load().catch((err) => toast.push(err.message, "error"));
  }, []);

  async function save(e, id) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const payload = { name: fd.get("name"), description: fd.get("description"), isActive: fd.get("isActive") === "on" };
    try {
      if (id) await api.put(`/api/categories/${id}`, payload);
      else await api.post("/api/categories", payload);
      toast.push(id ? "Category updated" : "Category created");
      setEditing(null);
      setCreating(false);
      load();
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  async function remove(id) {
    try {
      await api.del(`/api/categories/${id}`);
      toast.push("Category deleted");
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
          <h1>Categories</h1>
          <p>Database-driven classification for RCT documents.</p>
        </div>
        {can("category.create") && (
          <button className="btn primary" type="button" onClick={() => setCreating(true)}>
            New category
          </button>
        )}
      </div>
      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Documents</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className="chip">{c.name}</span>
                </td>
                <td>{c.description}</td>
                <td>{c.isActive ? "Active" : "Inactive"}</td>
                <td>{c._count?.documents ?? 0}</td>
                <td className="row-actions">
                  {can("category.update") && (
                    <button className="btn ghost sm" type="button" onClick={() => setEditing(c)}>
                      Edit
                    </button>
                  )}
                  {can("category.delete") && (
                    <button className="btn ghost sm" type="button" onClick={() => setPending(c)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <Modal title={editing ? "Update category" : "Create category"} onClose={() => { setCreating(false); setEditing(null); }}>
          <form className="form-grid" onSubmit={(e) => save(e, editing?.id)}>
            <label className="full">
              Name
              <input name="name" defaultValue={editing?.name || ""} required />
            </label>
            <label className="full">
              Description
              <textarea name="description" rows="3" defaultValue={editing?.description || ""} />
            </label>
            <label className="check">
              <input type="checkbox" name="isActive" defaultChecked={editing ? editing.isActive : true} /> Active
            </label>
            <div className="form-actions full">
              <button className="btn primary" type="submit">
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {pending && (
        <ConfirmDialog
          title="Delete category"
          message="Categories with documents cannot be deleted."
          danger
          onClose={() => setPending(null)}
          onConfirm={() => remove(pending.id)}
        />
      )}
    </div>
  );
}
