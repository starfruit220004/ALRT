import React, { useContext } from "react";
import { DoorContext } from "./DoorContext";

const AlarmSetting = () => {
  const { alarmEnabled, setAlarmEnabled } = useContext(DoorContext);
  const token = localStorage.getItem("token");

  // ✅ now saves to DB
  const handleToggle = async () => {
    const newValue = !alarmEnabled;
    setAlarmEnabled(newValue);
    try {
      await fetch("http://localhost:5000/api/settings/alarm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ value: newValue })
      });
    } catch (err) {
      console.error("Error toggling alarm:", err);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Alarm Settings</h2>
        <p className="text-sm text-gray-500">Configure alarm behavior and restricted hours</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-lg">🔔</div>
            <p className="font-semibold text-gray-800">Alarm Configuration</p>
          </div>

          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">Master Alarm System</p>
              <p className="text-xs text-gray-400 mt-0.5">Enable or disable all alerts</p>
            </div>
            <button
              onClick={handleToggle}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${alarmEnabled ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${alarmEnabled ? "translate-x-8" : "translate-x-1"}`} />
            </button>
          </div>

          {alarmEnabled && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-blue-700 text-sm font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse inline-block" />
              Alarm system is active
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-lg">🕐</div>
            <p className="font-semibold text-gray-800">System Info</p>
          </div>
          <p className="text-xs text-gray-400">
            Alarm state is synced with the database and persists across sessions.
          </p>
          <div className={`rounded-lg px-4 py-3 text-sm font-medium ${alarmEnabled ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-50 text-gray-500 border border-gray-200"}`}>
            Current State: {alarmEnabled ? "✅ Enabled" : "⛔ Disabled"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlarmSetting;