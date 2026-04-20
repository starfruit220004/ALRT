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

  // ✅ FIX: Auth/landing/admin pages don't need the DoorProvider at all.
  //         Render them outside it to avoid unnecessary socket connections
  //         and API calls when the user is unauthenticated.
  if (isAuthPage || isLanding) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/"               element={<LandingPage />} />
            <Route path="/login"          element={<Login />} />
            <Route path="/signup"         element={<Signup />} />
            <Route path="/forgot"         element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email"   element={<VerifyEmail />} />
            <Route path="*"               element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  if (isAdminPage) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="*"      element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    );
  }

  // ✅ FIX: DoorProvider now wraps Sidebar, main content, AND Profile so all
  //         three can safely consume DoorContext without getting undefined.
  return (
    <DoorProvider>
      <div className="min-h-screen bg-gray-50 flex">
        {showSidebar && <Sidebar onProfileClick={() => setShowProfile(true)} />}

        <main className="flex-1 overflow-auto md:p-6">
          <Routes>
            <Route path="/dashboard"     element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/logs"          element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
            <Route path="/alarm"         element={<ProtectedRoute><AlarmSetting /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/reports"       element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="*"              element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        {/* ✅ FIX: Profile is now inside DoorProvider so it can use DoorContext */}
        {showProfile && <Profile onClose={() => setShowProfile(false)} />}
      </div>
    </DoorProvider>
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