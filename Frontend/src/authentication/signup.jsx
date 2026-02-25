import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const signup = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });

      const data = await res.json();

      if (!res.ok) {
        // Handle error from backend
        alert(data.message || "Signup failed");
        return;
      }

      alert("✅ Account created successfully!");
      navigate("/"); // redirect to login
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again.");
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
          onChange={e => setName(e.target.value)}
        />
      </div>

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

      <button onClick={signup} className="auth-btn">Signup</button>
    </AuthLayout>
  );
}