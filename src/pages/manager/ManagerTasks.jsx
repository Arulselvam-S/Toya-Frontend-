
import { useMemo, useState } from "react";

import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Avatar,
  Chip,
  Alert,
  LinearProgress,
} from "@mui/material";

import {
  ClipboardList,
  CheckCircle2,
  Clock3,
  AlertTriangle,
  Plus,
  Download,
  CalendarClock,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

import CommonButton from "../../components/common/CommonButton";
import CommonTable from "../../components/common/CommonTable";
import CommonModal from "../../components/common/CommonModal";
import CommonPagination from "../../components/common/CommonPagination";
import CommonDatePicker from "../../components/common/CommonDatePicker";

import "../../styles/manager/ManagerTasks.css";

// =================================
// DEMO EMPLOYEES
// =================================

const EMPLOYEES = [
  { id: 1, name: "Arun Kumar", department: "IT" },
  { id: 2, name: "Priya Sharma", department: "Marketing" },
  { id: 3, name: "Rahul Raj", department: "Finance" },
  { id: 4, name: "Sneha R", department: "HR" },
  { id: 5, name: "Karthik S", department: "IT" },
  { id: 6, name: "Meena P", department: "Operations" },
];

const PRIORITIES = ["Low", "Medium", "High", "Urgent"];

const STATUSES = [
  "Not Started",
  "In Progress",
  "Completed",
];

function dateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function offsetDate(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return dateKey(date);
}

function displayDate(value) {
  if (!value) return "—";
  const [year, month, day] = value.split("-").map(Number);

  return new Date(year, month - 1, day).toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

const INITIAL_TASKS = [
  {
    id: 1,
    title: "Frontend Dashboard Development",
    description: "Build responsive dashboard components.",
    employeeId: 1,
    priority: "High",
    status: "In Progress",
    progress: 65,
    startDate: offsetDate(-3),
    dueDate: offsetDate(2),
  },
  {
    id: 2,
    title: "Marketing Campaign Assets",
    description: "Prepare the brand's social media materials.",
    employeeId: 2,
    priority: "Medium",
    status: "Completed",
    progress: 100,
    startDate: offsetDate(-5),
    dueDate: offsetDate(-1),
  },
  {
    id: 3,
    title: "Invoice Validation",
    description: "Validate payment and invoice details.",
    employeeId: 3,
    priority: "High",
    status: "Not Started",
    progress: 0,
    startDate: offsetDate(-2),
    dueDate: offsetDate(-1),
  },
  {
    id: 4,
    title: "Employee Onboarding Checklist",
    description: "Review onboarding documents.",
    employeeId: 4,
    priority: "Low",
    status: "Completed",
    progress: 100,
    startDate: offsetDate(-4),
    dueDate: offsetDate(0),
  },
  {
    id: 5,
    title: "Backend API Integration",
    description: "Connect frontend pages to API endpoints.",
    employeeId: 5,
    priority: "Urgent",
    status: "In Progress",
    progress: 35,
    startDate: offsetDate(-1),
    dueDate: offsetDate(1),
  },
  {
    id: 6,
    title: "Delivery Operations Review",
    description: "Review delivery coordination activities.",
    employeeId: 6,
    priority: "Medium",
    status: "Not Started",
    progress: 0,
    startDate: offsetDate(0),
    dueDate: offsetDate(3),
  },
];

const emptyForm = () => ({
  title: "",
  description: "",
  employeeId: "",
  priority: "Medium",
  status: "Not Started",
  progress: 0,
  startDate: offsetDate(0),
  dueDate: offsetDate(1),
});

function TaskStatus({ status }) {
  const color =
    status === "Completed"
      ? "success"
      : status === "In Progress"
        ? "info"
        : "default";

  return (
    <Chip
      size="small"
      label={status}
      color={color}
      variant="outlined"
    />
  );
}

function StatCard({
  label,
  value,
  Icon,
  tone,
  index,
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`toya-mt-stat tone-${tone}`}
      initial={
        reduceMotion ? false : { opacity: 0, y: 16 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.06,
      }}
    >
      <Box className="toya-mt-stat-icon">
        <Icon size={22} />
      </Box>

      <Typography className="toya-mt-stat-number">
        {value}
      </Typography>

      <Typography className="toya-mt-stat-label">
        {label}
      </Typography>
    </motion.div>
  );
}

export default function ManagerTasks() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] =
    useState("all");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [priorityFilter, setPriorityFilter] =
    useState("all");

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [message, setMessage] = useState("");

  const enrichedTasks = useMemo(
    () =>
      tasks.map((task) => {
        const employee = EMPLOYEES.find(
          (item) => item.id === task.employeeId
        );

        return {
          ...task,
          employeeName: employee?.name || "Unknown",
          department: employee?.department || "—",
        };
      }),
    [tasks]
  );

  const stats = useMemo(
    () => ({
      total: tasks.length,
      completed: tasks.filter(
        (task) => task.status === "Completed"
      ).length,
      inProgress: tasks.filter(
        (task) => task.status === "In Progress"
      ).length,
      overdue: tasks.filter(
        (task) =>
          task.status !== "Completed" &&
          task.dueDate < offsetDate(0)
      ).length,
    }),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return enrichedTasks.filter((task) => {
      const matched = [
        task.title,
        task.description,
        task.employeeName,
        task.department,
      ].some((value) =>
        value.toLowerCase().includes(query)
      );

      return (
        matched &&
        (employeeFilter === "all" ||
          task.employeeId === Number(employeeFilter)) &&
        (statusFilter === "all" ||
          task.status === statusFilter) &&
        (priorityFilter === "all" ||
          task.priority === priorityFilter)
      );
    });
  }, [
    enrichedTasks,
    search,
    employeeFilter,
    statusFilter,
    priorityFilter,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTasks.length / rowsPerPage)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleTasks = filteredTasks.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const selectedTask =
    enrichedTasks.find((task) => task.id === selectedId) ||
    null;

  const deleteTask =
    enrichedTasks.find((task) => task.id === deleteId) ||
    null;

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm());
    setError("");
    setFormOpen(true);
  };

  const openEdit = (task) => {
    setEditingId(task.id);
    setForm({
      title: task.title,
      description: task.description,
      employeeId: String(task.employeeId),
      priority: task.priority,
      status: task.status,
      progress: task.progress,
      startDate: task.startDate,
      dueDate: task.dueDate,
    });

    setError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setError("");
  };

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setError("");
  };

  const updateFormStatus = (status) => {
    setForm((previous) => ({
      ...previous,
      status,
      progress:
        status === "Completed"
          ? 100
          : status === "Not Started"
            ? 0
            : previous.progress > 0 &&
                previous.progress < 100
              ? previous.progress
              : 25,
    }));

    setError("");
  };

  const saveTask = (event) => {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.employeeId ||
      !form.startDate ||
      !form.dueDate
    ) {
      setError("Please complete the required fields.");
      return;
    }

    if (form.dueDate < form.startDate) {
      setError("Deadline cannot be before start date.");
      return;
    }

    const employeeId = Number(form.employeeId);

    if (
      !EMPLOYEES.some(
        (employee) => employee.id === employeeId
      )
    ) {
      setError("Select a valid employee.");
      return;
    }

    const progress = Number(form.progress);

    if (
      !Number.isFinite(progress) ||
      progress < 0 ||
      progress > 100
    ) {
      setError("Progress must be between 0 and 100.");
      return;
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      employeeId,
      priority: form.priority,
      status: form.status,
      progress:
        form.status === "Completed"
          ? 100
          : form.status === "Not Started"
            ? 0
            : Math.max(1, Math.min(99, progress)),
      startDate: form.startDate,
      dueDate: form.dueDate,
    };

    if (editingId !== null) {
      setTasks((previous) =>
        previous.map((task) =>
          task.id === editingId
            ? { ...task, ...payload }
            : task
        )
      );
      setMessage("Task updated successfully (demo).");
    } else {
      setTasks((previous) => [
        ...previous,
        {
          id:
            Math.max(
              0,
              ...previous.map((task) => task.id)
            ) + 1,
          ...payload,
        },
      ]);
      setMessage("New task assigned (demo).");
    }

    closeForm();
    setPage(1);
  };

  const updateTaskStatus = (id, status) => {
    setTasks((previous) =>
      previous.map((task) =>
        task.id === id
          ? {
              ...task,
              status,
              progress:
                status === "Completed"
                  ? 100
                  : status === "Not Started"
                    ? 0
                    : task.progress > 0 && task.progress < 100
                      ? task.progress
                      : 25,
            }
          : task
      )
    );

    setMessage("Task status updated (demo).");
  };

  const removeTask = () => {
    if (deleteId === null) return;

    setTasks((previous) =>
      previous.filter(
        (task) => task.id !== deleteId
      )
    );

    setDeleteId(null);
    setSelectedId(null);
    setPage(1);
    setMessage("Task deleted (demo).");
  };

  const exportCSV = () => {
    const rows = [
      [
        "Task ID",
        "Task",
        "Employee",
        "Department",
        "Priority",
        "Status",
        "Progress",
        "Start Date",
        "Deadline",
      ],
      ...filteredTasks.map((task) => [
        task.id,
        task.title,
        task.employeeName,
        task.department,
        task.priority,
        task.status,
        `${task.progress}%`,
        task.startDate,
        task.dueDate,
      ]),
    ];

    const csvValue = (value) => {
      const safe = String(value ?? "").replace(
        /^\s*[=+\-@]/,
        "'$&"
      );

      return `"${safe.replace(/"/g, '""')}"`;
    };

    const csv = rows
      .map((row) => row.map(csvValue).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "TOYA-Manager-Tasks.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const columns = [
    {
      field: "title",
      headerName: "Task",
      minWidth: 225,
      renderCell: (value, row) => (
        <Box>
          <Typography
            fontSize={13}
            fontWeight={750}
          >
            {value}
          </Typography>
          <Typography
            fontSize={11}
            color="text.secondary"
          >
            TASK-{String(row.id).padStart(3, "0")}
          </Typography>
        </Box>
      ),
    },
    {
      field: "employeeName",
      headerName: "Assigned To",
      minWidth: 175,
      renderCell: (value, row) => (
        <Box className="toya-mt-employee">
          <Avatar className="toya-mt-avatar">
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
              {row.department}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "priority",
      headerName: "Priority",
      minWidth: 100,
      renderCell: (value) => (
        <Chip
          size="small"
          label={value}
          color={
            value === "Urgent"
              ? "error"
              : value === "High"
                ? "warning"
                : "default"
          }
          variant="outlined"
        />
      ),
    },
    {
      field: "dueDate",
      headerName: "Deadline",
      minWidth: 130,
      renderCell: (value, row) => (
        <Box>
          <Typography fontSize={12}>
            {displayDate(value)}
          </Typography>

          {row.status !== "Completed" &&
            value < offsetDate(0) && (
              <Typography
                fontSize={11}
                color="error"
                fontWeight={700}
              >
                Overdue
              </Typography>
            )}
        </Box>
      ),
    },
    {
      field: "progress",
      headerName: "Progress",
      minWidth: 135,
      renderCell: (value) => (
        <Box className="toya-mt-progress">
          <LinearProgress
            variant="determinate"
            value={value}
            sx={{
              flex: 1,
              borderRadius: 3,
            }}
          />
          <Typography
            fontSize={11}
            fontWeight={700}
          >
            {value}%
          </Typography>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 130,
      renderCell: (value) => (
        <TaskStatus status={value} />
      ),
    },
  ];

  const cards = [
    {
      label: "Total Tasks",
      value: stats.total,
      Icon: ClipboardList,
      tone: "blue",
    },
    {
      label: "Completed",
      value: stats.completed,
      Icon: CheckCircle2,
      tone: "green",
    },
    {
      label: "In Progress",
      value: stats.inProgress,
      Icon: Clock3,
      tone: "cyan",
    },
    {
      label: "Overdue",
      value: stats.overdue,
      Icon: AlertTriangle,
      tone: "orange",
    },
  ];

  return (
    <Box className="toya-mt-page">
      {/* HEADER */}
      <Box className="toya-mt-heading">
        <Box>
          <Typography className="toya-mt-title">
            Team Task Management
          </Typography>
          <Typography className="toya-mt-subtitle">
            Assign, monitor and review team tasks
          </Typography>
        </Box>

        <Box className="toya-mt-heading-actions">
          <CommonButton
            label="Export CSV"
            variant="outlined"
            startIcon={<Download size={17} />}
            onClick={exportCSV}
          />

          <CommonButton
            label="Assign Task"
            startIcon={<Plus size={17} />}
            onClick={openAdd}
          />
        </Box>
      </Box>

      {message && (
        <Alert
          severity="success"
          onClose={() => setMessage("")}
          sx={{ mb: 2, borderRadius: 3 }}
        >
          {message}
        </Alert>
      )}

      {/* STATS */}
      <Box className="toya-mt-stats">
        {cards.map((card, index) => (
          <StatCard
            key={card.label}
            {...card}
            index={index}
          />
        ))}
      </Box>

      {/* FILTERS */}
      <Box className="toya-mt-filters">
        <TextField
          label="Search Tasks"
          placeholder="Task name or employee"
          size="small"
          fullWidth
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />

        <TextField
          select
          label="Employee"
          size="small"
          fullWidth
          value={employeeFilter}
          onChange={(event) => {
            setEmployeeFilter(event.target.value);
            setPage(1);
          }}
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
          select
          label="Status"
          size="small"
          fullWidth
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          {STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {status}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Priority"
          size="small"
          fullWidth
          value={priorityFilter}
          onChange={(event) => {
            setPriorityFilter(event.target.value);
            setPage(1);
          }}
        >
          <MenuItem value="all">All Priorities</MenuItem>
          {PRIORITIES.map((priority) => (
            <MenuItem
              key={priority}
              value={priority}
            >
              {priority}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* TASK TABLE */}
      <Box className="toya-mt-table-section">
        <CommonTable
          title="Team Task Directory"
          columns={columns}
          rows={visibleTasks}
          searchable={false}
          pagination={false}
          getRowId={(row) => row.id}
          onView={(row) => setSelectedId(row.id)}
          onEdit={openEdit}
          onDelete={(row) => setDeleteId(row.id)}
          emptyMessage="No tasks found"
        />

        <CommonPagination
          page={currentPage}
          rowsPerPage={rowsPerPage}
          totalRecords={filteredTasks.length}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value);
            setPage(1);
          }}
        />
      </Box>

      {/* ADD / EDIT MODAL */}
      <CommonModal
        open={formOpen}
        onClose={closeForm}
        title={
          editingId !== null
            ? "Edit Team Task"
            : "Assign New Task"
        }
        description="Manage assignment and deadline"
        icon={<ClipboardList size={21} />}
        showFooter={false}
        maxWidth="sm"
      >
        <Box
          component="form"
          onSubmit={saveTask}
          className="toya-mt-form"
        >
          {error && (
            <Alert severity="error">{error}</Alert>
          )}

          <TextField
            label="Task Title"
            size="small"
            fullWidth
            required
            value={form.title}
            onChange={(event) =>
              updateForm("title", event.target.value)
            }
          />

          <TextField
            label="Description"
            size="small"
            fullWidth
            multiline
            minRows={2}
            required
            value={form.description}
            onChange={(event) =>
              updateForm(
                "description",
                event.target.value
              )
            }
          />

          <TextField
            select
            label="Assign Employee"
            size="small"
            fullWidth
            required
            value={form.employeeId}
            onChange={(event) =>
              updateForm(
                "employeeId",
                event.target.value
              )
            }
          >
            {EMPLOYEES.map((employee) => (
              <MenuItem
                key={employee.id}
                value={String(employee.id)}
              >
                {employee.name} · {employee.department}
              </MenuItem>
            ))}
          </TextField>

          <Box className="toya-mt-form-grid">
            <TextField
              select
              label="Priority"
              value={form.priority}
              size="small"
              fullWidth
              onChange={(event) =>
                updateForm(
                  "priority",
                  event.target.value
                )
              }
            >
              {PRIORITIES.map((priority) => (
                <MenuItem
                  key={priority}
                  value={priority}
                >
                  {priority}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Status"
              value={form.status}
              size="small"
              fullWidth
              onChange={(event) =>
                updateFormStatus(
                  event.target.value
                )
              }
            >
              {STATUSES.map((status) => (
                <MenuItem
                  key={status}
                  value={status}
                >
                  {status}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          <Box className="toya-mt-form-grid">
            <CommonDatePicker
              name="managerTaskStart"
              label="Start Date"
              value={form.startDate}
              onChange={(value) =>
                updateForm("startDate", value)
              }
              maxDate={form.dueDate || undefined}
              size="small"
              required
            />

            <CommonDatePicker
              name="managerTaskDue"
              label="Deadline"
              value={form.dueDate}
              onChange={(value) =>
                updateForm("dueDate", value)
              }
              minDate={form.startDate || undefined}
              size="small"
              required
            />
          </Box>

          <TextField
            label="Progress (%)"
            type="number"
            size="small"
            fullWidth
            disabled={form.status !== "In Progress"}
            value={form.progress}
            onChange={(event) =>
              updateForm(
                "progress",
                event.target.value
              )
            }
            slotProps={{
              htmlInput: { min: 1, max: 99 },
            }}
          />

          <Box className="toya-mt-modal-actions">
            <CommonButton
              label="Cancel"
              variant="outlined"
              onClick={closeForm}
            />

            <CommonButton
              label={
                editingId !== null
                  ? "Update Task"
                  : "Assign Task"
              }
              type="submit"
            />
          </Box>
        </Box>
      </CommonModal>

      {/* TASK DETAILS */}
      <CommonModal
        open={Boolean(selectedTask)}
        onClose={() => setSelectedId(null)}
        title="Task Details"
        description="View and update progress"
        icon={<CalendarClock size={21} />}
        showFooter={false}
        maxWidth="sm"
      >
        {selectedTask && (
          <Box className="toya-mt-details">
            <Box className="toya-mt-detail-person">
              <Avatar className="toya-mt-avatar">
                {selectedTask.employeeName.charAt(0)}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography
                  fontWeight={800}
                  fontSize={14}
                >
                  {selectedTask.employeeName}
                </Typography>

                <Typography
                  fontSize={11}
                  color="text.secondary"
                >
                  {selectedTask.department}
                </Typography>
              </Box>

              <TaskStatus status={selectedTask.status} />
            </Box>

            <Typography fontWeight={800} fontSize={16}>
              {selectedTask.title}
            </Typography>

            <Typography
              fontSize={13}
              color="text.secondary"
            >
              {selectedTask.description}
            </Typography>

            <Box className="toya-mt-detail-grid">
              <Box>
                <span>Start Date</span>
                <strong>
                  {displayDate(selectedTask.startDate)}
                </strong>
              </Box>

              <Box>
                <span>Deadline</span>
                <strong>
                  {displayDate(selectedTask.dueDate)}
                </strong>
              </Box>

              <Box>
                <span>Priority</span>
                <strong>{selectedTask.priority}</strong>
              </Box>

              <Box>
                <span>Progress</span>
                <strong>
                  {selectedTask.progress}%
                </strong>
              </Box>
            </Box>

            <Box className="toya-mt-status-actions">
              {STATUSES.map((status) => (
                <CommonButton
                  key={status}
                  label={status}
                  variant="outlined"
                  disabled={
                    selectedTask.status === status
                  }
                  onClick={() =>
                    updateTaskStatus(
                      selectedTask.id,
                      status
                    )
                  }
                />
              ))}
            </Box>

            <Box className="toya-mt-modal-actions">
              <CommonButton
                label="Edit"
                variant="outlined"
                onClick={() => {
                  openEdit(selectedTask);
                  setSelectedId(null);
                }}
              />

              <CommonButton
                label="Close"
                onClick={() => setSelectedId(null)}
              />
            </Box>
          </Box>
        )}
      </CommonModal>

      {/* DELETE CONFIRMATION */}
      <CommonModal
        open={Boolean(deleteTask)}
        onClose={() => setDeleteId(null)}
        title="Delete Task?"
        description="This action removes the demo record"
        icon={<AlertTriangle size={21} />}
        maxWidth="xs"
        showFooter={false}
      >
        <Typography fontSize={13}>
          Delete <strong>{deleteTask?.title}</strong>?
        </Typography>

        <Box className="toya-mt-modal-actions">
          <CommonButton
            label="Cancel"
            variant="outlined"
            onClick={() => setDeleteId(null)}
          />
          <CommonButton
            label="Delete Task"
            color="error"
            onClick={removeTask}
          />
        </Box>
      </CommonModal>
    </Box>
  );
}
