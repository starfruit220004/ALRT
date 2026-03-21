import { useEffect, useState, useCallback, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { User, LogOut, MoreVertical, Pencil, UserX, UserCheck, AlertTriangle } from "lucide-react";
import UserSearchFilter from "../components/UserSearchFilter";
import AddUserModal from "./addUserModal";
import Profile from "../components/Profile";
import HomeCms     from "./HomeCms";
import ServicesCms from "./ServicesCms";
import AboutCms    from "./AboutCms";
import ContactCms  from "./ContactCms";

// ── CMS tabs ──────────────────────────────────────────────
const CMS_TABS = [
  { key: "home",     label: "🏠 Home" },
  { key: "services", label: "⚡ Services" },
  { key: "about",    label: "📖 About" },
  { key: "contact",  label: "📬 Contact" },
];

// ── Styled Confirmation Modal ─────────────────────────────
function ConfirmModal({ isOpen, onConfirm, onCancel, userName }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Dialog */}
      <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-sm mx-4 p-6 flex flex-col items-center gap-4 animate-modal-in">
        {/* Warning icon */}
        <div className="w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertTriangle size={28} className="text-red-500" />
        </div>

        {/* Text */}
        <div className="text-center space-y-1.5">
          <h3 className="text-base font-bold text-gray-800">Deactivate Account</h3>
          <p className="text-sm text-gray-500">
            You are about to deactivate{" "}
            <span className="font-semibold text-gray-700">{userName}</span>.
          </p>
          <p className="text-xs text-gray-400 leading-relaxed">
            They won't be able to log in until reactivated. Accounts inactive
            for <span className="font-medium text-gray-500">1 year</span> are
            automatically deleted.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 w-full pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            Deactivate
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 3-dot context menu ────────────────────────────────────
function ActionMenu({ user: u, onEdit, onToggleActive }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Actions"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 z-50 py-1 animate-fade-in">
          {/* Edit */}
          <button
            onClick={() => { onEdit(); setOpen(false); }}
            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil size={14} className="text-amber-500" />
            Edit User
          </button>

          <div className="my-1 border-t border-gray-100" />

          {/* Deactivate / Activate toggle */}
          {u.is_active !== false ? (
            <button
              onClick={() => { onToggleActive(false); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <UserX size={14} />
              Deactivate Account
            </button>
          ) : (
            <button
              onClick={() => { onToggleActive(true); setOpen(false); }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
            >
              <UserCheck size={14} />
              Activate Account
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────
export default function AdminDashboard() {
  const [users, setUsers]               = useState([]);
  const [editingUser, setEditingUser]   = useState(null);
  const [showAddForm, setShowAddForm]   = useState(false);
  const [showProfile, setShowProfile]   = useState(false);
  const [message, setMessage]           = useState("");
  const [copiedId, setCopiedId]         = useState(null);
  const [search, setSearch]             = useState("");
  const [roleFilter, setRoleFilter]     = useState("all");
  const [activeSection, setActiveSection] = useState("users");

  // ── Confirm modal state ───────────────────────────────
  const [confirmModal, setConfirmModal] = useState({
    isOpen:   false,
    userId:   null,
    userName: "",
  });

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
      const res = await fetch("http://localhost:5000/api/admin/users", { headers: getHeaders() });
      if (!res.ok) return notify(`❌ Failed to load users (${res.status})`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      notify("❌ Network error loading users");
    }
  }, [getHeaders]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ── Save edited user ──────────────────────────────────
  const handleUpdate = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/users/${editingUser.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify(editingUser),
      });
      const data = await res.json();
      if (!res.ok) return notify(`❌ ${data.message}`);
      notify("✅ User updated!");
      setEditingUser(null);
      loadUsers();
    } catch {
      notify("❌ Network error updating user");
    }
  };

  // ── Called by ActionMenu — opens modal for deactivate, fires directly for activate
  const handleToggleActive = (userId, activate, userName) => {
    if (!activate) {
      // Show styled confirm modal instead of window.confirm
      setConfirmModal({ isOpen: true, userId, userName });
    } else {
      executeToggle(userId, true);
    }
  };

  // ── Actually call the API ─────────────────────────────
  const executeToggle = async (userId, activate) => {
    try {
      const action = activate ? "activate" : "deactivate";
      const res = await fetch(`http://localhost:5000/api/admin/users/${userId}/${action}`, {
        method: "PATCH",
        headers: getHeaders(),
      });
      const data = await res.json();
      if (!res.ok) return notify(`❌ ${data.message}`);
      notify(activate ? "✅ Account activated!" : "✅ Account deactivated.");
      loadUsers();
    } catch {
      notify("❌ Network error toggling account status");
    }
  };

  // ── Modal confirm / cancel handlers ──────────────────
  const handleConfirmDeactivate = () => {
    executeToggle(confirmModal.userId, false);
    setConfirmModal({ isOpen: false, userId: null, userName: "" });
  };

  const handleCancelDeactivate = () => {
    setConfirmModal({ isOpen: false, userId: null, userName: "" });
  };

  const handleCopyTopic = (topic, id) => {
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

      {/* Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fadeIn 0.12s ease-out; }

        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-modal-in { animation: modalIn 0.18s ease-out; }
      `}</style>

      {/* Styled confirm modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        userName={confirmModal.userName}
        onConfirm={handleConfirmDeactivate}
        onCancel={handleCancelDeactivate}
      />

      <AddUserModal
        isOpen={showAddForm}
        onClose={() => setShowAddForm(false)}
        getHeaders={getHeaders}
        onSuccess={(msg) => { notify(msg); loadUsers(); }}
      />

      {showProfile && <Profile onClose={() => setShowProfile(false)} />}

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Panel</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage users and monitor all door activity</p>
        </div>

        <div
          onClick={() => setShowProfile(true)}
          className="flex flex-col items-center gap-1 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center overflow-hidden ring-2 ring-blue-400 ring-offset-2 ring-offset-gray-50 group-hover:ring-blue-500 transition-all shrink-0">
            {user?.avatar
              ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
              : <User size={20} className="text-white" />
            }
          </div>
          <p className="text-xs font-semibold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">
            {user?.name || "Admin"}
          </p>
          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white uppercase tracking-wide">
            Admin
          </span>
        </div>
      </div>

      {/* ── Toast message ── */}
      {message && (
        <div className={`p-3.5 rounded-xl border text-sm font-medium ${
          message.startsWith("✅")
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-600"
        }`}>
          {message}
        </div>
      )}

      {/* ── Stats cards ── */}
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
            <p className="text-3xl font-bold text-purple-700">
              {users.filter(u => u.role === "admin").length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Admin accounts</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center">
            <span className="text-2xl">🛡️</span>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Users</p>
            <p className="text-3xl font-bold text-blue-600">
              {users.filter(u => u.role === "user").length}
            </p>
            <p className="text-xs text-gray-400 mt-1">Regular user accounts</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <span className="text-2xl">👤</span>
          </div>
        </div>
      </div>

      {/* ── Section tabs ── */}
      <div className="flex gap-1 flex-wrap border-b border-gray-200">
        <button
          onClick={() => setActiveSection("users")}
          className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
            activeSection === "users"
              ? "border-blue-600 text-blue-600 bg-blue-50"
              : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
          }`}
        >
          👥 Users
        </button>
        {CMS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 -mb-px ${
              activeSection === key
                ? "border-blue-600 text-blue-600 bg-blue-50"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Users table ── */}
      {activeSection === "users" && (
        <div
          className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col"
          style={{ maxHeight: "420px" }}
        >
          <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold text-gray-800">Users</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {filteredUsers.length} of {users.length} account{users.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              + Add User
            </button>
          </div>

          <UserSearchFilter
            search={search}
            setSearch={setSearch}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
          />

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
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">MQTT Topic</th>
                    <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr
                      key={u.id}
                      className={`border-b border-gray-50 transition-colors ${
                        u.is_active === false
                          ? "bg-gray-50/60 opacity-70"
                          : "hover:bg-gray-50/80"
                      }`}
                    >
                      {editingUser?.id === u.id ? (
                        <>
                          <td className="px-5 py-3">
                            <input
                              className="border border-gray-200 p-1.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                              value={editingUser.name}
                              onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                            />
                          </td>
                          <td className="px-5 py-3">
                            <input
                              className="border border-gray-200 p-1.5 rounded-lg w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                              value={editingUser.email}
                              onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                            />
                          </td>
                          <td className="px-5 py-3">
                            <select
                              className="border border-gray-200 p-1.5 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-300"
                              value={editingUser.role}
                              onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                            >
                              <option value="user">User</option>
                              <option value="admin">Admin</option>
                            </select>
                          </td>
                          <td className="px-5 py-3" />
                          <td className="px-5 py-3 text-xs text-gray-400 font-mono">{u.mqtt_topic || "—"}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={handleUpdate}
                                className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-600 transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingUser(null)}
                                className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-5 py-3.5 font-medium text-gray-800">{u.name}</td>
                          <td className="px-5 py-3.5 text-gray-500">{u.email}</td>

                          {/* Role badge */}
                          <td className="px-5 py-3.5">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                              u.role === "admin"
                                ? "bg-purple-50 text-purple-700 border-purple-200"
                                : "bg-blue-50 text-blue-700 border-blue-200"
                            }`}>
                              {u.role === "admin" ? "🛡 Admin" : "👤 User"}
                            </span>
                          </td>

                          {/* Active / Inactive badge */}
                          <td className="px-5 py-3.5">
                            {u.is_active === false ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-red-50 text-red-600 border-red-200">
                                ⛔ Inactive
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-green-50 text-green-700 border-green-200">
                                ✅ Active
                              </span>
                            )}
                          </td>

                          {/* MQTT topic */}
                          <td className="px-5 py-3.5">
                            {u.mqtt_topic ? (
                              <div className="flex items-center gap-1.5">
                                <code className="text-xs text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-100 truncate max-w-40">
                                  {u.mqtt_topic}
                                </code>
                                <button
                                  onClick={() => handleCopyTopic(u.mqtt_topic, u.id)}
                                  className="text-xs text-gray-400 hover:text-blue-600 transition-colors shrink-0"
                                >
                                  {copiedId === u.id ? "✅" : "📋"}
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>

                          {/* 3-dot menu */}
                          <td className="px-5 py-3.5 text-right">
                            <ActionMenu
                              user={u}
                              onEdit={() => setEditingUser(u)}
                              onToggleActive={(activate) =>
                                handleToggleActive(u.id, activate, u.name)
                              }
                            />
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
      )}

      {/* ── CMS sections ── */}
      {activeSection === "home"     && <HomeCms     getHeaders={getHeaders} notify={notify} />}
      {activeSection === "services" && <ServicesCms getHeaders={getHeaders} notify={notify} />}
      {activeSection === "about"    && <AboutCms    getHeaders={getHeaders} notify={notify} />}
      {activeSection === "contact"  && <ContactCms  getHeaders={getHeaders} notify={notify} />}

      {/* ── Logout ── */}
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