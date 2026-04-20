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
    // ✅ FIX: Use null coalescing on getItem directly so that stored ""
    //         round-trips back as null, consistent with how setUser saves them.
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

    // ✅ FIX: Merge with existing state so that partial updates (e.g. only
    //         updating avatar) don't silently wipe fields like phone or address
    //         that were not included in the incoming userData object.
    setUserState((prev) => {
      const merged = {
        ...(prev ?? {}),
        ...userData,
        id:     userId,
        userId: userId,
      };
      return merged;
    });

    // ✅ FIX: Store null as "" in localStorage so the || null read on boot
    //         consistently produces null for unset fields (no stale values).
    localStorage.setItem("token",      userData.token      ?? "");
    localStorage.setItem("role",       userData.role       ?? "");
    localStorage.setItem("name",       userData.name       ?? "");
    localStorage.setItem("email",      userData.email      ?? "");
    localStorage.setItem("avatar",     userData.avatar     ?? "");
    localStorage.setItem("userId",     userId);
    localStorage.setItem("mqttTopic",  userData.mqttTopic  ?? "");
    localStorage.setItem("phone",      userData.phone      ?? "");
    localStorage.setItem("username",   userData.username   ?? "");
    localStorage.setItem("firstName",  userData.firstName  ?? "");
    localStorage.setItem("lastName",   userData.lastName   ?? "");
    localStorage.setItem("middleName", userData.middleName ?? "");
    localStorage.setItem("address",    userData.address    ?? "");
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