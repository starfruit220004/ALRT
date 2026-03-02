import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import UserSearchFilter from "../components/UserSearchFilter";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [message, setMessage] = useState("");
  const [copiedId, setCopiedId] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/"); };

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${localStorage.getItem("token")}`
  }), []);

  const notify = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  const loadUsers = useCallback(async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/users", { headers: getHeaders() });
      if (!res.ok) return notify(`❌ Failed to load users (${res.status})`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch { notify("❌ Network error loading users"); }
  }, [getHeaders]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password) return notify("❌ Please fill all fields");
    const res = await fetch("http://localhost:5000/api/admin/users", {
      method: "POST", headers: getHeaders(), body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) return notify(`❌ ${data.message}`);
    notify("✅ User created!");
    setForm({ name: "", email: "", password: "", role: "user" });
    setShowAddForm(false);
    loadUsers();
  };

  const handleUpdate = async () => {
    const res = await fetch(`http://localhost:5000/api/admin/users/${editingUser.id}`, {
      method: "PUT", headers: getHeaders(), body: JSON.stringify(editingUser)
    });
    const data = await res.json();
    if (!res.ok) return notify(`❌ ${data.message}`);
    notify("✅ User updated!");
    setEditingUser(null);
    loadUsers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
      method: "DELETE", headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) return notify(`❌ ${data.message}`);
    notify("✅ User deleted!");
    loadUsers();
  };

  const handleCopyTopic = (topic, id) => {
    navigator.clipboard.writeText(topic);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredUsers = users.filter(u => {
    const matchesRole   = roleFilter === "all" || u.role === roleFilter;
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
                          u.email?.toLowerCase().includes(search.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="p-6 bg-gray-50 min-h-screen space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage users and monitor all door activity</p>
        </div>

        {/* Profile */}
        <div onClick={() => navigate('/admin/profile')} className="flex flex-col items-center gap-1 cursor-pointer group">
          <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-50 group-hover:ring-blue-500 transition-all shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              : <User size={20} className="text-white" />
            }
          </div>
          <p className="text-xs font-semibold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">{user?.name || "Admin"}</p>
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wide">
            Admin
          </span>
        </div>
      </div>

      {message && (
        <div className={`p-3.5 rounded-xl border text-sm font-medium ${
          message.startsWith("✅") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-600"
        }`}>{message}</div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">All Users</p>
            <p className="text-3xl font-bold text-gray-800">{users.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total registered accounts</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <span className="text-2xl">👥</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Admins</p>
            <p className="text-3xl font-bold text-purple-700">{users.filter(u => u.role === 'admin').length}</p>
            <p className="text-xs text-gray-400 mt-1">Admin accounts</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
            <span className="text-2xl">🛡️</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Users</p>
            <p className="text-3xl font-bold text-blue-600">{users.filter(u => u.role === 'user').length}</p>
            <p className="text-xs text-gray-400 mt-1">Regular user accounts</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
        </div>
      </div>

      {/* Users table — fixed height with internal scroll */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: '420px' }}>
        <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-800">Users</h2>
            <p className="text-xs text-gray-400 mt-0.5">{filteredUsers.length} of {users.length} account{users.length !== 1 ? "s" : ""}</p>
          </div>
          <button onClick={() => setShowAddForm(!showAddForm)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${showAddForm ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-blue-600 text-white hover:bg-blue-700"}`}>
            {showAddForm ? "✕ Cancel" : "+ Add User"}
          </button>
        </div>

        {/* Search + Filter */}
        <UserSearchFilter
          search={search}
          setSearch={setSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
        />

        {showAddForm && (
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
        )}

        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-gray-400 gap-2">
            <span className="text-3xl">👥</span>
            <p className="text-sm">No users found.</p>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-100 text-left">
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Name</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">MQTT Topic</th>
                <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/80 transition-colors">
                  {editingUser?.id === u.id ? (
                    <>
                      <td className="px-5 py-3">
                        <input className="border border-gray-200 p-1.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} />
                      </td>
                      <td className="px-5 py-3">
                        <input className="border border-gray-200 p-1.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                          value={editingUser.email} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
                      </td>
                      <td className="px-5 py-3">
                        <select className="border border-gray-200 p-1.5 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                          value={editingUser.role} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-400 font-mono">{u.mqtt_topic || '—'}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-2">
                          <button onClick={handleUpdate} className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-600 transition-colors">Save</button>
                          <button onClick={() => setEditingUser(null)} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-5 py-3.5 font-medium text-gray-800">{u.name}</td>
                      <td className="px-5 py-3.5 text-gray-500">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                          {u.role === 'admin' ? '🛡 Admin' : '👤 User'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.mqtt_topic ? (
                          <div className="flex items-center gap-1.5">
                            <code className="text-xs text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100 truncate max-w-[160px]">{u.mqtt_topic}</code>
                            <button onClick={() => handleCopyTopic(u.mqtt_topic, u.id)}
                              className="text-xs text-gray-400 hover:text-blue-600 transition-colors shrink-0">
                              {copiedId === u.id ? '✅' : '📋'}
                            </button>
                          </div>
                        ) : <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex gap-2">
                          <button onClick={() => setEditingUser(u)} className="bg-amber-400 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-500 transition-colors">Edit</button>
                          <button onClick={() => handleDelete(u.id)} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-600 transition-colors">Delete</button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {/* Logout — sits naturally at the bottom of the page */}
      <div className="flex justify-end">
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white border border-gray-200 shadow-sm text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-colors"
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>

    </div>
  );
}