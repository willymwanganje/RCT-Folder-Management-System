import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import FileIcon from "../components/FileIcon";

function FolderList({ nodes, depth = 0 }) {
  return (
    <ul className="tree" style={{ paddingLeft: depth ? 16 : 0 }}>
      {nodes.map((n) => (
        <li key={n.id}>
          <Link to={`/folders/${n.id}`}>
            {n.name}
            <small>
              {n._count?.documents || 0} files · {n._count?.children || 0} folders
            </small>
          </Link>
          {n.children?.length > 0 && <FolderList nodes={n.children} depth={depth + 1} />}
        </li>
      ))}
    </ul>
  );
}

export default function FoldersPage() {
  const { id } = useParams();
  const { can } = useAuth();
  const toast = useToast();
  const [tree, setTree] = useState([]);
  const [folder, setFolder] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);

  async function loadTree() {
    const res = await api.get("/api/folders/tree");
    setTree(res.data);
  }

  useEffect(() => {
    loadTree().catch((err) => toast.push(err.message, "error"));
    api.get("/api/categories").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) {
      setFolder(null);
      return;
    }
    api
      .get(`/api/folders/${id}`)
      .then((r) => setFolder(r.data))
      .catch((err) => toast.push(err.message, "error"));
  }, [id]);

  async function createFolder(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      await api.post("/api/folders", {
        name: fd.get("name"),
        parentId: fd.get("parentId") || null,
        categoryId: fd.get("categoryId") || null,
      });
      toast.push("Folder created");
      setShowCreate(false);
      loadTree();
      if (id) {
        const r = await api.get(`/api/folders/${id}`);
        setFolder(r.data);
      }
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  async function rename(e) {
    e.preventDefault();
    try {
      await api.put(`/api/folders/${id}`, { name: new FormData(e.target).get("name") });
      toast.push("Folder updated");
      loadTree();
      const r = await api.get(`/api/folders/${id}`);
      setFolder(r.data);
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  async function remove() {
    try {
      await api.del(`/api/folders/${id}`);
      toast.push("Folder deleted");
      setPendingDelete(false);
      setFolder(null);
      loadTree();
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Folders</h1>
          <p>Organize documents in nested folders by programme area.</p>
        </div>
        {can("folder.create") && (
          <button className="btn primary" type="button" onClick={() => setShowCreate(true)}>
            New folder
          </button>
        )}
      </div>
      <div className="split">
        <section className="card">
          <h2>Library</h2>
          {tree.length === 0 ? (
            <EmptyState title="No folders yet" hint="Create a root folder to begin organizing files." />
          ) : (
            <FolderList nodes={tree} />
          )}
        </section>
        <section className="card">
          {!folder ? (
            <EmptyState title="Select a folder" hint="Choose a folder from the library to inspect its contents." />
          ) : (
            <>
              <div className="page-head compact">
                <h2>{folder.name}</h2>
                {can("folder.delete") && (
                  <button className="btn ghost sm" type="button" onClick={() => setPendingDelete(true)}>
                    Delete
                  </button>
                )}
              </div>
              {can("folder.update") && (
                <form className="inline-form" onSubmit={rename}>
                  <input name="name" defaultValue={folder.name} key={folder.id} />
                  <button className="btn ghost sm" type="submit">
                    Rename
                  </button>
                </form>
              )}
              <h3>Subfolders</h3>
              <ul className="plain-list">
                {folder.children?.map((c) => (
                  <li key={c.id}>
                    <Link to={`/folders/${c.id}`}>{c.name}</Link>
                  </li>
                ))}
                {folder.children?.length === 0 && <li className="muted">No subfolders</li>}
              </ul>
              <h3>Documents</h3>
              <ul className="activity">
                {folder.documents?.map((d) => (
                  <li key={d.id}>
                    <FileIcon type={d.fileType} />
                    <Link to={`/documents/${d.id}`}>{d.name}</Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      {showCreate && (
        <Modal title="Create folder" onClose={() => setShowCreate(false)}>
          <form className="form-grid" onSubmit={createFolder}>
            <label className="full">
              Name
              <input name="name" required />
            </label>
            <label>
              Parent
              <select name="parentId" defaultValue={id || ""}>
                <option value="">Root</option>
                {flatten(tree).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Category
              <select name="categoryId">
                <option value="">None</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-actions full">
              <button className="btn primary" type="submit">
                Create
              </button>
            </div>
          </form>
        </Modal>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete folder"
          message="Only empty folders can be deleted."
          danger
          confirmLabel="Delete"
          onClose={() => setPendingDelete(false)}
          onConfirm={remove}
        />
      )}
    </div>
  );
}

function flatten(nodes, prefix = "") {
  const out = [];
  for (const n of nodes || []) {
    const label = prefix ? `${prefix} / ${n.name}` : n.name;
    out.push({ id: n.id, label });
    out.push(...flatten(n.children, label));
  }
  return out;
}
