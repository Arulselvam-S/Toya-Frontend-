import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import {
  Box,
  Typography,
  TextField,
  MenuItem,
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
  Eye,
  X,
  History,
  FilterX,
  FileText,
} from "lucide-react";

import { getToday } from "../../mocks/workspaceData";

import CommonButton from "../../components/common/CommonButton";
import CommonDatePicker from "../../components/common/CommonDatePicker";
import CommonCard from "../../components/common/CommonCard";

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
// Firebase authenticated backend integration
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
  if (!shift?.checkInAt || !shift?.checkOutAt) {
    return 0;
  }

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

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "--";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

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
// MAIN COMPONENT
// =============================================

export default function EmployeeWorkLogs() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const formRef = useRef(null);
  const today = getToday();

  // API DATA
  const [logs, setLogs] = useState([]);
  const [todayShift, setTodayShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // FORM
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // FEEDBACK
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  // FILTERS
  const [period, setPeriod] = useState("all");
  const [search, setSearch] = useState("");
  const [customDate, setCustomDate] = useState("");

  // DETAILS MODAL
  const [selectedId, setSelectedId] = useState(null);

  // =============================================
  // ATTENDANCE STATUS
  // =============================================

  const checkedIn = Boolean(todayShift?.checkInAt);
  const checkedOut = Boolean(todayShift?.checkOutAt);
  const shiftHours = getShiftHours(todayShift);

  // =============================================
  // LOAD WORK LOGS + ATTENDANCE
  // =============================================

  async function refreshPageData(showLoader = true) {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const [workLogResult, attendanceResult] =
        await Promise.all([
          getWorkLogs(),
          getTodayAttendance(),
        ]);

      setLogs(
        Array.isArray(workLogResult?.data)
          ? workLogResult.data
          : []
      );

      const candidates = [
        attendanceResult?.attendance,
        attendanceResult?.data?.attendance,
        attendanceResult?.data,
        attendanceResult,
      ];

      const attendance = candidates.find(
        (item) =>
          item &&
          typeof item === "object" &&
          ("checkInAt" in item || "checkOutAt" in item)
      );

      setTodayShift(attendance || null);
      setError("");
    } catch (err) {
      setError(
        err.message || "Unable to load your work logs."
      );
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  useEffect(() => {
    refreshPageData();
  }, []);

  // =============================================
  // AUTO OPEN FORM FROM ATTENDANCE PAGE
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
        "Please complete Check Out before submitting your work."
      );
    }

    const next = new URLSearchParams(searchParams);
    next.delete("openForm");

    setSearchParams(next, { replace: true });
  }, [
    openFormRequested,
    loading,
    checkedOut,
    searchParams,
    setSearchParams,
  ]);

  // SCROLL TO FORM
  useEffect(() => {
    if (!showForm) return;

    formRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [showForm]);

  // =============================================
  // WORK LOG HISTORY
  // =============================================

  const myLogs = [...logs].sort((a, b) => {
    const dateCompare = String(b.date || "").localeCompare(
      String(a.date || "")
    );

    if (dateCompare !== 0) {
      return dateCompare;
    }

    return String(b.submittedAt || "").localeCompare(
      String(a.submittedAt || "")
    );
  });

  const todayLogs = myLogs.filter(
    (log) => log.date === today
  );

  const filteredLogs = myLogs.filter((log) => {
    const query = search.trim().toLowerCase();

    const matchesSearch =
      !query ||
      String(log.title || "")
        .toLowerCase()
        .includes(query) ||
      String(log.description || "")
        .toLowerCase()
        .includes(query);

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
        Boolean(customDate) &&
        log.date === customDate;
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
      setError(
        "Please Check Out before adding a work log."
      );
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
  // SAVE / UPDATE WORK LOG
  // =============================================

  async function handleSave(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (saving) return;

    if (!checkedOut) {
      setError(
        "Complete Check In and Check Out before submitting."
      );
      return;
    }

    const title = form.title.trim();
    const description = form.description.trim();
    const hours = Number(form.hours);

    if (!title || !description) {
      setError(
        "Work title and description are required."
      );
      return;
    }

    if (title.length > 150 || description.length > 5000) {
      setError(
        "Work title or description is too long."
      );
      return;
    }

    if (
      !form.hours.trim() ||
      !Number.isFinite(hours) ||
      hours <= 0 ||
      hours > 24
    ) {
      setError(
        "Enter valid work hours between 0.01 and 24."
      );
      return;
    }

    if (!WORK_STATUSES.includes(form.status)) {
      setError("Please select a valid work status.");
      return;
    }

    // Keep today's total at or below 24 hours.
    const otherHours = logs
      .filter(
        (log) =>
          log.date === today &&
          String(log.id) !== String(editingId)
      )
      .reduce(
        (sum, log) => sum + Number(log.hours || 0),
        0
      );

    if (otherHours + hours > 24 + 0.000001) {
      setError(
        "Total reported hours cannot exceed 24 hours per day."
      );
      return;
    }

    const payload = {
      title,
      description,
      hours,
      status: form.status,
    };

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
      setError(
        err.message || "Unable to save the work log."
      );
    } finally {
      setSaving(false);
    }
  }

  // =============================================
  // DELETE WORK LOG
  // =============================================

  async function handleDelete(id) {
    const record = logs.find(
      (log) =>
        String(log.id) === String(id) &&
        log.date === today
    );

    if (!record || !checkedOut) {
      setError(
        "Only today's work logs can be deleted."
      );
      return;
    }

    if (!window.confirm(`Delete "${record.title}"?`)) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteWorkLog(id);
      await refreshPageData(false);

      if (String(selectedId) === String(id)) {
        setSelectedId(null);
      }

      if (String(editingId) === String(id)) {
        cancelForm();
      }

      setSuccess("Work log deleted successfully.");
    } catch (err) {
      setError(
        err.message || "Unable to delete the work log."
      );
    }
  }

  // =============================================
  // CLEAR FILTERS
  // =============================================

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

          <Typography
            fontSize={13}
            color="text.secondary"
          >
            Submit daily work and review your previous logs
          </Typography>
        </Box>

        <CommonButton
          label="Add Work Log"
          variant="contained"
          startIcon={<Plus size={17} />}
          onClick={openAdd}
          disabled={!checkedOut || loading}
          className="toya-ewl-primary-btn"
        />
      </Box>

      {/* ATTENDANCE STATUS */}
      {!checkedIn && (
        <Alert
          severity="warning"
          sx={{ mb: 2, borderRadius: 2 }}
          action={
            <CommonButton
              size="small"
              variant="text"
              label="Attendance"
              onClick={() =>
                navigate("/employee/attendance")
              }
            />
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
            <CommonButton
              size="small"
              variant="text"
              label="Check Out"
              onClick={() =>
                navigate("/employee/attendance")
              }
            />
          }
        >
          Your shift is active. Check Out to submit work.
        </Alert>
      )}

      {checkedOut && (
        <Box className="toya-ewl-shift-info">
          <CheckCircle2
            size={20}
            color="#0c9b70"
          />

          <Box>
            <Typography
              fontWeight={700}
              fontSize={13}
            >
              Today's shift completed
            </Typography>

            <Typography
              fontSize={12}
              color="text.secondary"
            >
              Recorded duration: {formatDuration(shiftHours)}
              {" · "}
              Work hours are self-reported separately.
            </Typography>
          </Box>
        </Box>
      )}

      {/* SUCCESS MESSAGE */}
      {success && (
        <Alert
          severity="success"
          onClose={() => setSuccess("")}
          sx={{ mb: 2, borderRadius: 2 }}
        >
          {success}
        </Alert>
      )}

      {/* STATISTICS */}
      <Box className="toya-workspace-stats">
        <CommonCard
          title="Today's Work Logs"
          value={todayLogs.length}
          subtitle="Logs submitted today"
          icon={ClipboardList}
          iconColor="#0879ED"
          iconBackground="#E5F4FF"
          loading={loading}
          animated={false}
        />

        <CommonCard
          title="Today's Reported Hours"
          value={`${totalHours(todayLogs).toFixed(2)} hrs`}
          subtitle="Self-reported work time"
          icon={Clock3}
          iconColor="#0C9B70"
          iconBackground="#E3F8EF"
          loading={loading}
          animated={false}
        />

        <CommonCard
          title="Total History Hours"
          value={`${totalHours(myLogs).toFixed(2)} hrs`}
          subtitle={`${myLogs.length} total work logs`}
          icon={History}
          iconColor="#7C55D9"
          iconBackground="#F0E9FF"
          loading={loading}
          animated={false}
        />
      </Box>

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
              <ClipboardList
                size={20}
                color="#0879ed"
              />

              <Typography
                fontSize={17}
                fontWeight={800}
              >
                {editingId === null
                  ? "Submit Daily Work"
                  : "Edit Daily Work"}
              </Typography>
            </Stack>

            {error && (
              <Alert
                severity="error"
                sx={{ mb: 2 }}
              >
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
                  htmlInput: { maxLength: 120 },
                }}
              />

              <TextField
                label="Work Description"
                placeholder="Describe what you worked on"
                value={form.description}
                onChange={(event) =>
                  updateField(
                    "description",
                    event.target.value
                  )
                }
                required
                fullWidth
                multiline
                minRows={3}
                size="small"
                slotProps={{
                  htmlInput: { maxLength: 3000 },
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
                  helperText="Example: 0.5 = 30 minutes"
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
                    <MenuItem
                      key={status}
                      value={status}
                    >
                      {status}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Divider sx={{ my: 1 }} />

              <Stack
                direction={{
                  xs: "column-reverse",
                  sm: "row",
                }}
                justifyContent="flex-end"
                spacing={1.5}
              >
                <CommonButton
                  label="Cancel"
                  variant="outlined"
                  startIcon={<ArrowLeft size={15} />}
                  onClick={cancelForm}
                  disabled={saving}
                />

                <CommonButton
                  type="submit"
                  variant="contained"
                  loading={saving}
                  disabled={!checkedOut}
                  startIcon={<Save size={16} />}
                  className="toya-ewl-primary-btn"
                  label={
                    editingId === null
                      ? "Save Work Log"
                      : "Update Work Log"
                  }
                />
              </Stack>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* FORM ERROR */}
      {!showForm && error && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 2 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      {/* =========================================
          WORK LOG HISTORY
      ========================================= */}
      <Box className="toya-workspace-table">
        <Box className="toya-ewl-history-header">
          <Box>
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
            >
              <History
                size={20}
                color="#0879ed"
              />

              <Typography
                fontSize={17}
                fontWeight={800}
              >
                My Work Log History
              </Typography>
            </Stack>

            <Typography
              fontSize={12}
              color="text.secondary"
              mt={0.5}
            >
              Search and view previous work submissions
            </Typography>
          </Box>

          <Chip
            size="small"
            variant="outlined"
            label={`${myLogs.length} Logs`}
          />
        </Box>

        {/* FILTERS */}
        <Box className="toya-ewl-history-filters">
          <TextField
            size="small"
            fullWidth
            placeholder="Search title or description..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <TextField
            select
            fullWidth
            size="small"
            label="Period"
            value={period}
            onChange={(event) =>
              setPeriod(event.target.value)
            }
          >
            <MenuItem value="all">All Logs</MenuItem>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">Last 7 Days</MenuItem>
            <MenuItem value="month">Last 30 Days</MenuItem>
            <MenuItem value="custom">Custom Date</MenuItem>
          </TextField>

          {period === "custom" && (
            <CommonDatePicker
              name="workLogDate"
              label="Select Date"
              value={customDate || null}
              onChange={(value) =>
                setCustomDate(value || "")
              }
              maxDate={today}
              size="small"
            />
          )}

          <CommonButton
            label="Clear"
            variant="outlined"
            startIcon={<FilterX size={16} />}
            onClick={clearFilters}
          />
        </Box>

        <Typography
          fontSize={12}
          color="text.secondary"
          mb={2}
        >
          Showing {filteredLogs.length} of {myLogs.length} work logs
        </Typography>

        {/* LOADING / EMPTY / RECORDS */}
        {loading ? (
          <Box className="toya-ewl-empty">
            <History size={30} />

            <Typography fontWeight={700}>
              Loading work logs...
            </Typography>
          </Box>
        ) : filteredLogs.length === 0 ? (
          <Box className="toya-ewl-empty">
            <History size={30} />

            <Typography fontWeight={700}>
              No work logs found
            </Typography>

            <Typography
              fontSize={12}
              color="text.secondary"
            >
              Try changing the date or search keyword.
            </Typography>
          </Box>
        ) : (
          filteredLogs.map((log) => {
            const canEdit =
              checkedOut && log.date === today;

            return (
              <Box
                className="toya-ewl-log-row"
                key={log.id}
              >
                {/* LOG HEADER */}
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

                {/* DESCRIPTION */}
                <Typography
                  fontSize={12}
                  color="text.secondary"
                  className="toya-ewl-description"
                >
                  {log.description ||
                    "No description provided."}
                </Typography>

                {/* FOOTER */}
                <Box className="toya-ewl-log-footer">
                  <Chip
                    size="small"
                    icon={<Clock3 size={14} />}
                    label={`${Number(log.hours || 0)} hrs`}
                    variant="outlined"
                  />

                  <Box className="toya-ewl-row-actions">
                    <CommonButton
                      label="View Details"
                      variant="outlined"
                      size="small"
                      startIcon={<Eye size={15} />}
                      onClick={() =>
                        setSelectedId(log.id)
                      }
                    />

                    {canEdit && (
                      <>
                        <CommonButton
                          label="Edit"
                          variant="outlined"
                          size="small"
                          startIcon={<Pencil size={14} />}
                          onClick={() => openEdit(log)}
                        />

                        <CommonButton
                          label="Delete"
                          variant="outlined"
                          color="error"
                          size="small"
                          startIcon={<Trash2 size={14} />}
                          onClick={() =>
                            handleDelete(log.id)
                          }
                        />
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
                    label={
                      selectedLog.status || "Not Started"
                    }
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
                  <strong>
                    {formatDate(selectedLog.date)}
                  </strong>
                </Box>

                <Box>
                  <span>Submitted At</span>
                  <strong>
                    {formatDateTime(
                      selectedLog.submittedAt
                    )}
                  </strong>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions className="toya-ewl-dialog-actions">
              <CommonButton
                label="Close"
                variant="outlined"
                onClick={() => setSelectedId(null)}
              />
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}