
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Box,
  Typography,
  Avatar,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  Chip,
} from "@mui/material";

import {
  Plus,
  UserRound,
  Users,
  UserCheck,
  Building2,
  Save,
  X,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

import CommonButton from "../../components/common/CommonButton";
import CommonInput from "../../components/common/CommonInput";
import CommonSelect from "../../components/common/CommonSelect";
import CommonTable from "../../components/common/CommonTable";
import CommonStatusBadge from "../../components/common/CommonStatusBadge";

import {
  createEmployee,
  getEmployees,
  updateEmployee,
  updateEmployeeStatus,
} from "../../api/employeeApi";

import "../../styles/admin/Employees.css";

const departmentOptions = [
  { label: "Information Technology", value: "IT" },
  { label: "Marketing", value: "Marketing" },
  { label: "Finance", value: "Finance" },
  { label: "Human Resources", value: "HR" },
  { label: "Operations", value: "Operations" },
];

const roleOptions = [
  { label: "Manager", value: "manager" },
  { label: "Employee", value: "employee" },
];

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

const emptyForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  department: null,
  role: "employee",
  designation: "",
  status: "active",
};

export default function Employees() {
  const reduceMotion = useReducedMotion();

  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState(null);
  const [statusFilter, setStatusFilter] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [viewEmployee, setViewEmployee] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);

  const [form, setForm] = useState({ ...emptyForm });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Fetch employees from the backend.
  const loadEmployees = useCallback(async (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError("");

    try {
      const data = await getEmployees();
      setEmployees(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Unable to load employees.");
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  // Dashboard statistics.
  const stats = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter(
        (employee) => employee.status === "active"
      ).length,
      departments: new Set(
        employees.map((employee) => employee.department).filter(Boolean)
      ).size,
    }),
    [employees]
  );

  // Search and filters.
  const filteredEmployees = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return employees.filter((employee) => {
      const matchesSearch = [
        employee.name,
        employee.employeeCode,
        employee.email,
        employee.designation,
        employee.department,
        employee.role,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(keyword)
      );

      const matchesDepartment =
        !departmentFilter || employee.department === departmentFilter;

      const matchesStatus =
        !statusFilter || employee.status === statusFilter;

      return matchesSearch && matchesDepartment && matchesStatus;
    });
  }, [employees, search, departmentFilter, statusFilter]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
  };

  const handleSelectChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setError("");
  };

  // Open Add Employee form.
  const openAdd = () => {
    setEditingEmployee(null);
    setForm({ ...emptyForm });
    setError("");
    setMessage("");
    setFormOpen(true);
  };

  // Open Edit Employee form and prefill the selected employee.
  const openEdit = (employee) => {
    setEditingEmployee(employee);

    setForm({
      name: employee.name || "",
      email: employee.email || "",
      password: "",
      phone: employee.phone || "",
      department: employee.department || null,
      role: employee.role || "employee",
      designation: employee.designation || "",
      status: employee.status || "active",
    });

    setError("");
    setMessage("");
    setFormOpen(true);
  };

  const closeForm = () => {
    if (saving) return;

    setFormOpen(false);
    setEditingEmployee(null);
    setForm({ ...emptyForm });
    setError("");
  };

  // Create a new employee or update an existing employee.
  const handleSave = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (
      !form.name.trim() ||
      !form.email.trim() ||
      !form.department ||
      !form.role ||
      !form.designation.trim()
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    // Email changes require a separate account-management workflow.
    if (
      editingEmployee &&
      form.email.trim().toLowerCase() !==
        editingEmployee.email?.toLowerCase()
    ) {
      setError(
        "Email address cannot be changed here. Use a dedicated email-update workflow."
      );
      return;
    }

    if (!editingEmployee && form.password.length < 8) {
      setError("The initial password must contain at least 8 characters.");
      return;
    }

    const duplicateEmail = employees.some(
      (employee) =>
        employee.id !== editingEmployee?.id &&
        employee.email?.toLowerCase() === form.email.trim().toLowerCase()
    );

    if (duplicateEmail) {
      setError("An employee with this email already exists.");
      return;
    }

    setSaving(true);

    try {
      if (editingEmployee) {
        // Save profile details first.
        await updateEmployee(editingEmployee.id, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          department: form.department,
          role: form.role,
          designation: form.designation.trim(),
        });

        // Synchronize Firebase Authentication and Firestore status.
        if (form.status !== editingEmployee.status) {
          await updateEmployeeStatus(editingEmployee.id, form.status);
        }

        setMessage("Employee details updated successfully.");
      } else {
        const result = await createEmployee({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          password: form.password,
          phone: form.phone.trim(),
          department: form.department,
          role: form.role,
          designation: form.designation.trim(),
          status: form.status,
        });

        setMessage(
          result.message || "Employee account created successfully."
        );
      }

      setFormOpen(false);
      setEditingEmployee(null);
      setForm({ ...emptyForm });

      // Refresh directory and statistics from the backend.
      await loadEmployees();
    } catch (err) {
      setError(err.message || "Unable to save employee.");
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        field: "employeeCode",
        headerName: "Employee ID",
        minWidth: 125,
      },
      {
        field: "name",
        headerName: "Employee",
        minWidth: 190,
        renderCell: (value, row) => (
          <Box className="toya-employee-cell">
            <Avatar className="toya-employee-avatar">
              {value?.charAt(0)?.toUpperCase() || "E"}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Typography fontSize={13} fontWeight={700}>
                {value || "—"}
              </Typography>

              <Typography
                fontSize={11}
                color="text.secondary"
                sx={{ overflowWrap: "anywhere" }}
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
        minWidth: 130,
        renderCell: (value) => (
          <Chip
            label={value || "Unassigned"}
            size="small"
            className="toya-department-chip"
          />
        ),
      },
      {
        field: "designation",
        headerName: "Designation",
        minWidth: 175,
      },
      {
        field: "role",
        headerName: "Role",
        minWidth: 110,
        renderCell: (value) => (
          <span className="toya-role-text">
            {value
              ? value.charAt(0).toUpperCase() + value.slice(1)
              : "Employee"}
          </span>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        minWidth: 125,
        renderCell: (value) => (
          <CommonStatusBadge
            status={value || "inactive"}
            size="small"
            animated={false}
          />
        ),
      },
    ],
    []
  );

  return (
    <Box className="toya-employees-page">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box className="toya-employees-heading">
          <Box>
            <Typography className="toya-employees-title">
              Employee Management
            </Typography>

            <Typography className="toya-employees-subtitle">
              Manage employees, departments and roles
            </Typography>
          </Box>

          <CommonButton
            label="Add Employee"
            startIcon={<Plus size={18} />}
            onClick={openAdd}
          />
        </Box>
      </motion.div>

      {message && (
        <Alert
          severity="success"
          sx={{ mb: 3, borderRadius: 3 }}
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      )}

      {error && !formOpen && (
        <Alert
          severity="error"
          sx={{ mb: 3, borderRadius: 3 }}
          onClose={() => setError("")}
          action={
            <CommonButton
              label="Retry"
              size="small"
              variant="outlined"
              onClick={() => loadEmployees()}
              disabled={loading}
            />
          }
        >
          {error}
        </Alert>
      )}

      {/* Statistics */}
      <Box className="toya-employees-stats">
        {[
          { label: "Total Employees", value: stats.total, icon: Users },
          { label: "Active Employees", value: stats.active, icon: UserCheck },
          { label: "Departments", value: stats.departments, icon: Building2 },
        ].map((item, index) => {
          const Icon = item.icon;

          return (
            <motion.div
              key={item.label}
              className="toya-employees-stat-card"
              initial={reduceMotion ? false : { opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
            >
              <Box className="toya-employees-stat-icon">
                <Icon size={23} />
              </Box>

              <Box>
                <Typography className="toya-employees-stat-value">
                  {item.value}
                </Typography>

                <Typography className="toya-employees-stat-label">
                  {item.label}
                </Typography>
              </Box>
            </motion.div>
          );
        })}
      </Box>

      {/* Search and filters */}
      <Box className="toya-employees-filters">
        <CommonInput
          name="search"
          label="Search Employees"
          placeholder="Name, ID, email, designation..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          startIcon={<UserRound size={18} />}
          size="small"
        />

        <CommonSelect
          label="Department"
          placeholder="All Departments"
          options={departmentOptions}
          value={departmentFilter}
          onChange={setDepartmentFilter}
          size="small"
        />

        <CommonSelect
          label="Status"
          placeholder="All Statuses"
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          size="small"
        />
      </Box>

      {/* Employee directory */}
      <CommonTable
        title="Employee Directory"
        rows={filteredEmployees}
        columns={columns}
        loading={loading}
        getRowId={(row) => row.id}
        searchable={false}
        pagination
        pageSize={5}
        onView={setViewEmployee}
        onEdit={openEdit}
        emptyMessage="No matching employees found"
      />

      {/* Add / Edit Employee dialog */}
      <Dialog
        open={formOpen}
        onClose={closeForm}
        fullWidth
        maxWidth="sm"
        aria-labelledby="toya-employee-form-title"
        slotProps={{
          paper: { className: "toya-employee-dialog" },
        }}
      >
        <DialogTitle className="toya-employee-dialog-title">
          <Box>
            <Typography
              id="toya-employee-form-title"
              fontSize={21}
              fontWeight={800}
            >
              {editingEmployee ? "Edit Employee" : "Add New Employee"}
            </Typography>

            <Typography
              fontSize={12}
              color="text.secondary"
              sx={{ mt: 1 }}
            >
              {editingEmployee
                ? "Update employee profile and account settings"
                : "Create a Firebase login and employee profile"}
            </Typography>
          </Box>

          <IconButton
            onClick={closeForm}
            disabled={saving}
            aria-label="Close employee form"
          >
            <X size={20} />
          </IconButton>
        </DialogTitle>

        <Box
          component="form"
          id="toya-employee-form"
          onSubmit={handleSave}
        >
          <DialogContent dividers>
            <Stack spacing={2.5} sx={{ py: 1 }}>
              {error && <Alert severity="error">{error}</Alert>}

              <CommonInput
                name="name"
                label="Employee Name"
                value={form.name}
                onChange={handleInputChange}
                required
              />

              <CommonInput
                name="email"
                label="Email Address"
                type="email"
                value={form.email}
                onChange={handleInputChange}
                required
                disabled={Boolean(editingEmployee)}
              />

              {!editingEmployee && (
                <>
                  <CommonInput
                    name="password"
                    label="Initial Password"
                    type="password"
                    value={form.password}
                    onChange={handleInputChange}
                    required
                  />

                  <Typography variant="caption" color="text.secondary">
                    Use at least 8 characters. Provide a secure way for the
                    employee to change this password after their first sign-in.
                  </Typography>
                </>
              )}

              <CommonInput
                name="phone"
                label="Phone Number"
                type="tel"
                value={form.phone}
                onChange={handleInputChange}
              />

              <CommonSelect
                label="Department"
                options={departmentOptions}
                value={form.department}
                onChange={(value) =>
                  handleSelectChange("department", value)
                }
                required
              />

              <CommonInput
                name="designation"
                label="Designation"
                value={form.designation}
                onChange={handleInputChange}
                required
              />

              <CommonSelect
                label="Employee Role"
                options={roleOptions}
                value={form.role}
                onChange={(value) => handleSelectChange("role", value)}
                required
              />

              <CommonSelect
                label="Account Status"
                options={statusOptions}
                value={form.status}
                onChange={(value) => handleSelectChange("status", value)}
                required
              />

              {editingEmployee && (
                <Alert severity="info">
                  Changing status updates the employee's Firebase
                  Authentication account and Firestore profile.
                </Alert>
              )}
            </Stack>
          </DialogContent>

          <DialogActions className="toya-employee-dialog-actions">
            <CommonButton
              label="Cancel"
              variant="outlined"
              onClick={closeForm}
              disabled={saving}
            />

            <CommonButton
              type="submit"
              label={
                saving
                  ? "Saving..."
                  : editingEmployee
                    ? "Save Changes"
                    : "Create Employee"
              }
              startIcon={<Save size={17} />}
              loading={saving}
              disabled={saving}
            />
          </DialogActions>
        </Box>
      </Dialog>

      {/* View employee details */}
      <Dialog
        open={Boolean(viewEmployee)}
        onClose={() => setViewEmployee(null)}
        fullWidth
        maxWidth="xs"
        aria-labelledby="toya-view-employee-title"
        slotProps={{
          paper: { className: "toya-employee-dialog" },
        }}
      >
        <DialogTitle id="toya-view-employee-title">
          Employee Details
        </DialogTitle>

        <DialogContent dividers>
          {viewEmployee && (
            <Stack spacing={2}>
              <Box className="toya-employee-view-profile">
                <Avatar className="toya-employee-view-avatar">
                  {viewEmployee.name?.charAt(0)?.toUpperCase() || "E"}
                </Avatar>

                <Typography fontWeight={800} fontSize={20}>
                  {viewEmployee.name}
                </Typography>

                <Typography color="text.secondary">
                  {viewEmployee.employeeCode || viewEmployee.id}
                </Typography>
              </Box>

              {[
                ["Email", viewEmployee.email],
                ["Phone", viewEmployee.phone || "—"],
                ["Department", viewEmployee.department || "—"],
                ["Designation", viewEmployee.designation || "—"],
                ["Role", viewEmployee.role || "employee"],
                ["Status", viewEmployee.status || "inactive"],
              ].map(([label, value]) => (
                <Box
                  key={label}
                  className="toya-employee-detail-row"
                >
                  <Typography color="text.secondary">
                    {label}
                  </Typography>

                  <Typography fontWeight={650}>
                    {value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <CommonButton
            label="Close"
            variant="outlined"
            onClick={() => setViewEmployee(null)}
          />

          {viewEmployee && (
            <CommonButton
              label="Edit Employee"
              onClick={() => {
                const employee = viewEmployee;
                setViewEmployee(null);
                openEdit(employee);
              }}
            />
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
