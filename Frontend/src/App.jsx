// src/App.jsx
import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { DoorProvider } from "./pages/DoorContext";
import Sidebar from "./components/Sidebar";

// Auth
import Login          from "./authentication/login";
import Signup         from "./authentication/signup";
import ForgotPassword from "./authentication/forgotPassword";
import ResetPassword  from "./authentication/resetPassword";
import VerifyEmail    from "./authentication/VerifyEmail";

// Pages
import Dashboard      from "./pages/Dashboard";
import ActivityLog    from "./pages/ActivityLog";
import AlarmSetting   from "./pages/AlarmSettings";
import Notifications  from "./pages/Notification";
import Reports        from "./pages/Reports";
import Profile        from "./components/Profile";
import AdminDashboard from "./admin_pages/adminDashboard";

// Landing Page
import Navbar    from "./Landing Page/navbar";
import Home      from "./Landing Page/home";
import Services  from "./Landing Page/services";
import About     from "./Landing Page/about";
import Contact   from "./Landing Page/contact";

function LandingPage() {
  return (
    <>
      <Navbar />
      <Home />
      <Services />
      <About />
      <Contact />
      <footer className="bg-[#060f1e] border-t border-white/[0.06] py-6 text-center">
        <p className="text-slate-600 text-xs">© 2024 Smart Alert — IoT Safety Monitoring System</p>
      </footer>
    </>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen text-slate-500">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;
  return children;
}

function Layout() {
  const location = useLocation();
  const [showProfile, setShowProfile] = useState(false);

  const isAuthPage  = ["/login", "/signup", "/forgot", "/reset-password", "/verify-email"].includes(location.pathname);
  const isAdminPage = location.pathname.startsWith("/admin");
  const isLanding   = location.pathname === "/";
  const showSidebar = !isAuthPage && !isAdminPage && !isLanding;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {showSidebar && <Sidebar onProfileClick={() => setShowProfile(true)} />}

      <DoorProvider>
        <main className={`flex-1 overflow-auto ${showSidebar ? "md:p-6" : ""}`}>
          <Routes>
            {/* Landing */}
            <Route path="/"                element={<LandingPage />} />

            {/* Auth */}
            <Route path="/login"           element={<Login />} />
            <Route path="/signup"          element={<Signup />} />
            <Route path="/forgot"          element={<ForgotPassword />} />
            <Route path="/reset-password"  element={<ResetPassword />} />
            <Route path="/verify-email"    element={<VerifyEmail />} />

            {/* User routes */}
            <Route path="/dashboard"       element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/logs"            element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
            <Route path="/alarm"           element={<ProtectedRoute><AlarmSetting /></ProtectedRoute>} />
            <Route path="/notifications"   element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/reports"         element={<ProtectedRoute><Reports /></ProtectedRoute>} />

            {/* Admin route */}
            <Route path="/admin"           element={<AdminRoute><AdminDashboard /></AdminRoute>} />

            {/* Catch-all */}
            <Route path="*"                element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </DoorProvider>

      {showProfile && <Profile onClose={() => setShowProfile(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Layout />
      </Router>
    </AuthProvider>
  );
}