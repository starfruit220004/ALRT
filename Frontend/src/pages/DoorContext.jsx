import React, { createContext, useState, useEffect } from "react";
import socket from "../socket";

export const DoorContext = createContext();

export const DoorProvider = ({ children }) => {
  const [doorStatus,   setDoorStatus]   = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [smsLogs,      setSmsLogs]      = useState([]);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    const token  = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token) return;

    if (userId) socket.emit("join_user_room", userId);

    const fetchActivityLogs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/dashboard/logs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;
        setActivityLogs(data);
        if (data.length > 0) setDoorStatus(data[0].status);
      } catch (err) {
        console.error("Error fetching activity logs:", err);
      }
    };

    const fetchSmsLogs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/dashboard/sms-logs", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!Array.isArray(data)) return;
        setSmsLogs(data);
      } catch (err) {
        console.error("Error fetching SMS logs:", err);
      }
    };

    const fetchSettings = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/settings", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        if (data) {
          setAlarmEnabled(data.alarm_enabled);
          setEmailEnabled(data.sms_enabled);
        }
      } catch (err) {
        console.error("Error fetching settings:", err);
      }
    };

    fetchActivityLogs();
    fetchSmsLogs();
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleDoorUpdate = (data) => {
      setDoorStatus(data.status);
      setActivityLogs((prev) => [data, ...prev]);
    };

    const handleSmsUpdate = (data) => {
      setSmsLogs((prev) => [data, ...prev]);
    };

    socket.on("door_update", handleDoorUpdate);
    socket.on("sms_update",  handleSmsUpdate);

    return () => {
      socket.off("door_update", handleDoorUpdate);
      socket.off("sms_update",  handleSmsUpdate);
    };
  }, []);

  return (
    <DoorContext.Provider
      value={{
        doorStatus,   setDoorStatus,
        activityLogs, setActivityLogs,
        smsLogs,      setSmsLogs,
        alarmEnabled, setAlarmEnabled,
        emailEnabled, setEmailEnabled,
      }}
    >
      {children}
    </DoorContext.Provider>
  );
};