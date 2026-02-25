import React, { useContext } from "react";
import { DoorContext } from "./DoorContext";

const Notifications = () => {
  const { emailEnabled, setEmailEnabled, logs } = useContext(DoorContext);

  // Build SMS history from logs
  const smsHistory = logs.map((log) => {
    let message = "";
    if (log.status === "Opened") message = `ALRT: Door opened at ${new Date(log.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
    else if (log.status === "Closed") message = `ALRT: Door closed at ${new Date(log.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}`;
    else if (log.status === "Alarm") message = `ALRT ALERT: Door opened during restricted hours at ${new Date(log.time).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}. Please check immediately.`;

    const event = log.status === "Alarm" ? "Alarm triggered" : `Door ${log.status.toLowerCase()}`;
    return { ...log, message, event };
  });

  return (
    <div className="p-6 space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">SMS Notifications</h2>
        <p className="text-sm text-gray-500">Automatic SMS alerts sent by the system</p>
      </div>

      {/* Only Total SMS Sent card */}
      <div className="grid grid-cols-1 max-w-xs">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
            <span>💬</span> Total SMS Sent
          </p>
          <p className="text-3xl font-bold text-blue-600">{emailEnabled ? smsHistory.length : 0}</p>
        </div>
      </div>

      {/* Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-800">SMS Notifications</p>
          <p className="text-xs text-gray-400 mt-0.5">Send SMS alerts via API</p>
        </div>
        <button
          onClick={() => setEmailEnabled(!emailEnabled)}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${emailEnabled ? "bg-blue-600" : "bg-gray-300"}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${emailEnabled ? "translate-x-8" : "translate-x-1"}`} />
        </button>
      </div>

      {/* SMS History Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <p className="font-semibold text-gray-800">SMS History</p>
          <p className="text-xs text-gray-400 mt-0.5">All automatically sent SMS notifications</p>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Date & Time</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Phone Number</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Event</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Message</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {!emailEnabled || smsHistory.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400 text-sm">
                  {emailEnabled ? "No SMS sent yet" : "SMS notifications are disabled"}
                </td>
              </tr>
            ) : (
              smsHistory.map((sms, i) => {
                const dateObj = new Date(sms.time);
                const date = dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
                const time = dateObj.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

                return (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-800">{date}</p>
                      <p className="text-xs text-gray-400">{time}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">+63 912 345 6789</td>
                    <td className="px-5 py-3.5 text-gray-600">{sms.event}</td>
                    <td className="px-5 py-3.5 text-gray-600 max-w-xs">{sms.message}</td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                        ✓ Sent
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Notifications;