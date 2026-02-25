import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import NavBar from "./components/Navbar";

// Auth Pages
import Login from "./authentication/login";
import Signup from "./authentication/signup";
import ForgotPassword from "./authentication/forgotPassword";
import { DoorProvider } from "./pages/DoorContext";

// System Pages
import Dashboard from "./pages/Dashboard";
import ActivityLog from "./pages/ActivityLog";
import AlarmSetting from "./pages/AlarmSettings";
import Notifications from "./pages/Notification";

// Admin
import AdminDashboard from "./admin_pages/adminDashboard";

// Protected Route
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" />;
}

// Layout — controls NavBar visibility
function Layout() {
  const location = useLocation();

  // Auth pages where NavBar should be HIDDEN
  const authPages = ["/", "/signup", "/forgot"];
  const hideNav = authPages.includes(location.pathname);

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col">

      {/* NavBar only shows when logged in */}
      {!hideNav && <NavBar />}

      <main className="flex-1 p-6">
        <Routes>
          {/* Public Routes - no token needed */}
          <Route path="/" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot" element={<ForgotPassword />} />

          {/* Protected Routes - token required */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/logs" element={<ProtectedRoute><ActivityLog /></ProtectedRoute>} />
          <Route path="/alarm" element={<ProtectedRoute><AlarmSetting /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </main>

    </div>
  );
}

function App() {
  return (
    <DoorProvider>
      <Router>
        <Layout />  {/* Layout must be INSIDE Router so useLocation works */}
      </Router>
    </DoorProvider>
  );
}

export default App;