
import { useMemo, useState } from "react";

import {
  Box,
  Typography,
  Avatar,
  Chip,
  Alert,
  TextField,
  MenuItem,
  Switch,
  Checkbox,
} from "@mui/material";

import {
  Users,
  UserCheck,
  UserX,
  Shield,
  ShieldCheck,
  Plus,
  Download,
  Trash2,
  RotateCcw,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

import CommonButton from "../../components/common/CommonButton";
import CommonTable from "../../components/common/CommonTable";
import CommonModal from "../../components/common/CommonModal";
import CommonPagination from "../../components/common/CommonPagination";

import "../../styles/admin/UsersRoles.css";

// =========================================
// CONSTANTS
// =========================================

const ROLE_LABELS = {
  admin: "Admin",
  manager: "Manager",
  employee: "Employee",
};

const DEPARTMENTS = [
  "IT",
  "Marketing",
  "Finance",
  "HR",
  "Operations",
];

const PERMISSIONS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "employees", label: "Employee Management" },
  { id: "departments", label: "Departments" },
  { id: "attendance", label: "Attendance" },
  { id: "work_logs", label: "Work Logs" },
  { id: "tasks", label: "Task Management" },
  { id: "reports", label: "Weekly Reports" },
  { id: "analytics", label: "Analytics" },
  { id: "users_roles", label: "Users & Roles" },
  { id: "settings", label: "Settings" },
];

const ROLE_PERMISSIONS = {
  admin: PERMISSIONS.map((item) => item.id),
  manager: [
    "dashboard",
    "employees",
    "attendance",
    "work_logs",
    "tasks",
    "reports",
    "analytics",
  ],
  employee: [
    "dashboard",
    "attendance",
    "work_logs",
    "tasks",
  ],
};

// =========================================
// DEMO USERS
// =========================================

const INITIAL_USERS = [
  {
    id: 1,
    name: "Arun Kumar",
    email: "arun@toya.example",
    department: "IT",
    role: "admin",
    status: "active",
  },
  {
    id: 2,
    name: "Priya Sharma",
    email: "priya@toya.example",
    department: "Marketing",
    role: "manager",
    status: "active",
  },
  {
    id: 3,
    name: "Rahul Raj",
    email: "rahul@toya.example",
    department: "Finance",
    role: "employee",
    status: "inactive",
  },
  {
    id: 4,
    name: "Sneha R",
    email: "sneha@toya.example",
    department: "HR",
    role: "employee",
    status: "active",
  },
  {
    id: 5,
    name: "Karthik S",
    email: "karthik@toya.example",
    department: "IT",
    role: "employee",
    status: "active",
  },
  {
    id: 6,
    name: "Meena P",
    email: "meena@toya.example",
    department: "Operations",
    role: "employee",
    status: "active",
  },
  {
    id: 7,
    name: "Vijay M",
    email: "vijay@toya.example",
    department: "Marketing",
    role: "employee",
    status: "active",
  },
  {
    id: 8,
    name: "Divya R",
    email: "divya@toya.example",
    department: "Finance",
    role: "employee",
    status: "inactive",
  },
];

// =========================================
// HELPER FUNCTIONS
// =========================================

const createEmptyForm = () => ({
  name: "",
  email: "",
  department: "IT",
  role: "employee",
  status: "active",
});

// A single function shared by Edit,
// Deactivate and Delete operations.
function isLastActiveAdmin(users, userId) {
  const selectedUser = users.find(
    (user) => user.id === userId
  );

  if (
    !selectedUser ||
    selectedUser.role !== "admin" ||
    selectedUser.status !== "active"
  ) {
    return false;
  }

  const activeAdminCount = users.filter(
    (user) =>
      user.role === "admin" &&
      user.status === "active"
  ).length;

  return activeAdminCount <= 1;
}

function getNextId(users) {
  return Math.max(0, ...users.map((user) => user.id)) + 1;
}

// Escapes CSV values and prevents basic
// spreadsheet formula interpretation.
function csvCell(value) {
  const text = String(value ?? "");
  const safe = /^[\s]*[=+\-@\t\r\n]/.test(text)
    ? `'${text}`
    : text;

  return `"${safe.replace(/"/g, '""')}"`;
}

// =========================================
// COMMON UI
// =========================================

function RoleChip({ role }) {
  return (
    <Chip
      size="small"
      label={ROLE_LABELS[role] || role}
      className={`toya-ur-role role-${role}`}
    />
  );
}

function StatusChip({ status }) {
  return (
    <Chip
      size="small"
      label={status === "active" ? "Active" : "Inactive"}
      className={`toya-ur-status status-${status}`}
    />
  );
}

function SummaryCard({ label, value, Icon, tone, index }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`toya-ur-stat tone-${tone}`}
      initial={
        reduceMotion ? false : { opacity: 0, y: 18 }
      }
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.32,
        delay: index * 0.06,
      }}
    >
      <Box className="toya-ur-stat-icon">
        <Icon size={22} />
      </Box>

      <Typography className="toya-ur-stat-number">
        {value}
      </Typography>

      <Typography className="toya-ur-stat-label">
        {label}
      </Typography>
    </motion.div>
  );
}

// =========================================
// MAIN COMPONENT
// =========================================

export default function UsersRoles() {
  // USER DATA
  const [users, setUsers] = useState(INITIAL_USERS);

  // FILTERS
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // PAGINATION
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  // ADD / EDIT
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(createEmptyForm);
  const [formError, setFormError] = useState("");

  // VIEW / DELETE
  const [selectedId, setSelectedId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  // PERMISSIONS
  const [permissionsRole, setPermissionsRole] =
    useState("admin");

  // NOTIFICATIONS
  const [message, setMessage] = useState(null);

  const notify = (text, severity = "success") => {
    setMessage({ text, severity });
  };

  // =====================================
  // STATISTICS
  // =====================================

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter(
        (user) => user.status === "active"
      ).length,
      managers: users.filter(
        (user) => user.role === "manager"
      ).length,
      inactive: users.filter(
        (user) => user.status === "inactive"
      ).length,
    };
  }, [users]);

  // =====================================
  // SEARCH AND FILTERS
  // =====================================

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return users.filter((user) => {
      if (
        roleFilter !== "all" &&
        user.role !== roleFilter
      ) {
        return false;
      }

      if (
        statusFilter !== "all" &&
        user.status !== statusFilter
      ) {
        return false;
      }

      if (!query) return true;

      return [
        user.name,
        user.email,
        user.department,
      ].some((value) =>
        value.toLowerCase().includes(query)
      );
    });
  }, [users, search, roleFilter, statusFilter]);

  // =====================================
  // PAGINATION
  // =====================================

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / rowsPerPage)
  );

  const currentPage = Math.min(page, totalPages);

  const visibleUsers = filteredUsers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // =====================================
  // SELECTED USERS
  // =====================================

  const selectedUser =
    users.find((user) => user.id === selectedId) || null;

  const deleteUser =
    users.find((user) => user.id === deleteId) || null;

  // =====================================
  // OPEN / CLOSE FORM
  // =====================================

  const openAdd = () => {
    setEditingId(null);
    setForm(createEmptyForm());
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setEditingId(user.id);

    setForm({
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
      status: user.status,
    });

    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setFormError("");
  };

  const updateField = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (formError) setFormError("");
  };

  // =====================================
  // CREATE / UPDATE USER
  // =====================================

  const saveUser = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();

    // Required values
    if (!name || !email) {
      setFormError("Name and email are required.");
      return;
    }

    // Validate email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Enter a valid email address.");
      return;
    }

    // Duplicate email validation
    const duplicateEmail = users.some(
      (user) =>
        user.email.toLowerCase() === email &&
        user.id !== editingId
    );

    if (duplicateEmail) {
      setFormError("This email is already registered.");
      return;
    }

    // Last active Admin protection
    if (
      editingId !== null &&
      isLastActiveAdmin(users, editingId) &&
      (form.role !== "admin" || form.status !== "active")
    ) {
      setFormError(
        "Cannot remove or deactivate the last active Admin."
      );
      return;
    }

    const payload = {
      name,
      email,
      department: form.department,
      role: form.role,
      status: form.status,
    };

    if (editingId !== null) {
      // UPDATE
      setUsers((previous) =>
        previous.map((user) =>
          user.id === editingId
            ? { ...user, ...payload }
            : user
        )
      );

      notify("User updated successfully.");
    } else {
      // CREATE
      setUsers((previous) => [
        ...previous,
        {
          id: getNextId(previous),
          ...payload,
        },
      ]);

      notify("Demo user added successfully.");
    }

    closeForm();
    setPage(1);
  };

  // =====================================
  // ACTIVATE / DEACTIVATE USER
  // =====================================

  const toggleStatus = (userId) => {
    const target = users.find(
      (user) => user.id === userId
    );

    if (!target) return;

    if (isLastActiveAdmin(users, userId)) {
      notify(
        "Cannot deactivate the last active Admin.",
        "error"
      );
      return;
    }

    setUsers((previous) =>
      previous.map((user) =>
        user.id === userId
          ? {
              ...user,
              status:
                user.status === "active"
                  ? "inactive"
                  : "active",
            }
          : user
      )
    );

    notify("Account status updated successfully.");
  };

  // =====================================
  // DELETE USER
  // =====================================

  const removeUser = () => {
    if (!deleteUser) return;

    if (isLastActiveAdmin(users, deleteUser.id)) {
      setDeleteId(null);

      notify(
        "Cannot delete the last active Admin.",
        "error"
      );
      return;
    }

    setUsers((previous) =>
      previous.filter(
        (user) => user.id !== deleteUser.id
      )
    );

    setDeleteId(null);
    setSelectedId(null);
    setPage(1);

    notify("Demo user deleted successfully.");
  };

  // =====================================
  // RESET FILTERS
  // =====================================

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
    setPage(1);
  };

  // =====================================
  // EXPORT CSV
  // =====================================

  const exportCSV = () => {
    const rows = [
      [
        "User ID",
        "Name",
        "Email",
        "Department",
        "Role",
        "Status",
      ],
      ...filteredUsers.map((user) => [
        `USER-${String(user.id).padStart(3, "0")}`,
        user.name,
        user.email,
        user.department,
        ROLE_LABELS[user.role],
        user.status,
      ]),
    ];

    const csv = rows
      .map((row) => row.map(csvCell).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "TOYA-Users-Roles.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // =====================================
  // TABLE COLUMNS
  // =====================================

  const columns = [
    {
      field: "name",
      headerName: "User",
      minWidth: 215,
      renderCell: (value, row) => (
        <Box className="toya-ur-user">
          <Avatar className="toya-ur-avatar">
            {value.charAt(0)}
          </Avatar>

          <Box sx={{ minWidth: 0 }}>
            <Typography
              fontWeight={700}
              fontSize={13}
            >
              {value}
            </Typography>

            <Typography
              fontSize={11}
              color="text.secondary"
              sx={{
                overflowWrap: "anywhere",
              }}
            >
              {row.email}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      field: "department",
      headerName: "Department",
      minWidth: 120,
    },
    {
      field: "role",
      headerName: "Role",
      minWidth: 110,
      renderCell: (value) => (
        <RoleChip role={value} />
      ),
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 110,
      renderCell: (value) => (
        <StatusChip status={value} />
      ),
    },
  ];

  // =====================================
  // STAT CARDS
  // =====================================

  const cards = [
    {
      label: "Total Users",
      value: stats.total,
      Icon: Users,
      tone: "blue",
    },
    {
      label: "Active Users",
      value: stats.active,
      Icon: UserCheck,
      tone: "green",
    },
    {
      label: "Managers",
      value: stats.managers,
      Icon: ShieldCheck,
      tone: "cyan",
    },
    {
      label: "Inactive Users",
      value: stats.inactive,
      Icon: UserX,
      tone: "orange",
    },
  ];

  // =====================================
  // RENDER
  // =====================================

  return (
    <Box className="toya-ur-page">

      {/* HEADER */}
      <Box className="toya-ur-heading">
        <Box>
          <Typography className="toya-ur-title">
            Users & Roles
          </Typography>

          <Typography className="toya-ur-subtitle">
            Manage users, role assignments and access
          </Typography>
        </Box>

        <Box className="toya-ur-header-actions">
          <CommonButton
            label="Export CSV"
            variant="outlined"
            startIcon={<Download size={17} />}
            onClick={exportCSV}
          />

          <CommonButton
            label="Add User"
            startIcon={<Plus size={17} />}
            onClick={openAdd}
          />
        </Box>
      </Box>

      {/* DEMO NOTICE */}
      <Alert
        severity="info"
        className="toya-ur-demo-alert"
      >
        Frontend demo only. Adding a user here does
        not create login credentials or grant
        access to the real system.
      </Alert>

      {/* FEEDBACK */}
      {message && (
        <Alert
          severity={message.severity}
          onClose={() => setMessage(null)}
          sx={{ mb: 2, borderRadius: 3 }}
        >
          {message.text}
        </Alert>
      )}

      {/* SUMMARY CARDS */}
      <Box className="toya-ur-stats">
        {cards.map((card, index) => (
          <SummaryCard
            key={card.label}
            {...card}
            index={index}
          />
        ))}
      </Box>

      {/* FILTERS */}
      <Box className="toya-ur-filters">
        <TextField
          label="Search Users"
          placeholder="Name, email or department"
          size="small"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          fullWidth
        />

        <TextField
          select
          label="Role"
          size="small"
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value);
            setPage(1);
          }}
          fullWidth
        >
          <MenuItem value="all">All Roles</MenuItem>
          {Object.entries(ROLE_LABELS).map(
            ([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            )
          )}
        </TextField>

        <TextField
          select
          label="Account Status"
          size="small"
          value={statusFilter}
          onChange={(event) => {
            setStatusFilter(event.target.value);
            setPage(1);
          }}
          fullWidth
        >
          <MenuItem value="all">All Statuses</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>

        <CommonButton
          label="Reset"
          variant="outlined"
          startIcon={<RotateCcw size={16} />}
          onClick={resetFilters}
        />
      </Box>

      {/* USERS TABLE */}
      <Box className="toya-ur-table-section">
        <CommonTable
          title="User Directory"
          columns={columns}
          rows={visibleUsers}
          searchable={false}
          pagination={false}
          getRowId={(row) => row.id}
          onView={(row) => setSelectedId(row.id)}
          onEdit={openEdit}
          onDelete={(row) => setDeleteId(row.id)}
          emptyMessage="No users found"
        />

        <CommonPagination
          page={currentPage}
          rowsPerPage={rowsPerPage}
          totalRecords={filteredUsers.length}
          onPageChange={setPage}
          onRowsPerPageChange={(value) => {
            setRowsPerPage(value);
            setPage(1);
          }}
        />
      </Box>

      {/* ROLE PERMISSION SECTION */}
      <Box className="toya-ur-permission-panel">
        <Box className="toya-ur-permission-header">
          <Box>
            <Typography
              fontWeight={800}
              fontSize={17}
            >
              Role Permissions
            </Typography>

            <Typography
              fontSize={12}
              color="text.secondary"
            >
              Preview access permissions for each role
            </Typography>
          </Box>

          <Shield size={22} color="#0879ED" />
        </Box>

        <Box className="toya-ur-role-tabs">
          {Object.entries(ROLE_LABELS).map(
            ([value, label]) => (
              <button
                key={value}
                type="button"
                className={
                  permissionsRole === value
                    ? "active"
                    : ""
                }
                onClick={() =>
                  setPermissionsRole(value)
                }
              >
                {label}
              </button>
            )
          )}
        </Box>

        <Box className="toya-ur-permission-grid">
          {PERMISSIONS.map((permission) => {
            const allowed =
              ROLE_PERMISSIONS[permissionsRole].includes(
                permission.id
              );

            return (
              <Box
                key={permission.id}
                className={`toya-ur-permission-item ${
                  allowed ? "allowed" : "restricted"
                }`}
              >
                <Checkbox
                  checked={allowed}
                  disabled
                  size="small"
                />

                <span>{permission.label}</span>

                <Chip
                  size="small"
                  label={
                    allowed ? "Allowed" : "Restricted"
                  }
                  color={
                    allowed ? "success" : "default"
                  }
                  variant="outlined"
                />
              </Box>
            );
          })}
        </Box>

        <Alert
          severity="warning"
          sx={{ mt: 2, borderRadius: 3 }}
        >
          Role permissions are currently
          display-only. Actual authorization
          must be enforced through the backend.
        </Alert>
      </Box>

      {/* ADD / EDIT MODAL */}
      <CommonModal
        open={formOpen}
        onClose={closeForm}
        title={
          editingId !== null
            ? "Edit User"
            : "Add New User"
        }
        description="Manage user profile and role"
        icon={<Users size={21} />}
        showFooter={false}
        maxWidth="sm"
      >
        <Box
          component="form"
          onSubmit={saveUser}
          className="toya-ur-form"
        >
          {formError && (
            <Alert severity="error">
              {formError}
            </Alert>
          )}

          <TextField
            label="Full Name"
            value={form.name}
            onChange={(event) =>
              updateField("name", event.target.value)
            }
            required
            fullWidth
            size="small"
          />

          <TextField
            type="email"
            label="Email Address"
            value={form.email}
            onChange={(event) =>
              updateField("email", event.target.value)
            }
            required
            fullWidth
            size="small"
          />

          <TextField
            select
            label="Department"
            value={form.department}
            onChange={(event) =>
              updateField(
                "department",
                event.target.value
              )
            }
            fullWidth
            size="small"
          >
            {DEPARTMENTS.map((item) => (
              <MenuItem
                key={item}
                value={item}
              >
                {item}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            label="User Role"
            value={form.role}
            onChange={(event) =>
              updateField("role", event.target.value)
            }
            fullWidth
            size="small"
          >
            {Object.entries(ROLE_LABELS).map(
              ([value, label]) => (
                <MenuItem
                  key={value}
                  value={value}
                >
                  {label}
                </MenuItem>
              )
            )}
          </TextField>

          <TextField
            select
            label="Account Status"
            value={form.status}
            onChange={(event) =>
              updateField("status", event.target.value)
            }
            fullWidth
            size="small"
          >
            <MenuItem value="active">
              Active
            </MenuItem>
            <MenuItem value="inactive">
              Inactive
            </MenuItem>
          </TextField>

          <Box className="toya-ur-form-actions">
            <CommonButton
              label="Cancel"
              variant="outlined"
              onClick={closeForm}
            />

            <CommonButton
              label={
                editingId !== null
                  ? "Update User"
                  : "Add User"
              }
              type="submit"
            />
          </Box>
        </Box>
      </CommonModal>

      {/* USER DETAILS MODAL */}
      <CommonModal
        open={Boolean(selectedUser)}
        onClose={() => setSelectedId(null)}
        title="User Details"
        description="Account information and role"
        icon={<ShieldCheck size={21} />}
        showFooter={false}
        maxWidth="sm"
      >
        {selectedUser && (
          <Box className="toya-ur-details">
            <Box className="toya-ur-profile">
              <Avatar className="toya-ur-profile-avatar">
                {selectedUser.name.charAt(0)}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography fontWeight={800}>
                  {selectedUser.name}
                </Typography>

                <Typography
                  fontSize={12}
                  color="text.secondary"
                  sx={{
                    overflowWrap: "anywhere",
                  }}
                >
                  {selectedUser.email}
                </Typography>
              </Box>
            </Box>

            <Box className="toya-ur-details-grid">
              <Box>
                <span>Department</span>
                <strong>
                  {selectedUser.department}
                </strong>
              </Box>

              <Box>
                <span>Role</span>
                <RoleChip role={selectedUser.role} />
              </Box>

              <Box>
                <span>Account Status</span>
                <StatusChip
                  status={selectedUser.status}
                />
              </Box>

              <Box>
                <span>User ID</span>
                <strong>
                  USER-
                  {String(selectedUser.id).padStart(3, "0")}
                </strong>
              </Box>
            </Box>

            <Box className="toya-ur-switch-panel">
              <Box>
                <Typography
                  fontWeight={750}
                  fontSize={13}
                >
                  Account Enabled
                </Typography>

                <Typography
                  fontSize={12}
                  color="text.secondary"
                >
                  Toggle demo account status
                </Typography>
              </Box>

              <Switch
                checked={
                  selectedUser.status === "active"
                }
                onChange={() =>
                  toggleStatus(selectedUser.id)
                }
              />
            </Box>

            <Typography
              fontSize={13}
              fontWeight={800}
              sx={{ mt: 2, mb: 1 }}
            >
              Role Permissions
            </Typography>

            <Box className="toya-ur-details-permissions">
              {PERMISSIONS.filter((permission) =>
                ROLE_PERMISSIONS[
                  selectedUser.role
                ].includes(permission.id)
              ).map((permission) => (
                <Chip
                  key={permission.id}
                  size="small"
                  label={permission.label}
                  variant="outlined"
                  color="success"
                />
              ))}
            </Box>

            <Box className="toya-ur-form-actions">
              <CommonButton
                label="Edit User"
                variant="outlined"
                onClick={() => {
                  openEdit(selectedUser);
                  setSelectedId(null);
                }}
              />

              <CommonButton
                label="Close"
                onClick={() =>
                  setSelectedId(null)
                }
              />
            </Box>
          </Box>
        )}
      </CommonModal>

      {/* DELETE CONFIRMATION */}
      <CommonModal
        open={Boolean(deleteUser)}
        onClose={() => setDeleteId(null)}
        title="Delete User?"
        description="This removes the demo user."
        icon={<Trash2 size={21} />}
        showFooter={false}
        maxWidth="xs"
      >
        <Typography fontSize={13}>
          Are you sure you want to delete{" "}
          <strong>{deleteUser?.name}</strong>?
        </Typography>

        <Box className="toya-ur-form-actions">
          <CommonButton
            label="Cancel"
            variant="outlined"
            onClick={() => setDeleteId(null)}
          />

          <CommonButton
            label="Delete User"
            color="error"
            onClick={removeUser}
          />
        </Box>
      </CommonModal>
    </Box>
  );
}
