
import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Typography,
  Avatar,
  Chip,
  Alert,
  Stack,
  TextField,
  MenuItem,
  CircularProgress,
} from "@mui/material";

import {
  Users,
  UserCheck,
  UserX,
  CalendarOff,
  Clock3,
  Download,
  RotateCcw,
  RefreshCw,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

import { getAdminAttendance } from "../../api/adminAttendanceApi";
import CommonButton from "../../components/common/CommonButton";
import CommonDatePicker from "../../components/common/CommonDatePicker";
import CommonPagination from "../../components/common/CommonPagination";
import CommonModal from "../../components/common/CommonModal";
import CommonTable from "../../components/common/CommonTable";

import "../../styles/admin/Attendance.css";

// ---------------------------------------
// FILTER OPTIONS
// ---------------------------------------

const DEPARTMENTS = [
  "All",
  "IT",
  "Marketing",
  "Finance",
  "HR",
  "Operations",
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "On Leave" },
  { value: "not_marked", label: "Not Marked" },
];

// ---------------------------------------
// DATE AND TIME HELPERS
// ---------------------------------------

function getToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function formatDate(value) {
  if (!value) return "—";

  const [year, month, day] = value.split("-").map(Number);

  return new Date(
    Date.UTC(year, month - 1, day)
  ).toLocaleDateString("en-IN", {
    timeZone: "UTC",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function calculateHours(start, end) {
  if (!start || !end) return "—";

  const parseTime = (value) => {
    const match = value.match(
      /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (!match) return null;

    let hours = Number(match[1]) % 12;

    if (match[3].toUpperCase() === "PM") {
      hours += 12;
    }

    return hours * 60 + Number(match[2]);
  };

  const startMinutes = parseTime(start);
  const endMinutes = parseTime(end);

  if (startMinutes === null || endMinutes === null) {
    return "—";
  }

  const minutes = endMinutes - startMinutes;

  if (minutes < 0) return "—";

  return `${Math.floor(minutes / 60)}h ${String(
    minutes % 60
  ).padStart(2, "0")}m`;
}

function statusLabel(status) {
  return {
    present: "Present",
    absent: "Absent",
    leave: "On Leave",
    not_marked: "Not Marked",
  }[status] || "Not Marked";
}

// ---------------------------------------
// ATTENDANCE BADGE
// ---------------------------------------

function AttendanceBadge({ status }) {
  return (
    <Chip
      label={statusLabel(status)}
      size="small"
      className={`toya-att-status status-${status}`}
    />
  );
}

// ---------------------------------------
// STAT CARD
// ---------------------------------------

function StatCard({
  label,
  value,
  Icon,
  tone,
  index,
  reduceMotion,
}) {
  return (
    <motion.div
      className={`toya-att-stat-card tone-${tone}`}
      initial={
        reduceMotion
          ? false
          : { opacity: 0, y: 18 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.07,
      }}
    >
      <Box className="toya-att-stat-icon">
        <Icon size={22} />
      </Box>

      <Typography className="toya-att-stat-value">
        {value}
      </Typography>

      <Typography className="toya-att-stat-label">
        {label}
      </Typography>
    </motion.div>
  );
}

// ---------------------------------------
// NORMALIZE API DATA
// ---------------------------------------

function normalizeAttendance(records, selectedDate) {
  return records.map((item) => ({
    ...item,
    id: item.id || item.employeeId,
    employeeId: item.employeeId || item.id,
    code: item.code || "",
    name: item.name || "Unnamed employee",
    email: item.email || "",
    department: item.department || "Unassigned",
    designation: item.designation || "",
    date: item.date || selectedDate,
    checkIn: formatTime(item.checkIn),
    checkOut: formatTime(item.checkOut),
    status: item.status || "not_marked",
  }));
}

// ---------------------------------------
// MAIN COMPONENT
// ---------------------------------------

export default function Attendance() {
  const reduceMotion = useReducedMotion();

  const [selectedDate, setSelectedDate] = useState(getToday);
  const [records, setRecords] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("All");
  const [status, setStatus] = useState("all");

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [selectedEmployeeId, setSelectedEmployeeId] =
    useState(null);

  const today = getToday();

  const isFutureDate =
    Boolean(selectedDate) && selectedDate > today;

  // ---------------------------------------
  // LOAD REAL ATTENDANCE FROM BACKEND
  // ---------------------------------------

  const loadAttendance = async (silent = false) => {
    if (!selectedDate) return;

    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const data = await getAdminAttendance(selectedDate);

      setRecords(normalizeAttendance(data, selectedDate));
    } catch (err) {
      setError(
        err.message || "Unable to load attendance records."
      );
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchAttendance() {
      setLoading(true);
      setError("");

      try {
        const data = await getAdminAttendance(selectedDate);

        if (!cancelled) {
          setRecords(
            normalizeAttendance(data, selectedDate)
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.message || "Unable to load attendance records."
          );
          setRecords([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchAttendance();

    return () => {
      cancelled = true;
    };
  }, [selectedDate]);

  // ---------------------------------------
  // ATTENDANCE ROWS
  // ---------------------------------------

  const attendanceRows = useMemo(() => {
    return records.map((row) => ({
      ...row,
      workingHours: calculateHours(
        row.checkIn,
        row.checkOut
      ),
    }));
  }, [records]);

  // ---------------------------------------
  // STATISTICS
  // ---------------------------------------

  const stats = useMemo(() => ({
    total: attendanceRows.length,

    present: attendanceRows.filter(
      (row) => row.status === "present"
    ).length,

    absent: attendanceRows.filter(
      (row) => row.status === "absent"
    ).length,

    leave: attendanceRows.filter(
      (row) => row.status === "leave"
    ).length,

    notMarked: attendanceRows.filter(
      (row) => row.status === "not_marked"
    ).length,
  }), [attendanceRows]);

  const attendanceRate = stats.total
    ? ((stats.present / stats.total) * 100).toFixed(1)
    : "0.0";

  // ---------------------------------------
  // SEARCH AND FILTERS
  // ---------------------------------------

  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();

    return attendanceRows.filter((row) => {
      const matchesText = [
        row.name,
        row.code,
        row.department,
        row.email,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      return (
        matchesText &&
        (department === "All" ||
          row.department === department) &&
        (status === "all" ||
          row.status === status)
      );
    });
  }, [attendanceRows, search, department, status]);

  // ---------------------------------------
  // PAGINATION
  // ---------------------------------------

  const totalPages = Math.max(
    1,
    Math.ceil(filteredRows.length / rowsPerPage)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleRows = filteredRows.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const selectedEmployee =
    attendanceRows.find(
      (row) => row.id === selectedEmployeeId
    ) || null;

  // ---------------------------------------
  // EXPORT CSV
  // ---------------------------------------

  const exportCSV = () => {
    const csvHeaders = [
      "Employee ID",
      "Employee Name",
      "Email",
      "Department",
      "Designation",
      "Date",
      "Status",
      "Check In",
      "Check Out",
      "Working Hours",
    ];

    const escapeCsv = (value) => {
      const safeValue = String(value ?? "").replace(
        /^\s*[=+\-@]/,
        "'$&"
      );

      return `"${safeValue.replace(/"/g, '""')}"`;
    };

    const csvRows = filteredRows.map((row) => [
      row.code,
      row.name,
      row.email,
      row.department,
      row.designation,
      selectedDate,
      statusLabel(row.status),
      row.checkIn || "",
      row.checkOut || "",
      calculateHours(row.checkIn, row.checkOut),
    ]);

    const csv = [csvHeaders, ...csvRows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const blob = new Blob(
      ["\uFEFF" + csv],
      { type: "text/csv;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `TOYA-Attendance-${selectedDate}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    window.setTimeout(
      () => URL.revokeObjectURL(url),
      1000
    );
  };

  // ---------------------------------------
  // COMMON TABLE COLUMNS
  // ---------------------------------------

  const columns = [
    {
      field: "code",
      headerName: "Employee ID",
      minWidth: 120,
      renderCell: (value) => value || "—",
    },
    {
      field: "name",
      headerName: "Employee",
      minWidth: 185,
      renderCell: (value, row) => (
        <Box className="toya-att-employee">
          <Avatar className="toya-att-avatar">
            {(value || "?").charAt(0).toUpperCase()}
          </Avatar>

          <Box>
            <Typography fontSize={13} fontWeight={700}>
              {value}
            </Typography>

            <Typography
              fontSize={11}
              color="text.secondary"
            >
              {row.email || row.code || "—"}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "department",
      headerName: "Department",
      minWidth: 115,
    },
    {
      field: "checkIn",
      headerName: "Check In",
      minWidth: 100,
      renderCell: (value) => value || "—",
    },
    {
      field: "checkOut",
      headerName: "Check Out",
      minWidth: 100,
      renderCell: (value) => value || "—",
    },
    {
      field: "workingHours",
      headerName: "Working Hours",
      minWidth: 115,
      sortable: false,
      renderCell: (_, row) =>
        calculateHours(row.checkIn, row.checkOut),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 125,
      renderCell: (value) => (
        <AttendanceBadge status={value} />
      ),
    },
  ];

  // ---------------------------------------
  // SUMMARY CARDS
  // ---------------------------------------

  const summaryCards = [
    {
      label: "Total Employees",
      value: stats.total,
      Icon: Users,
      tone: "blue",
    },
    {
      label: "Present",
      value: stats.present,
      Icon: UserCheck,
      tone: "green",
    },
    {
      label: "Absent",
      value: stats.absent,
      Icon: UserX,
      tone: "red",
    },
    {
      label: "On Leave",
      value: stats.leave,
      Icon: CalendarOff,
      tone: "orange",
    },
  ];

  // ---------------------------------------
  // UI
  // ---------------------------------------

  return (
    <Box className="toya-att-page">
      {/* PAGE HEADER */}

      <Box className="toya-att-heading">
        <Box>
          <Typography className="toya-att-title">
            Attendance Management
          </Typography>

          <Typography className="toya-att-subtitle">
            Monitor daily attendance, check-in and check-out
          </Typography>
        </Box>

        <Stack direction="row" spacing={1}>
          <CommonButton
            label={refreshing ? "Refreshing..." : "Refresh"}
            variant="outlined"
            startIcon={<RefreshCw size={17} />}
            disabled={loading || refreshing}
            onClick={() => loadAttendance(true)}
          />

          <CommonButton
            label="Export CSV"
            startIcon={<Download size={18} />}
            onClick={exportCSV}
            disabled={loading || filteredRows.length === 0}
          />
        </Stack>
      </Box>

      {/* ERROR MESSAGE */}

      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 3 }}
        >
          {error}
        </Alert>
      )}

      {isFutureDate && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Future attendance dates are read-only.
        </Alert>
      )}

      {/* STATISTICS */}

      <Box className="toya-att-stats">
        {summaryCards.map((card, index) => (
          <StatCard
            key={card.label}
            {...card}
            index={index}
            reduceMotion={reduceMotion}
          />
        ))}
      </Box>

      {/* ATTENDANCE RATE */}

      <Box className="toya-att-rate-panel">
        <Box>
          <Typography
            fontSize={13}
            color="text.secondary"
          >
            Attendance Rate
          </Typography>

          <Typography className="toya-att-rate-value">
            {attendanceRate}%
          </Typography>

          <Typography
            fontSize={12}
            color="text.secondary"
          >
            {formatDate(selectedDate)} · {stats.notMarked} not marked
          </Typography>
        </Box>

        <Box className="toya-att-rate-track">
          <Box
            className="toya-att-rate-progress"
            sx={{ width: `${attendanceRate}%` }}
          />
        </Box>
      </Box>

      {/* FILTERS */}

      <Box className="toya-att-filter-panel">
        <CommonDatePicker
          name="attendanceDate"
          label="Attendance Date"
          value={selectedDate}
          onChange={(date) => {
            if (!date) return;

            setSelectedDate(date);
            setSelectedEmployeeId(null);
            setPage(1);
          }}
          maxDate={today}
          size="small"
        />

        <TextField
          size="small"
          label="Search Employee"
          placeholder="Name or employee ID"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          fullWidth
        />

        <TextField
          select
          label="Department"
          size="small"
          value={department}
          onChange={(event) => {
            setDepartment(event.target.value);
            setPage(1);
          }}
          fullWidth
        >
          {DEPARTMENTS.map((item) => (
            <MenuItem key={item} value={item}>
              {item === "All"
                ? "All Departments"
                : item}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Status"
          size="small"
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          fullWidth
        >
          {STATUS_OPTIONS.map((item) => (
            <MenuItem
              key={item.value}
              value={item.value}
            >
              {item.label}
            </MenuItem>
          ))}
        </TextField>

        <CommonButton
          label="Reset"
          variant="outlined"
          startIcon={<RotateCcw size={17} />}
          onClick={() => {
            setSelectedDate(getToday());
            setSearch("");
            setDepartment("All");
            setStatus("all");
            setPage(1);
            setSelectedEmployeeId(null);
          }}
        />
      </Box>

      {/* ATTENDANCE TABLE */}

      <Box className="toya-att-table-section">
        {loading ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{ py: 7 }}
          >
            <CircularProgress size={30} />

            <Typography
              color="text.secondary"
              fontSize={13}
            >
              Loading attendance records...
            </Typography>
          </Stack>
        ) : (
          <>
            <CommonTable
              title={`Attendance Register — ${formatDate(selectedDate)}`}
              rows={visibleRows}
              columns={columns}
              searchable={false}
              pagination={false}
              getRowId={(row) => row.id}
              onView={(row) => setSelectedEmployeeId(row.id)}
              emptyMessage="No employees or attendance records found"
            />

            <CommonPagination
              page={currentPage}
              rowsPerPage={rowsPerPage}
              totalRecords={filteredRows.length}
              onPageChange={setPage}
              onRowsPerPageChange={(value) => {
                setRowsPerPage(value);
                setPage(1);
              }}
              rowsPerPageOptions={[5, 10, 25]}
            />
          </>
        )}
      </Box>

      {/* ATTENDANCE DETAILS MODAL — READ ONLY */}

      <CommonModal
        open={Boolean(selectedEmployee)}
        onClose={() => setSelectedEmployeeId(null)}
        title="Attendance Details"
        description="Employee attendance information"
        icon={<Clock3 size={20} />}
        maxWidth="sm"
        showFooter={false}
      >
        {selectedEmployee && (
          <Box className="toya-att-compact-modal">
            <Box className="toya-att-compact-profile">
              <Avatar className="toya-att-compact-avatar">
                {selectedEmployee.name.charAt(0).toUpperCase()}
              </Avatar>

              <Box className="toya-att-profile-text">
                <Typography fontWeight={750} fontSize={15}>
                  {selectedEmployee.name}
                </Typography>

                <Typography
                  fontSize={12}
                  color="text.secondary"
                >
                  {selectedEmployee.code} ·{" "}
                  {selectedEmployee.department}
                </Typography>

                {selectedEmployee.email && (
                  <Typography
                    fontSize={12}
                    color="text.secondary"
                  >
                    {selectedEmployee.email}
                  </Typography>
                )}
              </Box>

              <Box className="toya-att-compact-status">
                <AttendanceBadge
                  status={selectedEmployee.status}
                />
              </Box>
            </Box>

            <Box className="toya-att-compact-details">
              <Box className="toya-att-compact-row">
                <span>Date</span>
                <strong>{formatDate(selectedDate)}</strong>
              </Box>

              <Box className="toya-att-compact-row">
                <span>Designation</span>
                <strong>
                  {selectedEmployee.designation || "—"}
                </strong>
              </Box>

              <Box className="toya-att-compact-row">
                <span>Check In</span>
                <strong>
                  {selectedEmployee.checkIn || "—"}
                </strong>
              </Box>

              <Box className="toya-att-compact-row">
                <span>Check Out</span>
                <strong>
                  {selectedEmployee.checkOut || "—"}
                </strong>
              </Box>

              <Box className="toya-att-compact-row">
                <span>Working Hours</span>
                <strong>
                  {calculateHours(
                    selectedEmployee.checkIn,
                    selectedEmployee.checkOut
                  )}
                </strong>
              </Box>
            </Box>

            <Alert
              severity="info"
              sx={{ mt: 2, borderRadius: 2 }}
            >
              This is a read-only view. Attendance updates are
              recorded through the employee check-in/check-out
              workflow.
            </Alert>
          </Box>
        )}
      </CommonModal>
    </Box>
  );
}
