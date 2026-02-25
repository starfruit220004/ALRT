import React, { useEffect, useState } from "react";

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  const token = localStorage.getItem("token");

  const fetchLogs = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/dashboard/logs", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching logs:", err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const totalOpened = logs.filter(l => l.status === "Opened" || l.status === "OPEN").length;
  const totalClosed = logs.filter(l => l.status === "Closed" || l.status === "CLOSE").length;
  const totalAlarm  = logs.filter(l => l.status === "Alarm").length;

  const getStatusStyle = (status) => {
    if (status === "Opened" || status === "OPEN") return "bg-orange-100 text-orange-600 border border-orange-200";
    if (status === "Closed" || status === "CLOSE") return "bg-green-100 text-green-700 border border-green-200";
    if (status === "Alarm") return "bg-red-100 text-red-600 border border-red-200";
    return "bg-gray-100 text-gray-600";
  };

  const getDescription = (status) => {
    if (status === "Opened" || status === "OPEN") return "Door opened";
    if (status === "Closed" || status === "CLOSE") return "Door closed";
    if (status === "Alarm") return "Alarm triggered";
    return "";
  };

  const filtered = logs.filter((log) => {
    const matchSearch = log.status.toLowerCase().includes(search.toLowerCase());
    const matchDate = dateFilter
      ? new Date(log.created_at).toISOString().startsWith(dateFilter)
      : true;
    return matchSearch && matchDate;
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Activity Log</h2>
        <p className="text-sm text-gray-500">Complete history of door events and alerts</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Alarms</p>
          <p className="text-3xl font-bold text-red-500">{totalAlarm}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Opened</p>
          <p className="text-3xl font-bold text-orange-500">{totalOpened}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Closed</p>
          <p className="text-3xl font-bold text-green-600">{totalClosed}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-4 py-2.5">
          <span className="text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search activities..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
          />
        </div>
        <input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-600 bg-white outline-none"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Event</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Date</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Time</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Description</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">No activity yet</td>
              </tr>
            ) : (
              filtered.map((log, i) => {
                const dateObj = new Date(log.created_at);
                const date = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                const time = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-800">
                      <span className="flex items-center gap-2">
                        {log.status === "Opened" || log.status === "OPEN" ? "🚪" : log.status === "Alarm" ? "⚠️" : "🔒"}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{date}</td>
                    <td className="px-5 py-3.5 text-gray-600">{time}</td>
                    <td className="px-5 py-3.5 text-gray-600">{getDescription(log.status)}</td>
                    <td className="px-5 py-3.5">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusStyle(log.status)}`}>
                        {log.status === "Opened" || log.status === "OPEN" ? "Warning" : log.status === "Alarm" ? "Alert" : "Safe"}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLog;