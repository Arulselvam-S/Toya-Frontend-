import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";

import {
  ClipboardList,
  Users,
  Clock3,
  CheckCircle2,
  Download,
  RefreshCw,
} from "lucide-react";

import CommonButton from "../../components/common/CommonButton";
import CommonTable from "../../components/common/CommonTable";
import { getAdminWorkLogs } from "../../api/adminWorkLogApi";

import "../../styles/admin/WorkLogs.css";

const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "Asia/Kolkata",
});

// ==========================================
// SUMMARY CARD
// ==========================================

function SummaryCard({ title, value, icon: Icon, description }) {
  return (
    <Paper elevation={0} className="toya-worklogs-stat">
      <Box className="toya-worklogs-stat-top">
        <Typography className="toya-worklogs-stat-label">
          {title}
        </Typography>

        <Box className="toya-worklogs-stat-icon">
          <Icon size={20} />
        </Box>
      </Box>

      <Typography className="toya-worklogs-stat-value">
        {value}
      </Typography>

      <Typography className="toya-worklogs-stat-description">
        {description}
      </Typography>
    </Paper>
  );
}

// ==========================================
// CSV HELPER
// ==========================================

function escapeCsv(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

// ==========================================
// MAIN WORK LOGS COMPONENT
// ==========================================

export default function WorkLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // ------------------------------------------
  // LOAD WORK LOGS
  // ------------------------------------------

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getAdminWorkLogs();

      const receivedLogs = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      setLogs(receivedLogs);
    } catch (err) {
      setError(err.message || "Unable to load work logs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // ------------------------------------------
  // FILTER OPTIONS
  // ------------------------------------------

  const employees = useMemo(
    () =>
      [
        ...new Set(
          logs.map((log) => log.employee).filter(Boolean)
        ),
      ].sort(),
    [logs]
  );

  const departments = useMemo(
    () =>
      [
        ...new Set(
          logs.map((log) => log.department).filter(Boolean)
        ),
      ].sort(),
    [logs]
  );

  // ------------------------------------------
  // FILTERED WORK LOGS
  // ------------------------------------------

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        if (
          employeeFilter !== "all" &&
          log.employee !== employeeFilter
        ) {
          return false;
        }

        if (
          departmentFilter !== "all" &&
          log.department !== departmentFilter
        ) {
          return false;
        }

        if (dateFilter && log.date !== dateFilter) {
          return false;
        }

        if (
          statusFilter !== "all" &&
          log.status !== statusFilter
        ) {
          return false;
        }

        return true;
      }),
    [
      logs,
      employeeFilter,
      departmentFilter,
      dateFilter,
      statusFilter,
    ]
  );

  // ------------------------------------------
  // SUMMARY STATISTICS
  // ------------------------------------------

  const summary = useMemo(() => {
    const totalHours = filteredLogs.reduce(
      (sum, log) => sum + (Number(log.hours) || 0),
      0
    );

    return {
      submissions: filteredLogs.length,

      employees: new Set(
        filteredLogs
          .map((log) => log.employeeId)
          .filter(Boolean)
      ).size,

      hours: totalHours,

      completed: filteredLogs.filter(
        (log) => log.status === "Completed"
      ).length,
    };
  }, [filteredLogs]);

  // ------------------------------------------
  // TABLE COLUMNS
  // ------------------------------------------

  const columns = useMemo(
    () => [
      {
        field: "employee",
        headerName: "Employee",
        minWidth: 150,
      },
      {
        field: "department",
        headerName: "Department",
        minWidth: 130,
      },
      {
        field: "title",
        headerName: "Work Activity",
        minWidth: 200,
      },
      {
        field: "date",
        headerName: "Work Date",
        minWidth: 120,
      },
      {
        field: "hours",
        headerName: "Hours",
        minWidth: 80,
        renderCell: (value) =>
          `${Number(value || 0).toFixed(2)} hrs`,
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 120,
        renderCell: (value) => (
          <Chip
            label={value || "Not Started"}
            size="small"
            color={
              value === "Completed"
                ? "success"
                : value === "In Progress"
                  ? "warning"
                  : "default"
            }
          />
        ),
      },
    ],
    []
  );

  // ------------------------------------------
  // EXPORT CSV
  // ------------------------------------------

  const exportCsv = () => {
    if (!filteredLogs.length) {
      setError(
        "There are no work logs to export for the selected filters."
      );
      return;
    }

    setError("");

    const headers = [
      "Employee",
      "Email",
      "Department",
      "Work Activity",
      "Description",
      "Work Date",
      "Hours",
      "Status",
    ];

    const rows = filteredLogs.map((log) => [
      log.employee,
      log.email,
      log.department,
      log.title,
      log.description,
      log.date,
      log.hours,
      log.status,
    ]);

    const csv = [
      headers.map(escapeCsv).join(","),
      ...rows.map((row) =>
        row.map(escapeCsv).join(",")
      ),
    ].join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `toya-work-logs-${today}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  };

  // ------------------------------------------
  // RESET FILTERS
  // ------------------------------------------

  const resetFilters = () => {
    setEmployeeFilter("all");
    setDepartmentFilter("all");
    setDateFilter("");
    setStatusFilter("all");
    setError("");
  };

  // ------------------------------------------
  // RENDER
  // ------------------------------------------

  return (
    <Box className="toya-worklogs-page">
      {/* PAGE HEADER */}

      <Box className="toya-worklogs-header">
        <Box>
          <Typography className="toya-worklogs-title">
            Daily Work Logs
          </Typography>

          <Typography className="toya-worklogs-subtitle">
            Review employee-submitted activities and working hours
          </Typography>
        </Box>

        <Box className="toya-worklogs-header-actions">
          <CommonButton
            label={loading ? "Loading..." : "Refresh"}
            variant="outlined"
            startIcon={<RefreshCw size={17} />}
            onClick={loadLogs}
            disabled={loading}
          />

          <CommonButton
            label="Export CSV"
            startIcon={<Download size={17} />}
            onClick={exportCsv}
            disabled={loading || filteredLogs.length === 0}
          />
        </Box>
      </Box>

      {/* ERROR MESSAGE */}

      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {/* SUMMARY CARDS */}

      <Box className="toya-worklogs-stats">
        <SummaryCard
          title="Total Submissions"
          value={summary.submissions}
          icon={ClipboardList}
          description="Matching work logs"
        />

        <SummaryCard
          title="Employees Reporting"
          value={summary.employees}
          icon={Users}
          description="Employees with matching logs"
        />

        <SummaryCard
          title="Reported Hours"
          value={summary.hours.toLocaleString(undefined, {
            maximumFractionDigits: 2,
          })}
          icon={Clock3}
          description="Combined reported hours"
        />

        <SummaryCard
          title="Completed Logs"
          value={summary.completed}
          icon={CheckCircle2}
          description="Marked as completed"
        />
      </Box>

      {/* FILTER PANEL */}

      <Paper
        elevation={0}
        className="toya-worklogs-filter-panel"
      >
        <Typography className="toya-worklogs-filter-title">
          Filter Work Logs
        </Typography>

        <Box className="toya-worklogs-filter-grid">
          <TextField
            select
            size="small"
            label="Employee"
            value={employeeFilter}
            onChange={(event) =>
              setEmployeeFilter(event.target.value)
            }
            fullWidth
          >
            <MenuItem value="all">All Employees</MenuItem>

            {employees.map((employee) => (
              <MenuItem key={employee} value={employee}>
                {employee}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            size="small"
            label="Department"
            value={departmentFilter}
            onChange={(event) =>
              setDepartmentFilter(event.target.value)
            }
            fullWidth
          >
            <MenuItem value="all">All Departments</MenuItem>

            {departments.map((department) => (
              <MenuItem key={department} value={department}>
                {department}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            size="small"
            label="Work Date"
            type="date"
            value={dateFilter}
            onChange={(event) =>
              setDateFilter(event.target.value)
            }
            slotProps={{
              inputLabel: { shrink: true },
            }}
            fullWidth
          />

          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value)
            }
            fullWidth
          >
            <MenuItem value="all">All Statuses</MenuItem>
            <MenuItem value="Not Started">Not Started</MenuItem>
            <MenuItem value="In Progress">In Progress</MenuItem>
            <MenuItem value="Completed">Completed</MenuItem>
          </TextField>
        </Box>

        <Box className="toya-worklogs-filter-actions">
          <CommonButton
            label="Clear Filters"
            variant="outlined"
            onClick={resetFilters}
          />
        </Box>
      </Paper>

      {/* WORK LOGS TABLE */}

      <Box className="toya-worklogs-table-panel">
        <Box className="toya-worklogs-table-heading">
          <Box>
            <Typography fontWeight={800} fontSize={16}>
              Employee Work Logs
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={12}
              sx={{ mt: 0.5 }}
            >
              Employee-submitted work activities and hours
            </Typography>
          </Box>

          <Chip
            label={`${filteredLogs.length} Records`}
            size="small"
            variant="outlined"
            color="primary"
          />
        </Box>

        {loading ? (
          <Box className="toya-worklogs-loading">
            <CircularProgress size={30} />

            <Typography color="text.secondary" fontSize={13}>
              Loading employee work logs...
            </Typography>
          </Box>
        ) : (
          <CommonTable
            columns={columns}
            rows={filteredLogs}
            loading={loading}
            searchable
            pagination
            pageSize={10}
            getRowId={(row) => row.id}
            emptyMessage={
              logs.length === 0
                ? "No employee work logs have been submitted yet."
                : "No work logs match the selected filters."
            }
          />
        )}
      </Box>
    </Box>
  );
}