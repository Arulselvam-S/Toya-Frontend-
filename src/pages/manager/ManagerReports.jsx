import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Chip,
  LinearProgress,
  Avatar,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Divider,
  Button,
} from "@mui/material";

import {
  ClipboardCheck,
  Clock3,
  CalendarCheck,
  ClipboardList,
  Download,
  RefreshCw,
  X,
} from "lucide-react";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

import CommonButton from "../../components/common/CommonButton";
import CommonDatePicker from "../../components/common/CommonDatePicker";
import CommonTable from "../../components/common/CommonTable";
import { getManagerReports } from "../../api/managerReportsApi";

import "../../styles/manager/ManagerReports.css";

const COLORS = ["#0879ed", "#73c9f1", "#e8eff7"];

function formatHours(value) {
  const hours = Number(value ?? 0);
  return Number.isFinite(hours) ? hours.toFixed(2) : "0.00";
}

function formatReportDate(value) {
  if (!value) return "Date not available";

  let dateValue = value;

  if (typeof value?.toDate === "function") {
    dateValue = value.toDate();
  } else if (typeof value === "object" && value.seconds) {
    dateValue = new Date(value.seconds * 1000);
  } else if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    dateValue = new Date(`${value}T00:00:00`);
  }

  const date = new Date(dateValue);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function formatTime(value) {
  if (!value) return "--";

  let dateValue = value;

  if (typeof value?.toDate === "function") {
    dateValue = value.toDate();
  } else if (typeof value === "object" && value.seconds) {
    dateValue = new Date(value.seconds * 1000);
  }

  if (dateValue instanceof Date) {
    return dateValue.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  if (typeof dateValue === "string") {
    // Keep already-formatted times such as "09:58 pm".
    if (/^\d{1,2}:\d{2}\s*(am|pm)$/i.test(dateValue.trim())) {
      return dateValue;
    }

    // A date/time string can be parsed as a Date.
    if (dateValue.includes("T")) {
      const date = new Date(dateValue);

      if (!Number.isNaN(date.getTime())) {
        return date.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
      }
    }

    return dateValue;
  }

  return String(dateValue);
}

function getDateKey(value) {
  if (!value) return "";

  if (typeof value === "string") {
    return value.length >= 10 ? value.slice(0, 10) : value;
  }

  if (typeof value?.toDate === "function") {
    return value.toDate().toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
  }

  if (typeof value === "object" && value.seconds) {
    return new Date(value.seconds * 1000).toLocaleDateString("en-CA", {
      timeZone: "Asia/Kolkata",
    });
  }

  return "";
}

function getShiftDuration(attendance) {
  if (!attendance?.checkIn || !attendance?.checkOut) return null;

  const start = new Date(attendance.checkIn).getTime();
  const end = new Date(attendance.checkOut).getTime();

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    end < start
  ) {
    return null;
  }

  return (end - start) / (1000 * 60 * 60);
}

function DetailItem({ label, value }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          color: "#819bb5",
          fontSize: 12,
          mb: 0.75,
        }}
      >
        {label}
      </Typography>

      <Box
        sx={{
          background: "#f5faff",
          border: "1px solid #e0edfa",
          borderRadius: 2,
          p: 2,
          minHeight: 52,
        }}
      >
        <Typography
          sx={{
            color: "#12315b",
            fontWeight: 700,
            overflowWrap: "anywhere",
            whiteSpace: "pre-wrap",
          }}
        >
          {value === undefined || value === null || value === ""
            ? "--"
            : String(value)}
        </Typography>
      </Box>
    </Box>
  );
}

function exportCSV(filename, headings, records) {
  const escape = (value) => {
    const safe = String(value ?? "").replace(/^\s*[=+\-@]/, "'$&");
    return `"${safe.replace(/"/g, '""')}"`;
  };

  const content = [headings, ...records]
    .map((row) => row.map(escape).join(","))
    .join("\r\n");

  const url = URL.createObjectURL(
    new Blob(["\uFEFF", content], {
      type: "text/csv;charset=utf-8",
    })
  );

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function StatCard({ label, value, Icon, tone }) {
  return (
    <Box className="tmr-stat">
      <Box className={`tmr-stat-icon ${tone}`}>
        <Icon size={20} />
      </Box>
      <Typography className="tmr-stat-value">{value}</Typography>
      <Typography className="tmr-stat-label">{label}</Typography>
    </Box>
  );
}

function isPresent(record) {
  const status = String(record?.status || "").toLowerCase();

  return (
    ["present", "checked-in", "checked-out"].includes(status) ||
    Boolean(record?.checkIn)
  );
}

function isPending(log) {
  return (
    String(log?.reviewStatus || "Pending").toLowerCase() === "pending"
  );
}

export default function ManagerReports() {
  const [employees, setEmployees] = useState([]);
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  // Selected work report and its matching attendance record.
  const [selectedReport, setSelectedReport] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getManagerReports({
        startDate,
        endDate,
      });

      if (!Array.isArray(result)) {
        throw new Error("Unexpected reports response from the backend.");
      }

      setEmployees(result);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || "Unable to load team reports.");
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredEmployees = useMemo(() => {
    if (employeeFilter === "all") return employees;

    return employees.filter(
      (employee) => String(employee.id) === String(employeeFilter)
    );
  }, [employees, employeeFilter]);

  const employeeRows = useMemo(
    () =>
      filteredEmployees.map((employee) => {
        const logs = Array.isArray(employee.worklogs)
          ? employee.worklogs
          : [];

        const attendance = Array.isArray(employee.attendance)
          ? employee.attendance
          : [];

        const totalHours = logs.reduce(
          (sum, log) => sum + Number(log.hours || 0),
          0
        );

        const presentDays = attendance.filter(isPresent).length;
        const pending = logs.filter(isPending).length;
        const reviewed = logs.length - pending;

        return {
          id: employee.id,
          name: employee.name || "Unnamed Employee",
          department: employee.department || "Not assigned",
          designation: employee.designation || "--",
          logCount: logs.length,
          hours: Number(totalHours.toFixed(2)),
          present: presentDays,
          pending,
          reviewProgress: logs.length
            ? Math.round((reviewed / logs.length) * 100)
            : 0,
        };
      }),
    [filteredEmployees]
  );

  const totalHours = employeeRows.reduce(
    (sum, employee) => sum + employee.hours,
    0
  );

  const presentRecords = employeeRows.reduce(
    (sum, employee) => sum + employee.present,
    0
  );

  const pendingReviews = employeeRows.reduce(
    (sum, employee) => sum + employee.pending,
    0
  );

  const totalLogs = employeeRows.reduce(
    (sum, employee) => sum + employee.logCount,
    0
  );

  const reviewedLogs = Math.max(totalLogs - pendingReviews, 0);

  const reviewRate = totalLogs
    ? Math.round((reviewedLogs / totalLogs) * 100)
    : 0;

  const chartData = employeeRows.map((employee) => ({
    employee: employee.name.split(" ")[0],
    hours: employee.hours,
  }));

  const reviewPieData = [
    { name: "Reviewed", value: reviewedLogs },
    { name: "Pending Review", value: pendingReviews },
  ];

  // Match the selected employee's work log with attendance for the same date.
  const openWorkReport = (employeeId) => {
    const employee = employees.find(
      (item) => String(item.id) === String(employeeId)
    );

    if (!employee) return;

    const logs = Array.isArray(employee.worklogs)
      ? employee.worklogs
      : [];

    if (!logs.length) return;

    // Open the most recent report first.
    const sortedLogs = [...logs].sort((a, b) =>
      String(b.date || b.submittedAt || b.id || "").localeCompare(
        String(a.date || a.submittedAt || a.id || "")
      )
    );

    const log = sortedLogs[0];
    const logDate = getDateKey(log.date || log.createdAt || log.id);

    const attendanceRecords = Array.isArray(employee.attendance)
      ? employee.attendance
      : [];

    const attendance =
      attendanceRecords.find((record) => {
        const attendanceDate = getDateKey(
          record.date || record.id || record.createdAt
        );

        return attendanceDate === logDate;
      }) || null;

    setSelectedReport({
      employee,
      log,
      attendance,
      shiftHours: getShiftDuration(attendance),
    });
  };

  const columns = [
    {
      field: "name",
      headerName: "Employee",
      minWidth: 190,
      renderCell: (value, row) => (
        <Box className="tmr-employee">
          <Avatar className="tmr-avatar">
            {value?.charAt(0)?.toUpperCase() || "E"}
          </Avatar>

          <Box>
            <Typography fontSize={13} fontWeight={700}>
              {value}
            </Typography>
            <Typography fontSize={11} color="text.secondary">
              {row.department}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "logCount",
      headerName: "Work Logs",
      minWidth: 100,
      renderCell: (value, row) => (
        <Button
          size="small"
          disabled={!value}
          onClick={() => openWorkReport(row.id)}
          sx={{
            minWidth: 28,
            p: 0.5,
            textTransform: "none",
            color: "#0879ed",
            fontWeight: 700,
            textDecoration: "underline",
            justifyContent: "flex-start",
          }}
        >
          {value}
        </Button>
      ),
    },
    {
      field: "hours",
      headerName: "Logged Hours",
      minWidth: 120,
      renderCell: (value) => formatHours(value),
    },
    {
      field: "present",
      headerName: "Attendance Days",
      minWidth: 135,
    },
    {
      field: "reviewProgress",
      headerName: "Reviewed",
      minWidth: 145,
      renderCell: (value) => (
        <Box className="tmr-progress-cell">
          <LinearProgress
            variant="determinate"
            value={value}
            sx={{ flex: 1, borderRadius: 5 }}
          />
          <Typography fontSize={11} fontWeight={700}>
            {value}%
          </Typography>
        </Box>
      ),
    },
    {
      field: "pending",
      headerName: "Pending Reviews",
      minWidth: 145,
      renderCell: (value) => (
        <Chip
          size="small"
          label={value}
          color={value > 0 ? "warning" : "success"}
          variant="outlined"
        />
      ),
    },
  ];

  const handleExport = () => {
    exportCSV(
      "TOYA-Manager-Report.csv",
      [
        "Employee",
        "Department",
        "Work Logs",
        "Logged Hours",
        "Attendance Days",
        "Reviewed %",
        "Pending Reviews",
      ],
      employeeRows.map((employee) => [
        employee.name,
        employee.department,
        employee.logCount,
        formatHours(employee.hours),
        employee.present,
        employee.reviewProgress,
        employee.pending,
      ])
    );
  };

  // Safely extract selected report fields.
  const employee = selectedReport?.employee;
  const log = selectedReport?.log;
  const attendance = selectedReport?.attendance;

  const status =
    log?.status || log?.workStatus || log?.reviewStatus || "Pending";

  const email =
    log?.email ||
    employee?.email ||
    employee?.workEmail ||
    "Email not available";

  const reportedHours =
    log?.hours ?? log?.reportedHours ?? log?.durationHours;

  const recordedHours =
    selectedReport?.shiftHours ??
    log?.recordedShiftHours ??
    log?.shiftHours ??
    log?.totalShiftHours;

  const checkIn =
    attendance?.checkIn ||
    attendance?.checkInTime ||
    log?.checkIn ||
    log?.checkInTime;

  const checkOut =
    attendance?.checkOut ||
    attendance?.checkOutTime ||
    log?.checkOut ||
    log?.checkOutTime;

  const reportDate =
    log?.date || log?.createdAt || log?.timestamp || log?.id;

  return (
    <Box className="toya-manager-reports">
      {/* HEADER */}
      <Box className="tmr-header">
        <Box>
          <Typography className="tmr-title">Team Reports</Typography>
          <Typography className="tmr-subtitle">
            Monitor team attendance, logged hours and work-log reviews
          </Typography>
        </Box>

        <Box className="tmr-actions">
          <CommonButton
            label="Refresh"
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={refresh}
            disabled={loading}
          />

          <CommonButton
            label="Export CSV"
            startIcon={<Download size={16} />}
            onClick={handleExport}
            disabled={loading || employeeRows.length === 0}
          />
        </Box>
      </Box>

      {/* FILTERS */}
      <Box className="tmr-filters">
        <TextField
          select
          size="small"
          label="Employee"
          value={employeeFilter}
          onChange={(event) => setEmployeeFilter(event.target.value)}
          fullWidth
        >
          <MenuItem value="all">All Employees</MenuItem>
          {employees.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.name || "Unnamed Employee"}
            </MenuItem>
          ))}
        </TextField>

        <CommonDatePicker
          name="reportStart"
          label="From Date"
          value={startDate}
          onChange={setStartDate}
          maxDate={endDate || undefined}
          size="small"
        />

        <CommonDatePicker
          name="reportEnd"
          label="To Date"
          value={endDate}
          onChange={setEndDate}
          minDate={startDate || undefined}
          size="small"
        />

        <CommonButton
          label="Clear Filters"
          variant="outlined"
          onClick={() => {
            setEmployeeFilter("all");
            setStartDate("");
            setEndDate("");
          }}
        />
      </Box>

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <CommonButton
              label="Retry"
              variant="outlined"
              onClick={refresh}
            />
          }
        >
          {error}
        </Alert>
      )}

      {loading && (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">
            Loading reports from backend...
          </Typography>
        </Box>
      )}

      {/* SUMMARY CARDS */}
      <Box className="tmr-stats">
        <StatCard
          label="Work Log Review Rate"
          value={`${reviewRate}%`}
          Icon={ClipboardCheck}
          tone="blue"
        />
        <StatCard
          label="Logged Hours"
          value={formatHours(totalHours)}
          Icon={Clock3}
          tone="cyan"
        />
        <StatCard
          label="Present Records"
          value={presentRecords}
          Icon={CalendarCheck}
          tone="green"
        />
        <StatCard
          label="Pending Reviews"
          value={pendingReviews}
          Icon={ClipboardList}
          tone="orange"
        />
      </Box>

      {/* CHARTS */}
      <Box className="tmr-chart-grid">
        <Box className="tmr-panel">
          <Box className="tmr-panel-heading">
            <Typography fontWeight={800}>
              Employee Productivity
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              Work hours logged per employee
            </Typography>
          </Box>

          <Box className="tmr-chart">
            {!loading && chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                >
                  <CartesianGrid
                    vertical={false}
                    strokeDasharray="4 4"
                    stroke="#e7eff8"
                  />
                  <XAxis
                    dataKey="employee"
                    tick={{ fontSize: 11 }}
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals />
                  <Tooltip />
                  <Bar
                    dataKey="hours"
                    name="Logged Hours"
                    fill="#0879ed"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={42}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box className="tmr-no-data">
                {loading ? "Loading chart..." : "No work-log data available"}
              </Box>
            )}
          </Box>
        </Box>

        <Box className="tmr-panel">
          <Box className="tmr-panel-heading">
            <Typography fontWeight={800}>
              Work Log Review Status
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              Reviewed and pending work logs
            </Typography>
          </Box>

          {!loading && totalLogs > 0 ? (
            <>
              <Box className="tmr-pie-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reviewPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      nameKey="name"
                      stroke="none"
                    >
                      {reviewPieData.map((item, index) => (
                        <Cell key={item.name} fill={COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              <Box className="tmr-legend">
                {reviewPieData.map((item, index) => (
                  <Box
                    key={item.name}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <span
                      className="tmr-legend-dot"
                      style={{ background: COLORS[index] }}
                    />
                    <Typography fontSize={12}>{item.name}</Typography>
                    <strong>{item.value}</strong>
                  </Box>
                ))}
              </Box>
            </>
          ) : (
            <Box className="tmr-no-data">
              {loading
                ? "Loading review data..."
                : "No work logs available for the selected filters"}
            </Box>
          )}
        </Box>
      </Box>

      {/* EMPLOYEE PERFORMANCE TABLE */}
      <Box className="tmr-panel tmr-table-panel">
        <Box className="tmr-panel-heading">
          <Typography fontWeight={800}>
            Employee Performance Report
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            Backend data for your department
          </Typography>
        </Box>

        <CommonTable
          title="Team Performance"
          columns={columns}
          rows={employeeRows}
          searchable
          pagination
          pageSize={5}
          getRowId={(row) => row.id}
          emptyMessage={
            loading ? "Loading employees..." : "No employees found"
          }
        />
      </Box>

      {/* WORK REPORT DETAILS — MATCHES ADMIN MODAL */}
      <Dialog
        open={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: "hidden",
            maxHeight: "92vh",
            width: "100%",
          },
        }}
      >
        {selectedReport && (
          <>
            <DialogTitle
              sx={{
                px: { xs: 2.5, sm: 4 },
                py: 2.5,
                background: "#f6fbff",
                borderBottom: "1px solid #e4edf6",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
              }}
            >
              <Box>
                <Typography
                  sx={{ fontSize: 20, fontWeight: 500, color: "#12315b" }}
                >
                  Work Report Details
                </Typography>
                <Typography
                  sx={{ fontSize: 17, color: "#12315b", mt: 0.25 }}
                >
                  {formatReportDate(reportDate)}
                </Typography>
              </Box>

              <IconButton
                aria-label="Close report details"
                onClick={() => setSelectedReport(null)}
                size="small"
              >
                <X size={22} />
              </IconButton>
            </DialogTitle>

            <DialogContent
              sx={{
                px: { xs: 2.5, sm: 4 },
                py: 3,
              }}
            >
              {/* EMPLOYEE DETAILS */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  py: 1,
                  mb: 2.5,
                }}
              >
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: "#e2f2ff",
                    color: "#0879ed",
                    fontWeight: 800,
                    fontSize: 25,
                  }}
                >
                  {(employee?.name || "E").charAt(0).toUpperCase()}
                </Avatar>

                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      color: "#12315b",
                      fontSize: 19,
                      fontWeight: 500,
                    }}
                  >
                    {employee?.name || "Unnamed Employee"}
                  </Typography>

                  <Typography sx={{ color: "#12315b" }}>
                    {employee?.department || "Department not assigned"}
                  </Typography>

                  <Typography
                    sx={{
                      color: "#12315b",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {email}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ mb: 2.5, borderColor: "#e5eef7" }} />

              {/* WORK TITLE */}
              <Typography
                sx={{
                  color: "#819bb5",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  mb: 1,
                }}
              >
                WORK TITLE
              </Typography>

              <Typography
                sx={{
                  color: "#12315b",
                  fontSize: 18,
                  fontWeight: 700,
                  mb: 1.25,
                }}
              >
                {log?.title ||
                  log?.workTitle ||
                  log?.taskTitle ||
                  log?.name ||
                  "Untitled work"}
              </Typography>

              <Chip
                label={status}
                size="small"
                variant="outlined"
                color={
                  String(status).toLowerCase() === "completed"
                    ? "success"
                    : String(status).toLowerCase() === "pending"
                      ? "warning"
                      : "default"
                }
                sx={{ mb: 2.5 }}
              />

              {/* WORK DESCRIPTION */}
              <Typography
                sx={{
                  color: "#819bb5",
                  fontSize: 12,
                  fontWeight: 800,
                  letterSpacing: 0.5,
                  mb: 1,
                }}
              >
                WORK DESCRIPTION
              </Typography>

              <Box
                sx={{
                  background: "#f5faff",
                  border: "1px solid #e0edfa",
                  borderRadius: 2,
                  p: 2,
                  mb: 2.5,
                  minHeight: 62,
                }}
              >
                <Typography
                  sx={{
                    color: "#496783",
                    whiteSpace: "pre-wrap",
                    overflowWrap: "anywhere",
                  }}
                >
                  {log?.description ||
                    log?.workDescription ||
                    log?.details ||
                    "No description provided."}
                </Typography>
              </Box>

              {/* HOURS AND ATTENDANCE */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                  },
                  gap: 1.75,
                }}
              >
                <DetailItem
                  label="Reported Hours"
                  value={
                    reportedHours !== undefined
                      ? `${formatHours(reportedHours)} hrs`
                      : "--"
                  }
                />

                <DetailItem
                  label="Recorded Shift Hours"
                  value={
                    recordedHours !== null && recordedHours !== undefined
                      ? `${formatHours(recordedHours)} hrs`
                      : "--"
                  }
                />

                <DetailItem
                  label="Check In"
                  value={formatTime(checkIn)}
                />

                <DetailItem
                  label="Check Out"
                  value={formatTime(checkOut)}
                />
              </Box>

              {selectedReport.shiftHours != null &&
                Number(reportedHours || 0) >
                  selectedReport.shiftHours + 0.01 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Reported work hours exceed the recorded attendance
                    duration. Please verify this entry.
                  </Alert>
                )}
            </DialogContent>

            <DialogActions
              sx={{
                px: { xs: 2.5, sm: 4 },
                py: 2,
                borderTop: "1px solid #e4edf6",
              }}
            >
              <Button
                variant="outlined"
                onClick={() => setSelectedReport(null)}
                sx={{
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  textTransform: "none",
                  fontWeight: 700,
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* FOOTER */}
      <Typography className="tmr-footer-note">
        {lastUpdated
          ? `Last updated ${lastUpdated.toLocaleTimeString("en-IN")}`
          : "Waiting for backend data"}
        {" · "}
        {employeeRows.length} employee(s)
        {" · "}
        {totalLogs} work log(s)
      </Typography>
    </Box>
  );
}