import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";
import Avatar from "../components/Avatar";
import FileIcon from "../components/FileIcon";
import Spinner from "../components/Spinner";
import { Link } from "react-router-dom";

export default function UserDetailsPage() {
  const { id } = useParams();
  const toast = useToast();
  const [user, setUser] = useState(null);
  const [docs, setDocs] = useState([]);

  useEffect(() => {
    api
      .get(`/api/users/${id}`)
      .then((r) => setUser(r.data))
      .catch(() =>
        api.get(`/api/admins/${id}`).then((r) => setUser(r.data)).catch((err) => toast.push(err.message, "error"))
      );
    api
      .get(`/api/users/${id}/documents`)
      .then((r) => setDocs(r.data.data))
      .catch(() => {});
  }, [id]);

  if (!user) return <Spinner />;

  return (
    <div>
      <div className="page-head">
        <div className="cell-user">
          <Avatar user={user} size={56} />
          <div>
            <h1>{user.fullName}</h1>
            <p>
              {user.email} · {user.role?.name} · {user.isActive ? "Active" : "Deactivated"}
            </p>
          </div>
        </div>
      </div>
      <section className="card">
        <h2>Uploaded documents</h2>
        <ul className="activity">
          {docs.map((d) => (
            <li key={d.id}>
              <FileIcon type={d.fileType} />
              <Link to={`/documents/${d.id}`}>{d.name}</Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
