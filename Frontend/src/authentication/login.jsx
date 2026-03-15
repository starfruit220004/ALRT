import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // ── Normal Email/Password Login ──────────────────────────
  const login = async () => {
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      // ✅ setUser handles all localStorage writes — no need to duplicate them
      setUser({
        token:     data.token,
        role:      data.role,
        name:      data.name      || "",
        email:     data.email     || email,
        avatar:    data.avatar    || null,
        userId:    data.id,           // backend returns `id`
        mqttTopic: data.mqttTopic || null,
      });

      navigate(data.role === "admin" ? "/admin" : "/dashboard");
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    }
  };

  // ── Google Login ─────────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    try {
      // Decode Google JWT to get user info
      const base64Url = credentialResponse.credential.split(".")[1];
      const base64    = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload   = JSON.parse(atob(base64));

      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email:  payload.email,
          name:   payload.name,
          avatar: payload.picture,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Google login failed");
        return;
      }

      setUser({
        token:     data.token,
        role:      data.role,
        name:      data.name      || "",
        email:     data.email     || "",
        avatar:    data.avatar    || null,
        userId:    data.id,
        mqttTopic: data.mqttTopic || null,
      });

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Google login error. Please try again.");
    }
  };

  return (
    <AuthLayout dotActive={0}>
      <p className="auth-eyebrow">Welcome back</p>
      <h2 className="auth-title">Sign in</h2>
      <p className="auth-sub">
        No account? <a href="/signup">Create one →</a>
      </p>

      <div className="auth-field">
        <label className="auth-label">Email</label>
        <input
          className="auth-input"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
        />
      </div>

      {/* ✅ Inline error instead of alert() */}
      {error && (
        <p style={{ color: "#ef4444", fontSize: "0.875rem", marginTop: "-4px" }}>
          {error}
        </p>
      )}

      <button onClick={login} className="auth-btn">
        Login
      </button>

      <p style={{ textAlign: "center", margin: "12px 0" }}>or</p>

      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => setError("Google Login Failed")}
      />

      <span className="auth-footer">
        <a href="/forgot">Forgot Password?</a>
      </span>
    </AuthLayout>
  );
}