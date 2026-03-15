import React, { useContext, useState } from "react";
import { DoorContext } from "./DoorContext";
import { ChevronLeft, ChevronRight } from "lucide-react";

// ── Mini Calendar ──────────────────────────────────────────
function Calendar({ logs, selectedDate, onSelectDate }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const activeDates = new Set(
    logs.map(l => new Date(l.created_at).toISOString().slice(0, 10))
  );

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const monthName = new Date(viewYear, viewMonth).toLocaleString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const toKey = (day) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${viewYear}-${mm}-${dd}`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 w-full">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <ChevronLeft size={15} />
        </button>
        <p className="text-sm font-semibold text-gray-800">{monthName}</p>
        <button onClick={nextMonth} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500">
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
          const key = toKey(day);
          const hasData = activeDates.has(key);
          const isSelected = selectedDate === key;
          const isToday = key === today.toISOString().slice(0, 10);

          return (
            <button
              key={day}
              onClick={() => onSelectDate(isSelected ? null : key)}
              className={`
                relative mx-auto w-8 h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all duration-150
                ${isSelected ? "bg-blue-600 text-white shadow-md" : ""}
                ${!isSelected && isToday ? "border border-blue-400 text-blue-600" : ""}
                ${!isSelected && !isToday ? "text-gray-700 hover:bg-gray-100" : ""}
                ${hasData && !isSelected ? "font-bold" : ""}
              `}
            >
              {day}
              {hasData && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Has activity
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-4 h-4 rounded-full bg-blue-600 inline-block" /> Selected
        </div>
        {selectedDate && (
          <button onClick={() => onSelectDate(null)} className="ml-auto text-xs text-blue-500 hover:text-blue-700 transition-colors">
            Clear filter
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main ActivityLog Component ─────────────────────────────
const ActivityLog = () => {
  const { logs, setLogs } = useContext(DoorContext);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);

  const token = localStorage.getItem("token");

  const totalOpened = logs.filter(l => l.status === "Opened" || l.status === "OPEN").length;
  const totalClosed = logs.filter(l => l.status === "Closed" || l.status === "CLOSE").length;
  const totalAlarm  = logs.filter(l => l.status === "Alarm").length;

  const filtered = logs.filter((log) => {
    const matchSearch = log.status.toLowerCase().includes(search.toLowerCase());
    const matchDate = selectedDate
      ? new Date(log.created_at).toISOString().slice(0, 10) === selectedDate
      : true;
    return matchSearch && matchDate;
  });

  const handleDeleteLog = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/dashboard/logs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(prev => prev.filter(l => l.id !== id));
    } catch (err) { console.error("Error deleting log:", err); }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Clear all activity logs? This cannot be undone.")) return;
    try {
      await fetch("http://localhost:5000/api/dashboard/logs", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs([]);
    } catch (err) { console.error("Error clearing logs:", err); }
  };

  const selectedLabel = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Activity Log</h2>
          <p className="text-sm text-gray-500 mt-0.5">Complete history of door events and alerts</p>
        </div>
        {logs.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg border border-red-200 transition-colors"
          >
            🗑 Clear All
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-red-200 bg-gradient-to-br from-red-50 to-red-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">Total Alarms</p>
            <span className="text-xl">⚠️</span>
          </div>
          <p className="text-4xl font-bold text-red-500">{totalAlarm}</p>
        </div>
        <div className="rounded-xl border border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-orange-400 uppercase tracking-wide">Total Opened</p>
            <span className="text-xl">🚪</span>
          </div>
          <p className="text-4xl font-bold text-orange-500">{totalOpened}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-gradient-to-br from-green-50 to-green-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-green-500 uppercase tracking-wide">Total Closed</p>
            <span className="text-xl">🔒</span>
          </div>
          <p className="text-4xl font-bold text-green-600">{totalClosed}</p>
        </div>
      </div>

      {/* Calendar + Table side by side */}
      <div className="flex gap-5 items-start">

        {/* Calendar */}
        <div className="w-72 flex-shrink-0">
          <Calendar
            logs={logs}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        {/* Table */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-gray-400 text-sm">🔍</span>
              <input
                type="text"
                placeholder="Search activities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder-gray-400"
              />
            </div>
            {selectedLabel && (
              <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-full font-medium whitespace-nowrap">
                {selectedLabel} · {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-14 text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-3xl">📋</span>
                      <p className="text-sm">
                        {selectedDate ? "No activity on this date" : "No activity yet"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((log, i) => {
                  const dateObj = new Date(log.created_at);
                  const date = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                  const time = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
                  const isOpen = log.status === "Opened" || log.status === "OPEN";
                  const isAlarm = log.status === "Alarm";

                  return (
                    <tr key={log.id ?? i} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className="flex items-center gap-2 font-medium text-gray-800">
                          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                            isAlarm ? "bg-red-100" : isOpen ? "bg-orange-100" : "bg-green-100"
                          }`}>
                            {isAlarm ? "⚠️" : isOpen ? "🚪" : "🔒"}
                          </span>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600">{date}</td>
                      <td className="px-5 py-3.5 text-gray-500">{time}</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={() => handleDeleteLog(log.id)}
                          className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2.5 py-1 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;