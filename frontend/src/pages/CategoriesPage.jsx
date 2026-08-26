import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
    const payload = {
      name: fd.get("name"),
      description: fd.get("description"),
      isActive: fd.get("isActive") === "on",
    };
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
    <div className="categories-page">
      <div className="page-head categories-page-head">
        <div>
          <span className="section-kicker"><i className="bi bi-collection-fill" /> Document library</span>
          <h1>Categories</h1>
          <p>Choose a category to explore its folders and documents.</p>
        </div>
        {can("category.create") && (
          <button className="btn primary" type="button" onClick={() => setCreating(true)}>
            <i className="bi bi-plus-lg me-2" />New category
          </button>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="card categories-empty">
          <i className="bi bi-collection" />
          <h2>No categories yet</h2>
          <p>Create your first category to start organizing documents.</p>
        </div>
      ) : (
        <div className="category-card-grid">
          {rows.map((category, index) => (
            <article className="category-card" key={category.id}>
              <Link className="category-card-main" to={`/categories/${category.id}`} aria-label={`Open ${category.name} category`}>
                <div className={`category-card-icon category-tone-${index % 5}`}>
                  <i className="bi bi-folder2-open" />
                </div>
                <div className="category-card-content">
                  <div className="category-card-topline">
                    <span className={`status-badge ${category.isActive ? "status-active" : "status-inactive"}`}>
                      <span className="status-dot" />{category.isActive ? "Active" : "Inactive"}
                    </span>
                    <i className="bi bi-arrow-up-right category-card-arrow" />
                  </div>
                  <h2>{category.name}</h2>
                  <p>{category.description || "No description provided."}</p>
                </div>
                <div className="category-card-meta">
                  <span><i className="bi bi-file-earmark-text" /> {category._count?.documents ?? 0} documents</span>
                  <span className="open-category">Open category <i className="bi bi-arrow-right" /></span>
                </div>
              </Link>

              {(can("category.update") || can("category.delete")) && (
                <div className="category-card-actions">
                  {can("category.update") && <button className="btn ghost sm" type="button" onClick={() => setEditing(category)}>Edit</button>}
                  {can("category.delete") && <button className="btn ghost sm danger-text" type="button" onClick={() => setPending(category)}>Delete</button>}
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <Modal title={editing ? "Update category" : "Create category"} onClose={() => { setCreating(false); setEditing(null); }}>
          <form className="form-grid" onSubmit={(e) => save(e, editing?.id)}>
            <label className="full">Name<input name="name" defaultValue={editing?.name || ""} required /></label>
            <label className="full">Description<textarea name="description" rows="3" defaultValue={editing?.description || ""} /></label>
            <label className="check"><input type="checkbox" name="isActive" defaultChecked={editing ? editing.isActive : true} /> Active</label>
            <div className="form-actions full"><button className="btn primary" type="submit">Save</button></div>
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
