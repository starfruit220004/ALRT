import React, { useContext, useState } from "react";
import { DoorContext } from "./DoorContext";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ClearSmsModal from "../components/ClearSmsModal";

function Calendar({ smsHistory, selectedDate, onSelectDate }) {
  const today = new Date();
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const activeDates = new Set(
    smsHistory.map((s) => new Date(s.created_at).toISOString().slice(0, 10))
  );

  const daysInMonth    = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const monthName      = new Date(viewYear, viewMonth).toLocaleString("en-US", { month: "long", year: "numeric" });

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  const toKey = (day) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${viewYear}-${mm}-${dd}`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5 w-full">
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
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1">{d}</div>
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
              className={`
                relative mx-auto w-7 h-7 md:w-8 md:h-8 flex items-center justify-center rounded-full text-xs font-medium transition-all duration-150
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
      <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-4 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" /> Has SMS
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

const Notifications = () => {
  const { smsLogs = [], setSmsLogs } = useContext(DoorContext);
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [showConfirm, setShowConfirm]   = useState(false);
  const token = localStorage.getItem("token");

  const handleDeleteLog = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/dashboard/sms-logs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSmsLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      console.error("Error deleting SMS log:", err);
    }
  };

  const handleClearAll = async () => {
    if (smsLogs.length === 0) return;
    try {
      await Promise.all(
        smsLogs.map((l) =>
          fetch(`http://localhost:5000/api/dashboard/sms-logs/${l.id}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setSmsLogs([]);
    } catch (err) {
      console.error("Error clearing SMS logs:", err);
    }
  };

  const smsHistory = smsLogs.map((log) => {
    const dateObj = new Date(log.created_at);
    const date    = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const time    = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
    const message = log.status === "Alarm"
      ? `ALRT: Door opened during restricted hours at ${time}. Please check immediately.`
      : `ALRT: Door opened at ${time}`;
    const event = log.status === "Alarm" ? "Alarm triggered" : `Door ${log.status}`;
    return { ...log, message, event, date, time };
  });

  const filteredSms = selectedDate
    ? smsHistory.filter((s) => new Date(s.created_at).toISOString().slice(0, 10) === selectedDate)
    : smsHistory;

  const selectedLabel = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-5">
      {showConfirm && (
        <ClearSmsModal
          onConfirm={() => { setShowConfirm(false); handleClearAll(); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">SMS Notifications</h2>
          <p className="text-sm text-gray-500 mt-0.5">Automatic SMS alerts sent by the system</p>
        </div>
        {smsHistory.length > 0 && (
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-1.5 px-3 md:px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg border border-red-200 transition-colors whitespace-nowrap"
          >
            🗑 <span className="hidden sm:inline">Clear All</span>
          </button>
        )}
      </div>

      <div className="md:hidden">
        <button
          onClick={() => setCalendarOpen((o) => !o)}
          className="w-full flex items-center justify-between px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 shadow-sm"
        >
          <span>📅 {selectedDate ? selectedLabel : "Filter by date"}</span>
          <ChevronRight size={15} className={`transition-transform ${calendarOpen ? "rotate-90" : ""}`} />
        </button>
        {calendarOpen && (
          <div className="mt-2">
            <Calendar
              smsHistory={smsHistory}
              selectedDate={selectedDate}
              onSelectDate={(d) => { setSelectedDate(d); setCalendarOpen(false); }}
            />
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:gap-5 items-start">
        <div className="hidden md:block w-72 flex-shrink-0">
          <Calendar smsHistory={smsHistory} selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col w-full">
          <div className="px-4 md:px-5 py-3 md:py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0 gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-gray-800">SMS History</p>
              {selectedLabel && <p className="text-xs text-blue-500 mt-0.5 truncate">Showing: {selectedLabel}</p>}
            </div>
            {selectedDate && (
              <span className="text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-1 rounded-full font-medium whitespace-nowrap flex-shrink-0">
                {filteredSms.length} result{filteredSms.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: "420px" }}>
            <table className="w-full text-sm table-fixed min-w-[560px]">
              <colgroup>
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[20%]" />
                <col className="w-[40%]" />
                <col className="w-[14%]" />
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 md:px-5 py-3 md:py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                  <th className="text-left px-4 md:px-5 py-3 md:py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Time</th>
                  <th className="text-left px-4 md:px-5 py-3 md:py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Event</th>
                  <th className="text-left px-4 md:px-5 py-3 md:py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</th>
                  <th className="text-left px-4 md:px-5 py-3 md:py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredSms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-14 text-gray-400">
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-3xl">📵</span>
                        <p className="text-sm">{selectedDate ? "No SMS on this date" : "No SMS sent yet"}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSms.map((sms, i) => (
                    <tr key={sms.id ?? i} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                      <td className="px-4 md:px-5 py-3 md:py-3.5 font-medium text-gray-800 text-xs md:text-sm">{sms.date}</td>
                      <td className="px-4 md:px-5 py-3 md:py-3.5 text-gray-500 text-xs md:text-sm">{sms.time}</td>
                      <td className="px-4 md:px-5 py-3 md:py-3.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                          sms.status === "Alarm"
                            ? "bg-red-100 text-red-600 border border-red-200"
                            : "bg-orange-100 text-orange-600 border border-orange-200"
                        }`}>
                          {sms.status === "Alarm" ? "⚠️" : "🚪"} {sms.event}
                        </span>
                      </td>
                      <td className="px-4 md:px-5 py-3 md:py-3.5 text-gray-600 text-xs leading-relaxed">{sms.message}</td>
                      <td className="px-4 md:px-5 py-3 md:py-3.5">
                        <button
                          onClick={() => handleDeleteLog(sms.id)}
                          className="text-xs text-red-400 hover:text-red-600 hover:bg-red-50 px-2 md:px-2.5 py-1 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="px-4 md:px-5 py-2.5 border-t border-gray-100 bg-gray-50 flex-shrink-0">
            <p className="text-xs text-gray-400">
              Showing <span className="font-semibold text-gray-600">{filteredSms.length}</span> of{" "}
              <span className="font-semibold text-gray-600">{smsHistory.length}</span> entries
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;