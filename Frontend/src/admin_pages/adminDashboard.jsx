import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, LogOut, Shield, User as UserIcon, Copy, Check, Power, PowerOff } from "lucide-react";
import UserSearchFilter from "../components/UserSearchFilter";
import AddUserModal from "./addUserModal";
import Profile from "../components/Profile";
import HomeCms     from "./HomeCms";
import ServicesCms from "./ServicesCms";
import AboutCms    from "./AboutCms";
import ContactCms  from "./ContactCms";

const CMS_TABS = [
  { key: "home",     label: "🏠 Home" },
  { key: "services", label: "⚡ Services" },
  { key: "about",    label: "📖 About" },
  { key: "contact",  label: "📬 Contact" },
];

export default function AdminDashboard() {
  const [users, setUsers]               = useState([]);
  const [showAddForm, setShowAddForm]   = useState(false);
  const [showProfile, setShowProfile]   = useState(false);
  const [message, setMessage]           = useState("");
  const [copiedId, setCopiedId]         = useState(null);
  const [search, setSearch]             = useState("");
  const [roleFilter, setRoleFilter]     = useState("all");
  const [activeSection, setActiveSection] = useState("users");

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  }), []);

  const notify = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const loadUsers = useCallback(async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/admin/users`, { headers: getHeaders() });
      if (!res.ok) return notify(`❌ Failed to load users`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      notify("❌ Network error loading users");
    }
  }, [getHeaders]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Optimized Toggle Logic ─────────────────────────────
  const handleToggleStatus = async (userId, currentIsActive) => {
    // Dynamically pick the route based on current state
    const action = currentIsActive ? "deactivate" : "activate";
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const res = await fetch(`${apiUrl}/api/admin/users/${userId}/${action}`, {
        method: "PATCH",
        headers: getHeaders(),
      });
      
      if (res.ok) {
        notify(currentIsActive ? "⚠️ Account Deactivated" : "✅ Account Activated");
        loadUsers(); 
      } else {
        const errorData = await res.json();
        notify(`❌ ${errorData.message || "Action failed"}`);
      }
    } catch {
      notify("❌ Server connection error");
    }
  };

  const handleCopyTopic = (topic, id) => {
    if (!topic) return;
    navigator.clipboard.writeText(topic);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUsers = users.filter(u => {
    const matchesRole   = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch =
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">
      <AddUserModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        getHeaders={getHeaders}
        onSuccess={(msg) => { notify(msg); loadUsers(); }}
      />

      {showProfile && <Profile onClose={() => setShowProfile(false)} />}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Control Center</h1>
          <p className="text-sm text-gray-500">Security Management & User Status</p>
        </div>

        <div onClick={() => setShowProfile(true)} className="flex flex-col items-center gap-1 cursor-pointer group">
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center ring-2 ring-slate-200 ring-offset-2">
            {user?.avatar ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" /> : <User size={18} className="text-white" />}
          </div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user?.name || "Admin"}</p>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="fixed top-6 right-6 z-50 p-4 rounded-lg border shadow-xl bg-white border-gray-100 animate-in fade-in slide-in-from-top-4">
          <span className="text-sm font-bold text-gray-800">{message}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button onClick={() => setActiveSection("users")} className={`px-6 py-3 text-xs font-bold transition-all border-b-2 ${activeSection === "users" ? "border-slate-900 text-slate-900 bg-slate-50" : "border-transparent text-gray-400"}`}>
          👥 Directory
        </button>
        {CMS_TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setActiveSection(key)} className={`px-6 py-3 text-xs font-bold transition-all border-b-2 ${activeSection === key ? "border-slate-900 text-slate-900 bg-slate-50" : "border-transparent text-gray-400"}`}>
            {label}
          </button>
        ))}
      </div>

      {activeSection === "users" && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-center px-5 py-4 border-b border-gray-100 gap-4">
            <UserSearchFilter search={search} setSearch={setSearch} roleFilter={roleFilter} setRoleFilter={setRoleFilter} />
            <button onClick={() => setShowAddForm(true)} className="w-full md:w-auto bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 transition-all active:scale-95">
              + Register User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/50 text-gray-400 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">Identity</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-center">Account Control</th>
                  <th className="px-6 py-4">MQTT Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map(u => (
                  <tr key={u.id} className={`hover:bg-gray-50/30 transition-colors ${!u.isActive ? 'opacity-60 bg-gray-50/50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-800">{u.name}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-700'}`}>
                        {u.role === 'admin' ? <Shield size={10}/> : <UserIcon size={10}/>} {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={() => handleToggleStatus(u.id, u.isActive)}
                        className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all shadow-sm border ${
                          u.isActive 
                            ? 'bg-white text-emerald-600 border-emerald-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100' 
                            : 'bg-white text-red-500 border-red-100 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-100'
                        }`}
                      >
                        {u.isActive ? <Power size={12}/> : <PowerOff size={12}/>}
                        {u.isActive ? 'Active' : 'Deactivated'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="bg-slate-50 text-slate-600 px-2.5 py-1 rounded text-xs font-mono border border-slate-200 uppercase">
                          {u.mqttTopic || "Unassigned"}
                        </code>
                        {u.mqttTopic && (
                          <button onClick={() => handleCopyTopic(u.mqttTopic, u.id)} className="text-gray-300 hover:text-slate-900 transition-colors">
                            {copiedId === u.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CMS Sections */}
      {activeSection === "home" && <HomeCms getHeaders={getHeaders} notify={notify} />}
      {activeSection === "services" && <ServicesCms getHeaders={getHeaders} notify={notify} />}
      {activeSection === "about" && <AboutCms getHeaders={getHeaders} notify={notify} />}
      {activeSection === "contact" && <ContactCms getHeaders={getHeaders} notify={notify} />}

      <div className="flex justify-end pt-4">
        <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors">
          <LogOut size={14} /> Log Out
        </button>
      </div>
    </div>
  );
}

