import React, { useContext, useMemo, useState } from "react";
import { DoorContext } from "./DoorContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = {
  open:   "#22c55e",
  alarm:  "#ef4444",
  closed: "#94a3b8",
};

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
  const [filter, setFilter] = useState("today"); // "today", "weekly", "monthly", "yearly", "custom"
  const [customRange, setCustomRange] = useState({ start: "", end: "" });

  const allLogs = useMemo(() => [...activityLogs, ...smsLogs], [activityLogs, smsLogs]);

  // Dynamic Chart & Summary processing
  const reportData = useMemo(() => {
    const now = new Date();
    let grouping = {};
    let labels = [];
    let filtered = [];

    const isSameDay = (d1, d2) => 
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    if (filter === "today") {
      labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
      labels.forEach(l => grouping[l] = { label: l, Opened: 0, Alarm: 0 });
      allLogs.forEach(l => {
        const d = new Date(l.createdAt || l.created_at);
        if (!isNaN(d.getTime()) && isSameDay(d, now)) {
          filtered.push(l);
          const h = `${String(d.getHours()).padStart(2, "0")}:00`;
          if (grouping[h]) {
            if (l.status === "Opened" || l.status === "OPEN") grouping[h].Opened++;
            else if (l.status === "Alarm") grouping[h].Alarm++;
          }
        }
      });
    } 
    else if (filter === "weekly") {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 6);
      sevenDaysAgo.setHours(0,0,0,0);

      for (let i = 0; i < 7; i++) {
        const d = new Date(sevenDaysAgo);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        labels.push(key);
        grouping[key] = { label: d.toLocaleDateString("en-US", { weekday: "short" }), Opened: 0, Alarm: 0 };
      }

      allLogs.forEach(l => {
        const d = new Date(l.createdAt || l.created_at);
        const key = d.toISOString().slice(0, 10);
        if (grouping[key]) {
          filtered.push(l);
          if (l.status === "Opened" || l.status === "OPEN") grouping[key].Opened++;
          else if (l.status === "Alarm") grouping[key].Alarm++;
        }
      });
    }
    else if (filter === "monthly") {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        labels.push(key);
        grouping[key] = { label: String(i), Opened: 0, Alarm: 0 };
      }
      allLogs.forEach(l => {
        const d = new Date(l.createdAt || l.created_at);
        const key = d.toISOString().slice(0, 10);
        if (grouping[key]) {
          filtered.push(l);
          if (l.status === "Opened" || l.status === "OPEN") grouping[key].Opened++;
          else if (l.status === "Alarm") grouping[key].Alarm++;
        }
      });
    }
    else if (filter === "yearly") {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      monthNames.forEach((name, i) => {
        const key = `${now.getFullYear()}-${String(i + 1).padStart(2, "0")}`;
        labels.push(key);
        grouping[key] = { label: name, Opened: 0, Alarm: 0 };
      });
      allLogs.forEach(l => {
        const d = new Date(l.createdAt || l.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (grouping[key]) {
          filtered.push(l);
          if (l.status === "Opened" || l.status === "OPEN") grouping[key].Opened++;
          else if (l.status === "Alarm") grouping[key].Alarm++;
        }
      });
    }
    else if (filter === "custom" && customRange.start && customRange.end) {
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      start.setHours(0,0,0,0);
      end.setHours(23,59,59,999);

      allLogs.forEach(l => {
        const d = new Date(l.createdAt || l.created_at);
        if (d >= start && d <= end) {
          filtered.push(l);
          const key = d.toISOString().slice(0, 10);
          if (!grouping[key]) {
            labels.push(key);
            grouping[key] = { label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), Opened: 0, Alarm: 0 };
          }
          if (l.status === "Opened" || l.status === "OPEN") grouping[key].Opened++;
          else if (l.status === "Alarm") grouping[key].Alarm++;
        }
      });
      labels.sort();
    }

    return {
      chart: labels.map(l => grouping[l]),
      summary: {
        total: filtered.length,
        opened: filtered.filter(l => l.status === "Opened" || l.status === "OPEN").length,
        alarm: filtered.filter(l => l.status === "Alarm").length,
        sms: filtered.filter(l => l.id && smsLogs.some(s => s.id === l.id)).length
      },
      pie: [
        { name: "Opened", value: filtered.filter(l => l.status === "Opened" || l.status === "OPEN").length, color: COLORS.open },
        { name: "Alarm", value: filtered.filter(l => l.status === "Alarm").length, color: COLORS.alarm },
      ].filter(d => d.value > 0)
    };
  }, [allLogs, filter, customRange, smsLogs]);

  const hasData = reportData.chart.some(h => h.Opened > 0 || h.Alarm > 0);

  return (
    <div className="p-4 md:p-6 space-y-6 pt-20 md:pt-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">System Reports</h2>
          <p className="text-sm text-gray-500 mt-1">Detailed analytics and activity breakdown</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {["today", "weekly", "monthly", "yearly", "custom"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                filter === f
                  ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filter === "custom" && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100 w-fit">
          <input 
            type="date" 
            value={customRange.start}
            onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
            className="text-xs border border-blue-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-400"
          />
          <span className="text-blue-400 text-xs font-bold">to</span>
          <input 
            type="date" 
            value={customRange.end}
            onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
            className="text-xs border border-blue-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-400"
          />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Filtered Events", val: reportData.summary.total, color: "text-slate-700", bg: "bg-slate-50" },
          { label: "Door Opens", val: reportData.summary.opened, color: "text-green-600", bg: "bg-green-50" },
          { label: "System Alarms", val: reportData.summary.alarm, color: "text-red-600", bg: "bg-red-50" },
          { label: "SMS Alerts", val: reportData.summary.sms, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((s, i) => (
          <div key={i} className={`rounded-xl border border-transparent p-4 ${s.bg}`}>
            <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest mb-1">{s.label}</p>
            <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-bold text-gray-800 uppercase tracking-tight">Activity Timeline</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" /><span className="text-[10px] font-bold text-gray-400">OPENED</span></div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /><span className="text-[10px] font-bold text-gray-400">ALARM</span></div>
            </div>
          </div>

          {!hasData ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-300 gap-2">
              <span className="text-4xl">📊</span>
              <p className="text-xs font-bold uppercase tracking-widest">No data for this period</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.chart} margin={{ top: 0, right: 0, bottom: 0, left: -25 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 9, fill: "#94a3b8", fontWeight: "bold" }} 
                  tickLine={false} axisLine={false}
                  interval={filter === "today" ? 3 : filter === "monthly" ? 4 : 0}
                />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                <Bar dataKey="Opened" fill={COLORS.open} radius={[4, 4, 0, 0]} barSize={filter === "today" ? 8 : 20} />
                <Bar dataKey="Alarm" fill={COLORS.alarm} radius={[4, 4, 0, 0]} barSize={filter === "today" ? 8 : 20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col">
          <p className="text-sm font-bold text-gray-800 uppercase tracking-tight mb-6">Type Distribution</p>
          <div className="flex-1 flex items-center justify-center">
            {reportData.pie.length === 0 ? (
               <p className="text-xs font-bold text-gray-300 uppercase">No events</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={reportData.pie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="value">
                    {reportData.pie.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
