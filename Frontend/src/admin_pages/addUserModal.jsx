import { useState } from "react";
import { X } from "lucide-react";

export default function AddUserModal({ isOpen, onClose, getHeaders, onSuccess }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const notify = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // exact same handleAdd from AdminDashboard, untouched
  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) return notify("❌ Please fill all fields");
    const res = await fetch("http://localhost:5000/api/admin/users", {
      method: "POST", headers: getHeaders(), body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) return notify(`❌ ${data.message}`);
    onSuccess("✅ User created!");
    setForm({ name: "", email: "", password: "", role: "user" });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Add New User</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {message && (
          <div className={`mx-5 mt-4 p-3 rounded-lg border text-sm font-medium ${
            message.startsWith("✅") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"
          }`}>{message}</div>
        )}

        {/* exact same form fields and styles from the original showAddForm block */}
        <div className="border-b border-gray-100 p-5 bg-gray-50 grid grid-cols-2 gap-3">
          <input className="border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Full Name"
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
          <input className="border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Email address"
            value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <input className="border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300" placeholder="Password" type="password"
            value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
          <select className="border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white"
            value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button onClick={handleAdd} className="col-span-2 bg-green-600 text-white p-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
            Create User
          </button>
        </div>

      </div>
    </div>
  );
}