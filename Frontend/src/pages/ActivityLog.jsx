import React, { useContext, useState, useEffect } from "react";
import { DoorContext } from "./DoorContext";
import { Clock, ChevronLeft, ChevronRight, Search, Trash2, Calendar as CalIcon, Filter, AlertTriangle, DoorOpen, ShieldCheck } from "lucide-react";
import ClearActivityModal from "../components/ClearActivityModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const ActivityLog = () => {
  const { activityLogs = [], setActivityLogs } = useContext(DoorContext);
  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const token = localStorage.getItem("token");

  // Filter logic
  const filtered = activityLogs.filter((log) => {
    const statusText = log.status || "";
    const matchesSearch = statusText.toLowerCase().includes(search.toLowerCase());
    const d = new Date(log.createdAt || log.created_at);
    if (isNaN(d.getTime())) return selectedDate ? false : matchesSearch;
    const logDate = d.toISOString().slice(0, 10);
    const matchesDate = selectedDate ? logDate === selectedDate : true;
    return matchesSearch && matchesDate;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [search, selectedDate]);

  const handleDeleteActivity = async (id) => {
    try {
      await fetch(`${API}/api/dashboard/logs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivityLogs((prev) => prev.filter((l) => l.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleClearAll = async () => {
    try {
      await fetch(`${API}/api/dashboard/logs`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setActivityLogs([]);
    } catch (err) { console.error(err); } 
    finally { setShowConfirm(false); }
  };

  return (
    <div className="p-4 md:p-6 pt-24 md:pt-10 space-y-6 max-w-7xl mx-auto min-h-screen pb-20">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-8 text-white shadow-2xl shadow-slate-200">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h2 className="text-3xl md:text-4xl font-black tracking-tight">Activity Log</h2>
            <div className="flex items-center gap-3 text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-700/50 px-3 py-1 rounded-full text-xs font-bold border border-slate-600">
                <ShieldCheck size={14} className="text-blue-400" /> System Active
              </span>
              <span className="text-xs font-medium">{activityLogs.length} Total Events Recorded</span>
            </div>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="group flex items-center gap-2 px-6 py-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white text-sm font-black uppercase tracking-widest rounded-2xl border border-red-500/20 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg shadow-red-500/5"
          >
            <Trash2 size={16} className="transition-transform group-hover:rotate-12" />
            Clear All Logs
          </button>
        </div>
        {/* Abstract Background Shapes */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
              <Filter size={18} className="text-slate-400" />
              <span className="font-black text-slate-700 uppercase tracking-wider text-xs">Refine Search</span>
            </div>
            
            <div className="space-y-4">
              <div className="relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-sm outline-none transition-all shadow-inner"
                />
              </div>

              <div className="relative group">
                <CalIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate || ""}
                  onChange={(e) => setSelectedDate(e.target.value || null)}
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-sm outline-none transition-all shadow-inner"
                />
              </div>

              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="w-full py-2 text-[10px] font-bold text-blue-500 hover:text-blue-600 uppercase tracking-widest"
                >
                  Clear Date Filter
                </button>
              )}
            </div>
          </div>

          {/* Mini Stat Card */}
          <div className="bg-blue-600 rounded-3xl p-6 text-white shadow-xl shadow-blue-100 overflow-hidden relative">
            <div className="relative z-10 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Current View</p>
              <p className="text-3xl font-black">{filtered.length}</p>
              <p className="text-xs text-blue-100 font-medium">Matches found</p>
            </div>
            <Search className="absolute -bottom-4 -right-4 w-24 h-24 text-white/10 -rotate-12" />
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3 space-y-4">
          {paginatedData.length === 0 ? (
            <div className="bg-white rounded-[2rem] border-2 border-dashed border-slate-100 py-32 flex flex-col items-center justify-center text-slate-300 gap-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <Search size={32} />
              </div>
              <p className="font-bold">No events match your criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedData.map((log) => {
                const isAlarm = log.status === "Alarm";
                const isOpen = log.status === "Opened" || log.status === "OPEN";
                const d = new Date(log.createdAt || log.created_at);
                
                return (
                  <div key={log.id} className="group bg-white hover:bg-slate-50 rounded-2xl border border-slate-100 p-4 flex items-center justify-between transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
                    <div className="flex items-center gap-5">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm transition-transform group-hover:scale-110 ${
                        isAlarm ? "bg-red-50 text-red-500 border border-red-100" : 
                        isOpen ? "bg-green-50 text-green-500 border border-green-100" : 
                        "bg-slate-50 text-slate-500 border border-slate-100"
                      }`}>
                        {isAlarm ? <AlertTriangle size={24} /> : isOpen ? <DoorOpen size={24} /> : <Clock size={24} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-black uppercase tracking-widest ${
                            isAlarm ? "text-red-600" : isOpen ? "text-green-600" : "text-slate-600"
                          }`}>
                            {log.status}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                          <span className="text-xs font-bold text-slate-400">System Event</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-slate-500">
                          <span className="flex items-center gap-1.5 text-xs font-medium">
                            <CalIcon size={12} className="text-slate-300" /> {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs font-medium">
                            <Clock size={12} className="text-slate-300" /> {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteActivity(log.id)}
                      className="opacity-0 group-hover:opacity-100 w-10 h-10 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-2 pt-6">
              <p className="text-xs font-bold text-slate-400">
                Page <span className="text-slate-700">{currentPage}</span> of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-all"
                >
                  <ChevronRight size={20} />
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
