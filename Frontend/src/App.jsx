import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DoorProvider } from "./pages/DoorContext";
import Sidebar from "./components/Sidebar";

import Login          from "./authentication/login";
import Signup         from "./authentication/signup";
import ForgotPassword from "./authentication/forgotPassword";
import Dashboard      from "./pages/Dashboard";
import ActivityLog    from "./pages/ActivityLog";
import Notifications  from "./pages/Notification";
import Profile        from "./components/Profile";
import AdminDashboard from "./admin_pages/adminDashboard";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  return <DoorProvider>{children}</DoorProvider>;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/" />;
  if (user.role !== "admin") return <Navigate to="/dashboard" />;
  return <DoorProvider>{children}</DoorProvider>;
}

function Layout() {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar onProfileClick={() => setShowProfile(true)} />
      <main className="flex-1 overflow-auto">
        <Routes>
          <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/logs"          element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        </Routes>
      </main>

      {showProfile && <Profile onClose={() => setShowProfile(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/"       element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route path="/admin"  element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/*"      element={<Layout />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}