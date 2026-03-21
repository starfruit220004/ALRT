// src/pages/Reports.jsx
import React, { useContext, useMemo } from "react";
import { DoorContext } from "./DoorContext";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid, PieChart, Pie, Cell, Legend,
} from "recharts";

const DAY_LABELS   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const COLORS = {
  open:  "#f97316",
  alarm: "#ef4444",
  closed:"#22c55e",
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
  // ✅ Combine both arrays so all charts work across all log types
  const { activityLogs = [], smsLogs = [] } = useContext(DoorContext);
  const logs = useMemo(() => [...activityLogs, ...smsLogs], [activityLogs, smsLogs]);

  const byHour = useMemo(() => {
    const counts = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, Open: 0, Alarm: 0 }));
    logs.forEach(l => {
      const h = new Date(l.created_at).getHours();
      if (l.status === "Opened" || l.status === "OPEN") counts[h].Open++;
      else if (l.status === "Alarm") counts[h].Alarm++;
    });
    return counts;
  }, [logs]);

  const byDay = useMemo(() => {
    const counts = DAY_LABELS.map(d => ({ day: d, Open: 0, Alarm: 0 }));
    logs.forEach(l => {
      const d = new Date(l.created_at).getDay();
      if (l.status === "Opened" || l.status === "OPEN") counts[d].Open++;
      else if (l.status === "Alarm") counts[d].Alarm++;
    });
    return counts;
  }, [logs]);

  const byDate = useMemo(() => {
    const map = {};
    logs.forEach(l => {
      const key = new Date(l.created_at).toISOString().slice(0, 10);
      if (!map[key]) map[key] = { date: key, Open: 0, Alarm: 0 };
      if (l.status === "Opened" || l.status === "OPEN") map[key].Open++;
      else if (l.status === "Alarm") map[key].Alarm++;
    });
    return Object.values(map)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map(d => ({ ...d, date: d.date.slice(5) }));
  }, [logs]);

  const pieData = useMemo(() => {
    let open = 0, alarm = 0, closed = 0;
    logs.forEach(l => {
      if (l.status === "Opened" || l.status === "OPEN") open++;
      else if (l.status === "Alarm") alarm++;
      else closed++;
    });
    return [
      { name: "Door Opened", value: open,   color: COLORS.open  },
      { name: "Alarm",       value: alarm,  color: COLORS.alarm },
      { name: "Other",       value: closed, color: COLORS.closed },
    ].filter(d => d.value > 0);
  }, [logs]);

  const totalOpen  = logs.filter(l => l.status === "Opened" || l.status === "OPEN").length;
  const totalAlarm = logs.filter(l => l.status === "Alarm").length;
  const totalDays  = useMemo(() => {
    const dates = new Set(logs.map(l => new Date(l.created_at).toISOString().slice(0, 10)));
    return dates.size;
  }, [logs]);
  const avgPerDay = totalDays > 0 ? (logs.length / totalDays).toFixed(1) : "0";

  if (logs.length === 0) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Visual breakdown of door activity</p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
          <span className="text-5xl">📊</span>
          <p className="text-sm font-medium">No activity data yet</p>
          <p className="text-xs text-gray-400">Charts will appear once your device starts logging events.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Reports</h2>
        <p className="text-sm text-gray-500 mt-0.5">Visual breakdown of door activity</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: logs.length, color: "text-gray-800",   bg: "bg-gray-50",   border: "border-gray-200" },
          { label: "Door Opened",  value: totalOpen,   color: "text-orange-500", bg: "bg-orange-50", border: "border-orange-200" },
          { label: "Alarms",       value: totalAlarm,  color: "text-red-500",    bg: "bg-red-50",    border: "border-red-200" },
          { label: "Avg / Day",    value: avgPerDay,   color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-200" },
        ].map(({ label, value, color, bg, border }) => (
          <div key={label} className={`rounded-xl border ${border} ${bg} p-4 flex flex-col gap-1`}>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
            <p className={`text-2xl md:text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5">
          <p className="text-sm font-semibold text-gray-800 mb-1">Daily Activity (last 30 days)</p>
          <p className="text-xs text-gray-400 mb-4">Door opens and alarms over time</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={byDate} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="Open"  stroke={COLORS.open}  strokeWidth={2} dot={false} name="Opened" />
              <Line type="monotone" dataKey="Alarm" stroke={COLORS.alarm} strokeWidth={2} dot={false} name="Alarm" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5 flex flex-col">
          <p className="text-sm font-semibold text-gray-800 mb-1">Event Breakdown</p>
          <p className="text-xs text-gray-400 mb-4">Distribution by type</p>
          <div className="flex-1 flex items-center justify-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 11, color: "#64748b" }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5">
          <p className="text-sm font-semibold text-gray-800 mb-1">Activity by Day of Week</p>
          <p className="text-xs text-gray-400 mb-4">Which days see the most events</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byDay} margin={{ top: 4, right: 8, bottom: 0, left: -20 }} barSize={14} barGap={3}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Open"  fill={COLORS.open}  radius={[4,4,0,0]} name="Opened" />
              <Bar dataKey="Alarm" fill={COLORS.alarm} radius={[4,4,0,0]} name="Alarm" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5">
          <p className="text-sm font-semibold text-gray-800 mb-1">Activity by Hour of Day</p>
          <p className="text-xs text-gray-400 mb-4">Peak hours for door events</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byHour} margin={{ top: 4, right: 8, bottom: 0, left: -20 }} barSize={8} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Open"  fill={COLORS.open}  radius={[3,3,0,0]} name="Opened" />
              <Bar dataKey="Alarm" fill={COLORS.alarm} radius={[3,3,0,0]} name="Alarm" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Reports;