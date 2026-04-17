/*
  ═══════════════════════════════════════════════════════
  CHANGES FROM ORIGINAL:
  1. Settings keys fixed — was reading alarm_enabled and
     sms_enabled (snake_case) but Prisma returns alarmEnabled
     and smsEnabled (camelCase). Both always loaded as
     undefined, so toggles had no effect on the UI state.
  2. scheduleStart / scheduleEnd now correctly read from
     settingsData.scheduleStart and settingsData.scheduleEnd
     (was schedule_start / schedule_end — same snake/camel
     mismatch).
  ═══════════════════════════════════════════════════════
*/

import React, { createContext, useState, useEffect } from "react";
import socket from "../socket";

export const DoorContext = createContext();

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const DoorProvider = ({ children }) => {
  const [doorStatus, setDoorStatus]       = useState(null);
  const [activityLogs, setActivityLogs]   = useState([]);
  const [smsLogs, setSmsLogs]             = useState([]);
  const [alarm_enabled, setAlarmEnabled]  = useState(false);
  const [sms_enabled, setSmsEnabled]      = useState(false);
  const [scheduleStart, setScheduleStart] = useState("08:00");
  const [scheduleEnd, setScheduleEnd]     = useState("17:00");

  useEffect(() => {
    const token  = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token) return;
    if (userId) socket.emit("join_user_room", userId);

    const fetchAllData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [activityRes, smsRes, settingsRes] = await Promise.all([
          fetch(`${API}/api/dashboard/logs`,     { headers }),
          fetch(`${API}/api/dashboard/sms-logs`, { headers }),
          fetch(`${API}/api/settings`,           { headers }),
        ]);

        const activityData = await activityRes.json();
        const smsData      = await smsRes.json();
        const settingsData = await settingsRes.json();

        if (Array.isArray(activityData)) {
          setActivityLogs(activityData);
          if (activityData.length > 0) setDoorStatus(activityData[0].status);
        }

        if (Array.isArray(smsData)) setSmsLogs(smsData);

        if (settingsData && !settingsData.message) {
          // ── FIX 1 & 2: Prisma returns camelCase — was previously
          //    reading alarm_enabled / sms_enabled (always undefined).
          setAlarmEnabled(settingsData.alarmEnabled  ?? false);
          setSmsEnabled(settingsData.smsEnabled      ?? false);
          setScheduleStart(settingsData.scheduleStart ?? "08:00");
          setScheduleEnd(settingsData.scheduleEnd     ?? "17:00");
        }
      } catch (err) {
        console.error("[DoorContext] Error fetching data:", err);
      }
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    const handleDoorUpdate = (data) => {
      setDoorStatus(data.status);
      setActivityLogs((prev) => {
        const exists = prev.some((log) => log.id === data.id);
        if (exists) return prev;
        return [data, ...prev];
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
    socket.on("sms_update",  handleSmsUpdate);

    return () => {
      socket.off("door_update", handleDoorUpdate);
      socket.off("sms_update",  handleSmsUpdate);
    };
  }, []);

  return (
    <DoorContext.Provider
      value={{
        doorStatus,      setDoorStatus,
        activityLogs,    setActivityLogs,
        smsLogs,         setSmsLogs,
        alarm_enabled,   setAlarmEnabled,
        sms_enabled,     setSmsEnabled,
        scheduleStart,   setScheduleStart,
        scheduleEnd,     setScheduleEnd,
      }}
    >
      {children}
    </DoorContext.Provider>
  );
};