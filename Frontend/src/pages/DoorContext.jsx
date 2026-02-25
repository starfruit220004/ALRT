import React, { createContext, useState, useEffect } from "react";
import socket from "../socket";

export const DoorContext = createContext();

export const DoorProvider = ({ children }) => {
  const [doorStatus, setDoorStatus] = useState("Closed");
  const [logs, setLogs] = useState([]);
  const [alarmEnabled, setAlarmEnabled] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/dashboard/logs");
        if (!res.ok) {
          console.error("Error fetching logs:", res.status, res.statusText);
          return;
        }
        const data = await res.json();
        setLogs(data);
      } catch (err) {
        console.error("Network or server error:", err);
      }
    };

    fetchLogs();
  }, []);

  useEffect(() => {
    const handleDoorUpdate = (data) => {
      setDoorStatus(data.status);
      setLogs(prev => [data, ...prev]);

      if (alarmEnabled && data.status === "Opened") {
        alert("🚨 Alarm Triggered!");
      }
    };

    socket.on("door_update", handleDoorUpdate);

    return () => {
      socket.off("door_update", handleDoorUpdate);
    };
  }, [alarmEnabled]);

  return (
    <DoorContext.Provider value={{ doorStatus, logs, alarmEnabled, setAlarmEnabled }}>
      {children}
    </DoorContext.Provider>
  );
};