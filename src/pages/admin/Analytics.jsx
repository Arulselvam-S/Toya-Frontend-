
import { useMemo, useState } from "react";

import {
  Box,
  Typography,
  Avatar,
  Chip,
  Alert,
  TextField,
  MenuItem,
} from "@mui/material";

import {
  Users,
  CheckCircle2,
  Clock3,
  TrendingUp,
  Download,
  RotateCcw,
  BarChart3,
  Award,
  Activity,
} from "lucide-react";

import {
  motion,
  useReducedMotion,
} from "motion/react";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

import CommonButton from "../../components/common/CommonButton";
import CommonTable from "../../components/common/CommonTable";
import CommonPagination from "../../components/common/CommonPagination";
import CommonModal from "../../components/common/CommonModal";
import CommonDatePicker from "../../components/common/CommonDatePicker";

import "../../styles/admin/Analytics.css";

// ====================================
// CONFIGURATION
// ====================================

const COLORS = [
  "#0879ED",
  "#38BDF8",
  "#12B886",
  "#F59E0B",
  "#8B5CF6",
];

const EMPLOYEES = [
  { id: 1, code: "TOYA001", name: "Arun Kumar", department: "IT" },
  { id: 2, code: "TOYA002", name: "Priya Sharma", department: "Marketing" },
  { id: 3, code: "TOYA003", name: "Rahul Raj", department: "Finance" },
  { id: 4, code: "TOYA004", name: "Sneha R", department: "HR" },
  { id: 5, code: "TOYA005", name: "Karthik S", department: "IT" },
  { id: 6, code: "TOYA006", name: "Meena P", department: "Operations" },
  { id: 7, code: "TOYA007", name: "Vijay M", department: "Marketing" },
  { id: 8, code: "TOYA008", name: "Divya R", department: "Finance" },
];

const DEPARTMENTS = [
  "IT",
  "Marketing",
  "Finance",
  "HR",
  "Operations",
];

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function fromDateKey(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function offsetDate(days) {
  const result = new Date();
  result.setDate(result.getDate() + days);
  return dateKey(result);
}

function formatDate(value) {
  return fromDateKey(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

// ====================================
// DEMO HISTORICAL DATA GENERATOR
// ====================================

function createDemoData() {
  const tasks = [];
  const logs = [];

  const today = new Date();
  const firstMonth = new Date(
    today.getFullYear(),
    today.getMonth() - 5,
    1
  );

  const current = new Date(firstMonth);
  let taskId = 1;
  let logId = 1;

  while (current <= today) {
    const day = current.getDay();

    // Weekday demo activity
    if (day !== 0 && day !== 6) {
      EMPLOYEES.forEach((employee, index) => {
        const stamp = dateKey(current);
        const dayNumber = current.getDate();
        const score = dayNumber + index * 3;

        logs.push({
          id: logId++,
          employeeId: employee.id,
          date: stamp,
          hours: 5 + (score % 4),
        });

        if ((score + index) % 3 !== 0) {
          const statusNumber = (score + index) % 5;

          tasks.push({
            id: taskId++,
            employeeId: employee.id,
            date: stamp,
            title: [
              "Feature Development",
              "Client Coordination",
              "Testing and Review",
              "Daily Operations",
              "Documentation",
            ][score % 5],
            status:
              statusNumber < 3
                ? "completed"
                : statusNumber === 3
                  ? "in_progress"
                  : "not_started",
          });
        }
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return { tasks, logs };
}

const DEMO = createDemoData();

// ====================================
// HELPERS
// ====================================

function getCompletionRate(completed, total) {
  return total
    ? Math.round((completed / total) * 100)
    : 0;
}

function getMonthLabel(key) {
  const [year, month] = key.split("-").map(Number);

  return new Date(year, month - 1, 1).toLocaleDateString(
    "en-IN",
    {
      month: "short",
      year: "2-digit",
    }
  );
}

function MetricCard({
  title,
  value,
  subtitle,
  Icon,
  tone,
  index,
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`toya-analytics-metric tone-${tone}`}
      initial={
        reduceMotion ? false : { opacity: 0, y: 18 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.34,
        delay: index * 0.07,
      }}
    >
      <Box className="toya-analytics-metric-icon">
        <Icon size={22} />
      </Box>

      <Typography className="toya-analytics-metric-value">
        {value}
      </Typography>

      <Typography className="toya-analytics-metric-label">
        {title}
      </Typography>

      <Typography
        color="text.secondary"
        fontSize={11}
        sx={{ mt: 0.7 }}
      >
        {subtitle}
      </Typography>
    </motion.div>
  );
}

// ====================================
// MAIN COMPONENT
// ====================================

export default function Analytics() {
  const [period, setPeriod] = useState("30");
  const [department, setDepartment] = useState("all");
  const [employeeFilter, setEmployeeFilter] =
    useState("all");
  const [search, setSearch] = useState("");

  const [endDate, setEndDate] = useState(
    dateKey(new Date())
  );

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState(null);

  const startDate = useMemo(() => {
    const date = fromDateKey(endDate);
    date.setDate(date.getDate() - Number(period) + 1);
    return dateKey(date);
  }, [endDate, period]);

  // Filter employees first so all visualizations
  // use the same employee selection.
  const selectedEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return EMPLOYEES.filter((employee) => {
      const textMatches = [
        employee.name,
        employee.code,
        employee.department,
      ].some((value) =>
        value.toLowerCase().includes(query)
      );

      return (
        textMatches &&
        (department === "all" ||
          employee.department === department) &&
        (employeeFilter === "all" ||
          employee.id === Number(employeeFilter))
      );
    });
  }, [department, employeeFilter, search]);

  const employeeIds = useMemo(
    () => new Set(selectedEmployees.map((item) => item.id)),
    [selectedEmployees]
  );

  const periodTasks = useMemo(
    () =>
      DEMO.tasks.filter(
        (task) =>
          task.date >= startDate &&
          task.date <= endDate &&
          employeeIds.has(task.employeeId)
      ),
    [startDate, endDate, employeeIds]
  );

  const periodLogs = useMemo(
    () =>
      DEMO.logs.filter(
        (log) =>
          log.date >= startDate &&
          log.date <= endDate &&
          employeeIds.has(log.employeeId)
      ),
    [startDate, endDate, employeeIds]
  );

  // ==================================
  // EMPLOYEE METRICS
  // ==================================

  const employeeMetrics = useMemo(() => {
    return selectedEmployees.map((employee) => {
      const ownTasks = periodTasks.filter(
        (task) => task.employeeId === employee.id
      );

      const ownLogs = periodLogs.filter(
        (log) => log.employeeId === employee.id
      );

      const completed = ownTasks.filter(
        (task) => task.status === "completed"
      ).length;

      const inProgress = ownTasks.filter(
        (task) => task.status === "in_progress"
      ).length;

      const notStarted = ownTasks.filter(
        (task) => task.status === "not_started"
      ).length;

      const hours = ownLogs.reduce(
        (sum, log) => sum + log.hours,
        0
      );

      return {
        ...employee,
        completed,
        inProgress,
        notStarted,
        totalTasks: ownTasks.length,
        hours,
        completionRate: getCompletionRate(
          completed,
          ownTasks.length
        ),
        tasks: ownTasks,
        logs: ownLogs,
      };
    });
  }, [selectedEmployees, periodTasks, periodLogs]);

  const totals = useMemo(() => {
    const completed = periodTasks.filter(
      (task) => task.status === "completed"
    ).length;

    const inProgress = periodTasks.filter(
      (task) => task.status === "in_progress"
    ).length;

    const notStarted = periodTasks.filter(
      (task) => task.status === "not_started"
    ).length;

    const hours = periodLogs.reduce(
      (sum, log) => sum + log.hours,
      0
    );

    return {
      employees: selectedEmployees.length,
      tasks: periodTasks.length,
      completed,
      inProgress,
      notStarted,
      hours,
      completionRate: getCompletionRate(
        completed,
        periodTasks.length
      ),
    };
  }, [selectedEmployees, periodTasks, periodLogs]);

  // ==================================
  // DEPARTMENT ANALYTICS
  // ==================================

  const departmentData = useMemo(
    () =>
      DEPARTMENTS.map((name) => {
        const employees = employeeMetrics.filter(
          (item) => item.department === name
        );

        return {
          department: name,
          employees: employees.length,
          completed: employees.reduce(
            (sum, item) => sum + item.completed,
            0
          ),
          pending: employees.reduce(
            (sum, item) =>
              sum + item.inProgress + item.notStarted,
            0
          ),
          hours: employees.reduce(
            (sum, item) => sum + item.hours,
            0
          ),
        };
      }).filter((item) => item.employees > 0),
    [employeeMetrics]
  );

  // ==================================
  // MONTHLY TREND
  // ==================================

  const monthlyTrend = useMemo(() => {
    const months = [];

    const cursor = new Date(
      fromDateKey(startDate).getFullYear(),
      fromDateKey(startDate).getMonth(),
      1
    );

    const finalMonth = fromDateKey(endDate);

    while (cursor <= finalMonth) {
      const key = monthKey(cursor);

      const monthlyTasks = periodTasks.filter(
        (task) => task.date.slice(0, 7) === key
      );

      months.push({
        month: getMonthLabel(key),
        assigned: monthlyTasks.length,
        completed: monthlyTasks.filter(
          (task) => task.status === "completed"
        ).length,
      });

      cursor.setMonth(cursor.getMonth() + 1);
    }

    return months;
  }, [startDate, endDate, periodTasks]);

  // ==================================
  // DAILY HOURS
  // ==================================

  const dailyHoursData = useMemo(() => {
    const grouped = new Map();

    periodLogs.forEach((log) => {
      grouped.set(
        log.date,
        (grouped.get(log.date) || 0) + log.hours
      );
    });

    return Array.from(grouped, ([date, hours]) => ({
      date,
      label: formatDate(date),
      hours,
    })).sort((a, b) => a.date.localeCompare(b.date));
  }, [periodLogs]);

  const taskStatusData = [
    {
      name: "Completed",
      value: totals.completed,
      color: "#12B886",
    },
    {
      name: "In Progress",
      value: totals.inProgress,
      color: "#0879ED",
    },
    {
      name: "Not Started",
      value: totals.notStarted,
      color: "#F59E0B",
    },
  ];

  // ==================================
  // TABLE PAGINATION
  // ==================================

  const totalPages = Math.max(
    1,
    Math.ceil(employeeMetrics.length / rowsPerPage)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleEmployees = employeeMetrics.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const selectedEmployee =
    employeeMetrics.find(
      (item) => item.id === selectedEmployeeId
    ) || null;

  // ==================================
  // EXPORT
  // ==================================

  const exportCSV = () => {
    const rows = [
      [
        "Employee ID",
        "Employee",
        "Department",
        "From",
        "To",
        "Logged Hours",
        "Total Tasks",
        "Completed",
        "In Progress",
        "Not Started",
        "Completion Rate",
      ],
      ...employeeMetrics.map((employee) => [
        employee.code,
        employee.name,
        employee.department,
        startDate,
        endDate,
        employee.hours,
        employee.totalTasks,
        employee.completed,
        employee.inProgress,
        employee.notStarted,
        `${employee.completionRate}%`,
      ]),
    ];

    const escapeCSV = (value) => {
      const safe = String(value ?? "").replace(
        /^\s*[=+\-@]/,
        "'$&"
      );

      return `"${safe.replace(/"/g, '""')}"`;
    };

    const text = rows
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", text], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `TOYA-Analytics-${endDate}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ==================================
  // EMPLOYEE TABLE
  // ==================================

  const columns = [
    {
      field: "name",
      headerName: "Employee",
      minWidth: 185,
      renderCell: (value, row) => (
        <Box className="toya-analytics-employee">
          <Avatar className="toya-analytics-avatar">
            {value.charAt(0)}
          </Avatar>

          <Box>
            <Typography fontWeight={700} fontSize={13}>
              {value}
            </Typography>
            <Typography
              fontSize={11}
              color="text.secondary"
            >
              {row.code}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "department",
      headerName: "Department",
      minWidth: 120,
    },
    {
      field: "hours",
      headerName: "Hours Logged",
      minWidth: 110,
      renderCell: (value) => `${value}h`,
    },
    {
      field: "totalTasks",
      headerName: "Tasks",
      minWidth: 80,
    },
    {
      field: "completed",
      headerName: "Completed",
      minWidth: 110,
      renderCell: (value) => (
        <Chip
          label={value}
          size="small"
          color="success"
          variant="outlined"
        />
      ),
    },
    {
      field: "inProgress",
      headerName: "In Progress",
      minWidth: 110,
    },
    {
      field: "completionRate",
      headerName: "Completion Rate",
      minWidth: 155,
      renderCell: (value) => (
        <Box className="toya-analytics-progress">
          <Box className="toya-analytics-progress-track">
            <Box sx={{ width: `${value}%` }} />
          </Box>
          <strong>{value}%</strong>
        </Box>
      ),
    },
  ];

  const metrics = [
    {
      title: "Employees",
      value: totals.employees,
      subtitle: "In selected filters",
      Icon: Users,
      tone: "blue",
    },
    {
      title: "Tasks Completed",
      value: totals.completed,
      subtitle: `${totals.tasks} total tasks`,
      Icon: CheckCircle2,
      tone: "green",
    },
    {
      title: "Completion Rate",
      value: `${totals.completionRate}%`,
      subtitle: "Across selected tasks",
      Icon: TrendingUp,
      tone: "cyan",
    },
    {
      title: "Hours Logged",
      value: `${totals.hours}h`,
      subtitle: "Selected date range",
      Icon: Clock3,
      tone: "orange",
    },
  ];

  return (
    <Box className="toya-analytics-page">
      {/* PAGE HEADER */}
      <Box className="toya-analytics-heading">
        <Box>
          <Typography className="toya-analytics-title">
            Performance Analytics
          </Typography>

          <Typography className="toya-analytics-subtitle">
            Monitor company productivity, work hours and tasks
          </Typography>
        </Box>

        <CommonButton
          label="Export Analytics"
          startIcon={<Download size={17} />}
          onClick={exportCSV}
        />
      </Box>

      <Alert
        severity="info"
        className="toya-analytics-demo-alert"
      >
        Analytics currently uses generated demo history.
        It does not automatically read changes from
        Attendance, Work Logs or Tasks.
      </Alert>

      {/* FILTERS */}
      <Box className="toya-analytics-filters">
        <TextField
          select
          label="Time Period"
          size="small"
          value={period}
          onChange={(event) => {
            setPeriod(event.target.value);
            setPage(1);
          }}
          fullWidth
        >
          <MenuItem value="7">Last 7 Days</MenuItem>
          <MenuItem value="30">Last 30 Days</MenuItem>
          <MenuItem value="90">Last 90 Days</MenuItem>
          <MenuItem value="180">Last 180 Days</MenuItem>
        </TextField>

        <CommonDatePicker
          label="End Date"
          name="analyticsEndDate"
          value={endDate}
          onChange={(value) => {
            if (!value) return;
            setEndDate(value);
            setPage(1);
          }}
          maxDate={dateKey(new Date())}
          size="small"
        />

        <TextField
          select
          label="Department"
          value={department}
          onChange={(event) => {
            setDepartment(event.target.value);
            setPage(1);
          }}
          size="small"
          fullWidth
        >
          <MenuItem value="all">All Departments</MenuItem>
          {DEPARTMENTS.map((item) => (
            <MenuItem key={item} value={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Employee"
          value={employeeFilter}
          onChange={(event) => {
            setEmployeeFilter(event.target.value);
            setPage(1);
          }}
          size="small"
          fullWidth
        >
          <MenuItem value="all">All Employees</MenuItem>

          {EMPLOYEES.map((employee) => (
            <MenuItem
              key={employee.id}
              value={String(employee.id)}
            >
              {employee.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Search"
          size="small"
          value={search}
          placeholder="Name or employee ID"
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          fullWidth
        />

        <CommonButton
          label="Reset"
          variant="outlined"
          startIcon={<RotateCcw size={17} />}
          onClick={() => {
            setPeriod("30");
            setEndDate(dateKey(new Date()));
            setDepartment("all");
            setEmployeeFilter("all");
            setSearch("");
            setSelectedEmployeeId(null);
            setPage(1);
          }}
        />
      </Box>

      <Box className="toya-analytics-date-caption">
        <Activity size={16} />
        {formatDate(startDate)} — {formatDate(endDate)}
      </Box>

      {/* METRICS */}
      <Box className="toya-analytics-metrics">
        {metrics.map((item, index) => (
          <MetricCard
            key={item.title}
            {...item}
            index={index}
          />
        ))}
      </Box>

      {/* MONTHLY TREND */}
      <Box className="toya-analytics-chart-card">
        <Box className="toya-analytics-chart-heading">
          <Box>
            <Typography fontWeight={800} fontSize={17}>
              Monthly Task Trend
            </Typography>

            <Typography
              fontSize={12}
              color="text.secondary"
            >
              Tasks assigned vs completed
            </Typography>
          </Box>
          <BarChart3 color="#0879ED" size={21} />
        </Box>

        <Box className="toya-analytics-chart-large">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyTrend}>
              <defs>
                <linearGradient
                  id="toyaCompletedGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor="#0879ED"
                    stopOpacity={0.23}
                  />
                  <stop
                    offset="95%"
                    stopColor="#0879ED"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="#EAF1F8"
                strokeDasharray="4 4"
                vertical={false}
              />

              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />

              <Area
                dataKey="assigned"
                name="Assigned Tasks"
                type="monotone"
                stroke="#38BDF8"
                fill="transparent"
                strokeWidth={2}
              />

              <Area
                dataKey="completed"
                name="Completed Tasks"
                type="monotone"
                stroke="#0879ED"
                fill="url(#toyaCompletedGradient)"
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* DEPARTMENT AND STATUS CHARTS */}
      <Box className="toya-analytics-chart-grid">
        <Box className="toya-analytics-chart-card">
          <Box className="toya-analytics-chart-heading">
            <Box>
              <Typography fontWeight={800} fontSize={16}>
                Department Performance
              </Typography>

              <Typography
                fontSize={12}
                color="text.secondary"
              >
                Completed and pending tasks
              </Typography>
            </Box>
          </Box>

          <Box className="toya-analytics-chart-medium">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={departmentData}>
                <CartesianGrid
                  vertical={false}
                  stroke="#EAF1F8"
                />
                <XAxis
                  dataKey="department"
                  tick={{ fontSize: 11 }}
                />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />

                <Bar
                  dataKey="completed"
                  name="Completed"
                  fill="#0879ED"
                  radius={[5, 5, 0, 0]}
                />

                <Bar
                  dataKey="pending"
                  name="Pending"
                  fill="#F59E0B"
                  radius={[5, 5, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        <Box className="toya-analytics-chart-card">
          <Box className="toya-analytics-chart-heading">
            <Box>
              <Typography fontWeight={800} fontSize={16}>
                Task Status Distribution
              </Typography>

              <Typography
                fontSize={12}
                color="text.secondary"
              >
                Overall assignment breakdown
              </Typography>
            </Box>
          </Box>

          <Box className="toya-analytics-chart-medium">
            {totals.tasks ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={taskStatusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={65}
                    outerRadius={105}
                    paddingAngle={4}
                  >
                    {taskStatusData.map((item) => (
                      <Cell
                        key={item.name}
                        fill={item.color}
                      />
                    ))}
                  </Pie>

                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box className="toya-analytics-empty">
                No task data in this period
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* HOURS */}
      <Box className="toya-analytics-chart-card">
        <Box className="toya-analytics-chart-heading">
          <Box>
            <Typography fontWeight={800} fontSize={16}>
              Daily Working Hours
            </Typography>

            <Typography
              fontSize={12}
              color="text.secondary"
            >
              Total hours recorded by selected employees
            </Typography>
          </Box>
        </Box>

        <Box className="toya-analytics-chart-medium">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyHoursData}>
              <CartesianGrid
                strokeDasharray="4 4"
                stroke="#EAF1F8"
                vertical={false}
              />

              <XAxis
                dataKey="label"
                minTickGap={24}
                tick={{ fontSize: 10 }}
              />

              <YAxis allowDecimals={false} />
              <Tooltip />

              <Line
                dataKey="hours"
                name="Working Hours"
                type="monotone"
                stroke="#0879ED"
                strokeWidth={3}
                dot={dailyHoursData.length <= 14}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Box>

      {/* EMPLOYEE PERFORMANCE */}
      <Box className="toya-analytics-table-section">
        <Box className="toya-analytics-chart-heading">
          <Box>
            <Typography fontWeight={800} fontSize={17}>
              Employee Performance
            </Typography>

            <Typography
              fontSize={12}
              color="text.secondary"
            >
              Productivity metrics for each employee
            </Typography>
          </Box>

          <Award size={21} color="#0879ED" />
        </Box>

        <CommonTable
          title="Performance Directory"
          rows={visibleEmployees}
          columns={columns}
          searchable={false}
          pagination={false}
          getRowId={(row) => row.id}
          onView={(row) =>
            setSelectedEmployeeId(row.id)
          }
          emptyMessage="No employee metrics found"
        />

        <CommonPagination
          page={currentPage}
          rowsPerPage={rowsPerPage}
          totalRecords={employeeMetrics.length}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value);
            setPage(1);
          }}
        />
      </Box>

      {/* EMPLOYEE DETAILS MODAL */}
      <CommonModal
        open={Boolean(selectedEmployee)}
        onClose={() => setSelectedEmployeeId(null)}
        title="Employee Analytics"
        description={`${formatDate(startDate)} — ${formatDate(endDate)}`}
        icon={<TrendingUp size={21} />}
        showFooter={false}
        maxWidth="sm"
      >
        {selectedEmployee && (
          <Box className="toya-analytics-detail">
            <Box className="toya-analytics-profile">
              <Avatar className="toya-analytics-profile-avatar">
                {selectedEmployee.name.charAt(0)}
              </Avatar>

              <Box>
                <Typography fontWeight={800}>
                  {selectedEmployee.name}
                </Typography>

                <Typography
                  fontSize={12}
                  color="text.secondary"
                >
                  {selectedEmployee.code} ·{" "}
                  {selectedEmployee.department}
                </Typography>
              </Box>
            </Box>

            <Box className="toya-analytics-detail-grid">
              {[
                ["Working Hours", `${selectedEmployee.hours}h`],
                ["Total Tasks", selectedEmployee.totalTasks],
                ["Completed", selectedEmployee.completed],
                ["In Progress", selectedEmployee.inProgress],
                ["Not Started", selectedEmployee.notStarted],
                [
                  "Completion Rate",
                  `${selectedEmployee.completionRate}%`,
                ],
              ].map(([label, value]) => (
                <Box key={label}>
                  <span>{label}</span>
                  <strong>{value}</strong>
                </Box>
              ))}
            </Box>

            <Typography
              fontSize={13}
              fontWeight={800}
              sx={{ mt: 2 }}
            >
              Recent Tasks in Selected Period
            </Typography>

            <Box className="toya-analytics-detail-list">
              {selectedEmployee.tasks.length === 0 ? (
                <Typography
                  fontSize={12}
                  color="text.secondary"
                  sx={{ py: 2 }}
                >
                  No tasks found.
                </Typography>
              ) : (
                selectedEmployee.tasks
                  .slice(-6)
                  .reverse()
                  .map((task) => (
                    <Box
                      key={task.id}
                      className="toya-analytics-task-item"
                    >
                      <Box>
                        <Typography
                          fontWeight={700}
                          fontSize={12}
                        >
                          {task.title}
                        </Typography>
                        <Typography
                          fontSize={11}
                          color="text.secondary"
                        >
                          {formatDate(task.date)}
                        </Typography>
                      </Box>

                      <Chip
                        size="small"
                        label={task.status.replace("_", " ")}
                        color={
                          task.status === "completed"
                            ? "success"
                            : task.status === "in_progress"
                              ? "info"
                              : "default"
                        }
                      />
                    </Box>
                  ))
              )}
            </Box>

            <Box className="toya-analytics-modal-actions">
              <CommonButton
                label="Close"
                variant="outlined"
                onClick={() =>
                  setSelectedEmployeeId(null)
                }
              />
            </Box>
          </Box>
        )}
      </CommonModal>
    </Box>
  );
}
