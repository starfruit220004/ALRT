import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const sendReset = async () => {
    setError("");

    if (!email) {
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

      setSent(true); // Show success message
    } catch (err) {
      setError("Network Error: Please ensure your backend server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout dotActive={2}>
      <p className="auth-eyebrow">Account recovery</p>
      <h2 className="auth-title">Forgot Password</h2>
      <p className="auth-sub">
        Remembered it? <Link to="/">Back to login →</Link>
      </p>

      {sent ? (
        <p style={{ color: "green", marginTop: "12px", fontSize: "14px" }}>
          ✅ A password reset link has been sent to your email!
        </p>
      ) : (
        <>
          {error && (
            <p style={{ color: "red", marginBottom: "8px", fontSize: "14px" }}>
              {error}
            </p>
          )}

          <div className="auth-field">
            <label className="auth-label">Email Address</label>
            <input
              className="auth-input"
              type="email"
              value={email}
              placeholder="you@example.com"
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <button onClick={sendReset} className="auth-btn" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </>
      )}
    </AuthLayout>
  );
}