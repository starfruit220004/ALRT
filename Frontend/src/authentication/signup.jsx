// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AuthLayout from "./AuthLayout";
// import { useAuth } from "../context/AuthContext";
// import { GoogleLogin } from "@react-oauth/google";

// export default function Signup() {
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const navigate = useNavigate();
//   const { setUser } = useAuth();

//   const signup = async () => {
//     try {
//       const res = await fetch("http://localhost:5000/api/auth/signup", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ name, email, password })
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         alert(data.message || "Signup failed");
//         return;
//       }

//       alert("✅ Account created successfully!");
//       navigate("/"); // redirect to login
//     } catch (err) {
//       console.error(err);
//       alert("Network error. Please try again.");
//     }
//   };

//   return (
//     <AuthLayout dotActive={1}>
//       <p className="auth-eyebrow">Get started</p>
//       <h2 className="auth-title">Create account</h2>
//       <p className="auth-sub">
//         Already have one? <a href="/">Sign in →</a>
//       </p>

//       <div className="auth-field">
//         <label className="auth-label">Name</label>
//         <input
//           className="auth-input"
//           placeholder="Jane Smith"
//           value={name}
//           onChange={e => setName(e.target.value)}
//         />
//       </div>

//       <div className="auth-field">
//         <label className="auth-label">Email</label>
//         <input
//           className="auth-input"
//           placeholder="you@example.com"
//           value={email}
//           onChange={e => setEmail(e.target.value)}
//         />
//       </div>

//       <div className="auth-field">
//         <label className="auth-label">Password</label>
//         <input
//           type="password"
//           className="auth-input"
//           placeholder="••••••••"
//           value={password}
//           onChange={e => setPassword(e.target.value)}
//         />
//       </div>

//       <button onClick={signup} className="auth-btn">Signup</button>
//       <p>or</p>
      
//       <>
//         <GoogleLogin 
//           onSuccess={(credentialResponse) => {
//             // Fix special characters for atob
//             const base64Url = credentialResponse.credential.split('.')[1];
//             const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
//             const payload = JSON.parse(atob(base64));
            
//             localStorage.setItem("token", credentialResponse.credential);
//             localStorage.setItem("role", "user");
//             localStorage.setItem("name", payload.name);
//             localStorage.setItem("email", payload.email);
//             localStorage.setItem("avatar", payload.picture);

//             setUser({
//               token: credentialResponse.credential,
//               role: "user",
//               name: payload.name,
//               email: payload.email,
//               avatar: payload.picture,
//             });

//             navigate("/dashboard");
//           }}
//           onError={() => alert("Google Signup Failed")}
//         />
//       </>

//     </AuthLayout>
//   );
// }

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const signup = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
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
      <p>or</p>
      
      <>
        <GoogleLogin 
          onSuccess={(credentialResponse) => {
            const base64Url = credentialResponse.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            
            // UI memory: save that this Google email has signed up
            const registered = JSON.parse(localStorage.getItem("google_registered") || "[]");
            if (!registered.includes(payload.email)) {
              registered.push(payload.email);
              localStorage.setItem("google_registered", JSON.stringify(registered));
            }
            
            localStorage.setItem("token", credentialResponse.credential);
            localStorage.setItem("role", "user");
            localStorage.setItem("name", payload.name);
            localStorage.setItem("email", payload.email);
            localStorage.setItem("avatar", payload.picture);

            setUser({
              token: credentialResponse.credential,
              role: "user",
              name: payload.name,
              email: payload.email,
              avatar: payload.picture,
            });

            navigate("/dashboard");
          }}
          onError={() => alert("Google Signup Failed")}
        />
      </>

    </AuthLayout>
  );
}