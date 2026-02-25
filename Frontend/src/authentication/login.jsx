import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      // ✅ Save token and role
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      alert("✅ Login successful!");

      // ✅ Redirect based on role
      if (data.role === "admin") {
        navigate("/admin");      // admin → Admin Dashboard
      } else {
        navigate("/dashboard");  // regular user → Dashboard
      }

    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
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
          onChange={e => setEmail(e.target.value)}
        />
      </div>

      <div className="auth-field">
        <label className="auth-label">Password</label>
        <input
          type="password"
          className="auth-input"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>

      <button onClick={login} className="auth-btn">Login</button>

      <span className="auth-footer">
        <a href="/forgot">Forgot Password?</a>
      </span>
    </AuthLayout>
  );
}