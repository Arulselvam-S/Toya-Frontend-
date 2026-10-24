
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  RefreshCw,
  Search,
  UserRoundX,
  Users,
} from "lucide-react";

import { getManagerTeamAttendance } from "../../api/attendanceApi";
import "../../styles/manager/ManagerAttendance.css";

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
}

function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function StatCard({ title, value, icon: Icon, color, background }) {
  return (
    <Paper className="attendance-stat-card" elevation={0}>
      <Box
        className="attendance-stat-icon"
        sx={{
          backgroundColor: background,
          color,
        }}
      >
        <Icon size={23} />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography className="attendance-stat-value" variant="h4">
          {value}
        </Typography>

        <Typography className="attendance-stat-label" variant="body2">
          {title}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function ManagerAttendance() {
  const [date, setDate] = useState(getLocalDateKey);
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAttendance = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      try {
        const result = await getManagerTeamAttendance(date);

        if (!result?.success) {
          throw new Error(
            result?.message || "Unable to load team attendance."
          );
        }

        setRows(Array.isArray(result.data) ? result.data : []);
      } catch (err) {
        setRows([]);
        setError(err.message || "Unable to load team attendance.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [date]
  );

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const presentCount = rows.filter(
    (employee) =>
      String(employee.status || "").toLowerCase() === "present"
  ).length;

  const notMarkedCount = Math.max(0, rows.length - presentCount);

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return rows;

    return rows.filter((employee) =>
      [
        employee.name,
        employee.employeeCode,
        employee.employeeId,
        employee.department,
        employee.designation,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      )
    );
  }, [rows, search]);

  function exportCSV() {
    if (!filteredRows.length) return;

    const headers = [
      "Employee Code",
      "Name",
      "Department",
      "Designation",
      "Date",
      "Status",
      "Check In",
      "Check Out",
    ];

    const escapeCSV = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csvRows = filteredRows.map((employee) => [
      employee.employeeCode || employee.employeeId || "",
      employee.name || "",
      employee.department || "",
      employee.designation || "",
      employee.date || date,
      String(employee.status || "").toLowerCase() === "present"
        ? "Present"
        : "Not Marked",
      formatTime(employee.checkIn),
      formatTime(employee.checkOut),
    ]);

    const csv = [headers, ...csvRows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `team-attendance-${date}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <Box className="toya-manager-attendance">
      {/* Page header */}
      <Stack
        className="attendance-header"
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
      >
        <Box>
          <Typography className="attendance-page-title" variant="h4">
            Team Attendance
          </Typography>

          <Typography className="attendance-page-subtitle" variant="body2">
            Review your team's check-in and check-out records.
          </Typography>
        </Box>

        <Stack
          className="attendance-header-actions"
          direction="row"
          spacing={1}
          flexWrap="wrap"
        >
          <Button
            variant="outlined"
            startIcon={
              refreshing ? (
                <CircularProgress size={16} />
              ) : (
                <RefreshCw size={17} />
              )
            }
            onClick={() => loadAttendance(true)}
            disabled={loading || refreshing}
          >
            Refresh
          </Button>

          <Button
            variant="contained"
            startIcon={<Download size={17} />}
            onClick={exportCSV}
            disabled={loading || filteredRows.length === 0}
          >
            Export CSV
          </Button>
        </Stack>
      </Stack>

      {/* Summary cards */}
      <Box className="attendance-stats">
        <StatCard
          title="Team Members"
          value={loading ? "—" : rows.length}
          icon={Users}
          color="#1677df"
          background="#e8f2ff"
        />

        <StatCard
          title="Present"
          value={loading ? "—" : presentCount}
          icon={CheckCircle2}
          color="#078653"
          background="#e3f8ed"
        />

        <StatCard
          title="Not Marked"
          value={loading ? "—" : notMarkedCount}
          icon={UserRoundX}
          color="#a66b00"
          background="#fff3dc"
        />
      </Box>

      {/* Search and date filters */}
      <Paper className="attendance-filters" elevation={0}>
        <Box className="attendance-filter-grid">
          <TextField
            fullWidth
            size="small"
            placeholder="Search employee, code or department"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} />
                </InputAdornment>
              ),
            }}
          />

          <TextField
            fullWidth
            size="small"
            type="date"
            label="Attendance date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            inputProps={{ max: getLocalDateKey() }}
            InputLabelProps={{ shrink: true }}
          />
        </Box>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          className="attendance-date-caption"
        >
          <CalendarDays size={15} />
          <Typography variant="caption">
            Attendance date: {formatDate(date)}
          </Typography>
        </Stack>
      </Paper>

      {/* Error message */}
      {error && (
        <Alert
          severity="error"
          className="attendance-error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => loadAttendance(true)}
              disabled={refreshing}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* Attendance table */}
      <Paper className="attendance-table-card" elevation={0}>
        <Box className="attendance-table-heading">
          <Typography variant="h6">Attendance Records</Typography>

          <Typography variant="body2">
            {loading
              ? "Loading attendance..."
              : `${filteredRows.length} employee record${
                  filteredRows.length === 1 ? "" : "s"
                }`}
          </Typography>
        </Box>

        {loading ? (
          <Stack
            alignItems="center"
            spacing={1.5}
            className="attendance-state"
          >
            <CircularProgress size={32} />
            <Typography variant="body2">
              Loading team attendance...
            </Typography>
          </Stack>
        ) : !error && filteredRows.length === 0 ? (
          <Stack
            alignItems="center"
            spacing={1.5}
            className="attendance-state"
          >
            <Avatar className="attendance-empty-avatar">
              <Users size={26} />
            </Avatar>

            <Typography className="attendance-empty-title">
              {rows.length === 0
                ? "No team members found"
                : "No matching employees"}
            </Typography>

            <Typography variant="body2">
              {rows.length === 0
                ? "Check whether active employee records match your department."
                : "Try another search term."}
            </Typography>
          </Stack>
        ) : !error ? (
          <TableContainer className="attendance-table-container">
            <Table className="attendance-table" sx={{ minWidth: 850 }}>
              <TableHead>
                <TableRow>
                  {[
                    "Employee",
                    "Department",
                    "Date",
                    "Check In",
                    "Check Out",
                    "Status",
                  ].map((heading) => (
                    <TableCell key={heading}>{heading}</TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {filteredRows.map((employee, index) => {
                  const isPresent =
                    String(employee.status || "").toLowerCase() ===
                    "present";

                  return (
                    <TableRow
                      key={
                        employee.id ||
                        employee.employeeId ||
                        employee.employeeCode ||
                        `${employee.name}-${index}`
                      }
                      hover
                    >
                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          <Avatar className="attendance-employee-avatar">
                            {(employee.name || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </Avatar>

                          <Box>
                            <Typography className="attendance-employee-name">
                              {employee.name || "Unnamed employee"}
                            </Typography>

                            <Typography
                              variant="caption"
                              className="attendance-employee-code"
                            >
                              {employee.employeeCode ||
                                employee.employeeId ||
                                "No employee ID"}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Typography variant="body2">
                          {employee.department || "—"}
                        </Typography>

                        {employee.designation && (
                          <Typography
                            variant="caption"
                            className="attendance-employee-code"
                          >
                            {employee.designation}
                          </Typography>
                        )}
                      </TableCell>

                      <TableCell>
                        {formatDate(employee.date || date)}
                      </TableCell>

                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={0.8}
                          alignItems="center"
                        >
                          <Clock3 size={15} />
                          {formatTime(employee.checkIn)}
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Stack
                          direction="row"
                          spacing={0.8}
                          alignItems="center"
                        >
                          <Clock3 size={15} />
                          {formatTime(employee.checkOut)}
                        </Stack>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="small"
                          label={isPresent ? "Present" : "Not Marked"}
                          className={
                            isPresent
                              ? "attendance-status-present"
                              : "attendance-status-unmarked"
                          }
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        ) : null}
      </Paper>
    </Box>
  );
}
