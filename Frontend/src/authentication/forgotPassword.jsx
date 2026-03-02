import { useState } from "react";
import AuthLayout from "./AuthLayout";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const sendReset = async () => {
    setError("");
    if (!email) return setError("Please enter your email.");

    try {
      const res = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) return setError(data.message || "Something went wrong.");

      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    }
  };

  return (
    <AuthLayout dotActive={2}>
      <p className="auth-eyebrow">Account recovery</p>
      <h2 className="auth-title">Forgot Password</h2>
      <p className="auth-sub">
        Remembered it? <a href="/">Back to login →</a>
      </p>

      {sent ? (
        <p className="text-sm text-green-600 mt-2">
          ✅ Reset token generated — check the backend console.
        </p>
      ) : (
        <>
          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

          <div className="auth-field">
            <label className="auth-label">Email</label>
            {/* FIX: input was missing value={email} — it was uncontrolled */}
            <input
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>

          <button onClick={sendReset} className="auth-btn">Send Reset</button>
        </>
      )}
    </AuthLayout>
  );
}