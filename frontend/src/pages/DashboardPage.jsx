import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import Avatar from "../components/Avatar";
import FileIcon from "../components/FileIcon";
import Spinner from "../components/Spinner";

function formatDate(value) { return new Date(value).toLocaleString(); }

function StatCard({ title, value, icon, tone }) {
  return <div className={`dashboard-stat-card ${tone}`}>
    <div className="stat-icon"><i className={`bi ${icon}`} /></div>
    <div className="stat-content"><strong>{value ?? 0}</strong><p>{title}</p></div>
  </div>;
}

export default function DashboardPage() {
  const { can, user } = useAuth();
  const [admin, setAdmin] = useState(null); const [mine, setMine] = useState(null); const [error, setError] = useState("");
  useEffect(() => { let alive = true; async function load() { try { if (can("dashboard.admin")) setAdmin((await api.get("/api/dashboard/admin")).data); setMine((await api.get("/api/dashboard/me")).data); } catch (err) { if (alive) setError(err.message || "Failed to load dashboard"); } } load(); return () => { alive = false; }; }, [can]);
  if (error) return <div className="alert alert-danger">{error}</div>;
  if (!mine && !admin) return <Spinner />;
  const isAdmin = can("dashboard.admin"); const totals = isAdmin ? admin.totals : mine.totals;
  return <div className="modern-dashboard">
    <section className="dashboard-welcome">
      <div className="welcome-visual"><i className="bi bi-folder-fill" /><span /></div>
      <div className="welcome-copy"><span className="welcome-badge">RCT DOCUMENT MANAGEMENT</span><h1>Welcome back, {user?.fullName?.split(" ")[0] || "User"}!</h1><p>Manage your documents, folders and keep your organization information secure and well organized.</p></div>
      <div className="welcome-stats">
        <StatCard title="Total Categories" value={totals.categories} icon="bi-folder-fill" tone="blue" />
        <StatCard title="Total Documents" value={totals.documents ?? totals.myDocuments} icon="bi-folder2-open" tone="green" />
        <StatCard title="Users" value={totals.users ?? 1} icon="bi-people-fill" tone="purple" />
      </div>
    </section>
    {isAdmin && admin ? <div className="dashboard-content-grid">
      <section className="modern-card"><div className="modern-card-header"><div><h5><i className="bi bi-cloud-arrow-up-fill me-2" />Recent Uploads</h5><p>Latest documents added to the system</p></div><Link to="/documents" className="view-all-btn">View all <i className="bi bi-arrow-right ms-2" /></Link></div><div className="modern-card-body">{admin.recentUploads?.length ? <div className="upload-list">{admin.recentUploads.map((doc) => <div className="upload-item" key={doc.id}><div className="upload-file-icon"><FileIcon type={doc.fileType} /></div><div className="upload-info"><Link to={`/documents/${doc.id}`} className="upload-name">{doc.name}</Link><div className="upload-meta"><span><i className="bi bi-folder me-1" />{doc.category?.name || "Uncategorized"}</span><span><i className="bi bi-clock me-1" />{formatDate(doc.createdAt)}</span></div></div><Avatar user={doc.uploadedBy} size={38} /></div>)}</div> : <div className="empty-dashboard"><i className="bi bi-file-earmark-x" /><p>No recent uploads</p></div>}</div></section>
      <section className="modern-card"><div className="modern-card-header"><div><h5><i className="bi bi-activity me-2" />Recent Activity</h5><p>Latest system activities</p></div></div><div className="modern-card-body"><div className="activity-list">{admin.recentActivity?.map((log) => <div className="activity-item" key={log.id}><div className="activity-icon"><i className="bi bi-lightning-charge-fill" /></div><div className="activity-info"><strong>{log.action}</strong><small>{log.actor?.fullName || "System"}</small><span>{formatDate(log.createdAt)}</span></div></div>)}</div></div></section>
    </div> : <section className="modern-card"><div className="modern-card-header"><div><h5><i className="bi bi-file-earmark-text-fill me-2" />My Recent Documents</h5><p>Your latest uploaded documents</p></div><Link to="/documents/mine" className="view-all-btn">View all <i className="bi bi-arrow-right ms-2" /></Link></div><div className="modern-card-body"><div className="upload-list">{mine.recentDocuments?.map((doc) => <div className="upload-item" key={doc.id}><div className="upload-file-icon"><FileIcon type={doc.fileType} /></div><div className="upload-info"><Link to={`/documents/${doc.id}`} className="upload-name">{doc.name}</Link><div className="upload-meta"><span><i className="bi bi-folder me-1" />{doc.folder?.name || "No folder"}</span><span>{formatDate(doc.createdAt)}</span></div></div></div>)}</div></div></section>}
  </div>;
}