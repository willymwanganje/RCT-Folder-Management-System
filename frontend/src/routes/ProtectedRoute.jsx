import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "../components/Spinner";

export default function ProtectedRoute({ children, permission }) {
  const { user, loading, can } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner label="Loading session" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (permission && !can(permission)) return <Navigate to="/" replace />;
  return children;
}
