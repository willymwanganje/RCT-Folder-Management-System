import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

function flattenFolders(nodes, prefix = "") {
  const out = [];
  for (const n of nodes || []) {
    const label = prefix ? `${prefix} / ${n.name}` : n.name;
    out.push({ id: n.id, label });
    out.push(...flattenFolders(n.children, label));
  }
  return out;
}

export default function UploadDocumentPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [folders, setFolders] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/api/categories"), api.get("/api/folders/tree")])
      .then(([c, f]) => {
        setCategories(c.data.filter((x) => x.isActive !== false));
        setFolders(flattenFolders(f.data));
      })
      .catch((err) => toast.push(err.message, "error"));
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (!fd.get("file")?.size) {
      toast.push("Choose a file", "error");
      return;
    }
    setBusy(true);
    try {
      await api.postForm("/api/documents", fd);
      toast.push("Document uploaded");
      navigate("/documents");
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="narrow">
      <div className="page-head">
        <div>
          <h1>Upload document</h1>
          <p>Provide a name, category, folder and description with the file.</p>
        </div>
      </div>
      <form className="card form-grid" onSubmit={onSubmit}>
        <label>
          File
          <input type="file" name="file" required />
        </label>
        <label>
          Document name
          <input name="name" required />
        </label>
        <label>
          Category
          <select name="categoryId" required>
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Folder
          <select name="folderId" required>
            <option value="">Select folder</option>
            {folders.map((f) => (
              <option key={f.id} value={f.id}>
                {f.label}
              </option>
            ))}
          </select>
        </label>
        <label className="full">
          Description
          <textarea name="description" rows="4" required />
        </label>
        <div className="form-actions full">
          <button className="btn primary" disabled={busy} type="submit">
            {busy ? "Uploading…" : "Upload"}
          </button>
        </div>
      </form>
    </div>
  );
}
