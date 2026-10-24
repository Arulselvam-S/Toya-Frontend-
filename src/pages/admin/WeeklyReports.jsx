
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Box,
  Typography,
  Avatar,
  Chip,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Stack,
} from "@mui/material";

import {
  FileText,
  Users,
  Clock3,
  CalendarCheck,
  Search,
  Eye,
  Download,
  RefreshCw,
  X,
  FilterX,
} from "lucide-react";

import { getAdminWorkLogs } from "../../api/adminWorkLogApi";
import { getAdminAttendance } from "../../api/adminAttendanceApi";

import "../../styles/admin/WeeklyReports.css";

// ---------------------------------------
// HELPERS
// ---------------------------------------

function formatDate(value) {
  if (!value) return "--";

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "--";

  return date.toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTime(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function hoursText(value) {
  const hours = Number(value || 0);
  return Number.isFinite(hours) ? hours.toFixed(2) : "0.00";
}

function getShiftDuration(attendance) {
  if (!attendance?.checkIn || !attendance?.checkOut) {
    return null;
  }

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

function attendanceStatusLabel(status) {
  if (status === "present" || status === "Present") {
    return "Present";
  }

  if (status === "absent" || status === "Absent") {
    return "Absent";
  }

  if (status === "leave" || status === "On Leave") {
    return "On Leave";
  }

  return "Not Marked";
}

function downloadCSV(rows) {
  const headings = [
    "Employee",
    "Email",
    "Department",
    "Work Date",
    "Work Title",
    "Description",
    "Work Status",
    "Reported Hours",
    "Attendance Status",
    "Check In",
    "Check Out",
    "Recorded Shift Hours",
  ];

  const csvEscape = (value) => {
    const safe = String(value ?? "").replace(
      /^\s*[=+\-@\t\r]/,
      "'$&"
    );

    return `"${safe.replace(/"/g, '""')}"`;
  };

  const records = rows.map((row) => [
    row.employeeName,
    row.email,
    row.department,
    row.date,
    row.title,
    row.description,
    row.status,
    row.hours,
    attendanceStatusLabel(row.attendance?.status),
    row.attendance?.checkIn || "",
    row.attendance?.checkOut || "",
    row.shiftHours ?? "",
  ]);

  const csv = [headings, ...records]
    .map((row) => row.map(csvEscape).join(","))
    .join("\r\n");

  const blob = new Blob(
    ["\uFEFF", csv],
    { type: "text/csv;charset=utf-8" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "TOYA-Employee-Work-Reports.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------
// SUMMARY CARD
// ---------------------------------------

function SummaryCard({ label, value, Icon, color }) {
  return (
    <Box className="tawr-stat">
      <Box className={`tawr-stat-icon ${color}`}>
        <Icon size={19} />
      </Box>

      <Typography className="tawr-stat-value">
        {value}
      </Typography>

      <Typography className="tawr-stat-label">
        {label}
      </Typography>
    </Box>
  );
}

// ---------------------------------------
// MAIN COMPONENT
// ---------------------------------------

export default function WeeklyReports() {
  const [workLogs, setWorkLogs] = useState([]);
  const [attendanceByDate, setAttendanceByDate] = useState({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [attendanceWarning, setAttendanceWarning] = useState("");

  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedId, setSelectedId] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ---------------------------------------
  // FETCH REAL WORK LOGS AND ATTENDANCE
  // ---------------------------------------

  const refresh = useCallback(async (silent = false) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    setAttendanceWarning("");

    try {
      const logs = await getAdminWorkLogs();

      const normalizedLogs = (Array.isArray(logs) ? logs : [])
        .map((log) => ({
          ...log,
          id: String(log.id),
          employeeId: String(log.employeeId || ""),
          employeeName:
            log.employee ||
            log.employeeName ||
            "Unknown Employee",
          email: log.email || "",
          department: log.department || "Not Assigned",
          date: log.date || "",
          title: log.title || "Untitled Work",
          description: log.description || "",
          status: log.status || "Not Started",
          hours: Number(log.hours || 0),
          submittedAt: log.submittedAt || null,
          updatedAt: log.updatedAt || null,
        }))
        .sort((a, b) => {
          const dateCompare = String(b.date).localeCompare(
            String(a.date)
          );

          if (dateCompare !== 0) return dateCompare;

          return String(b.submittedAt || b.id).localeCompare(
            String(a.submittedAt || a.id)
          );
        });

      setWorkLogs(normalizedLogs);

      // Fetch attendance for each distinct work-log date.
      const dates = [
        ...new Set(
          normalizedLogs
            .map((log) => log.date)
            .filter(Boolean)
        ),
      ];

      const nextAttendanceMap = {};
      let attendanceFailed = false;

      const attendanceResults = await Promise.all(
        dates.map(async (date) => {
          try {
            const records = await getAdminAttendance(date);
            return { date, records };
          } catch {
            attendanceFailed = true;
            return { date, records: null };
          }
        })
      );

      attendanceResults.forEach(({ date, records }) => {
        if (!records) return;

        records.forEach((record) => {
          const employeeId = String(
            record.employeeId || record.id || ""
          );

          const key = `${employeeId}-${date}`;

          nextAttendanceMap[key] = {
            ...record,
            status: attendanceStatusLabel(record.status),
            checkIn: formatTime(record.checkIn),
            checkOut: formatTime(record.checkOut),
            shiftHours: getShiftDuration(record),
          };
        });
      });

      setAttendanceByDate(nextAttendanceMap);

      if (attendanceFailed) {
        setAttendanceWarning(
          "Some attendance records could not be loaded. Work logs are still available."
        );
      }

      setLastUpdated(new Date());
    } catch (err) {
      setError(
        err.message || "Unable to load employee work reports."
      );
      setWorkLogs([]);
      setAttendanceByDate({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const handleFocus = () => refresh(true);
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [refresh]);

  // ---------------------------------------
  // COMBINE WORK LOGS WITH ATTENDANCE
  // ---------------------------------------

  const reports = useMemo(() => {
    return workLogs.map((log) => {
      const attendanceKey = `${log.employeeId}-${log.date}`;
      const attendance = attendanceByDate[attendanceKey] || null;

      return {
        ...log,
        attendance,
        shiftHours: attendance?.shiftHours ?? null,
      };
    });
  }, [workLogs, attendanceByDate]);

  // ---------------------------------------
  // EMPLOYEE FILTER OPTIONS
  // ---------------------------------------

  const employees = useMemo(() => {
    const uniqueEmployees = new Map();

    reports.forEach((report) => {
      if (!uniqueEmployees.has(report.employeeId)) {
        uniqueEmployees.set(report.employeeId, {
          id: report.employeeId,
          name: report.employeeName,
        });
      }
    });

    return [...uniqueEmployees.values()].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [reports]);

  // ---------------------------------------
  // FILTER REPORTS
  // ---------------------------------------

  const filteredReports = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reports.filter((report) => {
      const matchesSearch =
        !query ||
        [
          report.employeeName,
          report.email,
          report.department,
          report.title,
          report.description,
        ].some((value) =>
          String(value || "").toLowerCase().includes(query)
        );

      const matchesEmployee =
        employeeFilter === "all" ||
        String(report.employeeId) === employeeFilter;

      const matchesDate =
        !dateFilter || report.date === dateFilter;

      const matchesStatus =
        statusFilter === "all" ||
        report.status.toLowerCase() ===
          statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesEmployee &&
        matchesDate &&
        matchesStatus
      );
    });
  }, [
    reports,
    search,
    employeeFilter,
    dateFilter,
    statusFilter,
  ]);

  // ---------------------------------------
  // SUMMARY STATISTICS
  // ---------------------------------------

  const totalHours = filteredReports.reduce(
    (sum, report) => sum + Number(report.hours || 0),
    0
  );

  const employeesReported = new Set(
    filteredReports.map((report) => report.employeeId)
  ).size;

  const completedLogs = filteredReports.filter(
    (report) =>
      report.status.toLowerCase() === "completed"
  ).length;

  const selectedReport =
    reports.find(
      (report) => String(report.id) === String(selectedId)
    ) || null;

  function clearFilters() {
    setSearch("");
    setEmployeeFilter("all");
    setDateFilter("");
    setStatusFilter("all");
  }

  // ---------------------------------------
  // UI
  // ---------------------------------------

  return (
    <Box className="toya-admin-work-reports">
      {/* HEADER */}

      <Box className="tawr-header">
        <Box>
          <Typography className="tawr-title">
            Employee Work Reports
          </Typography>

          <Typography className="tawr-subtitle">
            Monitor employee daily work and attendance
          </Typography>
        </Box>

        <Box className="tawr-header-actions">
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={16} />}
            onClick={() => refresh(true)}
            disabled={loading || refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </Button>

          <Button
            variant="contained"
            startIcon={<Download size={16} />}
            onClick={() => downloadCSV(filteredReports)}
            disabled={
              loading || filteredReports.length === 0
            }
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* ERROR / ATTENDANCE WARNING */}

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      {attendanceWarning && !error && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
          {attendanceWarning}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
        Work hours are employee-reported. Recorded shift hours
        are calculated separately from check-in and check-out times.
      </Alert>

      {/* SUMMARY */}

      <Box className="tawr-stats">
        <SummaryCard
          label="Work Logs"
          value={filteredReports.length}
          Icon={FileText}
          color="blue"
        />

        <SummaryCard
          label="Employees Reported"
          value={employeesReported}
          Icon={Users}
          color="cyan"
        />

        <SummaryCard
          label="Reported Hours"
          value={hoursText(totalHours)}
          Icon={Clock3}
          color="orange"
        />

        <SummaryCard
          label="Completed Work Logs"
          value={completedLogs}
          Icon={CalendarCheck}
          color="green"
        />
      </Box>

      {/* FILTERS */}

      <Box className="tawr-filters">
        <TextField
          placeholder="Search employee or work..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          fullWidth
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={17} color="#7892ab" />
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          select
          label="Employee"
          value={employeeFilter}
          onChange={(event) =>
            setEmployeeFilter(event.target.value)
          }
          size="small"
          fullWidth
        >
          <MenuItem value="all">All Employees</MenuItem>

          {employees.map((employee) => (
            <MenuItem
              key={employee.id}
              value={String(employee.id)}
            >
              {employee.name}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          type="date"
          label="Work Date"
          value={dateFilter}
          onChange={(event) =>
            setDateFilter(event.target.value)
          }
          size="small"
          fullWidth
          slotProps={{
            inputLabel: { shrink: true },
          }}
        />

        <TextField
          select
          label="Work Status"
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          size="small"
          fullWidth
        >
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
          <MenuItem value="In Progress">In Progress</MenuItem>
          <MenuItem value="Not Started">Not Started</MenuItem>
        </TextField>

        <Button
          variant="outlined"
          startIcon={<FilterX size={16} />}
          onClick={clearFilters}
        >
          Clear
        </Button>
      </Box>

      {/* REPORTS */}

      <Box className="tawr-panel">
        <Box className="tawr-panel-header">
          <Box>
            <Typography fontWeight={800} fontSize={16}>
              Daily Work Submissions
            </Typography>

            <Typography fontSize={12} color="text.secondary">
              Employee-submitted work information
            </Typography>
          </Box>

          <Chip
            size="small"
            variant="outlined"
            label={`${filteredReports.length} Records`}
          />
        </Box>

        <Box className="tawr-table-scroll">
          <Box className="tawr-table-head">
            <span>Employee</span>
            <span>Work / Description</span>
            <span>Date</span>
            <span>Reported</span>
            <span>Attendance</span>
            <span>Action</span>
          </Box>

          {loading ? (
            <Stack
              alignItems="center"
              justifyContent="center"
              spacing={2}
              sx={{ py: 6 }}
            >
              <CircularProgress size={30} />
              <Typography fontSize={13} color="text.secondary">
                Loading work reports...
              </Typography>
            </Stack>
          ) : (
            <>
              {filteredReports.map((report) => (
                <Box
                  className="tawr-table-row"
                  key={`${report.employeeId}-${report.id}`}
                >
                  <Box className="tawr-employee">
                    <Avatar className="tawr-avatar">
                      {report.employeeName.charAt(0).toUpperCase()}
                    </Avatar>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontSize={13} fontWeight={750}>
                        {report.employeeName}
                      </Typography>

                      <Typography fontSize={11} color="text.secondary">
                        {report.department}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      fontWeight={700}
                      fontSize={13}
                      className="tawr-work-title"
                    >
                      {report.title}
                    </Typography>

                    <Typography
                      fontSize={11}
                      color="text.secondary"
                      className="tawr-description"
                    >
                      {report.description || "No description"}
                    </Typography>
                  </Box>

                  <Typography fontSize={12}>
                    {formatDate(report.date)}
                  </Typography>

                  <Box>
                    <Typography fontSize={13} fontWeight={800}>
                      {hoursText(report.hours)} hrs
                    </Typography>

                    <Typography fontSize={11} color="text.secondary">
                      Self-reported
                    </Typography>
                  </Box>

                  <Box>
                    <Chip
                      size="small"
                      label={attendanceStatusLabel(
                        report.attendance?.status
                      )}
                      color={
                        report.attendance?.status === "Present"
                          ? "success"
                          : "default"
                      }
                      variant="outlined"
                    />
                  </Box>

                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Eye size={15} />}
                    onClick={() => setSelectedId(report.id)}
                  >
                    View
                  </Button>
                </Box>
              ))}

              {filteredReports.length === 0 && (
                <Box className="tawr-empty">
                  <FileText size={30} />

                  <Typography fontWeight={750}>
                    No work reports found
                  </Typography>

                  <Typography fontSize={12} color="text.secondary">
                    Try clearing your filters or refreshing the page.
                  </Typography>
                </Box>
              )}
            </>
          )}
        </Box>
      </Box>

      <Typography className="tawr-updated">
        Last refreshed:{" "}
        {lastUpdated
          ? lastUpdated.toLocaleTimeString("en-IN", {
              timeZone: "Asia/Kolkata",
            })
          : "--"}
      </Typography>

      {/* DETAILS MODAL */}

      <Dialog
        open={Boolean(selectedReport)}
        onClose={() => setSelectedId(null)}
        fullWidth
        maxWidth="sm"
        slotProps={{
          paper: {
            className: "tawr-dialog-paper",
          },
        }}
      >
        {selectedReport && (
          <>
            <DialogTitle className="tawr-dialog-header">
              <Box>
                <Typography fontSize={17} fontWeight={800}>
                  Work Report Details
                </Typography>

                <Typography fontSize={12} color="text.secondary">
                  {formatDate(selectedReport.date)}
                </Typography>
              </Box>

              <IconButton
                onClick={() => setSelectedId(null)}
                aria-label="Close report details"
              >
                <X size={19} />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Box className="tawr-detail-person">
                <Avatar className="tawr-avatar">
                  {selectedReport.employeeName.charAt(0).toUpperCase()}
                </Avatar>

                <Box>
                  <Typography fontSize={14} fontWeight={800}>
                    {selectedReport.employeeName}
                  </Typography>

                  <Typography fontSize={12} color="text.secondary">
                    {selectedReport.department}
                  </Typography>

                  {selectedReport.email && (
                    <Typography fontSize={12} color="text.secondary">
                      {selectedReport.email}
                    </Typography>
                  )}
                </Box>
              </Box>

              <Box className="tawr-detail-section">
                <span>WORK TITLE</span>
                <strong>{selectedReport.title}</strong>

                <Chip
                  size="small"
                  label={selectedReport.status}
                  color={
                    selectedReport.status.toLowerCase() === "completed"
                      ? "success"
                      : "info"
                  }
                  variant="outlined"
                />
              </Box>

              <Box className="tawr-detail-section">
                <span>WORK DESCRIPTION</span>

                <Box className="tawr-detail-description">
                  {selectedReport.description ||
                    "No description provided."}
                </Box>
              </Box>

              <Box className="tawr-detail-grid">
                <Box>
                  <span>Reported Hours</span>
                  <strong>
                    {hoursText(selectedReport.hours)} hrs
                  </strong>
                </Box>

                <Box>
                  <span>Recorded Shift Hours</span>
                  <strong>
                    {selectedReport.shiftHours === null
                      ? "--"
                      : `${hoursText(selectedReport.shiftHours)} hrs`}
                  </strong>
                </Box>

                <Box>
                  <span>Check In</span>
                  <strong>
                    {selectedReport.attendance?.checkIn || "--"}
                  </strong>
                </Box>

                <Box>
                  <span>Check Out</span>
                  <strong>
                    {selectedReport.attendance?.checkOut || "--"}
                  </strong>
                </Box>
              </Box>

              {selectedReport.shiftHours !== null &&
                Number(selectedReport.hours || 0) >
                  selectedReport.shiftHours + 0.01 && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    Reported work hours exceed the recorded attendance
                    duration. Please verify this entry.
                  </Alert>
                )}

              <Box className="tawr-submitted">
                Submitted:{" "}
                {formatDateTime(selectedReport.submittedAt)}
              </Box>
            </DialogContent>

            <DialogActions className="tawr-dialog-actions">
              <Button
                variant="outlined"
                onClick={() => setSelectedId(null)}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
