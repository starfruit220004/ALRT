import React, { useContext } from "react";
import { DoorContext } from "./DoorContext";

const Dashboard = () => {
  const {
    doorStatus,
    logs,
    alarmEnabled, setAlarmEnabled,
    emailEnabled, setEmailEnabled,
  } = useContext(DoorContext);

  const token = localStorage.getItem("token");

  const handleAlarmToggle = async () => {
    const newValue = !alarmEnabled;
    setAlarmEnabled(newValue);
    try {
      await fetch("http://localhost:5000/api/settings/alarm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: newValue }),
      });
    } catch (err) {
      console.error("Error toggling alarm:", err);
    }
  };

  const handleSmsToggle = async () => {
    const newValue = !emailEnabled;
    setEmailEnabled(newValue);
    try {
      await fetch("http://localhost:5000/api/settings/sms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: newValue }),
      });
    } catch (err) {
      console.error("Error toggling SMS:", err);
    }
  };

  const isOpen = doorStatus === "Opened" || doorStatus === "OPEN";

  const totalOpened = logs.filter(l => l.status === "Opened" || l.status === "OPEN").length;
  const totalClosed = logs.filter(l => l.status === "Closed" || l.status === "CLOSE").length;
  const totalAlarm  = logs.filter(l => l.status === "Alarm").length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-sm text-gray-500">Real-time monitoring of your Smart Alert system</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded-xl border p-5 flex items-center justify-between ${isOpen ? "bg-orange-50 border-orange-200" : "bg-green-50 border-green-200"}`}>
          <div>
            <p className="text-xs text-gray-500 mb-1">Door Status</p>
            <p className={`text-xl font-bold ${isOpen ? "text-orange-500" : "text-green-600"}`}>
              {doorStatus}
            </p>
          </div>
          <span className="text-2xl">{isOpen ? "🔓" : "🔒"}</span>
        </div>

        <div className="rounded-xl border bg-blue-50 border-blue-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Alarm Status</p>
            <p className="text-xl font-bold text-blue-600">
              {alarmEnabled ? "Enabled" : "Disabled"}
            </p>
          </div>
          <span className="text-2xl">🔔</span>
        </div>
      </div>

      {/* Summary Counts */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Alarms</p>
            <p className="text-3xl font-bold text-red-500">{totalAlarm}</p>
          </div>
          <span className="text-2xl">⚠️</span>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Opened</p>
            <p className="text-3xl font-bold text-orange-500">{totalOpened}</p>
          </div>
          <span className="text-2xl">🚪</span>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-1">Total Closed</p>
            <p className="text-3xl font-bold text-green-600">{totalClosed}</p>
          </div>
          <span className="text-2xl">🔒</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <p className="text-base font-semibold text-gray-700">Quick Actions</p>

        {/* Alarm Toggle */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-800">Alarm System</p>
            <p className="text-xs text-gray-400">
              {alarmEnabled ? "🔔 Sound will play on door open/alarm" : "🔕 Alarm is disabled"}
            </p>
          </div>
          <button
            onClick={handleAlarmToggle}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${alarmEnabled ? "bg-blue-600" : "bg-gray-300"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${alarmEnabled ? "translate-x-8" : "translate-x-1"}`} />
          </button>
        </div>

        {/* SMS Toggle */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-800">SMS Notifications</p>
            <p className="text-xs text-gray-400">
              {emailEnabled ? "📱 SMS will be sent on door open/alarm" : "📵 SMS is disabled"}
            </p>
          </div>
          <button
            onClick={handleSmsToggle}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${emailEnabled ? "bg-blue-600" : "bg-gray-300"}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${emailEnabled ? "translate-x-8" : "translate-x-1"}`} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;