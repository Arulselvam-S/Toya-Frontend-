
import { useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";

import { Box, Typography } from "@mui/material";
import { motion } from "motion/react";

// ===================================
// COMMON LAYOUT
// ===================================

import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

// ===================================
// AUTHENTICATION
// ===================================

import {
  AuthProvider,
  useAuth,
  ROLE_HOME,
} from "./context/AuthContext";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import Login from "./pages/auth/Login";

// ===================================
// ADMIN PAGES
// ===================================

import AdminDashboard from "./pages/admin/AdminDashboard";
import Employees from "./pages/admin/Employees";
import Departments from "./pages/admin/Departments";
import Attendance from "./pages/admin/Attendance";
import WorkLogs from "./pages/admin/WorkLogs";
import WeeklyReports from "./pages/admin/WeeklyReports";
import Analytics from "./pages/admin/Analytics";
import Tasks from "./pages/admin/Tasks";
import UsersRoles from "./pages/admin/UsersRoles";
import Settings from "./pages/admin/Settings";
import Profile from "./pages/admin/Profile";
// ===================================
// MANAGER LAYOUT AND PAGES
// ===================================

import ManagerLayout from "./components/manager/ManagerLayout";
import ManagerDashboard from "./pages/manager/ManagerDashboard";
import ManagerTasks from "./pages/manager/ManagerTasks";
import ManagerTeam from "./pages/manager/ManagerTeam";
import ManagerAttendance from "./pages/manager/ManagerAttendance";
import ManagerReports from "./pages/manager/ManagerReports";
import ManagerProfile from "./pages/manager/ManagerProfile";
import ManagerWorkReports from "./pages/manager/ManagerWorkReports";

// ===================================
// EMPLOYEE PAGES
// ===================================

import EmployeeLayout from "./components/employee/EmployeeLayout";
import EmployeeDashboard from "./pages/employee/EmployeeDashboard";
import EmployeeTasks from "./pages/employee/EmployeeTasks";
import EmployeeWorkLogs from "./pages/employee/EmployeeWorkLogs";
import EmployeeAttendance from "./pages/employee/EmployeeAttendance";
import EmployeeProfile from "./pages/employee/EmployeeProfile";

// ===================================
// PLACEHOLDER PAGE
// ===================================

function PlaceholderPage() {
  const location = useLocation();

  const name =
    location.pathname
      .split("/")
      .filter(Boolean)
      .pop()
      ?.replace(/-/g, " ") || "Page";

  const pageTitle = name.replace(
    /\b\w/g,
    (char) => char.toUpperCase()
  );

  return (
    <motion.div
      key={location.pathname}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Typography
        variant="h4"
        fontWeight={800}
        sx={{ color: "#0b2852" }}
      >
        {pageTitle}
      </Typography>

      <Box
        className="glass-surface"
        sx={{
          p: 4,
          mt: 3,
          borderRadius: 4,
        }}
      >
        <Typography color="text.secondary">
          This module will be developed next.
        </Typography>
      </Box>
    </motion.div>
  );
}

// ===================================
// ADMIN LAYOUT
// ===================================

function AdminLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [, setSearch] = useState("");

  const adminUser = {
    name: user?.name || "TOYA Admin",
    role: "admin",
    department: "Administration",
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        minHeight: "100vh",
        minWidth: 0,
        background:
          "linear-gradient(135deg, #F5FBFF, #EAF7FF)",
      }}
    >
      {/* ADMIN SIDEBAR */}
      <Sidebar
        role={adminUser.role}
        user={adminUser}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
      />

      {/* MAIN AREA */}
      <Box
        sx={{
          flex: "1 1 0%",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Header
          user={adminUser}
          onMenuClick={() => setMobileOpen(true)}
          onSearch={setSearch}
          onLogout={handleLogout}
          onProfileClick={() => navigate("/admin/profile")}
          onSettingsClick={() => navigate("/admin/settings")}
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

// ===================================
// HOME REDIRECT
// ===================================

function HomeRedirect() {
  const { user } = useAuth();

  return (
    <Navigate
      to={
        user
          ? ROLE_HOME[user.role] || "/login"
          : "/login"
      }
      replace
    />
  );
}

// ===================================
// APPLICATION ROUTES
// ===================================

function AppRoutes() {
  return (
    <Routes>
      {/* LOGIN */}
      <Route path="/login" element={<Login />} />

      {/* ROOT */}
      <Route path="/" element={<HomeRedirect />} />

      {/* ============================
          ADMIN ROUTES
      ============================ */}

      <Route
        element={
          <ProtectedRoute allowedRoles={["admin"]} />
        }
      >
        <Route path="/admin" element={<AdminLayout />}>
          <Route
            index
            element={<Navigate to="dashboard" replace />}
          />

          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />

          <Route
            path="employees"
            element={<Employees />}
          />

          <Route
            path="departments"
            element={<Departments />}
          />

          <Route
            path="attendance"
            element={<Attendance />}
          />

          <Route
            path="work-logs"
            element={<WorkLogs />}
          />

          <Route
            path="tasks"
            element={<Tasks />}
          />

          <Route
            path="reports"
            element={<WeeklyReports />}
          />

          <Route
            path="analytics"
            element={<Analytics />}
          />

          <Route
            path="users-roles"
            element={<UsersRoles />}
          />

          <Route
            path="settings"
            element={<Settings />}
          />
          <Route path="/admin/profile" element={<Profile />} />

          <Route path="*" element={<PlaceholderPage />} />
        </Route>
      </Route>

      {/* ============================
          MANAGER ROUTES
      ============================ */}

      <Route
        element={
          <ProtectedRoute allowedRoles={["manager"]} />
        }
      >
        <Route path="/manager" element={<ManagerLayout />}>
          <Route
            index
            element={<Navigate to="dashboard" replace />}
          />

          <Route
            path="dashboard"
            element={<ManagerDashboard />}
          />

          <Route
            path="tasks"
            element={<ManagerTasks />}
          />

          <Route
            path="team"
            element={<ManagerTeam />}
          />

          <Route
            path="attendance"
            element={<ManagerAttendance />}
          />

          <Route
            path="reports"
            element={<ManagerWorkReports />}
          />
          <Route
            path="/manager/profile"
            element={<ManagerProfile />}
          />

          <Route
            path="settings"
            element={<PlaceholderPage />}
          />

          <Route path="*" element={<PlaceholderPage />} />
        </Route>
      </Route>

     {/* EMPLOYEE ROUTES */}
<Route
  element={
    <ProtectedRoute allowedRoles={["employee"]} />
  }
>
  <Route path="/employee" element={<EmployeeLayout />}>
    <Route
      index
      element={<Navigate to="dashboard" replace />}
    />

    <Route
      path="dashboard"
      element={<EmployeeDashboard />}
    />

    <Route
      path="tasks"
      element={<EmployeeTasks />}
    />

    <Route
      path="work-logs"
      element={<EmployeeWorkLogs />}
    />

    <Route
      path="attendance"
      element={<EmployeeAttendance />}
    />

    <Route
      path="profile"
      element={<EmployeeProfile />}
    />

    <Route
      path="settings"
      element={<PlaceholderPage />}
    />
  </Route>
</Route>

      {/* UNKNOWN ROUTES */}
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

// ===================================
// MAIN APP
// ===================================

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
