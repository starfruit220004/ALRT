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
  } = useContext(DoorContext);

  const allLogs = useMemo(() => [...activityLogs, ...smsLogs], [activityLogs, smsLogs]);
  const isOpen   = doorStatus === "Opened" || doorStatus === "OPEN";
  const isAlarm  = doorStatus === "Alarm";
  
  const totalOpened = activityLogs.filter((l) => l.status === "Opened" || l.status === "OPEN").length;
  const totalAlarm  = activityLogs.filter((l) => l.status === "Alarm").length;

  const todayData = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const counts = Array.from({ length: 24 }, (_, h) => ({
      hour: `${String(h).padStart(2, "0")}:00`,
      Opened: 0,
      Alarm: 0,
    }));

    allLogs.forEach((l) => {
      const d = new Date(l.createdAt || l.created_at);
      if (isNaN(d.getTime())) return;
      if (d.toISOString().slice(0, 10) !== todayStr) return;
      
      const h = d.getHours();
      if (l.status === "Opened" || l.status === "OPEN") counts[h].Opened++;
      else if (l.status === "Alarm") counts[h].Alarm++;
    });
    return counts;
  }, [allLogs]);

  const hasTodayData = todayData.some((h) => h.Opened > 0 || h.Alarm > 0);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className={`rounded-xl border p-5 flex items-center justify-between ${doorCardStyle.bg} ${doorCardStyle.border}`}>
          <div>
            <p className={`text-xs uppercase tracking-wider mb-1 font-bold ${doorCardStyle.label}`}>Door Status</p>
            <p className={`text-xl md:text-2xl font-black ${doorCardStyle.text}`}>{doorStatus ?? "Offline / Setup"}</p>
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

      {!doorStatus && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <span className="text-xl">💡</span>
          <div>
            <p className="text-sm font-bold text-amber-800">New Device? Setup Required</p>
            <p className="text-xs text-amber-700 mt-0.5">
              If your dashboard says "Offline", make sure you have entered your 
              <strong> Device Setup ID</strong> from your profile into the device's setup portal.
            </p>
          </div>
        </div>
      )}

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

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5">
        <p className="text-sm font-semibold text-gray-800 mb-1">Today's Activity</p>
        <p className="text-xs text-gray-400 mb-4">Door opens and alarms by hour</p>
        
        <div className="flex items-center gap-5 mb-4">
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-green-500" /><span className="text-xs font-medium text-gray-500">Opened</span></div>
          <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-red-500" /><span className="text-xs font-medium text-gray-500">Alarm</span></div>
        </div>

        {!hasTodayData ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-300 gap-2">
            <span className="text-4xl">📊</span><p className="text-sm">No activity recorded today</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={todayData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 9, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="Opened" fill={COLORS.open} radius={[4, 4, 0, 0]} />
              <Bar dataKey="Alarm" fill={COLORS.alarm} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
