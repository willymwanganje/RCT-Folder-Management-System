import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

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
      toast?.push(message, "error");
      return;
    }

    setBusy(true);

    try {
      await login(cleanEmail, password);

      toast?.push("Welcome back", "success");

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
      toast?.push(message, "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="container">
        <div className="row justify-content-center align-items-center min-vh-100">
          <div className="col-12 col-md-10 col-lg-8">
            <div className="row g-4 align-items-center">

              {/* RCT BRAND */}
              <div className="col-12 col-lg-6 text-white">
                <div className="text-center text-lg-start">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-4 shadow mb-3"
                    style={{
                      width: "90px",
                      height: "90px",
                      background: "#c9a227",
                      color: "#0d3b2e",
                      fontSize: "28px",
                      fontWeight: "800",
                    }}
                  >
                    RCT
                  </div>

                  <h1 className="fw-bold mb-2">
                    Rice Council of Tanzania
                  </h1>

                  <p className="lead opacity-75 mb-0">
                    Secure folder and document management
                    for authorized staff.
                  </p>
                </div>
              </div>

              {/* LOGIN CARD */}
              <div className="col-12 col-lg-6">
                <div className="card border-0 shadow-lg rounded-4">
                  <div className="card-body p-4 p-md-5">

                    <div className="text-center mb-4">
                      <div
                        className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                        style={{
                          width: "60px",
                          height: "60px",
                          background: "#eaf3ee",
                          color: "#145c43",
                        }}
                      >
                        <i className="bi bi-person-lock fs-3"></i>
                      </div>

                      <h2 className="fw-bold mb-1">
                        Sign in
                      </h2>

                      <p className="text-muted mb-0">
                        Access your RCT account
                      </p>
                    </div>

                    {/* ERROR MESSAGE */}
                    {error && (
                      <div
                        className="alert alert-danger d-flex align-items-center"
                        role="alert"
                      >
                        <i className="bi bi-exclamation-circle-fill me-2"></i>
                        <span>{error}</span>
                      </div>
                    )}

                    <form onSubmit={onSubmit} noValidate>

                      {/* EMAIL */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Organizational email
                        </label>

                        <div className="input-group">
                          <span className="input-group-text bg-white">
                            <i className="bi bi-envelope"></i>
                          </span>

                          <input
                            type="email"
                            className="form-control"
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
                      <div className="mb-3">
                        <label className="form-label fw-semibold">
                          Password
                        </label>

                        <div className="input-group">
                          <span className="input-group-text bg-white">
                            <i className="bi bi-lock"></i>
                          </span>

                          <input
                            type={showPassword ? "text" : "password"}
                            className="form-control"
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
                            className="btn btn-outline-secondary"
                            onClick={() =>
                              setShowPassword((prev) => !prev)
                            }
                            disabled={busy}
                            aria-label={
                              showPassword
                                ? "Hide password"
                                : "Show password"
                            }
                            title={
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

                      {/* SUBMIT */}
                      <button
                        type="submit"
                        className="btn btn-success w-100 py-2 fw-semibold"
                        disabled={busy}
                      >
                        {busy ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Signing in...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-box-arrow-in-right me-2"></i>
                            Sign in
                          </>
                        )}
                      </button>

                      {/* FORGOT PASSWORD */}
                      <div className="text-center mt-3">
                        <Link
                          to="/forgot-password"
                          className="text-decoration-none"
                        >
                          Forgot password?
                        </Link>
                      </div>

                    </form>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}