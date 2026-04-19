/*
  ═══════════════════════════════════════════════════════
  src/pages/DoorContext.jsx
  ───────────────────────────────────────────────────────
  FIXES FROM ORIGINAL:
  1. Settings keys were snake_case (alarm_enabled) but
     Prisma returns camelCase (alarmEnabled) — always
     undefined, so toggles had no effect on the UI.
  2. scheduleStart/scheduleEnd same camelCase fix.
  3. trigger_alarm socket event now sets alarmTriggered
     state so AlarmSettings can show a live banner.
  ═══════════════════════════════════════════════════════
*/

import React, { createContext, useState, useEffect } from 'react';
import socket from '../socket';

export const DoorContext = createContext();

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const DoorProvider = ({ children }) => {
  const [doorStatus,     setDoorStatus]     = useState(null);
  const [activityLogs,   setActivityLogs]   = useState([]);
  const [smsLogs,        setSmsLogs]        = useState([]);
  const [alarm_enabled,  setAlarmEnabled]   = useState(false);
  const [sms_enabled,    setSmsEnabled]     = useState(false);
  const [scheduleStart,  setScheduleStart]  = useState('08:00');
  const [scheduleEnd,    setScheduleEnd]    = useState('17:00');
  const [alarmTriggered, setAlarmTriggered] = useState(false);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (!token) return;
    if (userId) socket.emit('join_user_room', userId);

    const fetchAll = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [actRes, smsRes, setRes] = await Promise.all([
          fetch(`${API}/api/dashboard/logs`,     { headers }),
          fetch(`${API}/api/dashboard/sms-logs`, { headers }),
          fetch(`${API}/api/settings`,           { headers }),
        ]);
        const actData = await actRes.json();
        const smsData = await smsRes.json();
        const setData = await setRes.json();

        if (Array.isArray(actData)) {
          setActivityLogs(actData);
          if (actData.length > 0) setDoorStatus(actData[0].status);
        }
        if (Array.isArray(smsData)) setSmsLogs(smsData);

        if (setData && !setData.message) {
          // ✅ FIX 1 & 2: camelCase keys from Prisma
          setAlarmEnabled( setData.alarmEnabled  ?? false);
          setSmsEnabled(   setData.smsEnabled    ?? false);
          setScheduleStart(setData.scheduleStart ?? '08:00');
          setScheduleEnd(  setData.scheduleEnd   ?? '17:00');
        }
      } catch (err) {
        console.error('[DoorContext] Fetch error:', err);
      }
    };

    fetchAll();
  }, []);

  useEffect(() => {
    const onDoorUpdate = (data) => {
      setDoorStatus(data.status);
      setActivityLogs((prev) => {
        if (prev.some((l) => l.id === data.id)) return prev;
        return [data, ...prev];
      });
    };

    const onSmsUpdate = (data) => {
      setSmsLogs((prev) => {
        if (prev.some((s) => s.id === data.id)) return prev;
        return [data, ...prev];
      });
    };

    // ✅ FIX 3: Show alarm banner when server triggers alarm
    const onAlarmTrigger = () => {
      setAlarmTriggered(true);
      setTimeout(() => setAlarmTriggered(false), 10000);
    };

    socket.on('door_update',   onDoorUpdate);
    socket.on('sms_update',    onSmsUpdate);
    socket.on('trigger_alarm', onAlarmTrigger);

    return () => {
      socket.off('door_update',   onDoorUpdate);
      socket.off('sms_update',    onSmsUpdate);
      socket.off('trigger_alarm', onAlarmTrigger);
    };
  }, []);

  return (
    <DoorContext.Provider value={{
      doorStatus,     setDoorStatus,
      activityLogs,   setActivityLogs,
      smsLogs,        setSmsLogs,
      alarm_enabled,  setAlarmEnabled,
      sms_enabled,    setSmsEnabled,
      scheduleStart,  setScheduleStart,
      scheduleEnd,    setScheduleEnd,
      alarmTriggered, setAlarmTriggered,
    }}>
      {children}
    </DoorContext.Provider>
  );
};