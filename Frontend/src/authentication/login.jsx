// import { useState } from "react";
// import { useNavigate } from "react-router-dom";
// import AuthLayout from "./AuthLayout";
// import { useAuth } from "../context/AuthContext";
// import { GoogleLogin } from "@react-oauth/google";

// export default function Login() {
//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const navigate = useNavigate();
//   const { setUser } = useAuth();

//   const login = async () => {
//     try {
//       const res = await fetch("http://localhost:5000/api/auth/login", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email, password })
//       });

//       const data = await res.json();

//       if (!res.ok) {
//         alert(data.message || "Login failed");
//         return;
//       }

//       // Save to localStorage
//       localStorage.setItem("token",  data.token);
//       localStorage.setItem("role",   data.role);
//       localStorage.setItem("name",   data.name  || "");
//       localStorage.setItem("email",  data.email || email);
//       localStorage.setItem("avatar", data.avatar || "");

//       // Set user in context
//       setUser({
//         token:  data.token,
//         role:   data.role,
//         name:   data.name  || "",
//         email:  data.email || email,
//         avatar: data.avatar || null,
//       });

//       if (data.role === "admin") {
//         navigate("/admin");
//       } else {
//         navigate("/dashboard");
//       }

//     } catch (err) {
//       console.error(err);
//       alert("Network error. Please try again.");
//     }
//   };

//   return (
//     <AuthLayout dotActive={0}>
//       <p className="auth-eyebrow">Welcome back</p>
//       <h2 className="auth-title">Sign in</h2>
//       <p className="auth-sub">
//         No account? <a href="/signup">Create one →</a>
//       </p>

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

//       <button onClick={login} className="auth-btn">Login</button>
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
//           onError={() => alert("Google Login Failed")}
//         />
//       </>

//       <span className="auth-footer">
//         <a href="/forgot">Forgot Password?</a>
//       </span>
//     </AuthLayout>
//   );
// }

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "./AuthLayout";
import { useAuth } from "../context/AuthContext";
import { GoogleLogin } from "@react-oauth/google";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setUser } = useAuth();

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

      localStorage.setItem("token",  data.token);
      localStorage.setItem("role",   data.role);
      localStorage.setItem("name",   data.name  || "");
      localStorage.setItem("email",  data.email || email);
      localStorage.setItem("avatar", data.avatar || "");

      setUser({
        token:  data.token,
        role:   data.role,
        name:   data.name  || "",
        email:  data.email || email,
        avatar: data.avatar || null,
      });

      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
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
      <p>or</p>
      
      <>
        <GoogleLogin 
          onSuccess={(credentialResponse) => {
            const base64Url = credentialResponse.credential.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const payload = JSON.parse(atob(base64));
            
            // Check UI memory: block if they didn't sign up first
            const registered = JSON.parse(localStorage.getItem("google_registered") || "[]");
            if (!registered.includes(payload.email)) {
              alert("Account not found. Please sign up first.");
              return;
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
          onError={() => alert("Google Login Failed")}
        />
      </>

      <span className="auth-footer">
        <a href="/forgot">Forgot Password?</a>
      </span>
    </AuthLayout>
  );
}