import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DoorProvider } from "./pages/DoorContext";
import Sidebar from "./components/Sidebar";

import Login          from "./authentication/login";
import Signup         from "./authentication/signup";
import ForgotPassword from "./authentication/forgotPassword";
import Dashboard      from "./pages/Dashboard";
import ActivityLog    from "./pages/ActivityLog";
import AlarmSetting   from "./pages/AlarmSettings";
import Notifications  from "./pages/Notification";
import Profile        from "./components/Profile";
import AdminDashboard from "./admin_pages/adminDashboard";

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen text-slate-500">
      Loading...
    </div>
  );
  return user ? children : <Navigate to="/" />;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center h-screen text-slate-500">
      Loading...
    </div>
  );
  if (!user) return <Navigate to="/" />;
  if (user.role !== "admin") return <Navigate to="/dashboard" />;
  return children;
}

function Layout() {
  const location = useLocation();
  const authPages = ["/", "/signup", "/forgot"];
  const hideSidebar = authPages.includes(location.pathname);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {!hideSidebar && <Sidebar />}
      {/* ✅ no padding on auth pages */}
      <main className={`flex-1 overflow-auto ${hideSidebar ? "" : "p-6"}`}>
        <Routes>
          {/* Public */}
          <Route path="/"       element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot" element={<ForgotPassword />} />

          {/* Protected */}
          <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/logs"          element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
          <Route path="/alarm"         element={<ProtectedRoute><AlarmSetting /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Admin only */}
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <DoorProvider>
        <Router>
          <Layout />
        </Router>
      </DoorProvider>
    </AuthProvider>
  );
}