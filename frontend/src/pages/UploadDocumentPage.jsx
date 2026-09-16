import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function UploadDocumentPage() {
  const { categoryId, folderId } = useParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [folder, setFolder] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/api/folders/${folderId}`)
      .then((response) => {
        const nextFolder = response.data;
        if (String(nextFolder.categoryId) !== String(categoryId)) {
          throw new Error("This folder does not belong to the selected category");
        }
        setFolder(nextFolder);
      })
      .catch((err) => toast.push(err.message, "error"));
  }, [categoryId, folderId]);

  async function onSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file");

    if (!file?.size) {
      toast.push("Choose a file", "error");
      return;
    }

    fd.set("categoryId", categoryId);
    fd.set("folderId", folderId);
    setBusy(true);
    try {
      await api.postForm("/api/documents", fd);
      toast.push("Document uploaded to the selected folder");
      navigate(`/categories/${categoryId}/folders/${folderId}`);
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
          <span className="section-kicker"><i className="bi bi-cloud-arrow-up" /> Folder upload</span>
          <h1>Upload to {folder?.name || "selected folder"}</h1>
          <p>Every document is saved directly inside this folder and its category.</p>
        </div>
        <Link className="btn ghost" to={`/categories/${categoryId}/folders/${folderId}`}>Back to folder</Link>
      </div>

      <form className="card form-grid" onSubmit={onSubmit}>
        <label className="full">
          File
          <input type="file" name="file" required disabled={busy || !folder} />
        </label>
        <label className="full">
          Document name
          <input name="name" required disabled={busy || !folder} />
        </label>
        <div className="card folder-context-card full">
          <strong><i className="bi bi-folder-fill me-2" />{folder?.name || "Loading folder…"}</strong>
          <small>{folder?.category?.name || "Selected category"} · This location is locked for this upload.</small>
        </div>
        <label className="full">
          Description
          <textarea name="description" rows="4" required disabled={busy || !folder} />
        </label>
        <div className="form-actions full">
          <button className="btn primary" disabled={busy || !folder} type="submit">
            {busy ? "Uploading…" : "Upload to this folder"}
          </button>
        </div>
      </form>
    </div>
  );
}