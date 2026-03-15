import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

export default function Signup() {
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone]     = useState("");       // ← ADD
  const navigate = useNavigate();
  const { setUser } = useAuth();

  // ── Normal Email/Password Signup ─────────────────────────
  const signup = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),  // ← ADD phone
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Signup failed");
        return;
      }

      alert("✅ Account created successfully!");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
    }
  };

  // ── Google Signup ─────────────────────────────────────────
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const base64Url = credentialResponse.credential.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const payload = JSON.parse(atob(base64));

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
        alert(data.message || "Google signup failed");
        return;
      }

      localStorage.setItem("token",     data.token);
      localStorage.setItem("role",      data.role);
      localStorage.setItem("name",      data.name      || "");
      localStorage.setItem("email",     data.email     || "");
      localStorage.setItem("avatar",    data.avatar    || "");
      localStorage.setItem("userId",    data.id        || "");
      localStorage.setItem("mqttTopic", data.mqttTopic || "");
      localStorage.setItem("phone",     data.phone     || "");   // ← ADD

      setUser({
        token:     data.token,
        role:      data.role,
        name:      data.name      || "",
        email:     data.email     || "",
        avatar:    data.avatar    || null,
        userId:    data.id        || null,
        mqttTopic: data.mqttTopic || null,
        phone:     data.phone     || null,   // ← ADD
      });

      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Google signup error. Please try again.");
    }
  };

  return (
    <AuthLayout dotActive={1}>
      <p className="auth-eyebrow">Get started</p>
      <h2 className="auth-title">Create account</h2>
      <p className="auth-sub">
        Already have one? <a href="/">Sign in →</a>
      </p>

      <div className="auth-field">
        <label className="auth-label">Name</label>
        <input
          className="auth-input"
          placeholder="Jane Smith"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

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

      {/* ── ADD Phone Field ───────────────────────────────── */}
      <div className="auth-field">
        <label className="auth-label">Phone Number</label>
        <input
          className="auth-input"
          placeholder="+639XXXXXXXXX"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
      </div>

      <button onClick={signup} className="auth-btn">
        Sign Up
      </button>

      <p style={{ textAlign: "center", margin: "12px 0" }}>or</p>

      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={() => alert("Google Signup Failed")}
      />
    </AuthLayout>
  );
}