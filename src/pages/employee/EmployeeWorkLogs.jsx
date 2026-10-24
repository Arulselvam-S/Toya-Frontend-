
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  Alert,
  Chip,
  Stack,
  Card,
  CardContent,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
} from "@mui/material";

import {
  Plus,
  Save,
  Pencil,
  Trash2,
  ClipboardList,
  Clock3,
  CalendarDays,
  CheckCircle2,
  ArrowLeft,
  Search,
  Eye,
  X,
  History,
  FilterX,
  FileText,
} from "lucide-react";

import { getToday } from "../../mocks/workspaceData";
import {
  getWorkLogs,
  submitWorkLog,
  updateWorkLog,
  deleteWorkLog,
} from "../../api/workLogApi";
import { getTodayAttendance } from "../../api/attendanceApi";

import "../../styles/workspace/WorkspacePage.css";
import "../../styles/employee/EmployeeWorkLogs.css";

// =============================================
// TOYA — EMPLOYEE WORK LOGS
// API-backed using the authenticated employee.
// =============================================

const WORK_STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
];

// =============================================
// HELPERS
// =============================================

function emptyForm() {
  return {
    title: "",
    description: "",
    hours: "",
    status: "Completed",
  };
}

function localDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getShiftHours(shift) {
  if (!shift?.checkInAt || !shift?.checkOutAt) return 0;

  const start = new Date(shift.checkInAt).getTime();
  const end = new Date(shift.checkOutAt).getTime();

  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return 0;
  }

  return Math.max(0, (end - start) / 3600000);
}

function formatDuration(hours) {
  const seconds = Math.max(
    0,
    Math.floor(Number(hours || 0) * 3600)
  );

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  return [h, m, s]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

function formatDate(value) {
  if (!value) return "--";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString("en-IN", {
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
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusColor(status) {
  if (status === "Completed") return "success";
  if (status === "In Progress") return "info";
  return "default";
}

function totalHours(records) {
  return records.reduce(
    (sum, record) => sum + Number(record.hours || 0),
    0
  );
}

// =============================================
// COMPONENT
// =============================================

export default function EmployeeWorkLogs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const formRef = useRef(null);
  const today = getToday();

  // API-backed data
  const [logs, setLogs] = useState([]);
  const [todayShift, setTodayShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Feedback
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // History filters
  const [period, setPeriod] = useState("all");
  const [search, setSearch] = useState("");
  const [customDate, setCustomDate] = useState("");

  // Details modal
  const [selectedId, setSelectedId] = useState(null);

  // =============================================
  // ATTENDANCE + API DATA
  // =============================================

  const checkedIn = Boolean(todayShift?.checkInAt);
  const checkedOut = Boolean(todayShift?.checkOutAt);
  const shiftHours = getShiftHours(todayShift);

  async function refreshPageData(showLoader = true) {
    if (showLoader) setLoading(true);

    try {
      const [workLogResult, attendanceResult] = await Promise.all([
        getWorkLogs(),
        getTodayAttendance(),
      ]);

      setLogs(Array.isArray(workLogResult?.data) ? workLogResult.data : []);

      const attendance = attendanceResult?.attendance ?? null;
      setTodayShift(
        attendance
          ? {
              ...attendance,
              checkInAt: attendance.checkIn ?? null,
              checkOutAt: attendance.checkOut ?? null,
            }
          : null
      );
      setError("");
    } catch (err) {
      setError(err.message || "Unable to load your work logs.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    refreshPageData();
  }, []);

  // =============================================
  // AUTO OPEN FROM ATTENDANCE
  // =============================================

  const openFormRequested =
    searchParams.get("openForm") === "true";

  useEffect(() => {
    if (!openFormRequested || loading) return;

    if (checkedOut) {
      setEditingId(null);
      setForm(emptyForm());
      setError("");
      setSuccess("");
      setShowForm(true);
    } else {
      setError(
        checkedIn
          ? "Please complete Check Out before submitting your work."
          : "Please Check In before submitting daily work."
      );
    }

    const next = new URLSearchParams(searchParams);
    next.delete("openForm");
    setSearchParams(next, { replace: true });
  }, [
    openFormRequested,
    loading,
    checkedIn,
    checkedOut,
    searchParams,
    setSearchParams,
  ]);

  // Scroll to form after opening
  useEffect(() => {
    if (!showForm) return;

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [showForm]);

  // =============================================
  // MY WORK LOG HISTORY
  // =============================================

  const myLogs = [...logs].sort((a, b) => {
      const dateCompare = String(b.date || "").localeCompare(
        String(a.date || "")
      );

      if (dateCompare !== 0) return dateCompare;

      return Number(b.id) - Number(a.id);
    });

  const todayLogs = myLogs.filter(
    (log) => log.date === today
  );

  const filteredLogs = myLogs.filter((log) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      String(log.title || "").toLowerCase().includes(query) ||
      String(log.description || "").toLowerCase().includes(query);

    let matchesDate = true;

    if (period === "today") {
      matchesDate = log.date === today;
    } else if (period === "week") {
      matchesDate =
        log.date >= localDateDaysAgo(6) &&
        log.date <= today;
    } else if (period === "month") {
      matchesDate =
        log.date >= localDateDaysAgo(29) &&
        log.date <= today;
    } else if (period === "custom") {
      matchesDate =
        Boolean(customDate) && log.date === customDate;
    }

    return matchesSearch && matchesDate;
  });

  const selectedLog = myLogs.find(
    (log) => String(log.id) === String(selectedId)
  );

  // =============================================
  // FORM ACTIONS
  // =============================================

  function updateField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setError("");
  }

  function openAdd() {
    if (!checkedOut) {
      setError("Please Check Out before adding a work log.");
      return;
    }

    setEditingId(null);
    setForm(emptyForm());
    setSuccess("");
    setError("");
    setShowForm(true);
  }

  function openEdit(log) {
    if (!checkedOut || log.date !== today) {
      return;
    }

    setEditingId(log.id);
    setForm({
      title: log.title || "",
      description: log.description || "",
      hours: String(log.hours ?? ""),
      status: log.status || "Completed",
    });

    setSuccess("");
    setError("");
    setShowForm(true);
  }

  function cancelForm() {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setShowForm(false);
  }

  // =============================================
  // SAVE WORK LOG
  // =============================================

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!checkedIn) {
      setError("Please Check In before submitting daily work.");
      return;
    }

    if (!checkedOut) {
      setError("Complete Check In and Check Out before submitting.");
      return;
    }

    const title = form.title.trim();
    const description = form.description.trim();
    const hours = Number(form.hours);

    if (!title || !description) {
      setError("Work title and description are required.");
      return;
    }

    if (title.length > 150 || description.length > 5000) {
      setError("Title must be 150 characters or fewer and description 5000 or fewer.");
      return;
    }

    if (
      !form.hours.trim() ||
      !Number.isFinite(hours) ||
      hours <= 0 ||
      hours > 24
    ) {
      setError("Enter valid work hours between 0.01 and 24.");
      return;
    }

    if (!WORK_STATUSES.includes(form.status)) {
      setError("Please select a valid work status.");
      return;
    }

    // Exclude the current record when editing so its previous hours
    // are not counted twice. The daily total cannot exceed attendance.
    const todayHoursExceptEditing = logs
      .filter(
        (log) =>
          log.date === today &&
          String(log.id) !== String(editingId)
      )
      .reduce(
        (sum, log) => sum + Number(log.hours || 0),
        0
      );

    if (shiftHours <= 0) {
      setError(
        "Unable to calculate attendance hours. Please check your attendance record."
      );
      return;
    }

    const newDailyTotal = todayHoursExceptEditing + hours;

    if (newDailyTotal > shiftHours + 0.000001) {
      const remainingHours = Math.max(
        0,
        shiftHours - todayHoursExceptEditing
      );

      setError(
        `Work-log hours cannot exceed attendance hours. You can add up to ${remainingHours.toFixed(2)} more hours.`
      );
      return;
    }

    const payload = { title, description, hours, status: form.status };

    setSaving(true);
    try {
      if (editingId !== null) {
        await updateWorkLog(editingId, payload);
        setSuccess("Work log updated successfully.");
      } else {
        await submitWorkLog(payload);
        setSuccess("Work log submitted successfully.");
      }

      await refreshPageData(false);
      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm());
    } catch (err) {
      setError(err.message || "Unable to save work log.");
    } finally {
      setSaving(false);
    }
  }

  // =============================================
  // DELETE WORK LOG
  // =============================================

  async function handleDelete(id) {
    const record = logs.find((log) => String(log.id) === String(id));

    if (!record || !checkedOut || record.date !== today) {
      setError("Only today's work logs can be deleted after check-out.");
      return;
    }

    if (!window.confirm(`Delete "${record.title}"?`)) return;

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      await deleteWorkLog(id);
      await refreshPageData(false);

      if (String(selectedId) === String(id)) setSelectedId(null);
      if (String(editingId) === String(id)) cancelForm();

      setSuccess("Work log deleted successfully.");
    } catch (err) {
      setError(err.message || "Unable to delete work log.");
    } finally {
      setSaving(false);
    }
  }

  function clearFilters() {
    setSearch("");
    setPeriod("all");
    setCustomDate("");
  }

  // =============================================
  // UI
  // =============================================

  return (
    <Box className="toya-workspace toya-ewl">
      {/* HEADER */}
      <Box className="toya-workspace-header">
        <Box>
          <Typography className="toya-workspace-title">
            Daily Work Logs
          </Typography>

          <Typography fontSize={13} color="text.secondary">
            Submit daily work and review your previous logs
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<Plus size={17} />}
          onClick={openAdd}
          disabled={!checkedOut}
          className="toya-ewl-primary-btn"
        >
          Add Work Log
        </Button>
      </Box>

      {/* ATTENDANCE STATUS */}
      {!checkedIn && (
        <Alert
          severity="warning"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button
              size="small"
              onClick={() =>
                navigate("/employee/attendance")
              }
            >
              Attendance
            </Button>
          }
        >
          Please Check In before submitting daily work.
        </Alert>
      )}

      {checkedIn && !checkedOut && (
        <Alert
          severity="info"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <Button
              size="small"
              onClick={() =>
                navigate("/employee/attendance")
              }
            >
              Check Out
            </Button>
          }
        >
          Your shift is active. Check Out to submit work.
        </Alert>
      )}

      {checkedOut && (
        <Box className="toya-ewl-shift-info">
          <CheckCircle2 size={20} color="#0c9b70" />
          <Box>
            <Typography fontWeight={700} fontSize={13}>
              Today's shift completed
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              Recorded duration: {formatDuration(shiftHours)}
              {" · "}
              Work-log hours are checked against your attendance duration.
            </Typography>
          </Box>
        </Box>
      )}

      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {success}
        </Alert>
      )}

      {loading && (
        <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
          Loading your work logs and attendance...
        </Alert>
      )}

      {/* STATS */}
      <Box className="toya-workspace-stats">
        <Box>
          <span>Today's Work Logs</span>
          <strong>{todayLogs.length}</strong>
        </Box>
        <Box>
          <span>Attendance Hours</span>
          <strong>{checkedOut ? shiftHours.toFixed(2) : "--"}</strong>
        </Box>
        <Box>
          <span>Today's Work-Log Hours</span>
          <strong>{totalHours(todayLogs).toFixed(2)}</strong>
        </Box>
        <Box>
          <span>Total History Hours</span>
          <strong>{totalHours(myLogs).toFixed(2)}</strong>
        </Box>
      </Box>

      {/* ATTENDANCE / WORK-LOG HOURS COMPARISON */}
      {checkedOut && (
        <Alert
          severity={
            Math.abs(totalHours(todayLogs) - shiftHours) < 0.01
              ? "success"
              : totalHours(todayLogs) > shiftHours
                ? "error"
                : "warning"
          }
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {Math.abs(totalHours(todayLogs) - shiftHours) < 0.01
            ? `Hours matched: attendance and work logs both total ${shiftHours.toFixed(2)} hours.`
            : totalHours(todayLogs) > shiftHours
              ? `Work-log total exceeds attendance by ${(totalHours(todayLogs) - shiftHours).toFixed(2)} hours.`
              : `${Math.max(0, shiftHours - totalHours(todayLogs)).toFixed(2)} hours remaining to match your ${shiftHours.toFixed(2)} attendance hours.`}
        </Alert>
      )}

      {/* SUBMISSION FORM */}
      {showForm && (
        <Card
          ref={formRef}
          className="toya-ewl-form-card"
        >
          <CardContent sx={{ p: { xs: 2, md: 3 } }}>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              mb={2.5}
            >
              <ClipboardList size={20} color="#0879ed" />
              <Typography fontSize={17} fontWeight={800}>
                {editingId === null
                  ? "Submit Daily Work"
                  : "Edit Daily Work"}
              </Typography>
            </Stack>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSave}
              className="toya-workspace-form"
            >
              <TextField
                label="Task / Work Title"
                placeholder="Example: Website Development"
                value={form.title}
                onChange={(event) =>
                  updateField("title", event.target.value)
                }
                required
                fullWidth
                size="small"
                slotProps={{
                  htmlInput: { maxLength: 150 },
                }}
              />

              <TextField
                label="Work Description"
                placeholder="Describe what you worked on"
                value={form.description}
                onChange={(event) =>
                  updateField("description", event.target.value)
                }
                required
                fullWidth
                multiline
                minRows={3}
                size="small"
                slotProps={{
                  htmlInput: { maxLength: 5000 },
                }}
              />

              <Box className="toya-workspace-form-grid">
                <TextField
                  label="Hours Spent"
                  type="number"
                  value={form.hours}
                  onChange={(event) =>
                    updateField("hours", event.target.value)
                  }
                  helperText={`Attendance: ${shiftHours.toFixed(2)} hrs · Remaining: ${Math.max(0, shiftHours - logs.filter((log) => log.date === today && String(log.id) !== String(editingId)).reduce((sum, log) => sum + Number(log.hours || 0), 0)).toFixed(2)} hrs`}
                  required
                  fullWidth
                  size="small"
                  slotProps={{
                    htmlInput: {
                      min: 0.01,
                      max: 24,
                      step: 0.01,
                    },
                  }}
                />

                <TextField
                  select
                  label="Work Status"
                  value={form.status}
                  onChange={(event) =>
                    updateField("status", event.target.value)
                  }
                  fullWidth
                  size="small"
                >
                  {WORK_STATUSES.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Stack
                direction={{ xs: "column-reverse", sm: "row" }}
                justifyContent="flex-end"
                spacing={1.5}
              >
                <Button
                  variant="outlined"
                  startIcon={<ArrowLeft size={15} />}
                  onClick={cancelForm}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save size={16} />}
                  className="toya-ewl-primary-btn"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingId === null
                      ? "Save Work Log"
                      : "Update Work Log"}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      {!showForm && error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* HISTORY */}
      <Box className="toya-workspace-table">
        <Box className="toya-ewl-history-header">
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <History size={20} color="#0879ed" />
              <Typography fontSize={17} fontWeight={800}>
                My Work Log History
              </Typography>
            </Stack>
            <Typography fontSize={12} color="text.secondary" mt={0.5}>
              Search and view previous work submissions
            </Typography>
          </Box>

          <Chip
            size="small"
            variant="outlined"
            label={`${myLogs.length} Logs`}
          />
        </Box>

        <Box className="toya-ewl-history-filters">
          <TextField
            size="small"
            fullWidth
            placeholder="Search title or description..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
            fullWidth
            size="small"
            label="Period"
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
          >
            <MenuItem value="all">All Logs</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">Last 7 Days</MenuItem>
            <MenuItem value="month">Last 30 Days</MenuItem>
            <MenuItem value="custom">Custom Date</MenuItem>
          </TextField>

          {period === "custom" && (
            <TextField
              type="date"
              size="small"
              fullWidth
              label="Select Date"
              value={customDate}
              onChange={(event) =>
                setCustomDate(event.target.value)
              }
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}

          <Button
            variant="outlined"
            startIcon={<FilterX size={16} />}
            onClick={clearFilters}
          >
            Clear
          </Button>
        </Box>

        <Typography
          fontSize={12}
          color="text.secondary"
          mb={2}
        >
          Showing {filteredLogs.length} of {myLogs.length} work logs
        </Typography>

        {filteredLogs.length === 0 ? (
          <Box className="toya-ewl-empty">
            <History size={30} />
            <Typography fontWeight={700}>
              No work logs found
            </Typography>
            <Typography fontSize={12} color="text.secondary">
              Try changing the date or search keyword.
            </Typography>
          </Box>
        ) : (
          filteredLogs.map((log) => {
            const canEdit =
              checkedOut && log.date === today;

            return (
              <Box className="toya-ewl-log-row" key={log.id}>
                <Box className="toya-ewl-log-top">
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      fontSize={14}
                      fontWeight={800}
                      className="toya-ewl-log-title"
                    >
                      {log.title}
                    </Typography>
                    <Typography
                      fontSize={11}
                      color="text.secondary"
                      mt={0.5}
                    >
                      <CalendarDays
                        size={13}
                        style={{
                          verticalAlign: "middle",
                          marginRight: 5,
                        }}
                      />
                      {formatDate(log.date)}
                    </Typography>
                  </Box>

                  <Chip
                    size="small"
                    label={log.status || "Not Started"}
                    color={statusColor(log.status)}
                    variant="outlined"
                  />
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Typography
                  fontSize={12}
                  color="text.secondary"
                  className="toya-ewl-description"
                >
                  {log.description || "No description provided."}
                </Typography>

                <Box className="toya-ewl-log-footer">
                  <Chip
                    size="small"
                    icon={<Clock3 size={14} />}
                    label={`${Number(log.hours || 0)} hrs`}
                    variant="outlined"
                  />

                  <Box className="toya-ewl-row-actions">
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<Eye size={15} />}
                      onClick={() => setSelectedId(log.id)}
                    >
                      View Details
                    </Button>

                    {canEdit && (
                      <>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Pencil size={14} />}
                          onClick={() => openEdit(log)}
                        >
                          Edit
                        </Button>

                        <Button
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Trash2 size={14} />}
                          onClick={() => handleDelete(log.id)}
                        >
                          Delete
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      {/* =========================================
          WORK LOG DETAILS MODAL
      ========================================= */}
      <Dialog
        open={Boolean(selectedLog)}
        onClose={() => setSelectedId(null)}
        fullWidth
        maxWidth="sm"
        className="toya-ewl-details-dialog"
        slotProps={{
          paper: {
            className: "toya-ewl-details-paper",
          },
        }}
      >
        {selectedLog && (
          <>
            <DialogTitle className="toya-ewl-dialog-header">
              <Box>
                <Typography className="toya-ewl-dialog-title">
                  Work Log Details
                </Typography>
                <Typography className="toya-ewl-dialog-date">
                  {formatDate(selectedLog.date)}
                </Typography>
              </Box>

              <IconButton
                aria-label="Close details"
                onClick={() => setSelectedId(null)}
                className="toya-ewl-dialog-close"
              >
                <X size={19} />
              </IconButton>
            </DialogTitle>

            <DialogContent className="toya-ewl-details-content">
              {/* WORK TITLE */}
              <Box className="toya-ewl-detail-section">
                <Typography className="toya-ewl-detail-label">
                  WORK TITLE
                </Typography>

                <Typography className="toya-ewl-detail-title">
                  {selectedLog.title}
                </Typography>

                <Stack
                  direction="row"
                  flexWrap="wrap"
                  gap={1}
                  className="toya-ewl-detail-chips"
                >
                  <Chip
                    label={selectedLog.status || "Not Started"}
                    size="small"
                    color={statusColor(selectedLog.status)}
                    variant="outlined"
                  />
                  <Chip
                    label={`${Number(selectedLog.hours || 0)} hrs`}
                    size="small"
                    icon={<Clock3 size={14} />}
                    variant="outlined"
                  />
                </Stack>
              </Box>

              {/* DESCRIPTION */}
              <Box className="toya-ewl-detail-section">
                <Typography className="toya-ewl-detail-label">
                  WORK DESCRIPTION
                </Typography>

                <Box className="toya-ewl-detail-description">
                  <FileText size={17} />
                  <Typography component="div">
                    {selectedLog.description ||
                      "No description provided."}
                  </Typography>
                </Box>
              </Box>

              {/* SUBMISSION INFORMATION */}
              <Box className="toya-ewl-detail-meta">
                <Box>
                  <span>Work Date</span>
                  <strong>{formatDate(selectedLog.date)}</strong>
                </Box>

                <Box>
                  <span>Submitted At</span>
                  <strong>
                    {formatDateTime(selectedLog.submittedAt)}
                  </strong>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions className="toya-ewl-dialog-actions">
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
