
import { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Avatar,
  Alert,
  Chip,
} from "@mui/material";

import {
  Building2,
  Users,
  UserRoundCheck,
  Plus,
  Save,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

import CommonButton from "../../components/common/CommonButton";
import CommonInput from "../../components/common/CommonInput";
import CommonSelect from "../../components/common/CommonSelect";
import CommonTable from "../../components/common/CommonTable";
import CommonModal from "../../components/common/CommonModal";
import CommonConfirmDialog from "../../components/common/CommonConfirmDialog";
import CommonStatusBadge from "../../components/common/CommonStatusBadge";

import "../../styles/admin/Departments.css";

// Mock records for the frontend phase.
// department IDs are stable, even when names change.

const initialDepartments = [
  {
    id: 1,
    name: "Information Technology",
    code: "IT",
    description: "Technology and software development",
    managerId: 5,
    employeeCount: 2,
    status: "active",
  },
  {
    id: 2,
    name: "Marketing",
    code: "MKT",
    description: "Campaigns, branding and communications",
    managerId: 2,
    employeeCount: 2,
    status: "active",
  },
  {
    id: 3,
    name: "Finance",
    code: "FIN",
    description: "Financial operations and reporting",
    managerId: null,
    employeeCount: 2,
    status: "active",
  },
  {
    id: 4,
    name: "Human Resources",
    code: "HR",
    description: "Recruitment and employee relations",
    managerId: 4,
    employeeCount: 1,
    status: "active",
  },
  {
    id: 5,
    name: "Operations",
    code: "OPS",
    description: "Daily company operations",
    managerId: null,
    employeeCount: 1,
    status: "active",
  },
];

const employees = [
  { id: 1, name: "Arun Kumar", departmentId: 1 },
  { id: 2, name: "Priya Sharma", departmentId: 2 },
  { id: 3, name: "Rahul Raj", departmentId: 3 },
  { id: 4, name: "Sneha R", departmentId: 4 },
  { id: 5, name: "Karthik S", departmentId: 1 },
  { id: 6, name: "Meena P", departmentId: 5 },
  { id: 7, name: "Vijay M", departmentId: 2 },
  { id: 8, name: "Divya R", departmentId: 3 },
];

const emptyForm = {
  name: "",
  code: "",
  description: "",
  managerId: null,
  status: "active",
};

const statusOptions = [
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
];

export default function Departments() {
  const reduceMotion = useReducedMotion();

  const [departments, setDepartments] =
    useState(initialDepartments);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [formOpen, setFormOpen] = useState(false);

  const [viewDepartment, setViewDepartment] = useState(null);
  const [deleteDepartment, setDeleteDepartment] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [nextId, setNextId] = useState(6);

  const employeeCountFor = (department) =>
    employees.filter(
      (employee) => employee.departmentId === department.id
    ).length;

  const getManagerName = (managerId) =>
    employees.find((employee) => employee.id === managerId)
      ?.name ?? "Not Assigned";

  const enrichedDepartments = useMemo(
    () =>
      departments.map((department) => ({
        ...department,
        employeeCount: employeeCountFor(department),
        managerName: getManagerName(department.managerId),
      })),
    [departments]
  );

  const filteredDepartments = useMemo(() => {
    const keyword = search.toLowerCase().trim();

    return enrichedDepartments.filter((department) => {
      const matchesSearch = [
        department.name,
        department.code,
        department.description,
        department.managerName,
      ].some((value) =>
        String(value ?? "").toLowerCase().includes(keyword)
      );

      return (
        matchesSearch &&
        (!statusFilter || department.status === statusFilter)
      );
    });
  }, [enrichedDepartments, search, statusFilter]);

  const stats = {
    departments: departments.length,
    employees: employees.filter((employee) =>
      departments.some(
        (department) => department.id === employee.departmentId
      )
    ).length,
    managers: departments.filter(
      (department) => department.managerId !== null
    ).length,
  };

  const managerOptions = (departmentId) => [
    { label: "Not Assigned", value: "unassigned" },
    ...employees
      .filter(
        (employee) =>
          employee.departmentId === departmentId ||
          departmentId === null
      )
      .map((employee) => ({
        label: employee.name,
        value: employee.id,
      })),
  ];

  const updateForm = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
    setError("");
  };

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setError("");
    setFormOpen(true);
  };

  const openEdit = (department) => {
    setEditingId(department.id);
    setForm({
      name: department.name,
      code: department.code,
      description: department.description,
      managerId: department.managerId,
      status: department.status,
    });
    setError("");
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setError("");
  };

  const handleSave = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();

    if (!name || !code) {
      setError("Department name and code are required.");
      return;
    }

    const duplicate = departments.some(
      (department) =>
        department.id !== editingId &&
        (
          department.name.toLowerCase() === name.toLowerCase() ||
          department.code.toLowerCase() === code.toLowerCase()
        )
    );

    if (duplicate) {
      setError("Department name or code already exists.");
      return;
    }

    const managerId =
      form.managerId === "unassigned" ? null : form.managerId;

    if (managerId !== null) {
      const eligible = employees.some(
        (employee) =>
          employee.id === managerId &&
          (
            editingId === null ||
            employee.departmentId === editingId
          )
      );

      if (!eligible) {
        setError("Please select an eligible department employee.");
        return;
      }

      const assignedElsewhere = departments.some(
        (department) =>
          department.id !== editingId &&
          department.managerId === managerId
      );

      if (assignedElsewhere) {
        setError("This employee already manages another department.");
        return;
      }
    }

    const updated = {
      name,
      code,
      description: form.description.trim(),
      managerId,
      status: form.status || "active",
    };

    if (editingId !== null) {
      setDepartments((previous) =>
        previous.map((department) =>
          department.id === editingId
            ? { ...department, ...updated }
            : department
        )
      );
      setMessage("Department updated (frontend demo).");
    } else {
      setDepartments((previous) => [
        ...previous,
        { id: nextId, ...updated, employeeCount: 0 },
      ]);
      setNextId((previous) => previous + 1);
      setMessage("New department added (frontend demo).");
    }

    closeForm();
  };

  const handleDelete = () => {
    if (!deleteDepartment) return;

    if (employeeCountFor(deleteDepartment) > 0) {
      setError("Cannot delete a department with employees.");
      setMessage("");
      setDeleteDepartment(null);
      return;
    }

    setDepartments((previous) =>
      previous.filter(
        (department) => department.id !== deleteDepartment.id
      )
    );

    setMessage("Department deleted (frontend demo).");
    setDeleteDepartment(null);
  };

  const columns = [
    {
      field: "code",
      headerName: "Code",
      minWidth: 90,
    },
    {
      field: "name",
      headerName: "Department",
      minWidth: 200,
      renderCell: (value) => (
        <Box className="toya-dept-name-cell">
          <Box className="toya-dept-icon">
            <Building2 size={19} />
          </Box>
          <Typography fontWeight={700} fontSize={13}>
            {value}
          </Typography>
        </Box>
      ),
    },
    {
      field: "managerName",
      headerName: "Manager",
      minWidth: 155,
    },
    {
      field: "employeeCount",
      headerName: "Employees",
      minWidth: 115,
    },
    {
      field: "status",
      headerName: "Status",
      minWidth: 125,
      renderCell: (value) => (
        <CommonStatusBadge
          status={value}
          size="small"
          animated={false}
        />
      ),
    },
  ];

  return (
    <Box className="toya-departments-page">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Box className="toya-dept-heading">
          <Box>
            <Typography className="toya-dept-page-title">
              Department Management
            </Typography>
            <Typography color="text.secondary" fontSize={13}>
              Manage departments and department managers
            </Typography>
          </Box>

          <CommonButton
            label="Add Department"
            startIcon={<Plus size={18} />}
            onClick={openAdd}
          />
        </Box>
      </motion.div>

      {message && (
        <Alert
          severity="success"
          sx={{ mb: 2, borderRadius: 3 }}
          onClose={() => setMessage("")}
        >
          {message}
        </Alert>
      )}

      {error && !formOpen && (
        <Alert
          severity="error"
          sx={{ mb: 2, borderRadius: 3 }}
          onClose={() => setError("")}
        >
          {error}
        </Alert>
      )}

      <Box className="toya-dept-stats">
        {[
          { title: "Departments", value: stats.departments, Icon: Building2 },
          { title: "Employees", value: stats.employees, Icon: Users },
          { title: "Assigned Managers", value: stats.managers, Icon: UserRoundCheck },
        ].map(({ title, value, Icon }, index) => (
          <motion.div
            key={title}
            className="toya-dept-stat-card"
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Box className="toya-dept-stat-icon">
              <Icon size={22} />
            </Box>
            <Box>
              <Typography className="toya-dept-stat-value">
                {value}
              </Typography>
              <Typography color="text.secondary" fontSize={12}>
                {title}
              </Typography>
            </Box>
          </motion.div>
        ))}
      </Box>

      <Box className="toya-dept-filters">
        <CommonInput
          label="Search Departments"
          name="departmentSearch"
          placeholder="Search name, code, manager..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
        />

        <CommonSelect
          label="Status"
          options={statusOptions}
          value={statusFilter}
          onChange={setStatusFilter}
          placeholder="All Statuses"
          size="small"
        />
      </Box>

      <CommonTable
        title="Department Directory"
        rows={filteredDepartments}
        columns={columns}
        searchable={false}
        pagination
        pageSize={5}
        getRowId={(row) => row.id}
        onView={setViewDepartment}
        onEdit={openEdit}
        onDelete={setDeleteDepartment}
        emptyMessage="No departments found"
      />

      {/* Add / Edit Modal */}
      <CommonModal
        open={formOpen}
        onClose={closeForm}
        title={
          editingId !== null
            ? "Edit Department"
            : "Add New Department"
        }
        description="Configure department information and manager."
        icon={<Building2 size={22} />}
        confirmText={
          editingId !== null
            ? "Update Department"
            : "Save Department"
        }
        confirmType="submit"
        formId="toya-department-form"
      >
        <Box
          id="toya-department-form"
          component="form"
          onSubmit={handleSave}
          sx={{ pt: 1 }}
        >
          <Stack spacing={2.5}>
            {error && <Alert severity="error">{error}</Alert>}

            <CommonInput
              name="name"
              label="Department Name"
              value={form.name}
              onChange={(event) =>
                updateForm("name", event.target.value)
              }
              required
            />

            <CommonInput
              name="code"
              label="Department Code"
              value={form.code}
              onChange={(event) =>
                updateForm("code", event.target.value)
              }
              placeholder="Example: IT, MKT, FIN"
              required
            />

            <CommonInput
              name="description"
              label="Description"
              value={form.description}
              onChange={(event) =>
                updateForm("description", event.target.value)
              }
              multiline
              rows={3}
            />

            <CommonSelect
              label="Department Manager"
              options={managerOptions(editingId)}
              value={form.managerId ?? "unassigned"}
              onChange={(value) =>
                updateForm("managerId", value)
              }
            />

            <CommonSelect
              label="Status"
              options={statusOptions}
              value={form.status}
              onChange={(value) =>
                updateForm("status", value)
              }
              required
            />
          </Stack>
        </Box>
      </CommonModal>

      {/* Department Details */}
      <CommonModal
        open={Boolean(viewDepartment)}
        onClose={() => setViewDepartment(null)}
        title="Department Details"
        icon={<Building2 size={22} />}
        showFooter={false}
      >
        {viewDepartment && (
          <Stack spacing={2}>
            {[
              ["Name", viewDepartment.name],
              ["Code", viewDepartment.code],
              ["Description", viewDepartment.description || "—"],
              ["Manager", getManagerName(viewDepartment.managerId)],
              ["Employees", employeeCountFor(viewDepartment)],
              ["Status", viewDepartment.status],
            ].map(([label, value]) => (
              <Box key={label} className="toya-dept-detail">
                <Typography color="text.secondary" fontSize={13}>
                  {label}
                </Typography>
                <Typography fontSize={13} fontWeight={700}>
                  {value}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </CommonModal>

      {/* Delete Confirmation */}
      <CommonConfirmDialog
        open={Boolean(deleteDepartment)}
        onClose={() => setDeleteDepartment(null)}
        onConfirm={handleDelete}
        title="Delete Department?"
        message={
          deleteDepartment
            ? employeeCountFor(deleteDepartment) > 0
              ? `${deleteDepartment.name} contains employees. Reassign them before deleting this department.`
              : `Delete ${deleteDepartment.name}? This action cannot be undone.`
            : ""
        }
        variant="danger"
        confirmText="Delete Department"
        disabled={
          Boolean(deleteDepartment) &&
          employeeCountFor(deleteDepartment) > 0
        }
      />
    </Box>
  );
}
