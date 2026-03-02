import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const sendReset = async () => {
    if (!email) {
      alert("Please enter your email address.");
      return;
    }

    setLoading(true);
    try {
      // Hits the endpoint defined in your authRoutes.js
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        // Successful trigger of sendEmail.js
        alert("A password reset link has been sent to your email!");
      } else {
        // Handles 'User not found' or other backend errors
        alert(`Error: ${data.message || "Something went wrong."}`);
      }
    } catch (error) {
      alert("Network Error: Please ensure your backend server is running on port 5000.");
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

      <div className="auth-field">
        <label className="auth-label">Email Address</label>
        <input
          className="auth-input"
          type="email"
          value={email}
          placeholder="erica@example.com"
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
      </div>

      <button 
        onClick={sendReset} 
        className="auth-btn"
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Reset Link"}
      </button>
    </AuthLayout>
  );
}