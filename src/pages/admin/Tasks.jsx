
import { useMemo, useState } from "react";

import {
  Box,
  Typography,
  Avatar,
  Chip,
  Alert,
  Stack,
  TextField,
  MenuItem,
} from "@mui/material";

import {
  ListTodo,
  CheckCircle2,
  Clock3,
  CirclePause,
  Plus,
  Download,
  CalendarClock,
  UserRound,
  AlertTriangle,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

import CommonButton from "../../components/common/CommonButton";
import CommonDatePicker from "../../components/common/CommonDatePicker";
import CommonTable from "../../components/common/CommonTable";
import CommonModal from "../../components/common/CommonModal";
import CommonPagination from "../../components/common/CommonPagination";

import "../../styles/admin/Tasks.css";

// ======================================
// SAMPLE EMPLOYEES
// ======================================

const EMPLOYEES = [
  { id: 1, name: "Arun Kumar", department: "IT" },
  { id: 2, name: "Priya Sharma", department: "Marketing" },
  { id: 3, name: "Rahul Raj", department: "Finance" },
  { id: 4, name: "Sneha R", department: "HR" },
  { id: 5, name: "Karthik S", department: "IT" },
  { id: 6, name: "Meena P", department: "Operations" },
  { id: 7, name: "Vijay M", department: "Marketing" },
  { id: 8, name: "Divya R", department: "Finance" },
];

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

function dateOffset(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(value) {
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

function optionLabel(options, value) {
  return (
    options.find((option) => option.value === value)?.label ||
    value
  );
}

// ======================================
// DEMO TASK RECORDS
// ======================================

const INITIAL_TASKS = [
  {
    id: 1,
    title: "Build Admin Dashboard",
    description: "Implement responsive statistics and charts.",
    assignedTo: 1,
    priority: "high",
    status: "in_progress",
    startDate: dateOffset(-3),
    dueDate: dateOffset(2),
    progress: 60,
  },
  {
    id: 2,
    title: "Develop Employee APIs",
    description: "Create employee CRUD endpoints and validation.",
    assignedTo: 5,
    priority: "urgent",
    status: "not_started",
    startDate: dateOffset(0),
    dueDate: dateOffset(1),
    progress: 0,
  },
  {
    id: 3,
    title: "Prepare Marketing Campaign",
    description: "Finalize social media campaign assets.",
    assignedTo: 2,
    priority: "medium",
    status: "completed",
    startDate: dateOffset(-5),
    dueDate: dateOffset(-1),
    progress: 100,
  },
  {
    id: 4,
    title: "Verify Expense Reports",
    description: "Review invoices and expense entries.",
    assignedTo: 3,
    priority: "medium",
    status: "in_progress",
    startDate: dateOffset(-2),
    dueDate: dateOffset(-1),
    progress: 40,
  },
  {
    id: 5,
    title: "Employee Onboarding",
    description: "Prepare onboarding documents and checklist.",
    assignedTo: 4,
    priority: "low",
    status: "completed",
    startDate: dateOffset(-4),
    dueDate: dateOffset(0),
    progress: 100,
  },
  {
    id: 6,
    title: "Daily Delivery Coordination",
    description: "Coordinate delivery schedules.",
    assignedTo: 6,
    priority: "high",
    status: "not_started",
    startDate: dateOffset(0),
    dueDate: dateOffset(3),
    progress: 0,
  },
];

const emptyForm = () => ({
  title: "",
  description: "",
  assignedTo: "",
  priority: "medium",
  status: "not_started",
  startDate: dateOffset(0),
  dueDate: dateOffset(1),
  progress: 0,
});

function TaskStatus({ status }) {
  return (
    <Chip
      size="small"
      label={optionLabel(STATUS_OPTIONS, status)}
      className={`toya-task-status status-${status}`}
    />
  );
}

function TaskPriority({ priority }) {
  return (
    <Chip
      size="small"
      label={optionLabel(PRIORITY_OPTIONS, priority)}
      className={`toya-task-priority priority-${priority}`}
    />
  );
}

function StatCard({ label, value, Icon, tone, index }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`toya-task-stat tone-${tone}`}
      initial={
        reduceMotion ? false : { opacity: 0, y: 20 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.35,
        delay: index * 0.07,
      }}
    >
      <Box className="toya-task-stat-icon">
        <Icon size={22} />
      </Box>

      <Typography className="toya-task-stat-value">
        {value}
      </Typography>

      <Typography className="toya-task-stat-label">
        {label}
      </Typography>
    </motion.div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const [search, setSearch] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const [selectedId, setSelectedId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [message, setMessage] = useState("");

  const enrichedTasks = useMemo(
    () =>
      tasks.map((task) => {
        const employee = EMPLOYEES.find(
          (item) => item.id === task.assignedTo
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
        (task) => task.status === "completed"
      ).length,
      inProgress: tasks.filter(
        (task) => task.status === "in_progress"
      ).length,
      notStarted: tasks.filter(
        (task) => task.status === "not_started"
      ).length,
    }),
    [tasks]
  );

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return enrichedTasks.filter((task) => {
      const matchesSearch = [
        task.title,
        task.description,
        task.employeeName,
        task.department,
      ].some((value) =>
        String(value).toLowerCase().includes(query)
      );

      return (
        matchesSearch &&
        (employeeFilter === "all" ||
          task.assignedTo === Number(employeeFilter)) &&
        (priorityFilter === "all" ||
          task.priority === priorityFilter) &&
        (statusFilter === "all" ||
          task.status === statusFilter)
      );
    });
  }, [
    enrichedTasks,
    search,
    employeeFilter,
    priorityFilter,
    statusFilter,
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
    setForm(emptyForm());
    setEditingId(null);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (task) => {
    setForm({
      title: task.title,
      description: task.description,
      assignedTo: String(task.assignedTo),
      priority: task.priority,
      status: task.status,
      startDate: task.startDate,
      dueDate: task.dueDate,
      progress: task.progress,
    });

    setEditingId(task.id);
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormError("");
  };

  const changeForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setFormError("");
  };

  const changeStatus = (value) => {
    setForm((previous) => ({
      ...previous,
      status: value,
      progress:
        value === "completed"
          ? 100
          : value === "not_started"
            ? 0
            : previous.progress === 100 ||
                previous.progress === 0
              ? 25
              : previous.progress,
    }));
  };

  const saveTask = (event) => {
    event?.preventDefault?.();

    const assignedTo = Number(form.assignedTo);
    const progress = Number(form.progress);

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !EMPLOYEES.some(
        (employee) => employee.id === assignedTo
      ) ||
      !form.startDate ||
      !form.dueDate
    ) {
      setFormError("Please complete all required fields.");
      return;
    }

    if (form.dueDate < form.startDate) {
      setFormError(
        "Deadline cannot be before the start date."
      );
      return;
    }

    if (
      !Number.isFinite(progress) ||
      progress < 0 ||
      progress > 100
    ) {
      setFormError("Progress must be between 0 and 100.");
      return;
    }

    const normalizedProgress =
      form.status === "completed"
        ? 100
        : form.status === "not_started"
          ? 0
          : Math.max(1, Math.min(99, progress));

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      assignedTo,
      priority: form.priority,
      status: form.status,
      startDate: form.startDate,
      dueDate: form.dueDate,
      progress: normalizedProgress,
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

      setMessage("Task assigned successfully (demo).");
    }

    closeForm();
    setPage(1);
  };

  const updateTaskStatus = (id, status) => {
    setTasks((previous) =>
      previous.map((task) => {
        if (task.id !== id) return task;

        return {
          ...task,
          status,
          progress:
            status === "completed"
              ? 100
              : status === "not_started"
                ? 0
                : task.progress > 0 && task.progress < 100
                  ? task.progress
                  : 25,
        };
      })
    );

    setMessage("Task progress updated (demo).");
  };

  const removeTask = () => {
    if (deleteId === null) return;

    setTasks((previous) =>
      previous.filter((task) => task.id !== deleteId)
    );

    setDeleteId(null);
    setSelectedId(null);
    setMessage("Task deleted successfully (demo).");
    setPage(1);
  };

  const exportCSV = () => {
    const rows = [
      [
        "Task ID",
        "Title",
        "Employee",
        "Department",
        "Priority",
        "Status",
        "Start Date",
        "Deadline",
        "Progress",
        "Description",
      ],
      ...filteredTasks.map((task) => [
        task.id,
        task.title,
        task.employeeName,
        task.department,
        task.priority,
        task.status,
        task.startDate,
        task.dueDate,
        `${task.progress}%`,
        task.description,
      ]),
    ];

    const safeCSV = (value) => {
      const safe = String(value ?? "").replace(
        /^\s*[=+\-@]/,
        "'$&"
      );

      return `"${safe.replace(/"/g, '""')}"`;
    };

    const csv = rows
      .map((row) => row.map(safeCSV).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "TOYA-Task-Report.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const columns = [
    {
      field: "title",
      headerName: "Task",
      minWidth: 230,
      renderCell: (value, row) => (
        <Box>
          <Typography
            fontWeight={700}
            fontSize={13}
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
        <Box className="toya-task-employee">
          <Avatar className="toya-task-avatar">
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
        <TaskPriority priority={value} />
      ),
    },
    {
      field: "dueDate",
      headerName: "Deadline",
      minWidth: 135,
      renderCell: (value, row) => (
        <Box>
          <Typography fontSize={12}>
            {formatDate(value)}
          </Typography>

          {row.status !== "completed" &&
            value < dateOffset(0) && (
              <Typography
                color="error"
                fontSize={11}
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
      minWidth: 130,
      renderCell: (value) => (
        <Box className="toya-task-progress-cell">
          <Box className="toya-task-progress-track">
            <Box
              className="toya-task-progress-fill"
              sx={{ width: `${value}%` }}
            />
          </Box>
          <span>{value}%</span>
        </Box>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 140,
      renderCell: (value) => (
        <TaskStatus status={value} />
      ),
    },
  ];

  const cards = [
    {
      label: "Total Tasks",
      value: stats.total,
      Icon: ListTodo,
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
      tone: "orange",
    },
    {
      label: "Not Started",
      value: stats.notStarted,
      Icon: CirclePause,
      tone: "gray",
    },
  ];

  return (
    <Box className="toya-tasks-page">
      {/* PAGE HEADER */}
      <Box className="toya-task-heading">
        <Box>
          <Typography className="toya-task-title">
            Task Management
          </Typography>
          <Typography className="toya-task-subtitle">
            Assign tasks, set deadlines and monitor progress
          </Typography>
        </Box>

        <Box className="toya-task-heading-actions">
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
          sx={{ mb: 2, borderRadius: 3 }}
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      )}

      {/* STATISTICS */}
      <Box className="toya-task-stats">
        {cards.map((card, index) => (
          <StatCard
            key={card.label}
            {...card}
            index={index}
          />
        ))}
      </Box>

      {/* FILTERS */}
      <Box className="toya-task-filters">
        <TextField
          label="Search Tasks"
          placeholder="Task title, employee..."
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
          <MenuItem value="all">
            All Employees
          </MenuItem>

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
          {PRIORITY_OPTIONS.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
            >
              {option.label}
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
          {STATUS_OPTIONS.map((option) => (
            <MenuItem
              key={option.value}
              value={option.value}
            >
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* TABLE */}
      <Box className="toya-task-table-section">
        <CommonTable
          title="Task Directory"
          rows={visibleTasks}
          columns={columns}
          searchable={false}
          pagination={false}
          getRowId={(row) => row.id}
          onView={(row) => setSelectedId(row.id)}
          onEdit={openEdit}
          onDelete={(row) => setDeleteId(row.id)}
          emptyMessage="No tasks match your filters"
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

      {/* ADD / EDIT TASK */}
      <CommonModal
        open={formOpen}
        onClose={closeForm}
        title={
          editingId !== null
            ? "Edit Task"
            : "Assign New Task"
        }
        description="Set employee, priority and deadline"
        icon={<ListTodo size={21} />}
        showFooter={false}
        maxWidth="sm"
      >
        <Box
          component="form"
          onSubmit={saveTask}
          className="toya-task-form"
        >
          <Stack spacing={2}>
            {formError && (
              <Alert severity="error">
                {formError}
              </Alert>
            )}

            <TextField
              label="Task Title"
              value={form.title}
              onChange={(event) =>
                changeForm("title", event.target.value)
              }
              required
              fullWidth
              size="small"
            />

            <TextField
              label="Task Description"
              value={form.description}
              onChange={(event) =>
                changeForm("description", event.target.value)
              }
              multiline
              minRows={3}
              required
              fullWidth
              size="small"
            />

            <TextField
              select
              label="Assign Employee"
              value={form.assignedTo}
              onChange={(event) =>
                changeForm("assignedTo", event.target.value)
              }
              required
              fullWidth
              size="small"
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

            <TextField
              select
              label="Priority"
              value={form.priority}
              onChange={(event) =>
                changeForm("priority", event.target.value)
              }
              fullWidth
              size="small"
            >
              {PRIORITY_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <Box className="toya-task-date-grid">
              <CommonDatePicker
                name="taskStart"
                label="Start Date"
                value={form.startDate}
                onChange={(value) =>
                  changeForm("startDate", value)
                }
                maxDate={form.dueDate || undefined}
                size="small"
                required
              />

              <CommonDatePicker
                name="taskDue"
                label="Deadline"
                value={form.dueDate}
                onChange={(value) =>
                  changeForm("dueDate", value)
                }
                minDate={form.startDate || undefined}
                size="small"
                required
              />
            </Box>

            <TextField
              select
              label="Task Status"
              value={form.status}
              onChange={(event) =>
                changeStatus(event.target.value)
              }
              fullWidth
              size="small"
            >
              {STATUS_OPTIONS.map((option) => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              type="number"
              label="Progress (%)"
              value={form.progress}
              disabled={form.status !== "in_progress"}
              onChange={(event) =>
                changeForm("progress", event.target.value)
              }
              slotProps={{
                htmlInput: {
                  min: 1,
                  max: 99,
                  step: 1,
                },
              }}
              size="small"
              fullWidth
            />

            <Box className="toya-task-form-actions">
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
          </Stack>
        </Box>
      </CommonModal>

      {/* VIEW TASK */}
      <CommonModal
        open={Boolean(selectedTask)}
        onClose={() => setSelectedId(null)}
        title="Task Details"
        description="Review assignment and update progress"
        icon={<CalendarClock size={21} />}
        showFooter={false}
      >
        {selectedTask && (
          <Box className="toya-task-details">
            <Box className="toya-task-view-person">
              <Avatar className="toya-task-view-avatar">
                {selectedTask.employeeName.charAt(0)}
              </Avatar>

              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={800}>
                  {selectedTask.employeeName}
                </Typography>
                <Typography
                  fontSize={12}
                  color="text.secondary"
                >
                  {selectedTask.department}
                </Typography>
              </Box>

              <TaskPriority priority={selectedTask.priority} />
            </Box>

            <Typography
              fontWeight={800}
              fontSize={17}
              sx={{ mt: 2 }}
            >
              {selectedTask.title}
            </Typography>

            <Typography
              fontSize={13}
              color="text.secondary"
              sx={{ my: 1.5, whiteSpace: "pre-wrap" }}
            >
              {selectedTask.description}
            </Typography>

            <Box className="toya-task-detail-grid">
              <Box>
                <span>Start Date</span>
                <strong>
                  {formatDate(selectedTask.startDate)}
                </strong>
              </Box>

              <Box>
                <span>Deadline</span>
                <strong>
                  {formatDate(selectedTask.dueDate)}
                </strong>
              </Box>

              <Box>
                <span>Status</span>
                <TaskStatus status={selectedTask.status} />
              </Box>

              <Box>
                <span>Progress</span>
                <strong>{selectedTask.progress}%</strong>
              </Box>
            </Box>

            {selectedTask.status !== "completed" &&
              selectedTask.dueDate < dateOffset(0) && (
                <Alert
                  severity="warning"
                  icon={<AlertTriangle size={19} />}
                >
                  This task is overdue.
                </Alert>
              )}

            <Typography fontWeight={800} fontSize={13}>
              Update Task Status
            </Typography>

            <Box className="toya-task-status-actions">
              <CommonButton
                label="Not Started"
                variant="outlined"
                disabled={selectedTask.status === "not_started"}
                onClick={() =>
                  updateTaskStatus(
                    selectedTask.id,
                    "not_started"
                  )
                }
              />

              <CommonButton
                label="In Progress"
                variant="outlined"
                disabled={selectedTask.status === "in_progress"}
                onClick={() =>
                  updateTaskStatus(
                    selectedTask.id,
                    "in_progress"
                  )
                }
              />

              <CommonButton
                label="Completed"
                color="success"
                variant="outlined"
                disabled={selectedTask.status === "completed"}
                onClick={() =>
                  updateTaskStatus(
                    selectedTask.id,
                    "completed"
                  )
                }
              />
            </Box>

            <Box className="toya-task-form-actions">
              <CommonButton
                label="Edit Task"
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

      {/* DELETE TASK */}
      <CommonModal
        open={Boolean(deleteTask)}
        onClose={() => setDeleteId(null)}
        title="Delete Task?"
        description="This action removes the demo task."
        icon={<ListTodo size={21} />}
        showFooter={false}
        maxWidth="xs"
      >
        <Typography sx={{ mb: 3 }} fontSize={13}>
          Are you sure you want to delete{" "}
          <strong>{deleteTask?.title}</strong>?
        </Typography>

        <Box className="toya-task-form-actions">
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
