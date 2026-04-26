import React, { useContext, useState } from "react";
import { DoorContext } from "./DoorContext";
import { Clock, ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
import ClearActivityModal from "../components/ClearActivityModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function toMinutes(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function isNowInRange(start, end) {
  const now = new Date();
  const cur = now.getHours() * 60 + now.getMinutes();
  const s = toMinutes(start);
  const e = toMinutes(end);
  if (s <= e) return cur >= s && cur < e;
  return cur >= s || cur < e;
}

const Calendar = ({ activityLogs, selectedDate, setSelectedDate }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // FIX: Added safety check to prevent toISOString() crash in Calendar
  const activeDates = new Set(
    activityLogs
      .map((log) => {
        const d = new Date(log.createdAt || log.created_at);
        return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
      })
      .filter(Boolean)
  );

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const monthName = new Date(viewYear, viewMonth).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };
  const toKey = (day) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 w-full">
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 hover:bg-gray-100 rounded text-gray-500">
          <ChevronLeft size={16} />
        </button>
        <p className="text-sm font-bold text-gray-800">{monthName}</p>
        <button onClick={nextMonth} className="p-1 hover:bg-gray-100 rounded text-gray-500">
          <ChevronRight size={16} />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-1 text-center text-[10px] font-bold text-gray-400 uppercase">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const key = toKey(day);
          const hasData = activeDates.has(key);
          const isSelected = selectedDate === key;
          const isToday = key === today.toISOString().slice(0, 10);
          return (
            <button
              key={day}
              onClick={() => setSelectedDate(isSelected ? null : key)}
              className={`relative mx-auto w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all
                ${isSelected ? "bg-blue-600 text-white shadow-md"
                  : isToday ? "border border-blue-400 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100"}`}
            >
              {day}
              {hasData && !isSelected && (
                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

function AlarmScheduleCard() {
  const {
    alarmEnabled,
    setAlarmEnabled,
    scheduleStart,
    setScheduleStart,
    scheduleEnd,
    setScheduleEnd,
  } = useContext(DoorContext);
  const token = localStorage.getItem("token");
  const [isEditing, setIsEditing] = useState(false);
  const [draftStart, setDraftStart] = useState(scheduleStart);
  const [draftEnd, setDraftEnd] = useState(scheduleEnd);
  const [scheduleOn, setScheduleOn] = useState(false);

  React.useEffect(() => {
    setDraftStart(scheduleStart);
    setDraftEnd(scheduleEnd);
  }, [scheduleStart, scheduleEnd]);

  React.useEffect(() => {
    if (!alarmEnabled) { setScheduleOn(false); return; }
    const check = () => setScheduleOn(isNowInRange(scheduleStart, scheduleEnd));
    check();
    const id = setInterval(check, 60_000);
    return () => clearInterval(id);
  }, [alarmEnabled, scheduleStart, scheduleEnd]);

  const handleSave = async () => {
    setScheduleStart(draftStart);
    setScheduleEnd(draftEnd);
    setAlarmEnabled(true);
    setIsEditing(false);
    try {
      await fetch(`${API}/api/settings/alarm`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value: true, scheduleStart: draftStart, scheduleEnd: draftEnd }),
      });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div
      className={`rounded-xl border p-4 space-y-3 transition-all ${
        scheduleOn ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-200"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-bold ${scheduleOn ? "text-amber-700" : "text-blue-700"}`}>
            Alarm System
          </p>
          <p className="text-[10px] uppercase font-bold text-blue-400">
            {scheduleOn ? "Active" : "Scheduled"}
          </p>
        </div>
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            scheduleOn ? "bg-amber-500" : "bg-blue-600"
          }`}
        >
          <Clock size={16} className="text-white" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="time"
          value={draftStart}
          disabled={!isEditing}
          onChange={(e) => setDraftStart(e.target.value)}
          className="text-xs border rounded p-1.5 font-bold bg-white outline-none"
        />
        <input
          type="time"
          value={draftEnd}
          disabled={!isEditing}
          onChange={(e) => setDraftEnd(e.target.value)}
          className="text-xs border rounded p-1.5 font-bold bg-white outline-none"
        />
      </div>
      <button
        onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
        className="w-full py-2 rounded text-[10px] font-black uppercase tracking-widest bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-all"
      >
        {isEditing ? "Save Schedule" : "Edit Schedule"}
      </button>
    </div>
  );
}

const ActivityLog = () => {
  const { activityLogs = [], setActivityLogs } = useContext(DoorContext);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPage,  setCurrentPage]  = useState(1);
  const itemsPerPage = 7;
  const token = localStorage.getItem("token");

  // Filter logic
  const filtered = activityLogs.filter((log) => {
    const statusText = log.status || "";
    const matchesSearch = statusText.toLowerCase().includes(search.toLowerCase());
    
    const d = new Date(log.createdAt || log.created_at);
    
    if (isNaN(d.getTime())) {
        return selectedDate ? false : matchesSearch;
    }

    const logDate = d.toISOString().slice(0, 10);
    const matchesDate = selectedDate ? logDate === selectedDate : true;
    return matchesSearch && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when search or date changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDate]);

  const handleDeleteActivity = async (id) => {
    try {
      await fetch(`${API}/api/dashboard/logs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivityLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await fetch(`${API}/api/dashboard/logs`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivityLogs([]);
    } catch (err) {
      console.error("Error clearing activity logs:", err);
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <div className="p-4 md:p-6 pt-20 md:pt-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Activity Log</h2>
          <p className="text-sm md:text-base text-gray-500 mt-1">History of door events</p>
        </div>
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 bg-red-50 text-red-600 text-sm font-medium rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="hidden lg:flex flex-col gap-4 w-72 shrink-0">
          <AlarmScheduleCard />
          <Calendar
            activityLogs={activityLogs}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col w-full overflow-hidden min-h-[580px]">
          <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-white">
            <span className="font-bold text-gray-800 shrink-0">Event History</span>
            <div className="relative w-48 md:w-64">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-400 w-full transition-all"
              />
            </div>
          </div>

          <div className="flex-1">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr className="text-xs font-bold text-gray-400 uppercase">
                  <th className="px-5 py-3">Event</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-20 text-gray-400 italic">
                      No records found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((log) => {
                    const isAlarm = log.status === "Alarm";
                    const isOpen = log.status === "Opened" || log.status === "OPEN";
                    const logDateObj = new Date(log.createdAt || log.created_at);
                    const isValid = !isNaN(logDateObj.getTime());

                    return (
                      <tr
                        key={log.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-3 flex items-center gap-3">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              isAlarm ? "bg-red-100" : isOpen ? "bg-green-100" : "bg-slate-100"
                            }`}
                          >
                            {isAlarm ? "🚨" : isOpen ? "🚪" : "🔒"}
                          </span>
                          <span
                            className={`font-bold uppercase ${
                              isAlarm ? "text-red-600" : isOpen ? "text-green-700" : "text-slate-600"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                          {isValid ? logDateObj.toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                          {isValid ? logDateObj.toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          }) : "N/A"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDeleteActivity(log.id)}
                            className="text-red-400 hover:text-red-600 transition-all p-1.5 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between bg-white">
              <p className="text-xs text-gray-500">
                Showing <span className="font-bold text-gray-700">{Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filtered.length, currentPage * itemsPerPage)}</span> of <span className="font-bold text-gray-700">{filtered.length}</span> events
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    // Only show first, last, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            currentPage === page
                              ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return <span key={page} className="text-gray-400 px-1">...</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <ClearActivityModal
          onConfirm={handleClearAll}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
};

export default ActivityLog;
