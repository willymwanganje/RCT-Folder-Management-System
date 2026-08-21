import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import { useToast } from "../context/ToastContext";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [devUrl, setDevUrl] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    try {
      const res = await api.post("/api/auth/forgot-password", { email });
      toast.push(res.message || "If that email exists, a reset link has been sent");
      setDevUrl(res.data?.devResetUrl || "");
    } catch (err) {
      toast.push(err.message, "error");
    }
  }

  return (
    <div className="auth-screen">
      <form className="card auth-card" onSubmit={onSubmit}>
        <h2>Reset password</h2>
        <p className="muted">Enter your organizational email. We will send a reset link if the account exists.</p>
        <label>
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <button className="btn primary" type="submit">
          Send reset link
        </button>
        {devUrl && (
          <p className="dev-note">
            Development reset link: <a href={devUrl}>{devUrl}</a>
          </p>
        )}
        <Link to="/login">Back to sign in</Link>
      </form>
    </div>
  );
}
