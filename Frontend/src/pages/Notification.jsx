/*
  ═══════════════════════════════════════════════════════
  src/pages/Notification.jsx
  ───────────────────────────────────────────────────────
  FIXES FROM ORIGINAL:
  1. Removed the "Message" column — server never writes
     to the message field so it was always blank.
  2. Search now only filters by status (not message).
  3. Safe date handling with isNaN guard on all dates.
  4. colSpan updated from 5 → 4 after column removal.
  ═══════════════════════════════════════════════════════
*/

import React, { useContext, useState } from "react";
import { DoorContext } from "./DoorContext";
import { ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
import ClearSmsModal from "../components/ClearSmsModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function Calendar({ smsHistory, selectedDate, onSelectDate }) {
  const today = new Date();
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const activeDates = new Set(
    smsHistory
      .map((s) => {
        const d = new Date(s.createdAt || s.created_at);
        return isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
      })
      .filter(Boolean)
  );

  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const monthName      = new Date(viewYear, viewMonth).toLocaleString("en-US", {
    month: "long", year: "numeric",
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
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const key        = toKey(day);
          const hasData    = activeDates.has(key);
          const isSelected = selectedDate === key;
          const isToday    = key === today.toISOString().slice(0, 10);
          return (
            <button
              key={day}
              onClick={() => onSelectDate(isSelected ? null : key)}
              className={`relative mx-auto w-8 h-8 flex items-center justify-center rounded-full text-xs font-semibold transition-all
                ${isSelected
                  ? "bg-blue-600 text-white shadow-md"
                  : isToday
                  ? "border border-blue-400 text-blue-600"
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
}

const Notifications = () => {
  const { smsLogs = [], setSmsLogs, smsEnabled, setSmsEnabled } = useContext(DoorContext);
  const [selectedDate, setSelectedDate] = useState(null);
  const [search,       setSearch]       = useState("");
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [currentPage,  setCurrentPage]  = useState(1);
  const itemsPerPage = 7;
  const token = localStorage.getItem("token");

  // Filter logic
  const filteredSms = smsLogs.filter((s) => {
    const d       = new Date(s.createdAt || s.created_at);
    const logDate = !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "";
    const matchesDate   = selectedDate ? logDate === selectedDate : true;
    const matchesSearch = (s.status || "").toLowerCase().includes(search.toLowerCase());
    return matchesDate && matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredSms.length / itemsPerPage);
  const paginatedData = filteredSms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when search or date changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedDate]);

  const handleSmsToggle = async () => {
    const newValue = !smsEnabled;
    setSmsEnabled(newValue);
    try {
      await fetch(`${API}/api/settings/sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value: newValue }),
      });
    } catch (err) {
      console.error("SMS toggle error:", err);
      setSmsEnabled(!newValue);
    }
  };

  const handleDeleteLog = async (id) => {
    try {
      await fetch(`${API}/api/dashboard/sms-logs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSmsLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    try {
      await fetch(`${API}/api/dashboard/sms-logs`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSmsLogs([]);
    } catch (err) {
      console.error("Clear all error:", err);
    } finally {
      setShowConfirm(false);
    }
  };

  return (
    <div className="p-4 md:p-6 pt-20 md:pt-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">SMS Notifications</h2>
          <p className="text-sm md:text-base text-gray-500 mt-1">History of sent SMS alerts</p>
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
          <div className={`rounded-xl border shadow-sm p-4 flex items-center justify-between transition-colors ${
            smsEnabled ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200"
          }`}>
            <div>
              <p className={`text-sm font-bold ${smsEnabled ? "text-blue-700" : "text-gray-800"}`}>
                SMS Status
              </p>
              <p className={`text-xs ${smsEnabled ? "text-blue-500" : "text-gray-500"}`}>
                {smsEnabled ? "Active" : "Disabled"}
              </p>
            </div>
            <button
              onClick={handleSmsToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                smsEnabled ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                smsEnabled ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          </div>

          <Calendar
            smsHistory={smsLogs}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col w-full overflow-hidden min-h-[580px]">
          <div className="p-4 border-b border-gray-100 flex items-center gap-4 bg-white">
            <span className="font-bold text-gray-800 shrink-0">SMS History</span>
            <div className="relative w-48 md:w-64">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by status..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-blue-400 w-full"
              />
            </div>
          </div>

          <div className="flex-1">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase">
                <tr className="text-left">
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
                      No logs found
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((sms) => {
                    const isAlarm = sms.status === "Alarm";
                    const isOpen  = sms.status === "Opened" || sms.status === "OPEN";
                    const dateObj = new Date(sms.createdAt || sms.created_at);
                    const isValid = !isNaN(dateObj.getTime());
                    return (
                      <tr key={sms.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <span className={`font-bold uppercase ${
                            isAlarm ? "text-red-600" : isOpen ? "text-green-700" : "text-slate-600"
                          }`}>
                            {sms.status}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                          {isValid ? dateObj.toLocaleDateString() : "N/A"}
                        </td>
                        <td className="px-5 py-3 text-gray-500 whitespace-nowrap">
                          {isValid
                            ? dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                            : "N/A"}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDeleteLog(sms.id)}
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
                Showing <span className="font-bold text-gray-700">{Math.min(filteredSms.length, (currentPage - 1) * itemsPerPage + 1)}-{Math.min(filteredSms.length, currentPage * itemsPerPage)}</span> of <span className="font-bold text-gray-700">{filteredSms.length}</span> logs
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
                              ? "bg-blue-600 text-white shadow-md"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
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
        <ClearSmsModal onConfirm={handleClearAll} onCancel={() => setShowConfirm(false)} />
      )}
    </div>
  );
};

export default Notifications;
