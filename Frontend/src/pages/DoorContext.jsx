import React, { createContext, useState, useEffect } from "react";
import socket from "../socket";

export const DoorContext = createContext();

export const DoorProvider = ({ children }) => {
  const [doorStatus,   setDoorStatus]   = useState("Closed");
  const [logs,         setLogs]         = useState([]);
  const [alarmEnabled, setAlarmEnabled] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(false);

  useEffect(() => {
    const token  = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    // Stop here if not logged in — prevents 401 errors on login screen
    if (!token) return;

    // Join the user's private socket room for real-time door updates
    if (userId) socket.emit("join_user_room", userId);

    const fetchLogs = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/dashboard/logs", {
          headers: { Authorization: `Bearer ${token}` },
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

    fetchLogs();
    fetchSettings();
  }, []);

  useEffect(() => {
    const handleDoorUpdate = (data) => {
      setDoorStatus(data.status);
      setLogs((prev) => [data, ...prev]);
    };

    const handleAlarmTrigger = () => {
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(880, ctx.currentTime);
        gainNode.gain.setValueAtTime(1, ctx.currentTime);
        oscillator.start();
        oscillator.stop(ctx.currentTime + 2);
        console.log("Alarm sound played!");
      } catch (err) {
        console.error("Error playing alarm sound:", err);
      }
    };

    socket.on("door_update", handleDoorUpdate);
    socket.on("trigger_alarm", handleAlarmTrigger);

    return () => {
      socket.off("door_update", handleDoorUpdate);
      socket.off("trigger_alarm", handleAlarmTrigger);
    };
  }, []);

  return (
    <DoorContext.Provider
      value={{
        doorStatus,   setDoorStatus,
        logs,         setLogs,
        alarmEnabled, setAlarmEnabled,
        emailEnabled, setEmailEnabled,
      }}
    >
      {children}
    </DoorContext.Provider>
  );
};