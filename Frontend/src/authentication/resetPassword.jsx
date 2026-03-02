import { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Automatically extracts ?token=... from the URL 
  const token = searchParams.get("token");

  const handleReset = async (e) => {
    e.preventDefault();

    if (!token) {
      alert("Invalid request. Please use the link sent to your email.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      // Sends the token and new password to your backend API 
      const response = await fetch("http://localhost:5000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }) 
      });

      const data = await response.json();

      if (response.ok) {
        alert("Password updated successfully! Redirecting to login...");
        navigate("/"); // Redirect to login page 
      } else {
        alert(data.message || "Failed to reset password.");
      }
    } catch (error) {
      alert("Network Error: Make sure your server is running.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout dotActive={2}>
      <p className="auth-eyebrow">Account recovery</p>
      <h2 className="auth-title">Create New Password</h2>
      <p className="auth-sub">
        Enter your new password below to regain access.
      </p>

      <form onSubmit={handleReset}>
        <div className="auth-field">
          <label className="auth-label">New Password</label>
          <input
            className="auth-input"
            type="password"
            value={newPassword}
            placeholder="Min. 8 characters"
            onChange={e => setNewPassword(e.target.value)}
            required
          />
        </div>

        <div className="auth-field">
          <label className="auth-label">Confirm Password</label>
          <input
            className="auth-input"
            type="password"
            value={confirmPassword}
            placeholder="Repeat new password"
            onChange={e => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit" 
          className="auth-btn" 
          disabled={loading}
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </form>

      <div className="auth-links" style={{ marginTop: "20px", textAlign: "center" }}>
        <Link to="/" style={{ color: "#007bff", textDecoration: "none", fontSize: "14px" }}>
          Return to Login
        </Link>
      </div>
    </AuthLayout>
  );
}