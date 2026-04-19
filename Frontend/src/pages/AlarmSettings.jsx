/*
  ═══════════════════════════════════════════════════════
  src/pages/AlarmSettings.jsx
  ───────────────────────────────────────────────────────
  FIXES FROM ORIGINAL:
  1. Now also reads alarmTriggered from DoorContext and
     shows a live alarm banner when the door is opened
     and alarm is active.
  2. Schedule start/end times are now displayed and
     editable — they were in context but never shown.
  3. Optimistic toggle with revert on API failure was
     already correct — kept as-is.
  ═══════════════════════════════════════════════════════
*/

import React, { useContext, useState } from "react";
import { DoorContext } from "./DoorContext";
import { Bell, ShieldCheck, ShieldOff, Info, Clock, AlertTriangle, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const AlarmSetting = () => {
  const {
    alarm_enabled,
    setAlarmEnabled,
    scheduleStart,
    setScheduleStart,
    scheduleEnd,
    setScheduleEnd,
    alarmTriggered,
    setAlarmTriggered,
  } = useContext(DoorContext);

  const token = localStorage.getItem("token");
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleSaved,  setScheduleSaved]  = useState(false);

  // ── Toggle master alarm
  const handleToggle = async () => {
    if (!token) return;
    const newValue = !alarm_enabled;
    setAlarmEnabled(newValue);
    try {
      const res = await fetch(`${API}/api/settings/alarm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: newValue }),
      });
      if (!res.ok) throw new Error("Failed");
    } catch (err) {
      console.error("Error toggling alarm:", err);
      setAlarmEnabled(!newValue); // revert
    }
  };

  // ✅ FIX 2: Save schedule times
  const handleSaveSchedule = async () => {
    if (!token) return;
    setSavingSchedule(true);
    try {
      const res = await fetch(`${API}/api/settings/schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ scheduleStart, scheduleEnd }),
      });
      if (!res.ok) throw new Error("Failed");
      setScheduleSaved(true);
      setTimeout(() => setScheduleSaved(false), 2000);
    } catch (err) {
      console.error("Error saving schedule:", err);
    } finally {
      setSavingSchedule(false);
    }
  };

  return (
    <div className="p-4 md:p-6 pt-20 md:pt-8 space-y-6 max-w-3xl mx-auto">

      {/* ✅ FIX 1: Live alarm banner */}
      {alarmTriggered && (
        <div className="flex items-center justify-between gap-3 bg-red-600 text-white rounded-xl px-5 py-4 shadow-lg animate-pulse">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="shrink-0" />
            <span className="font-bold text-sm">⚠️ ALARM TRIGGERED — Door was opened!</span>
          </div>
          <button
            onClick={() => setAlarmTriggered(false)}
            className="hover:bg-red-700 rounded-lg p-1 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Alarm Settings</h2>
        <p className="text-sm text-gray-500 mt-1">
          Configure alarm behavior for your Smart Alert system
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Alarm Toggle Card */}
        <div className={`rounded-xl border shadow-sm p-5 space-y-4 transition-colors ${
          alarm_enabled ? "bg-amber-50 border-amber-200" : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              alarm_enabled ? "bg-amber-100" : "bg-gray-100"
            }`}>
              <Bell size={18} className={alarm_enabled ? "text-amber-600" : "text-gray-400"} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">Alarm Configuration</p>
              <p className="text-xs text-gray-400">Master on/off switch</p>
            </div>
          </div>

          <div className={`flex items-center justify-between rounded-lg px-4 py-3 border ${
            alarm_enabled ? "bg-amber-100/50 border-amber-200" : "bg-gray-50 border-gray-100"
          }`}>
            <div>
              <p className="text-sm font-semibold text-gray-800">Master Alarm</p>
              <p className="text-xs text-gray-400 mt-0.5">Enable or disable all alerts</p>
            </div>
            <button
              onClick={handleToggle}
              className={`relative inline-flex h-7 w-14 flex-shrink-0 items-center rounded-full transition-colors duration-300 ${
                alarm_enabled ? "bg-amber-500" : "bg-gray-300"
              }`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
                alarm_enabled ? "translate-x-8" : "translate-x-1"
              }`} />
            </button>
          </div>

          <div className={`flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium border ${
            alarm_enabled
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-slate-50 border-slate-200 text-slate-500"
          }`}>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              alarm_enabled ? "bg-red-500 animate-pulse" : "bg-slate-400"
            }`} />
            {alarm_enabled ? "Alarm system is active" : "Alarm system is inactive"}
          </div>
        </div>

        {/* System Info Card */}
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Info size={18} className="text-slate-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800">System Info</p>
              <p className="text-xs text-gray-400">Current alarm state</p>
            </div>
          </div>

          <div className={`flex items-center gap-4 rounded-xl p-4 border ${
            alarm_enabled ? "bg-red-50 border-red-200" : "bg-slate-50 border-slate-200"
          }`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
              alarm_enabled ? "bg-red-100" : "bg-slate-200"
            }`}>
              {alarm_enabled
                ? <ShieldCheck size={24} className="text-red-600" />
                : <ShieldOff   size={24} className="text-slate-400" />}
            </div>
            <div>
              <p className={`text-base font-black ${alarm_enabled ? "text-red-700" : "text-slate-500"}`}>
                {alarm_enabled ? "Armed" : "Disarmed"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Synced with database · persists across sessions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ FIX 2: Schedule card */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Clock size={18} className="text-blue-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Active Schedule</p>
            <p className="text-xs text-gray-400">
              Alarm only triggers within this time window (Philippine Time)
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Start Time</label>
            <input
              type="time"
              value={scheduleStart}
              onChange={(e) => setScheduleStart(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs font-semibold text-gray-500 mb-1 block">End Time</label>
            <input
              type="time"
              value={scheduleEnd}
              onChange={(e) => setScheduleEnd(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <button
          onClick={handleSaveSchedule}
          disabled={savingSchedule}
          className={`w-full py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            scheduleSaved
              ? "bg-green-500 text-white"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          } disabled:opacity-60`}
        >
          {savingSchedule ? "Saving..." : scheduleSaved ? "✓ Saved!" : "Save Schedule"}
        </button>

        <p className="text-xs text-gray-400">
          Outside this window, the alarm will be skipped even if the door opens.
          Leave both times the same to always trigger.
        </p>
      </div>
    </div>
  );
};

export default AlarmSetting;