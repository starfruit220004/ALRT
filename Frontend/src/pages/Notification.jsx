import React, { useContext, useState, useEffect } from "react";
import { DoorContext } from "./DoorContext";
import { 
  ChevronLeft, ChevronRight, Search, Trash2, 
  MessageSquare, Bell, Calendar as CalIcon, 
  Filter, Smartphone, ShieldCheck, Mail, AlertCircle
} from "lucide-react";
import ClearSmsModal from "../components/ClearSmsModal";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Notifications = () => {
  const { smsLogs = [], setSmsLogs, smsEnabled, setSmsEnabled } = useContext(DoorContext);
  const [selectedDate, setSelectedDate] = useState(null);
  const [search, setSearch] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const token = localStorage.getItem("token");

  // Filter logic
  const filteredSms = smsLogs.filter((s) => {
    const d = new Date(s.createdAt || s.created_at);
    const logDate = !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : "";
    const matchesDate = selectedDate ? logDate === selectedDate : true;
    const matchesSearch = (s.status || "").toLowerCase().includes(search.toLowerCase());
    return matchesDate && matchesSearch;
  });

  const totalPages = Math.ceil(filteredSms.length / itemsPerPage);
  const paginatedData = filteredSms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [search, selectedDate]);

  const handleSmsToggle = async () => {
    const newValue = !smsEnabled;
    setSmsEnabled(newValue);
    try {
      await fetch(`${API}/api/settings/sms`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
    } catch (err) { console.error(err); }
  };

  const handleClearAll = async () => {
    try {
      await fetch(`${API}/api/dashboard/sms-logs`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setSmsLogs([]);
    } catch (err) { console.error("Clear all error:", err); } 
    finally { setShowConfirm(false); }
  };

  return (
    <div className="p-4 md:p-6 pt-24 md:pt-10 space-y-6 max-w-7xl mx-auto min-h-screen pb-20">
      
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 to-blue-900 p-8 text-white shadow-2xl shadow-blue-100">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center backdrop-blur-md border border-white/10">
                <Bell size={20} className="text-blue-300" />
              </div>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">SMS Alerts</h2>
            </div>
            <p className="text-blue-200/70 text-sm font-medium ml-1">Monitor all outgoing security notifications</p>
          </div>
          <button
            onClick={() => setShowConfirm(true)}
            className="group flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-red-500 text-white text-sm font-black uppercase tracking-widest rounded-2xl border border-white/10 transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Trash2 size={16} className="transition-transform group-hover:rotate-12" />
            Wipe SMS History
          </button>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Sidebar Controls */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* SMS Master Switch */}
          <div className={`group rounded-[2rem] border-2 p-6 transition-all duration-500 ${
            smsEnabled ? "bg-blue-600 border-blue-400 shadow-xl shadow-blue-200" : "bg-white border-slate-100 shadow-sm"
          }`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-2xl transition-colors ${smsEnabled ? "bg-white/10" : "bg-slate-50"}`}>
                <Smartphone size={24} className={smsEnabled ? "text-white" : "text-slate-400"} />
              </div>
              <button
                onClick={handleSmsToggle}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-300 ${
                  smsEnabled ? "bg-green-400 shadow-[0_0_15px_rgba(74,222,128,0.5)]" : "bg-slate-200"
                }`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                  smsEnabled ? "translate-x-8" : "translate-x-1"
                }`} />
              </button>
            </div>
            <p className={`text-lg font-black tracking-tight ${smsEnabled ? "text-white" : "text-slate-800"}`}>
              SMS Gateway
            </p>
            <p className={`text-xs font-medium mt-1 ${smsEnabled ? "text-blue-100" : "text-slate-400"}`}>
              {smsEnabled ? "System is pushing live alerts to your phone" : "Alerts are currently paused"}
            </p>
          </div>

          {/* Quick Filters */}
          <div className="bg-white rounded-[2rem] border border-slate-100 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
              <Filter size={18} className="text-slate-400" />
              <span className="font-black text-slate-700 uppercase tracking-wider text-[10px]">Filter History</span>
            </div>
            
            <div className="space-y-4">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-xs outline-none transition-all"
                />
              </div>

              <div className="relative">
                <CalIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input
                  type="date"
                  value={selectedDate || ""}
                  onChange={(e) => setSelectedDate(e.target.value || null)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-xs outline-none transition-all"
                />
              </div>

              {selectedDate && (
                <button 
                  onClick={() => setSelectedDate(null)}
                  className="w-full py-2 text-[10px] font-bold text-blue-500 uppercase tracking-widest hover:bg-blue-50 rounded-xl transition-colors"
                >
                  Clear Date
                </button>
              )}
            </div>
          </div>
        </div>

        {/* SMS List Area */}
        <div className="lg:col-span-3 space-y-4">
          {paginatedData.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 py-32 flex flex-col items-center justify-center text-slate-300 gap-4">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                <MessageSquare size={32} />
              </div>
              <p className="font-bold">No SMS logs to display</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {paginatedData.map((sms) => {
                const isAlarm = sms.status === "Alarm";
                const isOpen = sms.status === "Opened" || sms.status === "OPEN";
                const d = new Date(sms.createdAt || sms.created_at);
                
                return (
                  <div key={sms.id} className="group bg-white hover:bg-slate-50/50 rounded-3xl border border-slate-100 p-5 flex items-center justify-between transition-all duration-300">
                    <div className="flex items-center gap-6">
                      <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center text-2xl transition-all duration-300 group-hover:scale-105 ${
                        isAlarm ? "bg-red-50 text-red-500" : isOpen ? "bg-green-50 text-green-500" : "bg-slate-50 text-slate-500"
                      }`}>
                        <Mail size={28} />
                        {isAlarm && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                            <AlertCircle size={10} className="text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-black uppercase tracking-widest ${
                            isAlarm ? "text-red-600" : isOpen ? "text-green-600" : "text-slate-600"
                          }`}>
                            {sms.status === "Alarm" ? "🚨 System Alarm" : sms.status}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-500 text-[10px] font-black uppercase">Sent</span>
                        </div>
                        <p className="text-xs text-slate-400 font-medium">
                          Notification triggered by {sms.status.toLowerCase()} event
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          <span className="flex items-center gap-1"><CalIcon size={12}/> {d.toLocaleDateString()}</span>
                          <span className="flex items-center gap-1"><Clock size={12}/> {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleDeleteLog(sms.id)}
                      className="opacity-0 group-hover:opacity-100 w-12 h-12 flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300 shadow-sm"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 pt-8">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Showing {paginatedData.length} logs
              </div>
              <div className="flex items-center gap-3">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-600 hover:border-blue-400 hover:text-blue-500 disabled:opacity-20 disabled:pointer-events-none transition-all shadow-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="w-12 h-12 flex items-center justify-center bg-blue-600 rounded-2xl text-white font-black text-xs shadow-lg shadow-blue-200">
                  {currentPage}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="w-12 h-12 flex items-center justify-center bg-white border border-slate-200 rounded-2xl text-slate-600 hover:border-blue-400 hover:text-blue-500 disabled:opacity-20 disabled:pointer-events-none transition-all shadow-sm"
                >
                  <ChevronRight size={20} />
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
