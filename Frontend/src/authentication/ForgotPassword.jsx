// authentication/ForgotPassword.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const sendReset = async () => {
    setError("");
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Something went wrong.");
        return;
      }
      setSent(true);
    } catch {
      setError("Network error. Please ensure your backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  // ── SUCCESS SCREEN ──
  if (sent) {
    return (
      <AuthLayout dotActive={2}>
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "50%",
            background: "#f0fdf4", border: "2px solid #86efac",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px", fontSize: "1.9rem",
          }}>
            📩
          </div>

          <h2 className="auth-title" style={{ marginBottom: "8px" }}>
            Check your email
          </h2>

          <p style={{ color: "#64748b", fontSize: "0.87rem", lineHeight: 1.6, marginBottom: "4px" }}>
            We sent a password reset link to:
          </p>
          <p style={{
            fontWeight: 700, color: "#1e293b", fontSize: "0.92rem",
            marginBottom: "18px", wordBreak: "break-all",
          }}>
            {email}
          </p>

          <p style={{
            color: "#64748b", fontSize: "0.82rem", lineHeight: 1.8,
            marginBottom: "26px", padding: "0 4px",
          }}>
            Click the link in that email to reset your password.
            It expires in <strong>10 minutes</strong> — also check
            your <strong>spam or junk folder</strong>.
          </p>

          <Link
            to="/login"
            className="auth-btn"
            style={{ display: "block", textDecoration: "none", textAlign: "center" }}
          >
            Back to Login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  // ── FORM ──
  return (
    <AuthLayout dotActive={2}>
      <h2 className="auth-title">Forgot Password</h2>
      <p className="auth-sub">
        Remembered it? <Link to="/login">Back to login →</Link>
      </p>

      <div className="auth-field">
        <label className="auth-label">Email Address</label>
        <input
          className="auth-input"
          type="email"
          value={email}
          placeholder="you@example.com"
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          onKeyDown={(e) => e.key === "Enter" && sendReset()}
        />
      </div>

      {error && (
        <div style={{
          marginBottom: "12px", padding: "14px 16px", borderRadius: "10px",
          background: "#fff1f2", border: "1px solid #fecdd3",
          borderLeft: "4px solid #f43f5e",
        }}>
          <p style={{ color: "#9f1239", fontWeight: 600, marginBottom: "4px", fontSize: "0.85rem" }}>
            🔍 Account not found
          </p>
          <p style={{ color: "#be123c", fontSize: "0.80rem", lineHeight: 1.6 }}>
            {error}
          </p>
        </div>
      )}

      <button onClick={sendReset} className="auth-btn" disabled={loading}>
        {loading ? "Sending…" : "Send Reset Link"}
      </button>
    </AuthLayout>
  );
}