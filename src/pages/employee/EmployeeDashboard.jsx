
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Typography,
} from "@mui/material";

import {
  UserRound,
  ClipboardList,
  Clock3,
  CheckCircle2,
  LogOut,
  CalendarCheck,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import CommonButton from "../../components/common/CommonButton";
import { useAuth } from "../../context/AuthContext";
import { getBackendProfile } from "../../api/backendApi";
import { getWorkLogs } from "../../api/workLogApi";
import { getTodayAttendance } from "../../api/attendanceApi";
import "../../styles/employee/EmployeeDashboard.css";
function extractWorkLogs(result) {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.workLogs)) return result.workLogs;
  if (Array.isArray(result?.data?.workLogs)) {
    return result.data.workLogs;
  }
  return [];
}

function extractAttendance(result) {
  return result?.data?.attendance ??
    result?.data ??
    result?.attendance ??
    null;
}

function getLocalDateKey(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekStart() {
  const today = new Date();
  const day = today.getDay();

  const mondayOffset = day === 0 ? -6 : 1 - day;

  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);

  return monday;
}

function formatHours(hours) {
  return `${Number(hours || 0).toFixed(1)} hrs`;
}

function getAttendanceStatus(attendance) {
  if (!attendance) {
    return {
      label: "Not Marked",
      color: "default",
    };
  }

  const status = String(attendance.status || "").toLowerCase();

  if (
    status === "checked-out" ||
    status === "checked_out" ||
    status === "checkedout" ||
    attendance.checkOut
  ) {
    return {
      label: "Checked Out",
      color: "info",
    };
  }

  if (
    status === "checked-in" ||
    status === "checked_in" ||
    status === "checkedin" ||
    attendance.checkIn
  ) {
    return {
      label: "Checked In",
      color: "success",
    };
  }

  return {
    label: status
      ? status.replace(/[-_]/g, " ")
      : "Not Marked",
    color: "default",
  };
}

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [backendProfile, setBackendProfile] = useState(null);
  const [workLogs, setWorkLogs] = useState([]);
  const [attendance, setAttendance] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      getBackendProfile(),
      getWorkLogs(),
      getTodayAttendance(),
    ]);

    const [profileResult, logsResult, attendanceResult] = results;

    const errors = [];

    if (profileResult.status === "fulfilled") {
      const result = profileResult.value;

      setBackendProfile(
        result?.data?.profile ??
        result?.profile ??
        result?.data ??
        result
      );
    } else {
      errors.push(
        `Profile: ${profileResult.reason?.message || "Unable to load"}`
      );
    }

    if (logsResult.status === "fulfilled") {
      setWorkLogs(extractWorkLogs(logsResult.value));
    } else {
      errors.push(
        `Work logs: ${logsResult.reason?.message || "Unable to load"}`
      );
    }

    if (attendanceResult.status === "fulfilled") {
      setAttendance(extractAttendance(attendanceResult.value));
    } else {
      errors.push(
        `Attendance: ${attendanceResult.reason?.message || "Unable to load"}`
      );
    }

    if (errors.length > 0) {
      setError(errors.join(" | "));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => {
    const weekStart = getWeekStart();

    const completed = workLogs.filter((log) => {
      const status = String(log.status || "").toLowerCase();
      return ["completed", "complete", "done"].includes(status);
    }).length;

    const weeklyHours = workLogs.reduce((total, log) => {
      const logDate = log.date
        ? new Date(`${String(log.date).slice(0, 10)}T12:00:00`)
        : null;

      if (!logDate || Number.isNaN(logDate.getTime())) {
        return total;
      }

      if (logDate < weekStart) {
        return total;
      }

      const hours = Number(log.hours);

      return total + (Number.isFinite(hours) ? hours : 0);
    }, 0);

    const todayKey = getLocalDateKey(new Date());

    const todayLogs = workLogs.filter(
      (log) => String(log.date || "").slice(0, 10) === todayKey
    );

    return {
      total: workLogs.length,
      completed,
      weeklyHours,
      todayLogs,
    };
  }, [workLogs]);

  const attendanceStatus = getAttendanceStatus(attendance);

  const cards = [
    {
      title: "My Work Logs",
      value: stats.total,
      Icon: ClipboardList,
      subtitle: "Total submitted entries",
    },
    {
      title: "Completed",
      value: stats.completed,
      Icon: CheckCircle2,
      subtitle: "Completed work logs",
    },
    {
      title: "Weekly Hours",
      value: formatHours(stats.weeklyHours),
      Icon: Clock3,
      subtitle: "Hours logged this week",
    },
  ];

  const handleLogout = async () => {
    setLoggingOut(true);

    try {
      await logout();
      navigate("/login", { replace: true });
    } catch {
      setError("Logout failed. Please try again.");
      setLoggingOut(false);
    }
  };

  return (
    <Box className="toya-employee-dashboard">
      <Box className="toya-dashboard-container">
        {/* Header */}
        <Box className="toya-dashboard-header">
          <Box>
            <Typography
              className="toya-dashboard-title"
              variant="h4"
              fontWeight={800}
              color="#0b2852"
            >
              Employee Dashboard
            </Typography>

            <Typography className="toya-dashboard-welcome" color="text.secondary">
              Welcome back,{" "}
              <strong>
                {backendProfile?.name ||
                  user?.name ||
                  user?.displayName ||
                  "Employee"}
              </strong>
            </Typography>
          </Box>

          <Box className="toya-dashboard-actions">
            <CommonButton
              label="Refresh"
              variant="outlined"
              startIcon={<RefreshCw size={17} />}
              onClick={loadDashboard}
              disabled={loading}
            />

            <CommonButton
              label={loggingOut ? "Logging out..." : "Logout"}
              variant="outlined"
              startIcon={<LogOut size={17} />}
              onClick={handleLogout}
              disabled={loggingOut}
            />
          </Box>
        </Box>

        {/* Loading */}
        {loading && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <CircularProgress size={18} />
              Loading employee dashboard...
            </Box>
          </Alert>
        )}

        {/* Error */}
        {error && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Employee Profile */}
        <Box className="toya-dashboard-card toya-dashboard-profile">
          <Box className="toya-dashboard-section-heading">
            <UserRound size={26} color="#0879ed" />

            <Typography fontWeight={800} variant="h6">
              My Employee Profile
            </Typography>
          </Box>

          <Box className="toya-dashboard-profile-grid">
            <Box>
              <Typography color="text.secondary" fontSize={13}>
                Employee Name
              </Typography>

              <Typography fontWeight={700}>
                {backendProfile?.name ||
                  user?.name ||
                  "—"}
              </Typography>
            </Box>

            <Box>
              <Typography color="text.secondary" fontSize={13}>
                Email
              </Typography>

              <Typography fontWeight={700} sx={{ wordBreak: "break-word" }}>
                {backendProfile?.email ||
                  user?.email ||
                  "—"}
              </Typography>
            </Box>

            <Box>
              <Typography color="text.secondary" fontSize={13}>
                Department
              </Typography>

              <Typography fontWeight={700}>
                {backendProfile?.department || "Not assigned"}
              </Typography>
            </Box>

            <Box>
              <Typography color="text.secondary" fontSize={13}>
                Role
              </Typography>

              <Chip
                label={backendProfile?.role || "Not verified"}
                color={backendProfile ? "success" : "default"}
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Box>
          </Box>
        </Box>

        {/* Dashboard Statistics */}
        <Box className="toya-dashboard-stats">
          {cards.map(({ title, value, Icon, subtitle }) => (
            <Box key={title} className="toya-dashboard-card toya-dashboard-stat-card">
              <Box className="toya-dashboard-stat-icon">
                <Icon size={23} color="#0879ed" />
              </Box>

              <Typography
                className="toya-dashboard-stat-value"
                variant="h4"
                fontWeight={800}
                color="#0b2852"
              >
                {loading ? "..." : value}
              </Typography>

              <Typography fontWeight={700}>
                {title}
              </Typography>

              <Typography
                color="text.secondary"
                fontSize={12}
                sx={{ mt: 0.5 }}
              >
                {subtitle}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Attendance */}
        <Box className="toya-dashboard-card toya-dashboard-attendance">
          <Box className="toya-dashboard-attendance-header">
            <Box>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  mb: 1,
                }}
              >
                <CalendarCheck size={23} color="#0879ed" />

                <Typography fontWeight={800} variant="h6">
                  Today's Attendance
                </Typography>
              </Box>

              <Typography
                color="text.secondary"
                fontSize={13}
              >
                Your current attendance status
              </Typography>
            </Box>

            <Chip
              label={loading ? "Loading..." : attendanceStatus.label}
              color={loading ? "default" : attendanceStatus.color}
              variant="outlined"
            />
          </Box>
        </Box>

        {/* My Work */}
        <Box className="toya-dashboard-card toya-dashboard-work">
          <Box className="toya-dashboard-section-heading">
            <ClipboardList size={26} color="#0879ed" />

            <Typography fontWeight={800} variant="h6">
              My Work
            </Typography>
          </Box>

          <Typography color="text.secondary" fontSize={13}>
            You have submitted{" "}
            <strong>{stats.todayLogs.length}</strong>{" "}
            work log(s) today.
          </Typography>

          {stats.todayLogs.length > 0 && (
            <Box className="toya-dashboard-work-list">
              {stats.todayLogs.slice(0, 3).map((log, index) => (
                <Box
                  key={log.id || index}
                  className="toya-dashboard-work-row"
                >
                  <Box className="toya-dashboard-work-info">
                    <Typography fontWeight={700} fontSize={14}>
                      {log.title || "Untitled Work"}
                    </Typography>

                    <Typography
                      color="text.secondary"
                      fontSize={12}
                    >
                      {formatHours(log.hours)}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={log.status || "Submitted"}
                    variant="outlined"
                  />
                </Box>
              ))}
            </Box>
          )}

          <Box className="toya-dashboard-work-footer">
            <CommonButton
              label="View My Work Logs"
              endIcon={<ArrowRight size={17} />}
              onClick={() => navigate("/employee/work-logs")}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
