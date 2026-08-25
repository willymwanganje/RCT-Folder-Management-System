import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { API_URL } from "../services/api";
import rctLogo from "../assets/rct-logo.jpg";

export default function LoginPage() {
  const { user, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/api/health`).catch(() => {});
  }, []);

  if (user) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();

    if (busy) return;

    setError("");

    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      const message = "Please enter your email and password.";
      setError(message);
      toast.push(message, "error");
      return;
    }

    setBusy(true);

    try {
      await login(cleanEmail, password);

      toast.push("Welcome back", "success");

      navigate(location.state?.from?.pathname || "/", {
        replace: true,
      });
    } catch (err) {
      console.error("Login error:", err);

      const message =
        err?.message ||
        err?.payload?.message ||
        "Invalid email or password";

      setError(message);
      toast.push(message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rct-login-page">
      <div className="rct-login-container">
        <div className="rct-login-grid">

          {/* =========================
              LEFT BRAND SECTION
          ========================== */}
          <section className="rct-login-brand">

            <div className="rct-logo-wrapper">
              <img
                src={rctLogo}
                alt="Rice Council of Tanzania"
                className="rct-login-logo"
              />
            </div>

            <div className="rct-brand-content">
              <span className="rct-brand-label">
                RICE COUNCIL OF TANZANIA
              </span>

              <h1>
                Document Management
                <span> System</span>
              </h1>

              <p>
                A secure and centralized platform for managing
                organizational folders, documents, users and access.
              </p>
            </div>

            <div className="rct-brand-features">
              <div className="rct-feature">
                <div className="rct-feature-icon">
                  <i className="bi bi-shield-check"></i>
                </div>

                <div>
                  <strong>Secure Access</strong>
                  <small>Protected organizational information</small>
                </div>
              </div>

              <div className="rct-feature">
                <div className="rct-feature-icon">
                  <i className="bi bi-folder2-open"></i>
                </div>

                <div>
                  <strong>Centralized Documents</strong>
                  <small>Organize and manage files efficiently</small>
                </div>
              </div>

              <div className="rct-feature">
                <div className="rct-feature-icon">
                  <i className="bi bi-people"></i>
                </div>

                <div>
                  <strong>Staff Management</strong>
                  <small>Manage users, roles and permissions</small>
                </div>
              </div>
            </div>

            <div className="rct-login-footer">
              © {new Date().getFullYear()} Rice Council of Tanzania
            </div>
          </section>

          {/* =========================
              RIGHT LOGIN SECTION
          ========================== */}
          <section className="rct-login-form-section">

            <div className="rct-login-card">

              <div className="rct-mobile-logo">
                <img
                  src={rctLogo}
                  alt="RCT Logo"
                />
              </div>

              <div className="rct-login-heading">
                <div className="rct-login-icon">
                  <i className="bi bi-person-lock"></i>
                </div>

                <h2>Welcome back</h2>

                <p>
                  Sign in to access your account
                </p>
              </div>

              {error && (
                <div className="rct-login-error" role="alert">
                  <i className="bi bi-exclamation-circle-fill"></i>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={onSubmit} noValidate>

                {/* EMAIL */}
                <div className="rct-form-group">
                  <label htmlFor="login-email">
                    Organizational email
                  </label>

                  <div className="rct-input-wrapper">
                    <i className="bi bi-envelope"></i>

                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="Enter your email"
                      autoComplete="username"
                      disabled={busy}
                      required
                    />
                  </div>
                </div>

                {/* PASSWORD */}
                <div className="rct-form-group">
                  <div className="rct-password-label">
                    <label htmlFor="login-password">
                      Password
                    </label>

                    <Link to="/forgot-password">
                      Forgot password?
                    </Link>
                  </div>

                  <div className="rct-input-wrapper">
                    <i className="bi bi-lock"></i>

                    <input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (error) setError("");
                      }}
                      placeholder="Enter your password"
                      autoComplete="current-password"
                      disabled={busy}
                      required
                    />

                    <button
                      type="button"
                      className="rct-password-toggle"
                      onClick={() =>
                        setShowPassword((prev) => !prev)
                      }
                      disabled={busy}
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      <i
                        className={
                          showPassword
                            ? "bi bi-eye-slash"
                            : "bi bi-eye"
                        }
                      ></i>
                    </button>
                  </div>
                </div>

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  className="rct-login-button"
                  disabled={busy}
                >
                  {busy ? (
                    <>
                      <span
                        className="rct-button-spinner"
                        aria-hidden="true"
                      ></span>

                      Signing in...
                    </>
                  ) : (
                    <>
                      <span>Sign in to your account</span>
                      <i className="bi bi-arrow-right"></i>
                    </>
                  )}
                </button>
              </form>

              <div className="rct-security-note">
                <i className="bi bi-shield-lock-fill"></i>

                <span>
                  Your account and organizational data are protected
                  by secure authentication.
                </span>
              </div>

            </div>
          </section>

        </div>
      </div>
    </div>
  );
}