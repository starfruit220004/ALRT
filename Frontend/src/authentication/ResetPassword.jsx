// authentication/ResetPassword.jsx
import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";

export default function ResetPassword() {
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const [success, setSuccess]                 = useState(false);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid request. Please use the link sent to your email.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => navigate("/login"), 3000);
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch {
      setError("Network error. Make sure your server is running.");
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCESS SCREEN ──
  if (success) {
    return (
      <AuthLayout dotActive={2}>
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "#f0fdf4", border: "2px solid #86efac",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", fontSize: "1.9rem",
          }}>
            ✅
          </div>

          <h2 className="auth-title" style={{ marginBottom: "8px" }}>
            Password updated!
          </h2>

          <p style={{
            color: "#64748b", fontSize: "0.87rem", lineHeight: 1.7,
            marginBottom: "26px",
          }}>
            Your password has been changed successfully.
            Redirecting you to login in a moment…
          </p>

          <Link
            to="/login"
            className="auth-btn"
            style={{ display: "block", textDecoration: "none", textAlign: "center" }}
          >
            Go to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ── FORM ──
  return (
    <AuthLayout dotActive={2}>
      <h2 className="auth-title">New Password</h2>
      <p className="auth-sub">Enter your new password below to regain access.</p>

      {error && (
        <div style={{
          marginBottom: "12px", padding: "14px 16px", borderRadius: "10px",
          background: "#fff1f2", border: "1px solid #fecdd3",
          borderLeft: "4px solid #f43f5e", width: "100%", textAlign: "left",
        }}>
          <p style={{ color: "#9f1239", fontWeight: 600, marginBottom: "4px", fontSize: "0.85rem" }}>
            ⚠️ Error
          </p>
          <p style={{ color: "#be123c", fontSize: "0.80rem", lineHeight: 1.6 }}>
            {error}
          </p>
        </div>
      )}

      <form onSubmit={handleReset} style={{ width: "100%" }}>
        <div className="auth-field">
          <label className="auth-label">New Password</label>
          <input
            className="auth-input"
            type="password"
            value={newPassword}
            placeholder="Min. 6 characters"
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label">Confirm Password</label>
          <input
            className="auth-input"
            type="password"
            value={confirmPassword}
            placeholder="Repeat new password"
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Updating…" : "Update Password"}
        </button>
      </form>

      <span className="auth-footer">
        <Link to="/login">Return to Login</Link>
      </span>
    </AuthLayout>
  );
}