import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Avatar from "../components/Avatar";
import FileIcon from "../components/FileIcon";
import Spinner from "../components/Spinner";
import Modal from "../components/Modal";

const PREVIEW = ["pdf", "jpg", "jpeg", "png", "txt"];

export default function DocumentDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const toast = useToast();
  const [doc, setDoc] = useState(null);
  const [folders, setFolders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(false);

  async function load() {
    const response = await api.get(`/api/documents/${id}`);
    setDoc(response.data);
  }

  useEffect(() => {
    load().catch((err) => toast.push(err.message, "error"));
    api.get("/api/categories").then((response) => setCategories(response.data)).catch(() => {});
    api.get("/api/folders").then((response) => setFolders(response.data)).catch(() => {});
  }, [id]);

  if (!doc) return <Spinner />;

  const ownerId = doc.uploadedById ?? doc.uploadedBy?.id;
  const isOwner = Number(ownerId) === Number(user?.id);
  const isAdmin = ["admin", "super_admin"].includes(user?.role);
  const canManage = isOwner || isAdmin;
  const previewable = PREVIEW.includes(doc.fileType);
  const src = doc.previewUrl || null;

  async function save(event) {
    event.preventDefault();
    const formData = new FormData(event.target);

    try {
      const response = await api.put(`/api/documents/${id}`, {
        name: formData.get("name"),
        description: formData.get("description"),
        categoryId: formData.get("categoryId"),
        folderId: formData.get("folderId"),
      });
      setDoc(response.data);
      setEditing(false);
      toast.push("Document updated");
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  async function download() {
    try {
      await api.download(`/api/documents/${id}/download`, doc.originalName);
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{doc.name}</h1>
          <p>{doc.category?.name} · {doc.folder?.name}</p>
        </div>
        <div className="row-actions">
          <button className="btn primary" type="button" onClick={download}>
            Download
          </button>
          {canManage && (
            <button className="btn ghost" type="button" onClick={() => setEditing(true)}>
              Edit
            </button>
          )}
        </div>
      </div>

      <div className="split">
        <section className="card">
          <h2>Preview</h2>
          {previewable && src ? (
            <>
              {doc.fileType === "pdf" && (
                <iframe
                  className="preview"
                  title="preview"
                  src={`${src}#toolbar=0&navpanes=0&scrollbar=0`}
                />
              )}
              {["jpg", "jpeg", "png"].includes(doc.fileType) && (
                <img className="preview-img" src={src} alt={doc.name} />
              )}
              {doc.fileType === "txt" && (
                <iframe
                  className="preview"
                  title="preview"
                  src={src}
                />
              )}
            </>
          ) : (
            <p className="muted">Preview is not available for this file type. Download the file to view it.</p>
          )}
        </section>

        <section className="card">
          <div className="uploader-block">
            <Avatar user={doc.uploadedBy} size={48} />
            <div>
              <small>Uploaded by</small>
              <strong>{doc.uploadedBy?.fullName}</strong>
              <p>{new Date(doc.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <dl className="meta">
            <dt>Description</dt>
            <dd>{doc.description || "—"}</dd>
            <dt>File</dt>
            <dd>
              <FileIcon type={doc.fileType} /> {doc.originalName} · {(doc.fileSize / 1024).toFixed(1)} KB
            </dd>
            <dt>Folder</dt>
            <dd><Link to={`/folders/${doc.folderId}`}>{doc.folder?.name}</Link></dd>
          </dl>
        </section>
      </div>

      {editing && canManage && (
        <Modal title="Update document" onClose={() => setEditing(false)}>
          <form className="form-grid" onSubmit={save}>
            <label className="full">
              Name
              <input name="name" defaultValue={doc.name} required />
            </label>
            <label>
              Category
              <select name="categoryId" defaultValue={doc.categoryId}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>
              Folder
              <select name="folderId" defaultValue={doc.folderId}>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </label>
            <label className="full">
              Description
              <textarea name="description" rows="4" defaultValue={doc.description || ""} />
            </label>
            <div className="form-actions full">
              <button className="btn ghost" type="button" onClick={() => setEditing(false)}>Cancel</button>
              <button className="btn primary" type="submit">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}