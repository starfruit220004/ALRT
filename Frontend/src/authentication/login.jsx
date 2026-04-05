// authentication/login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [error, setError]           = useState("");
  const [errorType, setErrorType]   = useState(""); // "notfound" | "unverified" | "deactivated" | "invalid" | "generic"
  const [resendSent, setResendSent] = useState(false);
  const [resending, setResending]   = useState(false);

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const login = async () => {
    setError("");
    setErrorType("");
    setResendSent(false);
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.unverified) {
          setErrorType("unverified");
        } else if (res.status === 404) {
          setErrorType("notfound");
        } else if (res.status === 403) {
          setErrorType("deactivated");
        } else if (res.status === 401) {
          setErrorType("invalid");
        } else {
          setError(data.message || "Login failed.");
          setErrorType("generic");
        }
        return;
      }

      setUser({
        token:      data.token,
        role:       data.role,
        name:       data.name       || "",
        email:      data.email      || email,
        avatar:     data.avatar     || null,
        userId:     data.id,
        mqttTopic:  data.mqttTopic  || null,
        phone:      data.phone      || null,
        username:   data.username   || null,
        firstName:  data.firstName  || null,
        lastName:   data.lastName   || null,
        middleName: data.middleName || null,
        address:    data.address    || null,
      });
      navigate(data.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setError("Network error. Please try again.");
      setErrorType("generic");
    }
  };

  const handleResend = async () => {
    setResending(true);
    setResendSent(false);
    try {
      const res = await fetch("http://localhost:5000/api/auth/resend-verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendSent(true);
      } else {
        setError(data.message || "Failed to resend verification email.");
        setErrorType("generic");
      }
    } catch {
      setError("Network error. Please try again.");
      setErrorType("generic");
    } finally {
      setResending(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setErrorType("");
    try {
      const base64Url = credentialResponse.credential.split(".")[1];
      const payload   = JSON.parse(atob(base64Url.replace(/-/g, "+").replace(/_/g, "/")));
      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload.email, name: payload.name, avatar: payload.picture }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Google login failed."); setErrorType("generic"); return; }
      setUser({
        token:      data.token,
        role:       data.role,
        name:       data.name       || "",
        email:      data.email      || "",
        avatar:     data.avatar     || null,
        userId:     data.id,
        mqttTopic:  data.mqttTopic  || null,
        phone:      data.phone      || null,
        username:   data.username   || null,
        firstName:  data.firstName  || null,
        lastName:   data.lastName   || null,
        middleName: data.middleName || null,
        address:    data.address    || null,
      });
      navigate(data.role === "admin" ? "/admin" : "/dashboard");
    } catch {
      setError("Google login error. Please try again.");
      setErrorType("generic");
    }
  };

  const handleKeyDown = (e) => { if (e.key === "Enter") login(); };

  return (
    <AuthLayout dotActive={0}>
      <h2 className="auth-title">Sign in</h2>
      <p className="auth-sub">No account? <Link to="/signup">Create one →</Link></p>

      <div className="auth-field">
        <label className="auth-label">Email</label>
        <input
          className="auth-input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      <div className="auth-field">
        <label className="auth-label">Password</label>
        <input
          type="password"
          className="auth-input"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={handleKeyDown}
        />
      </div>

      {/* ── User not found ── */}
      {errorType === "notfound" && (
        <div style={{
          marginBottom: "12px", padding: "14px 16px", borderRadius: "10px",
          background: "#fff1f2", border: "1px solid #fecdd3",
          borderLeft: "4px solid #f43f5e",
        }}>
          <p style={{ color: "#9f1239", fontWeight: 600, marginBottom: "4px", fontSize: "0.85rem" }}>
            🔍 No account found
          </p>
          <p style={{ color: "#be123c", fontSize: "0.80rem", lineHeight: 1.6, marginBottom: "10px" }}>
            We couldn't find an account for <strong>{email}</strong>.
            Double-check your email or create a new account.
          </p>
          <Link
            to="/signup"
            style={{
              fontSize: "0.80rem", fontWeight: 600, color: "#be123c",
              border: "1px solid #fecdd3", borderRadius: "6px",
              padding: "5px 12px", textDecoration: "none",
              display: "inline-block",
            }}
          >
            Create an account →
          </Link>
        </div>
      )}

      {/* ── Email not verified ── */}
      {errorType === "unverified" && (
        <div style={{
          marginBottom: "12px", padding: "14px 16px", borderRadius: "10px",
          background: "#fffbeb", border: "1px solid #fcd34d",
          borderLeft: "4px solid #f59e0b",
        }}>
          <p style={{ color: "#78350f", fontWeight: 600, marginBottom: "4px", fontSize: "0.85rem" }}>
            📬 Check your email to continue
          </p>
          <p style={{ color: "#92400e", fontSize: "0.80rem", marginBottom: "10px", lineHeight: 1.6 }}>
            We sent a verification link to <strong>{email}</strong>.
            Please open it to activate your account before logging in.
            Also check your <strong>spam or junk folder</strong>.
          </p>
          {resendSent ? (
            <p style={{ color: "#15803d", fontWeight: 500, fontSize: "0.80rem" }}>
              ✅ Verification email resent! Check your inbox.
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              style={{
                fontSize: "0.80rem", fontWeight: 600, color: "#b45309",
                background: "none", border: "1px solid #fcd34d",
                borderRadius: "6px", cursor: "pointer",
                padding: "5px 12px",
              }}
            >
              {resending ? "Sending…" : "Resend verification email"}
            </button>
          )}
        </div>
      )}

      {/* ── Account deactivated ── */}
      {errorType === "deactivated" && (
        <div style={{
          marginBottom: "12px", padding: "14px 16px", borderRadius: "10px",
          background: "#f8fafc", border: "1px solid #cbd5e1",
          borderLeft: "4px solid #64748b",
        }}>
          <p style={{ color: "#1e293b", fontWeight: 600, marginBottom: "4px", fontSize: "0.85rem" }}>
            🚫 Account deactivated
          </p>
          <p style={{ color: "#475569", fontSize: "0.80rem", lineHeight: 1.6 }}>
            Your account has been deactivated. Please contact an administrator for assistance.
          </p>
        </div>
      )}

      {/* ── Wrong password ── */}
      {errorType === "invalid" && (
        <div style={{
          marginBottom: "12px", padding: "14px 16px", borderRadius: "10px",
          background: "#fff1f2", border: "1px solid #fecdd3",
          borderLeft: "4px solid #f43f5e",
        }}>
          <p style={{ color: "#9f1239", fontWeight: 600, marginBottom: "4px", fontSize: "0.85rem" }}>
            🔐 Incorrect password
          </p>
          <p style={{ color: "#be123c", fontSize: "0.80rem", lineHeight: 1.6, marginBottom: "8px" }}>
            The password you entered is incorrect. Please try again.
          </p>
          <Link
            to="/forgot"
            style={{
              fontSize: "0.80rem", fontWeight: 600, color: "#be123c",
              textDecoration: "underline",
            }}
          >
            Forgot your password?
          </Link>
        </div>
      )}

      {/* ── Generic error ── */}
      {errorType === "generic" && error && (
        <p style={{
          fontSize: "0.82rem", marginBottom: "8px", padding: "9px 12px",
          borderRadius: "8px", color: "#be123c", background: "#fff1f2",
          border: "1px solid #fecdd3",
        }}>{error}</p>
      )}

      <button onClick={login} className="auth-btn">Login</button>

      <p style={{ textAlign: "center", margin: "12px 0", color: "#94a3b8", fontSize: "0.8rem" }}>or</p>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => { setError("Google Login Failed"); setErrorType("generic"); }}
        />
      </div>

      <span className="auth-footer"><Link to="/forgot">Forgot Password?</Link></span>
    </AuthLayout>
  );
}