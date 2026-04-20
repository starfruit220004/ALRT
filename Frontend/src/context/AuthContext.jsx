import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role  = localStorage.getItem("role");

    if (token && role) {
      const userId = localStorage.getItem("userId") || null;
      setUserState({
        token,
        role,
        id:         userId,
        userId:     userId,
        name:       localStorage.getItem("name")       || null,
        email:      localStorage.getItem("email")      || null,
        avatar:     localStorage.getItem("avatar")     || null,
        mqttTopic:  localStorage.getItem("mqttTopic")  || null,
        phone:      localStorage.getItem("phone")      || null,
        username:   localStorage.getItem("username")   || null,
        firstName:  localStorage.getItem("firstName")  || null,
        lastName:   localStorage.getItem("lastName")   || null,
        middleName: localStorage.getItem("middleName") || null,
        address:    localStorage.getItem("address")    || null,
      });
    }
    setLoading(false);
  }, []);

  function setUser(userData) {
    if (!userData) { setUserState(null); return; }

    // FIX: Read what is currently stored so partial updates (e.g. Profile.jsx
    // only sends avatar/phone/address) do NOT overwrite token, role, userId,
    // or any field that wasn't included in userData. The original code used
    // `userData.token ?? ""` unconditionally — if token was absent from the
    // update payload it wrote "" to localStorage, logging the user out on
    // the next page refresh.
    const stored = {
      token:      localStorage.getItem("token")      || null,
      role:       localStorage.getItem("role")        || null,
      name:       localStorage.getItem("name")        || null,
      email:      localStorage.getItem("email")       || null,
      avatar:     localStorage.getItem("avatar")      || null,
      userId:     localStorage.getItem("userId")      || null,
      mqttTopic:  localStorage.getItem("mqttTopic")   || null,
      phone:      localStorage.getItem("phone")       || null,
      username:   localStorage.getItem("username")    || null,
      firstName:  localStorage.getItem("firstName")   || null,
      lastName:   localStorage.getItem("lastName")    || null,
      middleName: localStorage.getItem("middleName")  || null,
      address:    localStorage.getItem("address")     || null,
    };

    // FIX: Resolve userId from incoming data, fall back to stored value.
    // Never let it become "" which would corrupt user.id for DoorContext.
    const userId =
      (userData.id     != null && userData.id     !== "" ? String(userData.id)     : null) ||
      (userData.userId != null && userData.userId !== "" ? String(userData.userId) : null) ||
      stored.userId;

    // Only replace a stored value when userData explicitly provides a
    // non-empty one. For nullable profile fields (avatar, phone, etc.)
    // we use "key in userData" so an intentional null/empty clears them.
    const merged = {
      token:      (userData.token      || stored.token),
      role:       (userData.role       || stored.role),
      name:       (userData.name       || stored.name),
      email:      (userData.email      || stored.email),
      mqttTopic:  (userData.mqttTopic  || stored.mqttTopic),
      avatar:     "avatar"     in userData ? (userData.avatar     || null) : stored.avatar,
      phone:      "phone"      in userData ? (userData.phone      || null) : stored.phone,
      username:   "username"   in userData ? (userData.username   || null) : stored.username,
      firstName:  "firstName"  in userData ? (userData.firstName  || null) : stored.firstName,
      lastName:   "lastName"   in userData ? (userData.lastName   || null) : stored.lastName,
      middleName: "middleName" in userData ? (userData.middleName || null) : stored.middleName,
      address:    "address"    in userData ? (userData.address    || null) : stored.address,
    };

    localStorage.setItem("token",      merged.token      ?? "");
    localStorage.setItem("role",       merged.role       ?? "");
    localStorage.setItem("name",       merged.name       ?? "");
    localStorage.setItem("email",      merged.email      ?? "");
    localStorage.setItem("avatar",     merged.avatar     ?? "");
    localStorage.setItem("userId",     userId            ?? "");
    localStorage.setItem("mqttTopic",  merged.mqttTopic  ?? "");
    localStorage.setItem("phone",      merged.phone      ?? "");
    localStorage.setItem("username",   merged.username   ?? "");
    localStorage.setItem("firstName",  merged.firstName  ?? "");
    localStorage.setItem("lastName",   merged.lastName   ?? "");
    localStorage.setItem("middleName", merged.middleName ?? "");
    localStorage.setItem("address",    merged.address    ?? "");

    setUserState({ ...merged, id: userId, userId });
  }

  function logout() {
    ["token","role","name","email","avatar","userId","mqttTopic",
     "phone","username","firstName","lastName","middleName","address"]
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