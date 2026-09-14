import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import FileIcon from "../components/FileIcon";
import Avatar from "../components/Avatar";
import Pagination from "../components/Pagination";
import EmptyState from "../components/EmptyState";
import ConfirmDialog from "../components/ConfirmDialog";
import Spinner from "../components/Spinner";

export default function DocumentsPage({ mine }) {
  const { can } = useAuth();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingDelete, setPendingDelete] = useState(null);

  const q = params.get("q") || "";
  const categoryId = params.get("categoryId") || "";
  const fileType = params.get("fileType") || "";
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const page = params.get("page") || "1";

  function update(next) {
    const merged = { q, categoryId, fileType, from, to, page, ...next };
    const sp = new URLSearchParams();
    Object.entries(merged).forEach(([k, v]) => {
      if (v) sp.set(k, v);
    });
    setParams(sp);
  }

  useEffect(() => {
    api.get("/api/categories").then((res) => setCategories(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const qs = new URLSearchParams({ page, pageSize: "15" });
    if (q) qs.set("q", q);
    if (categoryId) qs.set("categoryId", categoryId);
    if (fileType) qs.set("fileType", fileType);
    if (from) qs.set("from", from);
    if (to) qs.set("to", to);
    const path = mine ? `/api/documents/mine?${qs}` : `/api/documents?${qs}`;
    api
      .get(path)
      .then((res) => {
        setRows(res.data.data);
        setMeta(res.data.meta);
      })
      .catch((err) => toast.push(err.message, "error"))
      .finally(() => setLoading(false));
  }, [q, categoryId, fileType, from, to, page, mine]);

  async function remove(id) {
    try {
      await api.del(`/api/documents/${id}`);
      setRows((prev) => prev.filter((d) => d.id !== id));
      toast.push("Document deleted");
    } catch (err) {
      toast.push(err.message, "error");
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>{mine ? "My documents" : "Documents"}</h1>
          <p>Search, filter and manage organizational files.</p>
        </div>
        {can("document.create") && (
          <Link className="btn primary" to="/documents/upload">
            Upload document
          </Link>
        )}
      </div>

      <form
        className="filters card"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          update({
            q: fd.get("q"),
            categoryId: fd.get("categoryId"),
            fileType: fd.get("fileType"),
            from: fd.get("from"),
            to: fd.get("to"),
            page: "1",
          });
        }}
      >
        <input name="q" defaultValue={q} placeholder="Search name, description, folder, uploader…" />
        <select name="categoryId" defaultValue={categoryId}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input name="fileType" defaultValue={fileType} placeholder="Type e.g. pdf" />
        <input type="date" name="from" defaultValue={from} />
        <input type="date" name="to" defaultValue={to} />
        <button className="btn primary" type="submit">
          Search
        </button>
      </form>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <EmptyState title="No documents found" hint="Adjust filters or upload a new file." />
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>Document</th>
                <th>Category</th>
                <th>Folder</th>
                <th>Uploader</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {rows.map((doc) => (
                <tr key={doc.id}>
                  <td>
                    <div className="cell-file">
                      <FileIcon type={doc.fileType} />
                      <div>
                        <Link to={`/documents/${doc.id}`}>{doc.name}</Link>
                        <small>{doc.fileType.toUpperCase()} · {(doc.fileSize / 1024).toFixed(0)} KB</small>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="chip">{doc.category?.name}</span>
                  </td>
                  <td>{doc.folder?.name}</td>
                  <td>
                    <div className="cell-user">
                      <Avatar user={doc.uploadedBy} size={28} />
                      {doc.uploadedBy?.fullName}
                    </div>
                  </td>
                  <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td className="row-actions">
                    {can("document.delete") && (
                      <button type="button" className="btn ghost sm" onClick={() => setPendingDelete(doc)}>
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination meta={meta} onPage={(p) => update({ page: String(p) })} />
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete document"
          message={`Delete “${pendingDelete.name}”? This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onClose={() => setPendingDelete(null)}
          onConfirm={() => remove(pendingDelete.id)}
        />
      )}
    </div>
  );
}
