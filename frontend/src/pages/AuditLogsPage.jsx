import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import Pagination from "../components/Pagination";
import Avatar from "../components/Avatar";

export default function AuditLogsPage() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api
      .get(`/api/audit-logs?q=${encodeURIComponent(q)}&page=${page}`)
      .then((r) => {
        setRows(r.data.data);
        setMeta(r.data.meta);
      })
      .catch((err) => toast.push(err.message, "error"));
  }, [q, page]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1>Audit logs</h1>
          <p>Immutable trail of authentication, access and document activity.</p>
        </div>
      </div>
      <form
        className="filters card"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQ(new FormData(e.target).get("q"));
        }}
      >
        <input name="q" placeholder="Filter by action, resource or actor" />
        <button className="btn primary" type="submit">
          Filter
        </button>
      </form>
      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Resource</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.createdAt).toLocaleString()}</td>
                <td>
                  <div className="cell-user">
                    <Avatar user={log.actor} size={28} />
                    {log.actor?.fullName || "System"}
                  </div>
                </td>
                <td>
                  <code>{log.action}</code>
                </td>
                <td>
                  {log.resourceType}
                  {log.resourceId ? ` · ${log.resourceId.slice(0, 8)}` : ""}
                </td>
                <td>{log.ipAddress || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination meta={meta} onPage={setPage} />
      </div>
    </div>
  );
}
