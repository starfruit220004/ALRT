import { useEffect, useState } from "react";

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [editingUser, setEditingUser] = useState(null); // user being edited
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  useEffect(() => {
    loadUsers();
    loadAlerts();
  }, []);

  const loadUsers = async () => {
    const res = await fetch("http://localhost:5000/api/admin/users", { headers });
    const data = await res.json();
    setUsers(Array.isArray(data) ? data : []);
  };

  const loadAlerts = async () => {
    const res = await fetch("http://localhost:5000/api/admin/alerts", { headers });
    const data = await res.json();
    setAlerts(Array.isArray(data) ? data : []);
  };

  const notify = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 3000);
  };

  // ── CREATE ──
  const handleAdd = async () => {
    if (!form.name || !form.email || !form.password)
      return notify("❌ Please fill all fields");

    const res = await fetch("http://localhost:5000/api/admin/users", {
      method: "POST",
      headers,
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (!res.ok) return notify(`❌ ${data.message}`);

    notify("✅ User created!");
    setForm({ name: "", email: "", password: "", role: "user" });
    setShowAddForm(false);
    loadUsers();
  };

  // ── UPDATE ──
  const handleUpdate = async () => {
    const res = await fetch(`http://localhost:5000/api/admin/users/${editingUser.id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(editingUser)
    });
    const data = await res.json();
    if (!res.ok) return notify(`❌ ${data.message}`);

    notify("✅ User updated!");
    setEditingUser(null);
    loadUsers();
  };

  // ── DELETE ──
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    const res = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
      method: "DELETE",
      headers
    });
    const data = await res.json();
    if (!res.ok) return notify(`❌ ${data.message}`);

    notify("✅ User deleted!");
    loadUsers();
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* TOAST MESSAGE */}
      {message && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-300 rounded text-blue-800">
          {message}
        </div>
      )}

      {/* ── USERS TABLE ── */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-lg">Users</h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          >
            {showAddForm ? "Cancel" : "+ Add User"}
          </button>
        </div>

        {/* ADD FORM */}
        {showAddForm && (
          <div className="border p-4 rounded mb-4 bg-gray-50 grid grid-cols-2 gap-3">
            <input className="border p-2 rounded" placeholder="Name"
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <input className="border p-2 rounded" placeholder="Email"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            <input className="border p-2 rounded" placeholder="Password" type="password"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
            <select className="border p-2 rounded"
              value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={handleAdd}
              className="col-span-2 bg-green-600 text-white p-2 rounded hover:bg-green-700">
              Create User
            </button>
          </div>
        )}

        {/* USERS LIST */}
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-2">Name</th>
              <th className="p-2">Email</th>
              <th className="p-2">Role</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b hover:bg-gray-50">
                {editingUser?.id === u.id ? (
                  <>
                    <td className="p-2">
                      <input className="border p-1 rounded w-full"
                        value={editingUser.name}
                        onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} />
                    </td>
                    <td className="p-2">
                      <input className="border p-1 rounded w-full"
                        value={editingUser.email}
                        onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
                    </td>
                    <td className="p-2">
                      <select className="border p-1 rounded"
                        value={editingUser.role}
                        onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="p-2 flex gap-2">
                      <button onClick={handleUpdate}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600">
                        Save
                      </button>
                      <button onClick={() => setEditingUser(null)}
                        className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500">
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2">{u.name}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-2 flex gap-2">
                      <button onClick={() => setEditingUser(u)}
                        className="bg-yellow-400 text-white px-3 py-1 rounded hover:bg-yellow-500">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(u.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600">
                        Delete
                      </button>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── ALERTS ── */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-bold text-lg mb-3">Alerts / Door Logs</h2>
        {alerts.map(a => (
          <div key={a.id} className="border p-2 mb-2 rounded flex justify-between">
            <span>🚨 {a.status}</span>
            <small className="text-gray-500">{new Date(a.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}