import React, { useContext, useMemo } from "react";
import { DoorContext } from "./DoorContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

const COLORS = {
  open:  "#22c55e", // green-500
  alarm: "#ef4444", // red-500
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

const Dashboard = () => {
  const {
    doorStatus,
    smsLogs = [],
    activityLogs = [],
    dashboardFilter, setDashboardFilter,
    customRange, setCustomRange,
  } = useContext(DoorContext);

  // Combine logs for processing
  const allLogs = useMemo(() => [...activityLogs, ...smsLogs], [activityLogs, smsLogs]);

  // Status checks
  const isOpen   = doorStatus === "Opened" || doorStatus === "OPEN";
  const isAlarm  = doorStatus === "Alarm";
  
  // Counts based on activity logs
  const totalOpened = activityLogs.filter((l) => l.status === "Opened" || l.status === "OPEN").length;
  const totalAlarm  = activityLogs.filter((l) => l.status === "Alarm").length;

  // Dynamic Chart processing
  const chartData = useMemo(() => {
    const now = new Date();
    let filteredLogs = [];
    let grouping = {};
    let labels = [];

    const getStartOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (dashboardFilter === "today") {
      const todayStr = now.toISOString().slice(0, 10);
      labels = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);
      labels.forEach(l => grouping[l] = { label: l, Opened: 0, Alarm: 0 });
      
      allLogs.forEach(l => {
        const d = new Date(l.createdAt || l.created_at);
        if (isNaN(d.getTime())) return;
        if (d.toISOString().slice(0, 10) === todayStr) {
          const h = `${String(d.getHours()).padStart(2, "0")}:00`;
          if (grouping[h]) {
            if (l.status === "Opened" || l.status === "OPEN") grouping[h].Opened++;
            else if (l.status === "Alarm") grouping[h].Alarm++;
          }
        }
      });
    } 
    else if (dashboardFilter === "weekly") {
      // Last 7 days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
        const key = d.toISOString().slice(0, 10);
        labels.push(key);
        grouping[key] = { label: dayLabel, Opened: 0, Alarm: 0 };
      }

      allLogs.forEach(l => {
        const d = new Date(l.createdAt || l.created_at);
        if (isNaN(d.getTime())) return;
        const key = d.toISOString().slice(0, 10);
        if (grouping[key]) {
          if (l.status === "Opened" || l.status === "OPEN") grouping[key].Opened++;
          else if (l.status === "Alarm") grouping[key].Alarm++;
        }
      });
    }
    else if (dashboardFilter === "monthly") {
      // This Month
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        labels.push(key);
        grouping[key] = { label: String(i), Opened: 0, Alarm: 0 };
      }

      allLogs.forEach(l => {
        const d = new Date(l.createdAt || l.created_at);
        if (isNaN(d.getTime())) return;
        const key = d.toISOString().slice(0, 10);
        if (grouping[key]) {
          if (l.status === "Opened" || l.status === "OPEN") grouping[key].Opened++;
          else if (l.status === "Alarm") grouping[key].Alarm++;
        }
      });
    }
    else if (dashboardFilter === "yearly") {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      monthNames.forEach((name, i) => {
        const key = `${now.getFullYear()}-${String(i + 1).padStart(2, "0")}`;
        labels.push(key);
        grouping[key] = { label: name, Opened: 0, Alarm: 0 };
      });

      allLogs.forEach(l => {
        const d = new Date(l.createdAt || l.created_at);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (grouping[key]) {
          if (l.status === "Opened" || l.status === "OPEN") grouping[key].Opened++;
          else if (l.status === "Alarm") grouping[key].Alarm++;
        }
      });
    }
    else if (dashboardFilter === "custom" && customRange.start && customRange.end) {
      const start = new Date(customRange.start);
      const end = new Date(customRange.end);
      const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) + 1;
      
      for (let i = 0; i < diffDays; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const key = d.toISOString().slice(0, 10);
        labels.push(key);
        grouping[key] = { label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), Opened: 0, Alarm: 0 };
      }

      allLogs.forEach(l => {
        const d = new Date(l.createdAt || l.created_at);
        if (isNaN(d.getTime())) return;
        const key = d.toISOString().slice(0, 10);
        if (grouping[key]) {
          if (l.status === "Opened" || l.status === "OPEN") grouping[key].Opened++;
          else if (l.status === "Alarm") grouping[key].Alarm++;
        }
      });
    }

    return labels.map(l => grouping[l]);
  }, [allLogs, dashboardFilter, customRange]);

  const hasData = chartData.some((h) => h.Opened > 0 || h.Alarm > 0);

  // Card Styling Logic
  const doorCardStyle = isAlarm
    ? { bg: "bg-red-50",   border: "border-red-300",   text: "text-red-600",   label: "text-red-400",   icon: "🚨" }
    : isOpen
    ? { bg: "bg-green-50", border: "border-green-300", text: "text-green-600", label: "text-green-400", icon: "🔓" }
    : { bg: "bg-slate-50", border: "border-slate-200", text: "text-slate-700", label: "text-slate-400", icon: "🔒" };

  return (
    <div className="p-4 md:p-6 pt-20 md:pt-8 space-y-6 max-w-7xl mx-auto">

      <div className="border-b border-gray-100 pb-4">
        <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">Dashboard Overview</h2>
        <p className="text-sm md:text-base text-gray-500 mt-1">Real-time monitoring of your Smart Alert system</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`rounded-xl border p-5 flex items-center justify-between ${doorCardStyle.bg} ${doorCardStyle.border}`}>
          <div>
            <p className={`text-xs uppercase tracking-wider mb-1 font-bold ${doorCardStyle.label}`}>Door Status</p>
            <p className={`text-xl md:text-2xl font-black ${doorCardStyle.text}`}>
              {doorStatus ?? "No Device"}
            </p>
          </div>
          <span className="text-3xl">{doorCardStyle.icon}</span>
        </div>

        <div className="rounded-xl border bg-blue-50 border-blue-200 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-blue-400 mb-1 font-bold">SMS Logs</p>
            <p className="text-xl md:text-2xl font-black text-blue-700">{smsLogs.length} Sent</p>
          </div>
          <span className="text-3xl">📱</span>
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-red-300 bg-red-50 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-bold text-red-400 mb-1">Total Alarms</p>
            <p className="text-3xl font-black text-red-600">{totalAlarm}</p>
          </div>
          <span className="text-3xl">🚨</span>
        </div>

        <div className="rounded-xl border border-green-300 bg-green-50 p-5 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase font-bold text-green-500 mb-1">Total Opened</p>
            <p className="text-3xl font-black text-green-600">{totalOpened}</p>
          </div>
          <span className="text-3xl">🚪</span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Activity Analytics</p>
            <p className="text-xs text-gray-400">
              {dashboardFilter === "today" ? "Hourly breakdown for today" : 
               dashboardFilter === "weekly" ? "Daily breakdown for the last 7 days" :
               dashboardFilter === "monthly" ? "Daily breakdown for this month" :
               dashboardFilter === "yearly" ? "Monthly breakdown for this year" :
               "Custom date range activity"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {["today", "weekly", "monthly", "yearly", "custom"].map((f) => (
              <button
                key={f}
                onClick={() => setDashboardFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  dashboardFilter === f
                    ? "bg-blue-600 text-white shadow-md shadow-blue-100"
                    : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {dashboardFilter === "custom" && (
          <div className="flex items-center gap-3 mb-6 p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Start Date</label>
              <input 
                type="date" 
                value={customRange.start}
                onChange={(e) => setCustomRange(prev => ({ ...prev, start: e.target.value }))}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">End Date</label>
              <input 
                type="date" 
                value={customRange.end}
                onChange={(e) => setCustomRange(prev => ({ ...prev, end: e.target.value }))}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-5 mb-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLORS.open }} />
            <span className="text-xs font-medium text-gray-500">Opened</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: COLORS.alarm }} />
            <span className="text-xs font-medium text-gray-500">Alarm</span>
          </div>
        </div>

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-300 gap-2">
            <span className="text-4xl">📊</span>
            <p className="text-sm">No activity recorded for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }} barSize={dashboardFilter === "today" ? 10 : 15} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="label" 
                tick={{ fontSize: 9, fill: "#94a3b8" }} 
                tickLine={false} 
                axisLine={false} 
                interval={dashboardFilter === "today" ? 3 : dashboardFilter === "monthly" ? 4 : 0} 
              />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Opened" fill={COLORS.open}  radius={[4, 4, 0, 0]} name="Opened" />
              <Bar dataKey="Alarm"  fill={COLORS.alarm} radius={[4, 4, 0, 0]} name="Alarm" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
};

export default Dashboard;