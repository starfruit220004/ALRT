import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function VerifyEmail() {
  const [status, setStatus]   = useState("verifying");
  const [message, setMessage] = useState("");
  const [searchParams]        = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus("error");
      setMessage("No verification token found. Please use the link sent to your email.");
      return;
    }
    fetch(`${BASE}/api/auth/verify-email?token=${token}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.message?.toLowerCase().includes("success") || data.message?.toLowerCase().includes("already verified")) {
          setStatus("success"); setMessage(data.message);
        } else {
          setStatus("error"); setMessage(data.message || "Verification failed.");
        }
      })
      .catch(() => { setStatus("error"); setMessage("Network error. Please try again."); });
  }, [searchParams]);

  return (
    <AuthLayout dotActive={1}>
      <h2 className="auth-title">Email Verification</h2>
      {status === "verifying" && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <p style={{ color: "#64748b", fontSize: "14px" }}>⏳ Verifying your email address…</p>
        </div>
      )}
      {status === "success" && (
        <div style={{ padding: "16px", borderRadius: "8px", background: "#f0fdf4", border: "1px solid #bbf7d0", marginBottom: "16px" }}>
          <p style={{ color: "#15803d", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>✅ {message}</p>
          <p style={{ color: "#166534", fontSize: "13px" }}>You can now sign in to your account.</p>
        </div>
      )}
      {status === "error" && (
        <div style={{ padding: "16px", borderRadius: "8px", background: "#fff1f2", border: "1px solid #fecdd3", marginBottom: "16px" }}>
          <p style={{ color: "#be123c", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>❌ Verification failed</p>
          <p style={{ color: "#9f1239", fontSize: "13px" }}>{message}</p>
        </div>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px" }}>
        {status === "success" && <Link to="/login" className="auth-btn" style={{ textAlign: "center", textDecoration: "none" }}>Go to Login</Link>}
        {status === "error"   && <Link to="/login" style={{ color: "#1d4ed8", fontSize: "13px", textAlign: "center" }}>Back to Login →</Link>}
      </div>
    </AuthLayout>
  );
}