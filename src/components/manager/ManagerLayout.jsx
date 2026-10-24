
import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import { Box } from "@mui/material";

import Sidebar from "../layout/Sidebar";
import Header from "../layout/Header";

import { useAuth } from "../../context/AuthContext";

export default function ManagerLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [, setSearch] = useState("");

  const managerUser = {
    name: user?.name || "TOYA Manager",
    role: "manager",
    department: "Operations",
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
        width: "100%",
        minWidth: 0,
        background:
          "linear-gradient(135deg,#F5FBFF,#EAF7FF)",
      }}
    >
      <Sidebar
        role="manager"
        user={managerUser}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />

      <Box
        sx={{
          display: "flex",
          flex: "1 1 0%",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Header
          user={managerUser}
          onMenuClick={() => setMobileOpen(true)}
          onSearch={setSearch}
          onLogout={handleLogout}
          onProfileClick={() =>
            navigate("/manager/profile")
          }
          onSettingsClick={() =>
            navigate("/manager/settings")
          }
        />

        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            p: { xs: 2, md: 4 },
          }}
        >
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
