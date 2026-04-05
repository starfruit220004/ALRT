import React, { createContext, useState, useEffect } from "react";
import socket from "../socket";

export const DoorContext = createContext();

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const DoorProvider = ({ children }) => {
  const [doorStatus, setDoorStatus] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [alarm_enabled, setAlarmEnabled] = useState(false);
  const [sms_enabled, setSmsEnabled] = useState(false);
  const [scheduleStart, setScheduleStart] = useState("08:00");
  const [scheduleEnd, setScheduleEnd] = useState("17:00");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token) return;
    if (userId) socket.emit("join_user_room", userId);

    const fetchAllData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        // Run fetches in parallel for better performance
        const [activityRes, smsRes, settingsRes] = await Promise.all([
          fetch(`${API}/api/dashboard/logs`, { headers }),
          fetch(`${API}/api/dashboard/sms-logs`, { headers }),
          fetch(`${API}/api/settings`, { headers }),
        ]);

        const activityData = await activityRes.json();
        const smsData = await smsRes.json();
        const settingsData = await settingsRes.json();

        if (Array.isArray(activityData)) {
          setActivityLogs(activityData);
          if (activityData.length > 0) setDoorStatus(activityData[0].status);
        }
        if (Array.isArray(smsData)) setSmsLogs(smsData);
        
        if (settingsData) {
          setAlarmEnabled(settingsData.alarm_enabled);
          setSmsEnabled(settingsData.sms_enabled);
          if (settingsData.schedule_start) setScheduleStart(settingsData.schedule_start);
          if (settingsData.schedule_end) setScheduleEnd(settingsData.schedule_end);
        }
      } catch (err) {
        console.error("Error fetching context data:", err);
      }
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    const handleDoorUpdate = (data) => {
      // 1. Immediately update the main status
      setDoorStatus(data.status);
      
      // 2. Add to logs if it doesn't exist
      setActivityLogs((prev) => {
        const exists = prev.some((log) => log.id === data.id);
        if (exists) return prev;
        return [data, ...prev]; // New logs at the top
      });
    };

    const handleSmsUpdate = (data) => {
      setSmsLogs((prev) => {
        const exists = prev.some((sms) => sms.id === data.id);
        if (exists) return prev;
        return [data, ...prev];
      });
    };

    socket.on("door_update", handleDoorUpdate);
    socket.on("sms_update", handleSmsUpdate);

    return () => {
      socket.off("door_update", handleDoorUpdate);
      socket.off("sms_update", handleSmsUpdate);
    };
  }, []);

  return (
    <DoorContext.Provider
      value={{
        doorStatus,
        setDoorStatus,
        activityLogs,
        setActivityLogs,
        smsLogs,
        setSmsLogs,
        alarm_enabled,
        setAlarmEnabled,
        sms_enabled,
        setSmsEnabled,
        scheduleStart,
        setScheduleStart,
        scheduleEnd,
        setScheduleEnd,
      }}
    >
      {children}
    </DoorContext.Provider>
  );
};