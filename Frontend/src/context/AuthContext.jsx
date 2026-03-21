import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token      = localStorage.getItem("token");
    const role       = localStorage.getItem("role");
    const name       = localStorage.getItem("name");
    const email      = localStorage.getItem("email");
    const avatar     = localStorage.getItem("avatar")     || null;
    const userId     = localStorage.getItem("userId")     || null;
    const mqttTopic  = localStorage.getItem("mqttTopic")  || null;
    const phone      = localStorage.getItem("phone")      || null;
    const username   = localStorage.getItem("username")   || null;
    const firstName  = localStorage.getItem("firstName")  || null;
    const lastName   = localStorage.getItem("lastName")   || null;
    const middleName = localStorage.getItem("middleName") || null;
    const address    = localStorage.getItem("address")    || null;

    if (token && role) {
      setUserState({
        token, role, name, email, avatar,
        id: userId, userId,   // expose both so user.id and user.userId both work
        mqttTopic, phone, username, firstName, lastName, middleName, address,
      });
    }
    setLoading(false);
  }, []);

  function setUser(userData) {
    if (!userData) { setUserState(null); return; }

    // Normalise: accept either userData.id or userData.userId
    const userId = userData.userId || userData.id || "";

    const normalized = {
      ...userData,
      id:     userId,
      userId: userId,
    };

    setUserState(normalized);

    localStorage.setItem("token",      normalized.token      ?? "");
    localStorage.setItem("role",       normalized.role       ?? "");
    localStorage.setItem("name",       normalized.name       ?? "");
    localStorage.setItem("email",      normalized.email      ?? "");
    localStorage.setItem("avatar",     normalized.avatar     ?? "");
    localStorage.setItem("userId",     userId);
    localStorage.setItem("mqttTopic",  normalized.mqttTopic  ?? "");
    localStorage.setItem("phone",      normalized.phone      ?? "");
    localStorage.setItem("username",   normalized.username   ?? "");
    localStorage.setItem("firstName",  normalized.firstName  ?? "");
    localStorage.setItem("lastName",   normalized.lastName   ?? "");
    localStorage.setItem("middleName", normalized.middleName ?? "");
    localStorage.setItem("address",    normalized.address    ?? "");
  }

  function logout() {
    ["token", "role", "name", "email", "avatar", "userId", "mqttTopic",
     "phone", "username", "firstName", "lastName", "middleName", "address"]
      .forEach(k => localStorage.removeItem(k));
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