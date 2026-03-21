import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";

export default function ResetPassword() {
  const [newPassword, setNewPassword]         = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState("");
  const [successMsg, setSuccessMsg]           = useState("");

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const handleReset = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

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
        setSuccessMsg("Password updated successfully!");
        navigate("/login");
      } else {
        setError(data.message || "Failed to reset password.");
      }
    } catch {
      setError("Network error. Make sure your server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout dotActive={2}>
      <p className="auth-eyebrow">Account recovery</p>
      <h2 className="auth-title">Create New Password</h2>
      <p className="auth-sub">Enter your new password below to regain access.</p>

      {/* Error message */}
      {error && (
        <p style={{
          fontSize: "0.82rem",
          marginBottom: "8px",
          padding: "9px 12px",
          borderRadius: "8px",
          color: "#be123c",
          background: "#fff1f2",
          border: "1px solid #fecdd3",
        }}>
          {error}
        </p>
      )}

      {/* Success message */}
      {successMsg && (
        <p style={{
          fontSize: "0.82rem",
          marginBottom: "8px",
          padding: "9px 12px",
          borderRadius: "8px",
          color: "#15803d",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
        }}>
          {successMsg}
        </p>
      )}

      <form onSubmit={handleReset}>
        <div className="auth-field">
          <label className="auth-label">New Password</label>
          <input className="auth-input" type="password"
            value={newPassword} placeholder="Min. 6 characters"
            onChange={e => setNewPassword(e.target.value)} required />
        </div>

        <div className="auth-field">
          <label className="auth-label">Confirm Password</label>
          <input className="auth-input" type="password"
            value={confirmPassword} placeholder="Repeat new password"
            onChange={e => setConfirmPassword(e.target.value)} required />
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>

      <div style={{ marginTop: "16px", textAlign: "center" }}>
        <Link to="/login" style={{ color: "#1d4ed8", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
          Return to Login
        </Link>
      </div>
    </AuthLayout>
  );
}