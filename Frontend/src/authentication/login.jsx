import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const login = async () => {
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Login failed"); return; }
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
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    try {
      const base64Url = credentialResponse.credential.split(".")[1];
      const payload   = JSON.parse(atob(base64Url.replace(/-/g, "+").replace(/_/g, "/")));
      const res = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: payload.email, name: payload.name, avatar: payload.picture }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Google login failed"); return; }
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
      navigate("/dashboard");
    } catch (err) {
      setError("Google login error. Please try again.");
    }
  };

  return (
    <AuthLayout dotActive={0}>
      <h2 className="auth-title">Sign in</h2>
      <p className="auth-sub">No account? <Link to="/signup">Create one →</Link></p>

      <div className="auth-field">
        <label className="auth-label">Email</label>
        <input className="auth-input" placeholder="you@example.com"
          value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      <div className="auth-field">
        <label className="auth-label">Password</label>
        <input type="password" className="auth-input" placeholder="••••••••"
          value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>

      {error && (
        <p style={{
          fontSize: "0.82rem",
          marginBottom: "8px",
          padding: "9px 12px",
          borderRadius: "8px",
          color: "#be123c",
          background: "#fff1f2",
          border: "1px solid #fecdd3",
        }}>{error}</p>
      )}

      <button onClick={login} className="auth-btn">Login</button>

      <p style={{ textAlign: "center", margin: "12px 0", color: "#94a3b8", fontSize: "0.8rem" }}>or</p>

      <div style={{ display: "flex", justifyContent: "center" }}>
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError("Google Login Failed")} />
      </div>

      <span className="auth-footer"><Link to="/forgot">Forgot Password?</Link></span>
    </AuthLayout>
  );
}