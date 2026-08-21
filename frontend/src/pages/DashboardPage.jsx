import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
import Avatar from "../components/Avatar";
import FileIcon from "../components/FileIcon";
import Spinner from "../components/Spinner";

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function StatCard({ title, value, icon, color }) {
  return (
    <div className="col-12 col-sm-6 col-xl-3">
      <div className="dashboard-stat-card h-100">
        <div className={`stat-icon ${color}`}>
          <i className={`bi ${icon}`}></i>
        </div>

        <div className="stat-content">
          <p>{title}</p>
          <h2>{value ?? 0}</h2>
        </div>

        <div className="stat-arrow">
          <i className="bi bi-arrow-up-right"></i>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { can, user } = useAuth();

  const [admin, setAdmin] = useState(null);
  const [mine, setMine] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function loadDashboard() {
      try {
        if (can("dashboard.admin")) {
          const adminResponse = await api.get("/api/dashboard/admin");

          if (alive) {
            setAdmin(adminResponse.data);
          }
        }

        const mineResponse = await api.get("/api/dashboard/me");

        if (alive) {
          setMine(mineResponse.data);
        }
      } catch (err) {
        if (alive) {
          setError(err.message || "Failed to load dashboard");
        }
      }
    }

    loadDashboard();

    return () => {
      alive = false;
    };
  }, [can]);

  if (error) {
    return (
      <div className="alert alert-danger shadow-sm border-0">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        {error}
      </div>
    );
  }

  if (!mine && !admin) {
    return <Spinner />;
  }

  const isAdmin = can("dashboard.admin");

  return (
    <div className="modern-dashboard">

      {/* WELCOME HEADER */}
      <div className="dashboard-welcome mb-4">
        <div>
          <span className="welcome-badge">
            <i className="bi bi-grid-1x2-fill me-2"></i>
            RCT DOCUMENT MANAGEMENT
          </span>

          <h1 className="dashboard-title">
            Welcome back, {user?.fullName?.split(" ")[0] || "User"} 👋
          </h1>

          <p className="dashboard-subtitle">
            Here is what's happening in your document management system today.
          </p>
        </div>

        <div className="dashboard-date">
          <i className="bi bi-calendar3 me-2"></i>
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
      </div>

      {/* ADMIN STATISTICS */}
      {isAdmin && admin && (
        <>
          <div className="row g-4 mb-4">

            <StatCard
              title="Total Users"
              value={admin.totals.users}
              icon="bi-people-fill"
              color="green"
            />

            <StatCard
              title="Active Users"
              value={admin.totals.activeUsers}
              icon="bi-person-check-fill"
              color="gold"
            />

            <StatCard
              title="Administrators"
              value={admin.totals.administrators}
              icon="bi-shield-check"
              color="blue"
            />

            <StatCard
              title="Documents"
              value={admin.totals.documents}
              icon="bi-file-earmark-text-fill"
              color="purple"
            />

            <StatCard
              title="Folders"
              value={admin.totals.folders}
              icon="bi-folder-fill"
              color="orange"
            />

            <StatCard
              title="Categories"
              value={admin.totals.categories}
              icon="bi-collection-fill"
              color="teal"
            />

            <StatCard
              title="Deactivated Users"
              value={admin.totals.deactivatedUsers}
              icon="bi-person-x-fill"
              color="red"
            />
          </div>

          {/* CONTENT ROW */}
          <div className="row g-4">

            {/* RECENT UPLOADS */}
            <div className="col-12 col-xl-7">
              <div className="modern-card h-100">

                <div className="modern-card-header">
                  <div>
                    <h5>
                      <i className="bi bi-cloud-arrow-up-fill me-2"></i>
                      Recent Uploads
                    </h5>

                    <p>Latest documents added to the system</p>
                  </div>

                  <Link
                    to="/documents"
                    className="view-all-btn"
                  >
                    View all
                    <i className="bi bi-arrow-right ms-2"></i>
                  </Link>
                </div>

                <div className="modern-card-body">

                  {admin.recentUploads?.length > 0 ? (
                    <div className="upload-list">

                      {admin.recentUploads.map((doc) => (
                        <div className="upload-item" key={doc.id}>

                          <div className="upload-file-icon">
                            <FileIcon type={doc.fileType} />
                          </div>

                          <div className="upload-info">
                            <Link
                              to={`/documents/${doc.id}`}
                              className="upload-name"
                            >
                              {doc.name}
                            </Link>

                            <div className="upload-meta">
                              <span>
                                <i className="bi bi-folder2-open me-1"></i>
                                {doc.category?.name || "Uncategorized"}
                              </span>

                              <span>
                                <i className="bi bi-clock me-1"></i>
                                {formatDate(doc.createdAt)}
                              </span>
                            </div>
                          </div>

                          <Avatar
                            user={doc.uploadedBy}
                            size={38}
                          />

                        </div>
                      ))}

                    </div>
                  ) : (
                    <div className="empty-dashboard">
                      <i className="bi bi-file-earmark-x"></i>
                      <p>No recent uploads</p>
                    </div>
                  )}

                </div>
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="col-12 col-xl-5">
              <div className="modern-card h-100">

                <div className="modern-card-header">
                  <div>
                    <h5>
                      <i className="bi bi-activity me-2"></i>
                      Recent Activity
                    </h5>

                    <p>Latest system activities</p>
                  </div>
                </div>

                <div className="modern-card-body">

                  {admin.recentActivity?.length > 0 ? (
                    <div className="activity-list">

                      {admin.recentActivity.map((log) => (
                        <div
                          className="activity-item"
                          key={log.id}
                        >
                          <div className="activity-icon">
                            <i className="bi bi-lightning-charge-fill"></i>
                          </div>

                          <div className="activity-info">
                            <strong>{log.action}</strong>

                            <small>
                              {log.actor?.fullName || "System"}
                            </small>

                            <span>
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                        </div>
                      ))}

                    </div>
                  ) : (
                    <div className="empty-dashboard">
                      <i className="bi bi-activity"></i>
                      <p>No recent activity</p>
                    </div>
                  )}

                </div>
              </div>
            </div>

          </div>
        </>
      )}

      {/* NORMAL USER DASHBOARD */}
      {!isAdmin && mine && (
        <>
          <div className="row g-4 mb-4">

            <StatCard
              title="My Documents"
              value={mine.totals.myDocuments}
              icon="bi-file-earmark-person-fill"
              color="green"
            />

            <StatCard
              title="Accessible Documents"
              value={mine.totals.accessibleDocuments}
              icon="bi-file-earmark-check-fill"
              color="gold"
            />

            <StatCard
              title="Folders"
              value={mine.totals.folders}
              icon="bi-folder-fill"
              color="blue"
            />

          </div>

          <div className="modern-card">

            <div className="modern-card-header">
              <div>
                <h5>
                  <i className="bi bi-file-earmark-text-fill me-2"></i>
                  My Recent Documents
                </h5>

                <p>Your latest uploaded documents</p>
              </div>

              <Link
                to="/documents"
                className="view-all-btn"
              >
                View all
                <i className="bi bi-arrow-right ms-2"></i>
              </Link>
            </div>

            <div className="modern-card-body">

              {mine.recentDocuments?.length > 0 ? (
                <div className="upload-list">

                  {mine.recentDocuments.map((doc) => (
                    <div
                      className="upload-item"
                      key={doc.id}
                    >

                      <div className="upload-file-icon">
                        <FileIcon type={doc.fileType} />
                      </div>

                      <div className="upload-info">

                        <Link
                          to={`/documents/${doc.id}`}
                          className="upload-name"
                        >
                          {doc.name}
                        </Link>

                        <div className="upload-meta">
                          <span>
                            <i className="bi bi-folder me-1"></i>
                            {doc.folder?.name || "No folder"}
                          </span>

                          <span>
                            <i className="bi bi-clock me-1"></i>
                            {formatDate(doc.createdAt)}
                          </span>
                        </div>

                      </div>

                    </div>
                  ))}

                </div>
              ) : (
                <div className="empty-dashboard">
                  <i className="bi bi-file-earmark-x"></i>
                  <p>You have no recent documents.</p>
                </div>
              )}

            </div>
          </div>
        </>
      )}

    </div>
  );
}