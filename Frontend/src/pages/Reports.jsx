import React, { useContext, useMemo, useState } from "react";
import { DoorContext } from "./DoorContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = {
  open:   "#22c55e", 
  alarm:  "#ef4444", 
  closed: "#94a3b8",
};

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "#fff", border: "1px solid #e5e7eb",
      borderRadius: 10, padding: "8px 12px", fontSize: 12,
      boxShadow: "0 4px 12px rgba(0,0,0,0.08)"
    }}>
      <p style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: "2px 0" }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

const Reports = () => {
  const { activityLogs = [], smsLogs = [] } = useContext(DoorContext);
  const [filter, setFilter] = useState("today"); 
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const allLogs = useMemo(() => [...activityLogs, ...smsLogs], [activityLogs, smsLogs]);

  // 1. Filter the raw logs based on selected range
  const filteredLogs = useMemo(() => {
    const now = new Date();
    const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    return allLogs.filter(l => {
      const d = new Date(l.createdAt || l.created_at);
      if (isNaN(d.getTime())) return false;

      if (filter === "today") {
        return d.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
      }
      if (filter === "weekly") {
        const weekAgo = new Date();
        weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (filter === "monthly") {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (filter === "yearly") {
        return d.getFullYear() === now.getFullYear();
      }
      if (filter === "custom" && customRange.start && customRange.end) {
        const s = new Date(customRange.start);
        const e = new Date(customRange.end);
        e.setHours(23, 59, 59, 999);
        return d >= s && d <= e;
      }
      return true;
    });
  }, [allLogs, filter, customRange]);

  // 2. Process Data for the Timeline (Line Chart)
  const timelineData = useMemo(() => {
    const map = {};
    filteredLogs.forEach(l => {
      const d = new Date(l.createdAt || l.created_at);
      const key = filter === "today" 
        ? `${String(d.getHours()).padStart(2, "0")}:00`
        : d.toISOString().slice(0, 10);

      if (!map[key]) map[key] = { label: key, Open: 0, Alarm: 0 };
      if (l.status === "Opened" || l.status === "OPEN") map[key].Open++;
      else if (l.status === "Alarm") map[key].Alarm++;
    });
    return Object.values(map).sort((a, b) => a.label.localeCompare(b.label));
  }, [filteredLogs, filter]);

  // 3. Process Data for Day of Week
  const dayOfWeekData = useMemo(() => {
    const counts = DAY_LABELS.map(d => ({ day: d, Open: 0, Alarm: 0 }));
    filteredLogs.forEach(l => {
      const d = new Date(l.createdAt || l.created_at).getDay();
      if (l.status === "Opened" || l.status === "OPEN") counts[d].Open++;
      else if (l.status === "Alarm") counts[d].Alarm++;
    });
    return counts;
  }, [filteredLogs]);

  // 4. Process Data for Hour of Day
  const hourOfDayData = useMemo(() => {
    const counts = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, Open: 0, Alarm: 0 }));
    filteredLogs.forEach(l => {
      const h = new Date(l.createdAt || l.created_at).getHours();
      if (l.status === "Opened" || l.status === "OPEN") counts[h].Open++;
      else if (l.status === "Alarm") counts[h].Alarm++;
    });
    return counts;
  }, [filteredLogs]);

  // 5. Process Data for Pie Chart
  const pieData = useMemo(() => {
    let open = 0, alarm = 0;
    filteredLogs.forEach(l => {
      if (l.status === "Opened" || l.status === "OPEN") open++;
      else if (l.status === "Alarm") alarm++;
    });
    return [
      { name: "Opened", value: open,  color: COLORS.open },
      { name: "Alarm",  value: alarm, color: COLORS.alarm },
    ].filter(d => d.value > 0);
  }, [filteredLogs]);

  const totalOpen  = filteredLogs.filter(l => l.status === "Opened" || l.status === "OPEN").length;
  const totalAlarm = filteredLogs.filter(l => l.status === "Alarm").length;
  const avgPerDay  = useMemo(() => {
    const dates = new Set(filteredLogs.map(l => new Date(l.createdAt || l.created_at).toISOString().slice(0, 10)));
    return dates.size > 0 ? (filteredLogs.length / dates.size).toFixed(1) : "0";
  }, [filteredLogs]);

  return (
    <div className="p-4 md:p-6 space-y-6 pt-20 md:pt-8 max-w-7xl mx-auto">
      {/* Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">System Reports</h2>
          <p className="text-sm text-gray-500">Advanced activity analytics</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {["today", "weekly", "monthly", "yearly", "custom"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                filter === f ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filter === "custom" && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 w-fit animate-in fade-in slide-in-from-top-2">
          <input type="date" value={customRange.start} onChange={(e) => setCustomRange(p => ({ ...p, start: e.target.value }))} className="text-xs border rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-400" />
          <span className="text-blue-400 text-xs font-bold">to</span>
          <input type="date" value={customRange.end} onChange={(e) => setCustomRange(p => ({ ...p, end: e.target.value }))} className="text-xs border rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">Total Events</p>
          <p className="text-2xl font-black text-slate-700">{filteredLogs.length}</p>
        </div>
        <div className="rounded-xl border border-green-200 bg-green-50/30 p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-green-500 mb-1">Door Opens</p>
          <p className="text-2xl font-black text-green-600">{totalOpen}</p>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/30 p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-red-400 mb-1">Alarms</p>
          <p className="text-2xl font-black text-red-600">{totalAlarm}</p>
        </div>
        <div className="rounded-xl border border-blue-200 bg-blue-50/30 p-4 shadow-sm">
          <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">Avg / Day</p>
          <p className="text-2xl font-black text-blue-600">{avgPerDay}</p>
        </div>
      </div>

      {/* Main Timeline & Pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-tight">Activity Timeline</p>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timelineData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Open" stroke={COLORS.open} strokeWidth={3} dot={{ r: 4, fill: COLORS.open }} activeDot={{ r: 6 }} name="Opened" />
              <Line type="monotone" dataKey="Alarm" stroke={COLORS.alarm} strokeWidth={3} dot={{ r: 4, fill: COLORS.alarm }} activeDot={{ r: 6 }} name="Alarm" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col items-center">
          <p className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-tight w-full">Event Breakdown</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value">
                {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-tight">Day of Week Distribution</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={dayOfWeekData} barSize={20} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Open" fill={COLORS.open} radius={[4, 4, 0, 0]} name="Opened" />
              <Bar dataKey="Alarm" fill={COLORS.alarm} radius={[4, 4, 0, 0]} name="Alarm" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <p className="text-sm font-bold text-gray-800 mb-4 uppercase tracking-tight">Peak Activity Hours</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hourOfDayData} barSize={8} margin={{ left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="hour" tick={{ fontSize: 8, fill: "#94a3b8" }} axisLine={false} tickLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Open" fill={COLORS.open} radius={[2, 2, 0, 0]} name="Opened" />
              <Bar dataKey="Alarm" fill={COLORS.alarm} radius={[2, 2, 0, 0]} name="Alarm" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;
