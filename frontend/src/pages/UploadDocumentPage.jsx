import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

function flattenFolders(nodes, prefix = "") {
  const out = [];
  for (const node of nodes || []) {
    const label = prefix ? `${prefix} / ${node.name}` : node.name;
    out.push({ id: node.id, label, categoryId: node.categoryId });
    out.push(...flattenFolders(node.children, label));
  }
  return out;
}

export default function UploadDocumentPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [allFolders, setAllFolders] = useState([]);
  const [categoryId, setCategoryId] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/api/categories"), api.get("/api/folders/tree")])
      .then(([categoriesResponse, foldersResponse]) => {
        setCategories(categoriesResponse.data.filter((item) => item.isActive !== false));
        setAllFolders(flattenFolders(foldersResponse.data));
      })
      .catch((err) => toast.push(err.message, "error"));
  }, []);

  const folders = useMemo(() => {
    if (!categoryId) return [];
    return allFolders.filter((folder) => String(folder.categoryId) === String(categoryId));
  }, [allFolders, categoryId]);

  async function onSubmit(e) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);

    if (!fd.get("categoryId")) {
      toast.push("Select a category", "error");
      return;
    }
    if (!fd.get("folderId")) {
      toast.push("Select a folder inside the category", "error");
      return;
    }
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
          <p>Choose a category first, then select one of its folders.</p>
        </div>
      </div>

      <form className="card form-grid" onSubmit={onSubmit}>
        <label>
          File
          <input type="file" name="file" required disabled={busy} />
        </label>
        <label>
          Document name
          <input name="name" required disabled={busy} />
        </label>
        <label>
          Category
          <select
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            required
            disabled={busy}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>
        <label>
          Folder
          <select name="folderId" required disabled={!categoryId || busy}>
            <option value="">
              {categoryId ? "Select folder" : "Select category first"}
            </option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>{folder.label}</option>
            ))}
          </select>
          {categoryId && folders.length === 0 && (
            <small className="form-hint">No folders have been assigned to this category yet.</small>
          )}
        </label>
        <label className="full">
          Description
          <textarea name="description" rows="4" required disabled={busy} />
        </label>
        <div className="form-actions full">
          <button className="btn primary" disabled={busy || !categoryId || folders.length === 0} type="submit">
            {busy ? "Uploading…" : "Upload document"}
          </button>
        </div>
      </form>
    </div>
  );
}
