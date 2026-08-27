import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import FileIcon from "../components/FileIcon";

function flatten(nodes, prefix = "") {
  const out = [];
  for (const node of nodes || []) {
    const label = prefix ? `${prefix} / ${node.name}` : node.name;
    out.push({ id: node.id, label, categoryId: node.categoryId });
    out.push(...flatten(node.children, label));
  }
  return out;
}

function filterByCategory(nodes, categoryId) {
  if (!categoryId) return nodes || [];

  return (nodes || [])
    .map((node) => {
      const children = filterByCategory(node.children, categoryId);
      const belongsToCategory = String(node.categoryId) === String(categoryId);

      return belongsToCategory || children.length > 0
        ? { ...node, children }
        : null;
    })
    .filter(Boolean);
}

function FolderCard({ folder, categoryId, depth = 0, showChildren = true }) {
  const href = categoryId
    ? `/categories/${categoryId}/folders/${folder.id}`
    : `/folders/${folder.id}`;

  return (
    <div className="folder-card-wrap" style={{ marginLeft: depth ? 18 : 0 }}>
      <Link
        className="folder-card"
        to={href}
        aria-label={`Open folder ${folder.name}`}
      >
        <div className="folder-card-icon">
          <i className="bi bi-folder-fill" aria-hidden="true" />
        </div>

        <div className="folder-card-content">
          <div className="folder-card-topline">
            <span className="folder-card-type">FOLDER</span>
            <i className="bi bi-arrow-up-right folder-card-arrow" aria-hidden="true" />
          </div>

          <h3>{folder.name}</h3>

          <div className="folder-card-meta">
            <span>
              <i className="bi bi-file-earmark-text" aria-hidden="true" />
              {folder._count?.documents || 0} files
            </span>
            <span>
              <i className="bi bi-folder2-open" aria-hidden="true" />
              {folder._count?.children || 0} folders
            </span>
          </div>
        </div>

        <span className="folder-card-open">
          Open <i className="bi bi-arrow-right" aria-hidden="true" />
        </span>
      </Link>

      {showChildren && folder.children?.length > 0 && (
        <div className="nested-folder-cards">
          {folder.children.map((child) => (
            <FolderCard
              key={child.id}
              folder={child}
              categoryId={categoryId}
              depth={depth + 1}
              showChildren={showChildren}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FoldersPage() {
  const { id, categoryId } = useParams();
  const { can } = useAuth();
  const toast = useToast();

  const [tree, setTree] = useState([]);
  const [folder, setFolder] = useState(null);
  const [categories, setCategories] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [loadingFolder, setLoadingFolder] = useState(false);

  async function loadTree() {
    const response = await api.get("/api/folders/tree");
    setTree(response.data);
  }

  useEffect(() => {
    loadTree().catch((err) => toast.push(err.message, "error"));

    api
      .get("/api/categories")
      .then((response) => setCategories(response.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    let active = true;

    async function loadFolder() {
      if (!id) {
        setFolder(null);
        return;
      }

      setLoadingFolder(true);

      try {
        const response = await api.get(`/api/folders/${id}`);
        if (active) setFolder(response.data);
      } catch (err) {
        if (active) {
          setFolder(null);
          toast.push(err.message, "error");
        }
      } finally {
        if (active) setLoadingFolder(false);
      }
    }

    loadFolder();

    return () => {
      active = false;
    };
  }, [id]);

  async function createFolder(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    try {
      await api.post("/api/folders", {
        name: formData.get("name"),
        parentId: formData.get("parentId") || null,
        categoryId: formData.get("categoryId") || categoryId || null,
      });

      toast.push("Folder created");
      setShowCreate(false);
      await loadTree();

      if (id) {
        const response = await api.get(`/api/folders/${id}`);
        setFolder(response.data);
      }
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  async function rename(event) {
    event.preventDefault();

    try {
      await api.put(`/api/folders/${id}`, {
        name: new FormData(event.currentTarget).get("name"),
      });

      toast.push("Folder updated");
      await loadTree();

      const response = await api.get(`/api/folders/${id}`);
      setFolder(response.data);
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
      await loadTree();
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  const visibleTree = filterByCategory(tree, categoryId);
  const categoryName = categories.find(
    (category) => String(category.id) === String(categoryId)
  )?.name;

  return (
    <div className="folders-page">
      <div className="page-head folders-page-head">
        <div>
          <span className="section-kicker">
            <i className="bi bi-folder2-open" aria-hidden="true" />
            File organization
          </span>
          <h1>{id ? folder?.name || "Folder" : categoryName || "Folders"}</h1>
          <p>
            {id
              ? "Browse this folder's subfolders or files."
              : categoryId
                ? "Folders belonging to this category."
                : "Choose a folder to explore its files."}
          </p>
        </div>

        {can("folder.create") && (
          <button
            className="btn primary"
            type="button"
            onClick={() => setShowCreate(true)}
          >
            <i className="bi bi-plus-lg me-2" aria-hidden="true" />
            New folder
          </button>
        )}
      </div>

      <div className={`folders-layout ${id ? "folder-detail-only" : ""}`}>
        {!id && (
        <section className="card folder-library-card">
          <div className="folder-section-heading">
            <div>
              <h2>
                <i className="bi bi-grid-fill me-2" aria-hidden="true" />
                {categoryId ? "Category folders" : "Folder library"}
              </h2>
              <p>{visibleTree.length} top-level folders</p>
            </div>
          </div>

          {visibleTree.length === 0 ? (
            <EmptyState
              title="No folders yet"
              hint="Create a folder to begin organizing files."
            />
          ) : (
            <div className="folder-card-grid">
              {visibleTree.map((folderNode) => (
                <FolderCard
                  key={folderNode.id}
                  folder={folderNode}
                  categoryId={categoryId}
                />
              ))}
            </div>
          )}
        </section>
        )}

        <section className={`card folder-details-card ${id ? "folder-details-full" : ""}`}>
          {loadingFolder ? (
            <EmptyState title="Loading folder" hint="Retrieving files from the server..." />
          ) : !folder ? (
            <EmptyState
              title="Select a folder"
              hint="Click any folder card to inspect its subfolders and files."
            />
          ) : (
            <>
              <div className="folder-detail-head">
                <div>
                  <div className="folder-detail-icon">
                    <i className="bi bi-folder-fill" aria-hidden="true" />
                  </div>
                  <h2>{folder.name}</h2>
                  <p>{folder.documents?.length || 0} files in this folder</p>
                </div>

                {can("folder.delete") && (
                  <button
                    className="btn ghost sm"
                    type="button"
                    onClick={() => setPendingDelete(true)}
                  >
                    Delete
                  </button>
                )}
              </div>

              {can("folder.update") && (
                <form className="inline-form" onSubmit={rename}>
                  <input
                    name="name"
                    defaultValue={folder.name}
                    key={folder.id}
                  />
                  <button className="btn ghost sm" type="submit">
                    Rename
                  </button>
                </form>
              )}

              {folder.children?.length > 0 ? (
                <>
                  <div className="folder-content-heading">
                    <h3>Subfolders</h3>
                    <span>{folder.children.length} subfolders</span>
                  </div>
                  <div className="folder-detail-subfolder-grid">
                    {folder.children.map((child) => (
                      <FolderCard
                        key={child.id}
                        folder={child}
                        categoryId={categoryId}
                        showChildren={false}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="folder-content-heading">
                    <h3>Files</h3>
                    <span>{folder.documents?.length || 0} files</span>
                  </div>
                  <div className="folder-file-list">
                    {folder.documents?.map((document) => (
                      <Link key={document.id} to={`/documents/${document.id}`}>
                        <FileIcon type={document.fileType} />
                        <span>{document.name}</span>
                        <i className="bi bi-chevron-right" aria-hidden="true" />
                      </Link>
                    ))}
                    {folder.documents?.length === 0 && (
                      <span className="muted">No files in this folder</span>
                    )}
                  </div>
                </>
              )}
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
                {flatten(visibleTree).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Category
              <select
                name="categoryId"
                defaultValue={categoryId || ""}
                disabled={Boolean(categoryId)}
              >
                <option value="">None</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
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
