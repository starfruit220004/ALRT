import React, { useContext } from "react";
import { DoorContext } from "./DoorContext";
// ✅ removed duplicate socket — now handled in DoorContext

const Dashboard = () => {
  const { doorStatus, logs, alarmEnabled, setAlarmEnabled } = useContext(DoorContext);

  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  const handleAlarmToggle = async () => {
    const newValue = !alarmEnabled;
    setAlarmEnabled(newValue);
    try {
      await fetch("http://localhost:5000/api/settings/alarm", {
        method: "POST",
        headers,
        body: JSON.stringify({ value: newValue })
      });
    } catch (err) {
      console.error("Error toggling alarm:", err);
    }
  };

  const isOpen = doorStatus === "Opened" || doorStatus === "OPEN";

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
        <p className="text-sm text-gray-500">Real-time monitoring of your smart door system</p>
      </div>

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

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-base font-semibold text-gray-700 mb-4">Recent Activity</p>
          {logs.length === 0 ? (
            <p className="text-sm text-gray-400">No recent activity</p>
          ) : (
            <ul className="space-y-3">
              {logs.slice(0, 5).map((log, i) => {
                const isLogOpen = log.status === "Opened" || log.status === "OPEN";
                return (
                  <li key={i} className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${isLogOpen ? "bg-orange-400" : "bg-green-500"}`} />
                    <span className="text-sm text-gray-700">Door {log.status}</span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <p className="text-base font-semibold text-gray-700">Quick Actions</p>
          <div className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium text-gray-800">Alarm System</p>
              <p className="text-xs text-gray-400">Toggle buzzer alarm</p>
            </div>
            <button
              onClick={handleAlarmToggle}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${alarmEnabled ? "bg-blue-600" : "bg-gray-300"}`}
            >
              <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${alarmEnabled ? "translate-x-8" : "translate-x-1"}`} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-orange-50 border border-orange-100 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-500">
                {logs.filter(l => l.status === "Opened" || l.status === "OPEN").length}
              </p>
              <p className="text-xs text-gray-500">Total Opened</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {logs.filter(l => l.status === "Closed" || l.status === "CLOSE").length}
              </p>
              <p className="text-xs text-gray-500">Total Closed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;