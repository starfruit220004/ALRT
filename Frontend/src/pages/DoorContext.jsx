// src/pages/DoorContext.jsx
import React, { createContext, useState, useEffect, useRef } from 'react';
import socket from '../socket';
import { useAuth } from '../context/AuthContext';

export const DoorContext = createContext();

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const DoorProvider = ({ children }) => {
  const { user, logout } = useAuth();

  const [doorStatus,     setDoorStatus]     = useState(null);
  const [activityLogs,   setActivityLogs]   = useState([]);
  const [smsLogs,        setSmsLogs]        = useState([]);
  const [alarmEnabled,   setAlarmEnabled]   = useState(false);
  const [smsEnabled,     setSmsEnabled]     = useState(false);
  const [scheduleStart,  setScheduleStart]  = useState('08:00');
  const [scheduleEnd,    setScheduleEnd]    = useState('17:00');
  const [alarmTriggered, setAlarmTriggered] = useState(false);

  // FIX: Track the userId we last joined a room for, so we can leave the old
  // room when the user changes (e.g. logout → login as different account).
  const joinedRoomRef = useRef(null);

  // Data fetch + socket room join — re-runs when user?.id changes
  useEffect(() => {
    const token  = localStorage.getItem('token');
    const userId = user?.id;

    if (!token || !userId) return;

    // FIX: Leave previous room before joining a new one. Without this, if the
    // user logs out and back in as a different account, the socket is still
    // subscribed to the old room and receives the wrong user's events.
    if (joinedRoomRef.current && joinedRoomRef.current !== userId) {
      socket.emit('leave_user_room', joinedRoomRef.current);
    }
    socket.emit('join_user_room', userId);
    joinedRoomRef.current = userId;

    const fetchAll = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [actRes, smsRes, setRes] = await Promise.all([
          fetch(`${API}/api/dashboard/logs`,     { headers }),
          fetch(`${API}/api/dashboard/sms-logs`, { headers }),
          fetch(`${API}/api/settings`,           { headers }),
        ]);

        // If any request returns 401 or 403, it means the session is invalid or account deactivated
        if (actRes.status === 403 || smsRes.status === 403 || setRes.status === 403 ||
            actRes.status === 401 || smsRes.status === 401 || setRes.status === 401) {
          console.warn('[DoorContext] Unauthorized or deactivated. Logging out.');
          logout();
          return;
        }

        const actData = await actRes.json();
        const smsData = await smsRes.json();
        const setData = await setRes.json();

        if (Array.isArray(actData)) {
          setActivityLogs(actData);
          if (actData.length > 0) setDoorStatus(actData[0].status);
        }
        if (Array.isArray(smsData)) setSmsLogs(smsData);

        if (setData && !setData.message) {
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
  }, [user?.id]);

  // Socket event listeners — registered once, never stack
  // FIX: The original had these in a separate useEffect with [] deps, meaning
  // they were registered once on mount and never cleaned up per-user. If the
  // component remounts (e.g. DoorProvider re-renders), listeners could stack.
  // The cleanup function in the return guarantees exactly one set at a time.
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
      alarmEnabled,   setAlarmEnabled,
      smsEnabled,     setSmsEnabled,
      scheduleStart,  setScheduleStart,
      scheduleEnd,    setScheduleEnd,
      alarmTriggered, setAlarmTriggered,
    }}>
      {children}
    </DoorContext.Provider>
  );
};