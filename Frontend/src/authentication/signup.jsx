import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Signup() {
  const [firstName, setFirstName]   = useState("");
  const [lastName, setLastName]     = useState("");
  const [middleName, setMiddleName] = useState("");
  const [username, setUsername]     = useState("");
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [phone, setPhone]           = useState("");
  const [address, setAddress]       = useState("");
  const [errors, setErrors]         = useState({});
  const [formMessage, setFormMessage]       = useState({ text: "", type: "" });
  const [signupSuccess, setSignupSuccess]   = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const navigate = useNavigate();
  const { setUser } = useAuth();

  const showMessage = (text, type = "error") => setFormMessage({ text, type });

  const validate = () => {
    const newErrors = {};
    if (!firstName.trim())  newErrors.firstName  = "First name is required.";
    if (!lastName.trim())   newErrors.lastName   = "Last name is required.";
    if (!username.trim())   newErrors.username   = "Username is required.";
    if (!email.trim())      newErrors.email      = "Email is required.";
    if (!password.trim())   newErrors.password   = "Password is required.";
    if (!phone.trim())      newErrors.phone      = "Phone number is required.";
    if (!address.trim())    newErrors.address    = "Address is required.";
    return newErrors;
  };

  const signup = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) { setErrors(validationErrors); return; }
    setErrors({}); setFormMessage({ text: "", type: "" });
    try {
      const name = `${firstName} ${lastName}`.trim();
      const res = await fetch(`${BASE}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone, username, firstName, lastName, middleName, address }),
      });
      const data = await res.json();
      if (!res.ok) { showMessage(data.message || "Signup failed."); return; }
      setSubmittedEmail(email);
      setSignupSuccess(true);
    } catch {
      showMessage("Network error. Please try again.");
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setFormMessage({ text: "", type: "" });
    try {
      const res = await fetch(`${BASE}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: credentialResponse.credential }),
      });
      const data = await res.json();
      if (!res.ok) { showMessage(data.message || "Google signup failed."); return; }
      setUser({

        token: data.token, role: data.role, name: data.name || "", email: data.email || "",
        avatar: data.avatar || null, userId: data.id || null, mqttTopic: data.mqttTopic || null,
        phone: data.phone || null, username: data.username || null,
        firstName: data.firstName || null, lastName: data.lastName || null,
        middleName: data.middleName || null, address: data.address || null,
      });
      navigate("/dashboard");
    } catch { showMessage("Google signup error. Please try again."); }
  };

  const inputClass = (field) => `auth-input${errors[field] ? " auth-input--error" : ""}`;

  if (signupSuccess) {
    return (
      <AuthLayout dotActive={1}>
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#f0fdf4", border: "2px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "1.9rem" }}>📬</div>
          <h2 className="auth-title" style={{ marginBottom: "8px" }}>Check your email</h2>
          <p style={{ color: "#64748b", fontSize: "0.87rem", lineHeight: 1.6, marginBottom: "4px" }}>We sent a verification link to:</p>
          <p style={{ fontWeight: 700, color: "#1e293b", fontSize: "0.92rem", marginBottom: "18px", wordBreak: "break-all" }}>{submittedEmail}</p>
          <p style={{ color: "#64748b", fontSize: "0.82rem", lineHeight: 1.8, marginBottom: "26px", padding: "0 4px" }}>
            Click the link in that email to activate your account. Also check your <strong>spam or junk folder</strong>.
          </p>
          <Link to="/login" className="auth-btn" style={{ display: "block", textDecoration: "none", textAlign: "center" }}>Go to Login</Link>
          <p style={{ marginTop: "16px", fontSize: "0.78rem", color: "#94a3b8" }}>
            Didn't receive it? <Link to="/login" style={{ color: "#3b82f6", textDecoration: "underline" }}>You can resend it from the login page.</Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout dotActive={1}>
      <h2 className="auth-title">Create account</h2>
      <p className="auth-sub">Already have one? <Link to="/login">Sign in →</Link></p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <div className="auth-field">
          <label className="auth-label">First Name</label>
          <input className={inputClass("firstName")} placeholder="Juan" value={firstName} onChange={e => setFirstName(e.target.value)} />
          {errors.firstName && <span className="auth-error">{errors.firstName}</span>}
        </div>
        <div className="auth-field">
          <label className="auth-label">Last Name</label>
          <input className={inputClass("lastName")} placeholder="Dela Cruz" value={lastName} onChange={e => setLastName(e.target.value)} />
          {errors.lastName && <span className="auth-error">{errors.lastName}</span>}
        </div>
      </div>
      <div className="auth-field">
        <label className="auth-label">Middle Name <span style={{ color: "#94a3b8", fontWeight: 400 }}>(optional)</span></label>
        <input className="auth-input" placeholder="Santos" value={middleName} onChange={e => setMiddleName(e.target.value)} />
      </div>
      <div className="auth-field">
        <label className="auth-label">Username</label>
        <input className={inputClass("username")} placeholder="juandelacruz" value={username} onChange={e => setUsername(e.target.value)} />
        {errors.username && <span className="auth-error">{errors.username}</span>}
      </div>
      <div className="auth-field">
        <label className="auth-label">Email</label>
        <input className={inputClass("email")} placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
        {errors.email && <span className="auth-error">{errors.email}</span>}
      </div>
      <div className="auth-field">
        <label className="auth-label">Password</label>
        <input type="password" className={inputClass("password")} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
        {errors.password && <span className="auth-error">{errors.password}</span>}
      </div>
      <div className="auth-field">
        <label className="auth-label">Phone Number</label>
        <input className={inputClass("phone")} placeholder="+639XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
        {errors.phone && <span className="auth-error">{errors.phone}</span>}
      </div>
      <div className="auth-field">
        <label className="auth-label">Address</label>
        <input className={inputClass("address")} placeholder="123 Rizal St, Zamboanga City" value={address} onChange={e => setAddress(e.target.value)} />
        {errors.address && <span className="auth-error">{errors.address}</span>}
      </div>
      {formMessage.text && (
        <p style={{ fontSize: "0.82rem", marginBottom: "8px", padding: "9px 12px", borderRadius: "8px", color: formMessage.type === "success" ? "#15803d" : "#be123c", background: formMessage.type === "success" ? "#f0fdf4" : "#fff1f2", border: `1px solid ${formMessage.type === "success" ? "#bbf7d0" : "#fecdd3"}` }}>
          {formMessage.text}
        </p>
      )}
      <button onClick={signup} className="auth-btn">Sign Up</button>
      <p style={{ textAlign: "center", margin: "12px 0", color: "#94a3b8", fontSize: "0.8rem" }}>or</p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => showMessage("Google signup failed.")} />
      </div>
    </AuthLayout>
  );
}