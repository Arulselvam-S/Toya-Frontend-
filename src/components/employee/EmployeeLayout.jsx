
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Box } from "@mui/material";

import Sidebar from "../layout/Sidebar";
import Header from "../layout/Header";
import { useAuth } from "../../context/AuthContext";

export default function EmployeeLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);

  const employeeUser = {
    ...user,
    name: user?.name || "TOYA Employee",
    role: "employee",
    department: user?.department || "Development",
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        minWidth: 0,
        background: "#F5FBFF",
      }}
    >
      <Sidebar
        role="employee"
        user={employeeUser}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />

      <Box
        sx={{
          flex: "1 1 0%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header
          user={employeeUser}
          onMenuClick={() => setMobileOpen(true)}
          onSearch={() => {}}
          onLogout={handleLogout}
          onProfileClick={() => navigate("/employee/profile")}
          onSettingsClick={() => navigate("/employee/settings")}
        />

        <Box
          component="main"
          sx={{
            flex: 1,
            p: { xs: 2, md: 4 },
            minWidth: 0,
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
