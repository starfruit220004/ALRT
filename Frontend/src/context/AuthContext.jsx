import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token     = localStorage.getItem("token");
    const role      = localStorage.getItem("role");
    const name      = localStorage.getItem("name");
    const email     = localStorage.getItem("email");
    const avatar    = localStorage.getItem("avatar") || null;
    const userId    = localStorage.getItem("userId") || null;
    const mqttTopic = localStorage.getItem("mqttTopic") || null;

    if (token && role) {
      setUserState({ token, role, name, email, avatar, userId, mqttTopic });
    }
    setLoading(false);
  }, []);

  function setUser(userData) {
    if (!userData) { setUserState(null); return; }
    setUserState(userData);
    localStorage.setItem("token",     userData.token     || "");
    localStorage.setItem("role",      userData.role      || "");
    localStorage.setItem("name",      userData.name      || "");
    localStorage.setItem("email",     userData.email     || "");
    localStorage.setItem("avatar",    userData.avatar    || "");
    localStorage.setItem("userId",    userData.userId    || "");
    localStorage.setItem("mqttTopic", userData.mqttTopic || "");
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    localStorage.removeItem("email");
    localStorage.removeItem("avatar");
    localStorage.removeItem("userId");
    localStorage.removeItem("mqttTopic");
    setUserState(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}