
import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
} from "@mui/material";

import { Plus, Download, ClipboardList } from "lucide-react";

import CommonButton from "../common/CommonButton";
import CommonTable from "../common/CommonTable";
import CommonModal from "../common/CommonModal";
import CommonDatePicker from "../common/CommonDatePicker";

import {
  EMPLOYEES,
  INITIAL_TASKS,
  INITIAL_ATTENDANCE,
  INITIAL_WORKLOGS,
  readData,
  saveData,
  getEmployeeName,
  getToday,
} from "../../mocks/workspaceData";

import "../../styles/workspace/WorkspacePage.css";

const TASK_STATUSES = ["Not Started", "In Progress", "Completed"];
const ATTENDANCE_STATUSES = ["Present", "Absent", "Leave"];

function statusColor(status) {
  if (["Completed", "Present"].includes(status)) return "success";
  if (["In Progress", "Leave"].includes(status)) return "info";
  if (status === "Absent") return "error";
  return "warning";
}

function StatusCell({ status }) {
  return (
    <Chip
      label={status}
      size="small"
      variant="outlined"
      color={statusColor(status)}
    />
  );
}

function newForm(type, employeeId) {
  const base = {
    employeeId,
    status: "In Progress",
    date: getToday(),
  };

  if (type === "tasks") {
    return {
      ...base,
      title: "",
      priority: "Medium",
      status: "Not Started",
      progress: 0,
      dueDate: getToday(),
    };
  }

  if (type === "attendance") {
    return {
      ...base,
      status: "Present",
      checkIn: "09:00 AM",
      checkOut: "--",
    };
  }

  return {
    ...base,
    title: "",
    description: "",
    hours: 1,
  };
}

export default function WorkspacePage({
  title,
  subtitle,
  type,
  role = "manager",
  employeeId = 1,
}) {
  const isManager = role === "manager";

  const initialData =
    type === "tasks"
      ? INITIAL_TASKS
      : type === "attendance"
        ? INITIAL_ATTENDANCE
        : INITIAL_WORKLOGS;

  const [records, setRecords] = useState(() =>
    readData(type, initialData)
  );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(() => newForm(type, employeeId));
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    saveData(type, records);
  }, [type, records]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (
        !isManager &&
        Number(record.employeeId) !== Number(employeeId)
      ) {
        return false;
      }

      const searchableText = [
        record.title,
        record.description,
        getEmployeeName(record.employeeId),
        record.status,
        record.date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        searchableText.includes(search.trim().toLowerCase()) &&
        (statusFilter === "all" || record.status === statusFilter)
      );
    });
  }, [records, isManager, employeeId, search, statusFilter]);

  const statusOptions =
    type === "attendance"
      ? ATTENDANCE_STATUSES
      : TASK_STATUSES;

  const canAdd = isManager || type === "worklogs";
  const canEdit = isManager || type === "tasks" || type === "worklogs";
  const canDelete = isManager || type === "worklogs";

  const openAdd = () => {
    setEditingId(null);
    setForm(newForm(type, employeeId));
    setError("");
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingId(record.id);
    setForm({ ...record });
    setError("");
    setModalOpen(true);
  };

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setError("");
  };

  const saveRecord = (event) => {
    event.preventDefault();

    if (type !== "attendance" && !form.title?.trim()) {
      setError("Please enter a title.");
      return;
    }

    if (type === "worklogs") {
      const hours = Number(form.hours);

      if (!Number.isFinite(hours) || hours <= 0 || hours > 24) {
        setError("Working hours must be between 0 and 24.");
        return;
      }
    }

    const payload = {
      ...form,
      employeeId: isManager
        ? Number(form.employeeId)
        : Number(employeeId),
    };

    if (type === "tasks") {
      payload.progress =
        form.status === "Completed"
          ? 100
          : form.status === "Not Started"
            ? 0
            : Math.max(1, Math.min(99, Number(form.progress) || 1));
    }

    if (type === "worklogs") {
      payload.hours = Number(form.hours);
    }

    if (editingId !== null) {
      setRecords((previous) =>
        previous.map((record) =>
          record.id === editingId
            ? { ...record, ...payload }
            : record
        )
      );

      setMessage("Record updated successfully.");
    } else {
      setRecords((previous) => [
        {
          ...payload,
          id:
            Math.max(0, ...previous.map((record) => record.id)) + 1,
        },
        ...previous,
      ]);

      setMessage("Record added successfully.");
    }

    setModalOpen(false);
  };

  const deleteRecord = (id) => {
    if (!canDelete) return;

    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }

    setRecords((previous) =>
      previous.filter((record) => record.id !== id)
    );

    setMessage("Record deleted successfully.");
  };

  const exportCSV = () => {
    const headers = ["Employee", "Title", "Date", "Status"];

    const rows = filteredRecords.map((record) => [
      getEmployeeName(record.employeeId),
      record.title || "Attendance",
      record.date || record.dueDate || "",
      record.status,
    ]);

    const escapeCSV = (value) => {
      const safe = String(value ?? "").replace(/^\s*[=+\-@]/, "'$&");
      return `"${safe.replace(/"/g, '""')}"`;
    };

    const csv = [headers, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `TOYA-${role}-${type}.csv`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const columns = [
    ...(isManager
      ? [
          {
            field: "employeeId",
            headerName: "Employee",
            minWidth: 150,
            renderCell: (value) => getEmployeeName(value),
          },
        ]
      : []),

    ...(type !== "attendance"
      ? [
          {
            field: "title",
            headerName: type === "tasks" ? "Task" : "Work Log",
            minWidth: 200,
          },
        ]
      : []),

    {
      field: type === "tasks" ? "dueDate" : "date",
      headerName: type === "tasks" ? "Deadline" : "Date",
      minWidth: 120,
    },

    ...(type === "tasks"
      ? [
          {
            field: "progress",
            headerName: "Progress",
            minWidth: 140,
            renderCell: (value) => (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  minWidth: 110,
                }}
              >
                <LinearProgress
                  variant="determinate"
                  value={value}
                  sx={{ flex: 1, borderRadius: 3 }}
                />
                <Typography fontSize={11}>{value}%</Typography>
              </Box>
            ),
          },
        ]
      : []),

    ...(type === "worklogs"
      ? [
          {
            field: "hours",
            headerName: "Hours",
            minWidth: 85,
          },
        ]
      : []),

    ...(type === "attendance"
      ? [
          { field: "checkIn", headerName: "Check In", minWidth: 110 },
          { field: "checkOut", headerName: "Check Out", minWidth: 110 },
        ]
      : []),

    {
      field: "status",
      headerName: "Status",
      minWidth: 130,
      renderCell: (value) => <StatusCell status={value} />,
    },
  ];

  return (
    <Box className="toya-workspace">
      <Box className="toya-workspace-header">
        <Box>
          <Typography className="toya-workspace-title">
            {title}
          </Typography>
          <Typography color="text.secondary" fontSize={13}>
            {subtitle}
          </Typography>
        </Box>

        <Box className="toya-workspace-actions">
          <CommonButton
            label="Export CSV"
            variant="outlined"
            startIcon={<Download size={17} />}
            onClick={exportCSV}
          />

          {canAdd && (
            <CommonButton
              label={type === "tasks" ? "Assign Task" : "Add Record"}
              startIcon={<Plus size={17} />}
              onClick={openAdd}
            />
          )}
        </Box>
      </Box>

      {message && (
        <Alert
          severity="success"
          onClose={() => setMessage("")}
          sx={{ mb: 2 }}
        >
          {message}
        </Alert>
      )}

      <Box className="toya-workspace-stats">
        <Box>
          <span>Total Records</span>
          <strong>{filteredRecords.length}</strong>
        </Box>
        <Box>
          <span>
            {type === "attendance" ? "Present" : "Completed"}
          </span>
          <strong>
            {
              filteredRecords.filter((record) =>
                ["Completed", "Present"].includes(record.status)
              ).length
            }
          </strong>
        </Box>
        <Box>
          <span>Other Statuses</span>
          <strong>
            {
              filteredRecords.filter(
                (record) =>
                  !["Completed", "Present"].includes(record.status)
              ).length
            }
          </strong>
        </Box>
      </Box>

      <Box className="toya-workspace-filters">
        <TextField
          label="Search"
          size="small"
          fullWidth
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <TextField
          select
          label="Status"
          size="small"
          fullWidth
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <MenuItem value="all">All Statuses</MenuItem>

          {statusOptions.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <Box className="toya-workspace-table">
        <CommonTable
          title={title}
          columns={columns}
          rows={filteredRecords}
          searchable={false}
          pagination
          pageSize={10}
          getRowId={(row) => row.id}
          onEdit={canEdit ? openEdit : undefined}
          onDelete={
            canDelete ? (row) => deleteRecord(row.id) : undefined
          }
          emptyMessage="No records found"
        />
      </Box>

      <CommonModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId !== null ? "Update Record" : "Add Record"}
        icon={<ClipboardList size={20} />}
        maxWidth="sm"
        showFooter={false}
      >
        <Box
          component="form"
          onSubmit={saveRecord}
          className="toya-workspace-form"
        >
          {error && <Alert severity="error">{error}</Alert>}

          {isManager && (
            <TextField
              select
              label="Employee"
              size="small"
              fullWidth
              value={form.employeeId}
              onChange={(event) =>
                updateField("employeeId", event.target.value)
              }
            >
              {EMPLOYEES.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.name}
                </MenuItem>
              ))}
            </TextField>
          )}

          {type !== "attendance" && (
            <TextField
              label="Title"
              size="small"
              required
              fullWidth
              value={form.title}
              onChange={(event) =>
                updateField("title", event.target.value)
              }
            />
          )}

          {type === "worklogs" && (
            <TextField
              label="Description"
              size="small"
              fullWidth
              multiline
              minRows={2}
              value={form.description}
              onChange={(event) =>
                updateField("description", event.target.value)
              }
            />
          )}

          <Box className="toya-workspace-form-grid">
            {type === "tasks" && (
              <TextField
                select
                label="Priority"
                size="small"
                fullWidth
                value={form.priority}
                onChange={(event) =>
                  updateField("priority", event.target.value)
                }
              >
                {["Low", "Medium", "High", "Urgent"].map(
                  (priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority}
                    </MenuItem>
                  )
                )}
              </TextField>
            )}

            <TextField
              select
              label="Status"
              size="small"
              fullWidth
              value={form.status}
              onChange={(event) => {
                const status = event.target.value;

                setForm((previous) => ({
                  ...previous,
                  status,
                  ...(type === "tasks"
                    ? {
                        progress:
                          status === "Completed"
                            ? 100
                            : status === "Not Started"
                              ? 0
                              : previous.progress > 0 &&
                                  previous.progress < 100
                                ? previous.progress
                                : 25,
                      }
                    : {}),
                }));
              }}
            >
              {statusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status}
                </MenuItem>
              ))}
            </TextField>

            <CommonDatePicker
              name="workspaceDate"
              label={type === "tasks" ? "Deadline" : "Date"}
              value={
                type === "tasks" ? form.dueDate : form.date
              }
              onChange={(value) =>
                updateField(
                  type === "tasks" ? "dueDate" : "date",
                  value
                )
              }
              required
              size="small"
            />
          </Box>

          {type === "tasks" && (
            <TextField
              type="number"
              label="Progress (%)"
              size="small"
              fullWidth
              disabled={form.status !== "In Progress"}
              value={form.progress}
              onChange={(event) =>
                updateField("progress", event.target.value)
              }
              slotProps={{
                htmlInput: { min: 1, max: 99 },
              }}
            />
          )}

          {type === "worklogs" && (
            <TextField
              type="number"
              label="Hours Worked"
              size="small"
              fullWidth
              value={form.hours}
              onChange={(event) =>
                updateField("hours", event.target.value)
              }
              slotProps={{
                htmlInput: { min: 0.5, max: 24, step: 0.5 },
              }}
            />
          )}

          {type === "attendance" && (
            <Box className="toya-workspace-form-grid">
              <TextField
                label="Check In"
                size="small"
                fullWidth
                value={form.checkIn}
                onChange={(event) =>
                  updateField("checkIn", event.target.value)
                }
              />

              <TextField
                label="Check Out"
                size="small"
                fullWidth
                value={form.checkOut}
                onChange={(event) =>
                  updateField("checkOut", event.target.value)
                }
              />
            </Box>
          )}

          <Box className="toya-workspace-modal-actions">
            <CommonButton
              label="Cancel"
              variant="outlined"
              onClick={() => setModalOpen(false)}
            />
            <CommonButton
              label={editingId !== null ? "Update" : "Save"}
              type="submit"
            />
          </Box>
        </Box>
      </CommonModal>
    </Box>
  );
}
