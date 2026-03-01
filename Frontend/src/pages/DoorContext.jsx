// import React, { createContext, useState, useEffect } from "react";
// import socket from "../socket";

// export const DoorContext = createContext();

// export const DoorProvider = ({ children }) => {
//   const [doorStatus,   setDoorStatus]   = useState("Closed");
//   const [logs,         setLogs]         = useState([]);
//   const [alarmEnabled, setAlarmEnabled] = useState(false);
//   const [emailEnabled, setEmailEnabled] = useState(false); // ✅ added

//   useEffect(() => {
//     const token = localStorage.getItem("token");

//     const fetchLogs = async () => {
//       try {
//         const res = await fetch("http://localhost:5000/api/dashboard/logs", {
//           headers: { Authorization: `Bearer ${token}` } // ✅ added token
//         });
//         if (!res.ok) return;
//         const data = await res.json();
//         setLogs(Array.isArray(data) ? data : []);
//         if (data.length > 0) setDoorStatus(data[0].status);
//       } catch (err) {
//         console.error("Network or server error:", err);
//       }
//     };

//     const fetchSettings = async () => {
//       try {
//         const res = await fetch("http://localhost:5000/api/settings", {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         if (!res.ok) return;
//         const data = await res.json();
//         if (data) {
//           setAlarmEnabled(data.alarm_enabled);
//           setEmailEnabled(data.sms_enabled); // ✅ load from DB
//         }
//       } catch (err) {
//         console.error("Error fetching settings:", err);
//       }
//     };

//     fetchLogs();
//     fetchSettings();
//   }, []);

//   useEffect(() => {
//     const handleDoorUpdate = (data) => {
//       setDoorStatus(data.status);
//       setLogs(prev => [data, ...prev]);
//     };

//     socket.on("door_update", handleDoorUpdate);
//     return () => socket.off("door_update", handleDoorUpdate);
//   }, []);

//   return (
//     <DoorContext.Provider value={{
//       doorStatus,   setDoorStatus,
//       logs,         setLogs,
//       alarmEnabled, setAlarmEnabled,
//       emailEnabled, setEmailEnabled, // ✅ exposed
//     }}>
//       {children}
//     </DoorContext.Provider>
//   );
// };

import React, { createContext, useState, useEffect } from "react";
import socket from "../socket";

export const DoorContext = createContext();

export const DoorProvider = ({ children }) => {
  const [doorStatus,   setDoorStatus]   = useState("Closed");
  const [logs,         setLogs]         = useState([]);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false); // ✅ added

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Prevent fetching and throwing 401 errors if there is no token
    if (!token) return;

    const fetchLogs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/dashboard/logs", {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
          }
        });
        if (!res.ok) return;
        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
        if (data.length > 0) setDoorStatus(data[0].status);
      } catch (err) {
        console.error("Network or server error:", err);
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/settings", {
          method: "GET",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
          }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data) {
          setAlarmEnabled(data.alarm_enabled);
          setEmailEnabled(data.sms_enabled); // ✅ load from DB
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };

    fetchLogs();
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleDoorUpdate = (data) => {
      setDoorStatus(data.status);
      setLogs(prev => [data, ...prev]);
    };

    socket.on("door_update", handleDoorUpdate);
    return () => socket.off("door_update", handleDoorUpdate);
  }, []);

  return (
    <DoorContext.Provider value={{
      doorStatus,   setDoorStatus,
      logs,         setLogs,
      alarmEnabled, setAlarmEnabled,
      emailEnabled, setEmailEnabled, // ✅ exposed
    }}>
      {children}
    </DoorContext.Provider>
  );
};