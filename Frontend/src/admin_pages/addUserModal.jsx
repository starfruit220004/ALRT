import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EMPTY = {
  firstName:  "",
  lastName:   "",
  middleName: "",
  username:   "",
  email:      "",
  password:   "",
  phone:      "",
  address:    "",
};

export default function AddUserModal({ isOpen, onClose, getHeaders, onSuccess }) {
  const [form, setForm]       = useState(EMPTY);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors]   = useState({});
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim())  e.lastName  = "Required";
    if (!form.username.trim())  e.username  = "Required";
    if (!form.email.trim())     e.email     = "Required";
    if (!form.password.trim())  e.password  = "Required";
    if (!form.phone.trim())     e.phone     = "Required";
    if (!form.address.trim())   e.address   = "Required";
    return e;
  };

  const notify = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const handleAdd = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    try {
      const name = `${form.firstName} ${form.lastName}`.trim();
      const res = await fetch(`${BASE}/api/admin/users`, {
        method:  "POST",
        headers: getHeaders(),
        body:    JSON.stringify({ ...form, name, role: "user" }),
      });
      const data = await res.json();
      if (!res.ok) { notify(`❌ ${data.message}`); return; }
      onSuccess("✅ User created!");
      setForm(EMPTY);
      setErrors({});
      onClose();
    } catch {
      notify("❌ Network error. Please try again.");
    }
  };

  const ic = (field) =>
    `border p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-full ${
      errors[field] ? "border-red-300" : "border-gray-200"
    }`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Add new user</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>
        {message && (
          <div className={`mx-5 mt-4 p-3 rounded-lg border text-sm font-medium ${
            message.startsWith("✅")
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-600"
          }`}>
            {message}
          </div>
        )}
        <div className="p-5 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">First name</label>
            <input className={ic("firstName")} placeholder="Juan" value={form.firstName} onChange={set("firstName")} />
            {errors.firstName && <span className="text-xs text-red-500">{errors.firstName}</span>}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Last name</label>
            <input className={ic("lastName")} placeholder="Dela Cruz" value={form.lastName} onChange={set("lastName")} />
            {errors.lastName && <span className="text-xs text-red-500">{errors.lastName}</span>}
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Middle name <span className="text-gray-400">(optional)</span></label>
            <input className="border border-gray-200 p-2.5 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 w-full" placeholder="Santos" value={form.middleName} onChange={set("middleName")} />
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Username</label>
            <input className={ic("username")} placeholder="juandelacruz" value={form.username} onChange={set("username")} />
            {errors.username && <span className="text-xs text-red-500">{errors.username}</span>}
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Email</label>
            <input className={ic("email")} placeholder="you@example.com" value={form.email} onChange={set("email")} />
            {errors.email && <span className="text-xs text-red-500">{errors.email}</span>}
          </div>
          <div className="col-span-2">
            <label className="block text-xs text-gray-500 mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                className={`${ic("password")} pr-10`}
                placeholder="••••••••" 
                value={form.password} 
                onChange={set("password")} 
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <span className="text-xs text-red-500">{errors.password}</span>}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Phone number</label>
            <input className={ic("phone")} placeholder="+639XXXXXXXXX" value={form.phone} onChange={set("phone")} />
            {errors.phone && <span className="text-xs text-red-500">{errors.phone}</span>}
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Address</label>
            <input className={ic("address")} placeholder="123 Rizal St" value={form.address} onChange={set("address")} />
            {errors.address && <span className="text-xs text-red-500">{errors.address}</span>}
          </div>
          <button onClick={handleAdd} className="col-span-2 bg-blue-600 text-white p-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors mt-1">
            Create user
          </button>
        </div>
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-xs text-gray-400">Role is always set to <span className="font-medium text-gray-500">user</span> — only one admin account is permitted.</p>
        </div>
      </div>
    </div>
  );
}