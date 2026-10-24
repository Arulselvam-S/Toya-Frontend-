
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Chip,
  Avatar,
  Button,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material";

import {
  Users,
  UserCheck,
  Building2,
  FileBarChart2,
  ArrowRight,
  Plus,
  Clock3,
  RefreshCw,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import CommonStatusBadge from "../../components/common/CommonStatusBadge";

import { getEmployees } from "../../api/employeeApi";
import { getAdminAttendance } from "../../api/adminAttendanceApi";
import { getAdminWorkLogs } from "../../api/adminWorkLogApi";

import "../../styles/admin/AdminDashboard.css";

const DEPARTMENT_COLORS = {
  IT: "#0879ED",
  Marketing: "#38BDF8",
  Finance: "#14B8A6",
  HR: "#8B5CF6",
  Operations: "#F59E0B",
  Admin: "#64748B",
};

const DEFAULT_DEPARTMENT_COLOR = "#94A3B8";

const getDepartmentColor = (department) =>
  DEPARTMENT_COLORS[department] || DEFAULT_DEPARTMENT_COLOR;

const getLocalDateKey = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const parseDate = (value) => {
  if (!value) return null;

  if (typeof value?.toDate === "function") {
    return value.toDate();
  }

  if (typeof value?.seconds === "number") {
    return new Date(value.seconds * 1000);
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getLogDateKey = (log) => {
  const dateValue = log?.date || log?.submittedAt || log?.createdAt;
  const date = parseDate(dateValue);

  return date ? getLocalDateKey(date) : null;
};

const getDisplayTime = (value) => {
  const date = parseDate(value);

  if (!date) return "Time unavailable";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getEmployeeName = (log) =>
  log?.employee ||
  log?.name ||
  log?.employeeName ||
  log?.employeeDetails?.name ||
  log?.email ||
  "Employee";

const getLogTitle = (log) =>
  log?.title || log?.task || log?.description || "Work log";

const normalizeStatus = (status) =>
  String(status || "pending").toLowerCase().replace(/[\s-]+/g, "_");

const isCompleted = (status) => {
  const normalized = normalizeStatus(status);

  return ["completed", "complete", "approved", "done"].includes(normalized);
};

const isActiveEmployee = (employee) => {
  if (typeof employee?.active === "boolean") {
    return employee.active;
  }

  if (typeof employee?.status === "string") {
    return employee.status.toLowerCase() === "active";
  }

  return true;
};

const normalizeArray = (result) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.data)) return result.data.data;
  if (Array.isArray(result?.employees)) return result.employees;
  if (Array.isArray(result?.workLogs)) return result.workLogs;
  if (Array.isArray(result?.attendance)) return result.attendance;

  return [];
};

const getMonday = (date) => {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);

  const day = monday.getDay();
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1));

  return monday;
};

const getWeekDays = (period) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentMonday = getMonday(today);

  if (period === "lastWeek") {
    currentMonday.setDate(currentMonday.getDate() - 7);
  }

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(currentMonday);
    date.setDate(currentMonday.getDate() + index);

    return {
      date,
      key: getLocalDateKey(date),
      day: date.toLocaleDateString("en-IN", {
        weekday: "short",
      }),
    };
  });
};

const cardConfig = [
  {
    title: "Total Employees",
    field: "totalEmployees",
    icon: Users,
    description: "Active employee accounts",
    color: "#0879ED",
    background: "#E5F4FF",
  },
  {
    title: "Present Today",
    field: "presentToday",
    icon: UserCheck,
    description: "Attendance recorded",
    color: "#0D9B75",
    background: "#E2F8EF",
  },
  {
    title: "Departments",
    field: "departments",
    icon: Building2,
    description: "Departments represented",
    color: "#8B5CF6",
    background: "#F0E9FF",
  },
  {
    title: "Weekly Reports",
    field: "weeklyReports",
    icon: FileBarChart2,
    description: "Work logs submitted this week",
    color: "#E49A13",
    background: "#FFF5DD",
  },
];

function DashboardStatCard({ item, value, index, reduceMotion }) {
  const Icon = item.icon;

  return (
    <motion.div
      className="toya-admin-stat-card"
      initial={reduceMotion ? false : { opacity: 0, y: 26, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, delay: index * 0.08 }}
      whileHover={reduceMotion ? undefined : { y: -5, scale: 1.01 }}
    >
      <Box className="toya-admin-stat-top">
        <Typography className="toya-admin-stat-title">
          {item.title}
        </Typography>

        <Box
          className="toya-admin-stat-icon"
          sx={{
            color: item.color,
            background: item.background,
          }}
        >
          <Icon size={23} />
        </Box>
      </Box>

      <Typography className="toya-admin-stat-number">
        {value}
      </Typography>

      <Typography className="toya-admin-stat-description">
        {item.description}
      </Typography>
    </motion.div>
  );
}

function WeeklyActivityChart({ data }) {
  if (!data.length || !data.some((item) => item.completed + item.pending > 0)) {
    return (
      <Box
        className="toya-admin-chart-area"
        sx={{
          display: "grid",
          placeItems: "center",
          color: "text.secondary",
        }}
      >
        <Typography variant="body2">
          No work-log activity available for this period.
        </Typography>
      </Box>
    );
  }

  return (
    <div className="toya-admin-chart-area">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 12, left: -25, bottom: 0 }}
        >
          <defs>
            <linearGradient
              id="toyaCompletedGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop offset="0%" stopColor="#0879ED" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#0879ED" stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="#EAF1F8"
            strokeDasharray="4 5"
            vertical={false}
          />

          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 12, fill: "#8198AC" }}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#8198AC" }}
          />

          <Tooltip
            contentStyle={{
              borderRadius: 12,
              border: "1px solid #E1EDF7",
              boxShadow: "0 12px 28px rgba(8,80,150,0.1)",
            }}
          />

          <Area
            type="monotone"
            dataKey="completed"
            name="Completed"
            stroke="#0879ED"
            strokeWidth={3}
            fill="url(#toyaCompletedGradient)"
            animationDuration={700}
          />

          <Area
            type="monotone"
            dataKey="pending"
            name="Pending / In progress"
            stroke="#F59E0B"
            strokeWidth={2}
            fill="transparent"
            strokeDasharray="5 4"
            animationDuration={700}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function DepartmentChart({ departments }) {
  if (!departments.length) {
    return (
      <Box
        className="toya-admin-department-chart"
        sx={{ display: "grid", placeItems: "center" }}
      >
        <Typography variant="body2" color="text.secondary">
          No department data available.
        </Typography>
      </Box>
    );
  }

  return (
    <div className="toya-admin-department-chart">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={departments}
            dataKey="employees"
            nameKey="name"
            innerRadius={64}
            outerRadius={91}
            paddingAngle={3}
            stroke="none"
          >
            {departments.map((department) => (
              <Cell key={department.name} fill={department.color} />
            ))}
          </Pie>

          <Tooltip
            formatter={(value) => [`${value} employees`, "Employees"]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [period, setPeriod] = useState("thisWeek");
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [workLogs, setWorkLogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const today = getLocalDateKey();

      const [employeeResult, attendanceResult, workLogResult] =
        await Promise.all([
          getEmployees(),
          getAdminAttendance(today),
          getAdminWorkLogs(),
        ]);

      setEmployees(normalizeArray(employeeResult));
      setAttendance(normalizeArray(attendanceResult));
      setWorkLogs(normalizeArray(workLogResult));
    } catch (err) {
      console.error("Admin dashboard loading failed:", err);
      setError(
        err?.message ||
          "Unable to load dashboard data. Check your connection and permissions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, refreshKey]);

  const activeEmployees = useMemo(
    () => employees.filter(isActiveEmployee),
    [employees]
  );

  const presentToday = useMemo(() => {
    const presentIds = new Set();

    attendance.forEach((record) => {
      const status = normalizeStatus(record.status);

      if (
        record.active !== false &&
        ["present", "checked_in", "checked_out", "late"].includes(status)
      ) {
        presentIds.add(
          record.employeeId || record.id || record.email || record.name
        );
      }
    });

    return presentIds.size;
  }, [attendance]);

  const departmentData = useMemo(() => {
    const counts = new Map();

    activeEmployees.forEach((employee) => {
      const name = employee.department || "Unassigned";
      counts.set(name, (counts.get(name) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, count]) => ({
        name,
        employees: count,
        color: getDepartmentColor(name),
      }))
      .sort((a, b) => b.employees - a.employees);
  }, [activeEmployees]);

  const weekDays = useMemo(() => getWeekDays(period), [period]);

  const weeklyActivity = useMemo(() => {
    return weekDays.map(({ key, day }) => {
      const dayLogs = workLogs.filter((log) => getLogDateKey(log) === key);

      const completed = dayLogs.filter((log) =>
        isCompleted(log.status)
      ).length;

      return {
        day,
        completed,
        pending: dayLogs.length - completed,
      };
    });
  }, [weekDays, workLogs]);

  const weeklyReports = useMemo(() => {
    const validDates = new Set(weekDays.map((day) => day.key));

    return workLogs.filter((log) => validDates.has(getLogDateKey(log))).length;
  }, [weekDays, workLogs]);

  const recentWorkLogs = useMemo(() => {
    return [...workLogs]
      .sort((a, b) => {
        const dateA = parseDate(a.submittedAt || a.updatedAt || a.date);
        const dateB = parseDate(b.submittedAt || b.updatedAt || b.date);

        return (dateB?.getTime() || 0) - (dateA?.getTime() || 0);
      })
      .slice(0, 4);
  }, [workLogs]);

  const stats = {
    totalEmployees: activeEmployees.length,
    presentToday,
    departments: departmentData.length,
    weeklyReports,
  };

  const attendanceRate = stats.totalEmployees
    ? ((stats.presentToday / stats.totalEmployees) * 100).toFixed(1)
    : "0.0";

  return (
    <Box className="toya-admin-dashboard">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box className="toya-admin-welcome">
          <Box>
            <Typography className="toya-admin-heading">
              Welcome back, Admin 👋
            </Typography>

            <Typography className="toya-admin-subheading">
              Here's an overview of your TOYA workspace.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            className="toya-admin-add-button"
            onClick={() => navigate("/admin/employees")}
          >
            Manage Employees
          </Button>
        </Box>
      </motion.div>

      {error && (
        <Alert
          severity="error"
          sx={{ mt: 2, mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            minHeight: 300,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
          }}
        >
          <CircularProgress size={34} />
          <Typography color="text.secondary">
            Loading your dashboard...
          </Typography>
        </Box>
      ) : (
        <>
          <Box className="toya-admin-stats-grid">
            {cardConfig.map((item, index) => (
              <DashboardStatCard
                key={item.field}
                item={item}
                index={index}
                value={stats[item.field]}
                reduceMotion={reduceMotion}
              />
            ))}
          </Box>

          <Box className="toya-admin-chart-grid">
            <motion.section
              className="toya-admin-panel"
              initial={reduceMotion ? false : { opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
            >
              <Box className="toya-admin-panel-header">
                <Box>
                  <Typography className="toya-admin-panel-title">
                    Task Activity
                  </Typography>

                  <Typography className="toya-admin-panel-subtitle">
                    Completed and pending work logs
                  </Typography>
                </Box>

                <Select
                  size="small"
                  value={period}
                  onChange={(event) => setPeriod(event.target.value)}
                  aria-label="Select activity period"
                  sx={{ minWidth: 125, borderRadius: 2 }}
                >
                  <MenuItem value="thisWeek">This Week</MenuItem>
                  <MenuItem value="lastWeek">Last Week</MenuItem>
                </Select>
              </Box>

              <WeeklyActivityChart data={weeklyActivity} />
            </motion.section>

            <motion.section
              className="toya-admin-panel"
              initial={reduceMotion ? false : { opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.4 }}
            >
              <Box className="toya-admin-panel-header">
                <Box>
                  <Typography className="toya-admin-panel-title">
                    Department Distribution
                  </Typography>

                  <Typography className="toya-admin-panel-subtitle">
                    Active employees by department
                  </Typography>
                </Box>
              </Box>

              <DepartmentChart departments={departmentData} />

              <Box className="toya-admin-department-legend">
                {departmentData.map((department) => (
                  <Box
                    className="toya-admin-department-row"
                    key={department.name}
                  >
                    <Box className="toya-admin-department-label">
                      <span
                        className="toya-admin-department-dot"
                        style={{ background: department.color }}
                      />
                      {department.name}
                    </Box>

                    <strong>{department.employees}</strong>
                  </Box>
                ))}
              </Box>
            </motion.section>
          </Box>

          <Box className="toya-admin-bottom-grid">
            <section className="toya-admin-panel">
              <Box className="toya-admin-panel-header">
                <Box>
                  <Typography className="toya-admin-panel-title">
                    Recent Work Logs
                  </Typography>

                  <Typography className="toya-admin-panel-subtitle">
                    Latest employee activity
                  </Typography>
                </Box>

                <Button
                  endIcon={<ArrowRight size={16} />}
                  onClick={() => navigate("/admin/work-logs")}
                >
                  View All
                </Button>
              </Box>

              <Box className="toya-admin-logs">
                {recentWorkLogs.length ? (
                  recentWorkLogs.map((log, index) => (
                    <Box
                      className="toya-admin-log-row"
                      key={log.id || `${log.employeeId}-${index}`}
                    >
                      <Avatar className="toya-admin-log-avatar">
                        {getEmployeeName(log).charAt(0).toUpperCase()}
                      </Avatar>

                      <Box className="toya-admin-log-details">
                        <Typography fontWeight={700} fontSize={13}>
                          {getEmployeeName(log)}
                        </Typography>

                        <Typography className="toya-admin-log-task">
                          {getLogTitle(log)}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {log.department || "Unassigned"} ·{" "}
                          {getDisplayTime(
                            log.submittedAt || log.updatedAt || log.date
                          )}
                        </Typography>
                      </Box>

                      <CommonStatusBadge
                        status={log.status || "pending"}
                        size="small"
                        animated={false}
                      />
                    </Box>
                  ))
                ) : (
                  <Box sx={{ py: 4, textAlign: "center" }}>
                    <Typography color="text.secondary" variant="body2">
                      No work logs have been submitted yet.
                    </Typography>
                  </Box>
                )}
              </Box>
            </section>

            <section className="toya-admin-panel">
              <Box className="toya-admin-panel-header">
                <Box>
                  <Typography className="toya-admin-panel-title">
                    Quick Overview
                  </Typography>

                  <Typography className="toya-admin-panel-subtitle">
                    Organization performance
                  </Typography>
                </Box>
              </Box>

              <Box className="toya-admin-attendance-summary">
                <Box className="toya-admin-attendance-icon">
                  <UserCheck size={26} />
                </Box>

                <Typography className="toya-admin-attendance-value">
                  {attendanceRate}%
                </Typography>

                <Typography color="text.secondary" fontSize={13}>
                  Today's attendance rate
                </Typography>
              </Box>

              <Box className="toya-admin-overview-divider" />

              <Box className="toya-admin-quick-actions">
                <Button
                  startIcon={<Clock3 size={17} />}
                  onClick={() => navigate("/admin/attendance")}
                >
                  Attendance
                </Button>

                <Button
                  startIcon={<FileBarChart2 size={17} />}
                  onClick={() => navigate("/admin/reports")}
                >
                  Weekly Reports
                </Button>

                <Button
                  startIcon={<Building2 size={17} />}
                  onClick={() => navigate("/admin/departments")}
                >
                  Departments
                </Button>

                <Button
                  startIcon={<RefreshCw size={17} />}
                  onClick={() => setRefreshKey((key) => key + 1)}
                >
                  Refresh Data
                </Button>
              </Box>
            </section>
          </Box>
        </>
      )}
    </Box>
  );
}
