import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const toast = useToast();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    try {
      await api.post("/api/auth/reset-password", { token: params.get("token"), newPassword });
      toast.push("Password updated. Sign in with your new password.");
      navigate("/login");
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  return (
    <div className="auth-screen">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h2>Choose a new password</h2>
        <label>
          New password
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={10} />
        </label>
        <p className="muted">Use at least 10 characters with uppercase, lowercase, and a number.</p>
        <button className="btn primary" type="submit">
          Reset password
        </button>
        <Link to="/login">Back to sign in</Link>
      </form>
    </div>
  );
}
