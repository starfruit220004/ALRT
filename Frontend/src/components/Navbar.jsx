import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Activity Log", path: "/logs" },
  { label: "Alarm Setting", path: "/alarm" },
  { label: "Notifications", path: "/notifications" },
];

function NavBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="flex gap-2 bg-blue-800 px-6 py-3">
      {navItems.map(({ label, path }) => {
        const isActive = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
              isActive
                ? "bg-white text-blue-800 shadow"
                : "text-blue-100 hover:bg-blue-700 hover:text-white"
            }`}
          >
            {label}
          </button>
        );
      })}
    </nav>
  );
}

export default NavBar;