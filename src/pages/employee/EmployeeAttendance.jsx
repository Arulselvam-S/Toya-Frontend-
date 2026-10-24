
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
} from "@mui/material";

import {
  CalendarDays,
  LogIn,
  LogOut,
  Timer,
  Clock3,
  CheckCircle2,
  ClipboardList,
  ArrowRight,
} from "lucide-react";

import {
  getTodayAttendance,
  checkInAttendance,
  checkOutAttendance,
  getAttendanceHistory,
} from "../../api/attendanceApi";

import "../../styles/employee/EmployeeAttendance.css";

function timeText(value) {
  if (!value) return "--";

  return new Date(value).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function durationText(ms) {
  if (!Number.isFinite(ms)) return "00:00:00";

  const seconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function readableDate(value) {
  if (!value) return "--";

  const date = new Date(`${value}T00:00:00+05:30`);

  return date.toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function normalizeAttendance(record) {
  if (!record) return null;

  return {
    id: record.id || record.date,
    date: record.date,
    checkInAt: record.checkIn || null,
    checkOutAt: record.checkOut || null,
    checkIn: timeText(record.checkIn),
    checkOut: timeText(record.checkOut),
    status: record.status,
  };
}

function elapsed(shift, now) {
  if (!shift?.checkInAt) return 0;

  const start = new Date(shift.checkInAt).getTime();

  const end = shift.checkOutAt
    ? new Date(shift.checkOutAt).getTime()
    : now;

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }

  return Math.max(0, end - start);
}

function TimeCard({ label, value, Icon, tone }) {
  return (
    <Box className="tea-time-card">
      <Box className={`tea-time-icon ${tone}`}>
        <Icon size={20} />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography className="tea-time-label">
          {label}
        </Typography>

        <Typography className="tea-time-value">
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export default function EmployeeAttendance() {
  const navigate = useNavigate();

  const [todayShift, setTodayShift] = useState(null);
  const [history, setHistory] = useState([]);
  const [now, setNow] = useState(Date.now());

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const today = todayShift?.date ||
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

  const checkedIn = Boolean(todayShift?.checkInAt);
  const checkedOut = Boolean(todayShift?.checkOutAt);

  const shiftStatus = !checkedIn
    ? "Not Started"
    : checkedOut
      ? "Completed"
      : "Working";

  async function loadAttendance() {
    setError("");

    try {
      const [todayResult, historyResult] = await Promise.all([
        getTodayAttendance(),
        getAttendanceHistory(),
      ]);

      setTodayShift(normalizeAttendance(todayResult.attendance));

      setHistory(
        (historyResult.attendance || []).map(normalizeAttendance)
      );
    } catch (err) {
      setError(err.message || "Unable to load attendance.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAttendance();
  }, []);

  // Live timer while the employee is checked in.
  useEffect(() => {
    if (!checkedIn || checkedOut) return;

    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, [checkedIn, checkedOut]);

  async function handleCheckIn() {
    if (submitting || checkedIn) return;

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const result = await checkInAttendance();

      setTodayShift(normalizeAttendance(result.attendance));
      setMessage(result.message || "Check-in recorded successfully.");
      setNow(Date.now());

      await loadAttendance();
    } catch (err) {
      setError(err.message || "Unable to check in.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCheckOut() {
    if (submitting || !checkedIn || checkedOut) return;

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const result = await checkOutAttendance();

      setTodayShift(normalizeAttendance(result.attendance));
      setMessage(result.message || "Check-out recorded successfully.");
      setNow(Date.now());

      await loadAttendance();
    } catch (err) {
      setError(err.message || "Unable to check out.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleSubmitWorkLog() {
    if (!checkedOut) return;

    navigate("/employee/work-logs?openForm=true");
  }

  const completedShifts = history.filter(
    (shift) => Boolean(shift?.checkOutAt)
  ).length;

  return (
    <Box className="toya-employee-attendance">
      {/* Page header */}
      <Box className="tea-header">
        <Box>
          <Typography className="tea-title">
            My Attendance
          </Typography>

          <Typography className="tea-subtitle">
            Manage your daily shift and view attendance history
          </Typography>
        </Box>

        <Chip
          label={shiftStatus}
          variant="outlined"
          color={
            checkedOut
              ? "success"
              : checkedIn
                ? "info"
                : "default"
          }
        />
      </Box>

      {loading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={18} />
            Loading attendance from TOYA backend...
          </Box>
        </Alert>
      )}

      {error && (
        <Alert
          severity="error"
          onClose={() => setError("")}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {error}
        </Alert>
      )}

      {message && (
        <Alert
          severity="success"
          onClose={() => setMessage("")}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {message}
        </Alert>
      )}

      {/* Today's shift */}
      <Box className="tea-panel">
        <Box className="tea-panel-header">
          <Box className="tea-panel-heading">
            <Box className="tea-calendar-icon">
              <CalendarDays size={21} />
            </Box>

            <Box>
              <Typography fontWeight={800} fontSize={15}>
                Today's Shift
              </Typography>

              <Typography fontSize={12} color="text.secondary">
                {readableDate(today)}
              </Typography>
            </Box>
          </Box>

          <Box className="tea-status-indicator">
            <span
              className={
                checkedOut
                  ? "complete"
                  : checkedIn
                    ? "active"
                    : "inactive"
              }
            />
            {shiftStatus}
          </Box>
        </Box>

        {/* Time cards */}
        <Box className="tea-time-grid">
          <TimeCard
            label="Check In"
            value={todayShift?.checkIn || "--"}
            Icon={LogIn}
            tone="blue"
          />

          <TimeCard
            label="Check Out"
            value={todayShift?.checkOut || "--"}
            Icon={LogOut}
            tone="orange"
          />

          <TimeCard
            label="Working Duration"
            value={
              checkedIn
                ? durationText(elapsed(todayShift, now))
                : "00:00:00"
            }
            Icon={Timer}
            tone="cyan"
          />
        </Box>

        {/* Actions */}
        <Box className="tea-actions">
          <Button
            variant="contained"
            startIcon={<LogIn size={17} />}
            disabled={loading || submitting || checkedIn}
            onClick={handleCheckIn}
            className="tea-check-in"
          >
            {submitting && !checkedIn ? "Processing..." : "Check In"}
          </Button>

          <Button
            variant="outlined"
            color="error"
            startIcon={<LogOut size={17} />}
            disabled={loading || submitting || !checkedIn || checkedOut}
            onClick={handleCheckOut}
            className="tea-check-out"
          >
            {submitting && checkedIn && !checkedOut
              ? "Processing..."
              : "Check Out"}
          </Button>

          {checkedOut && (
            <Button
              variant="outlined"
              endIcon={<ArrowRight size={16} />}
              startIcon={<ClipboardList size={16} />}
              onClick={handleSubmitWorkLog}
              className="tea-log-button"
            >
              Submit Work Log
            </Button>
          )}
        </Box>

        {/* Shift status */}
        <Box
          className={`tea-shift-message ${
            checkedOut
              ? "success"
              : checkedIn
                ? "working"
                : "waiting"
          }`}
        >
          {checkedOut ? (
            <CheckCircle2 size={18} />
          ) : (
            <Clock3 size={18} />
          )}

          <Typography fontSize={12}>
            {!checkedIn
              ? "Your shift has not started. Check in to begin."
              : checkedOut
                ? "Your shift is complete. You can now submit today's work log."
                : "Shift in progress. Check out when your work is complete."}
          </Typography>
        </Box>
      </Box>

      {/* Attendance history */}
      <Box className="tea-panel">
        <Box className="tea-history-header">
          <Box>
            <Typography fontWeight={800} fontSize={16}>
              Attendance History
            </Typography>

            <Typography fontSize={12} color="text.secondary">
              Previous attendance and working hours
            </Typography>
          </Box>

          <Chip
            label={`${completedShifts} Completed`}
            size="small"
            color="success"
            variant="outlined"
          />
        </Box>

        <Box className="tea-history-table">
          <Box className="tea-history-columns">
            <span>Date</span>
            <span>Check In</span>
            <span>Check Out</span>
            <span>Duration</span>
            <span>Status</span>
          </Box>

          {loading ? (
            <Box className="tea-empty">
              Loading attendance history...
            </Box>
          ) : history.length === 0 ? (
            <Box className="tea-empty">
              No attendance records yet.
            </Box>
          ) : (
            history.map((shift) => (
              <Box
                key={shift.id}
                className="tea-history-row"
              >
                <Typography fontSize={12} fontWeight={700}>
                  {readableDate(shift.date)}
                </Typography>

                <Typography fontSize={12}>
                  {shift.checkIn || "--"}
                </Typography>

                <Typography fontSize={12}>
                  {shift.checkOut || "--"}
                </Typography>

                <Typography
                  fontSize={12}
                  fontWeight={700}
                  sx={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {shift.checkOutAt
                    ? durationText(elapsed(shift, now))
                    : shift.checkInAt
                      ? durationText(elapsed(shift, now))
                      : "--"}
                </Typography>

                <Box>
                  <Chip
                    label={
                      shift.checkOutAt
                        ? "Completed"
                        : "Working"
                    }
                    color={shift.checkOutAt ? "success" : "info"}
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Box>
            ))
          )}
        </Box>
      </Box>
    </Box>
  );
}
