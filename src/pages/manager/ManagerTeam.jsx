
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Box,
  Typography,
  Avatar,
  Chip,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Button,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";

import {
  Users,
  Search,
  Eye,
  X,
  CalendarCheck,
  BriefcaseBusiness,
  Mail,
  RefreshCw,
} from "lucide-react";

import { getManagerTeam } from "../../api/managerApi";
import "../../styles/manager/ManagerTeam.css";

function AttendanceBadge({ status }) {
  const color =
    status === "Present"
      ? "success"
      : status === "Absent"
        ? "error"
        : status === "Leave"
          ? "warning"
          : "default";

  return (
    <Chip
      label={status || "Not Available"}
      color={color}
      variant="outlined"
      size="small"
      sx={{ fontWeight: 700 }}
    />
  );
}

export default function ManagerTeam() {
  const [employees, setEmployees] = useState([]);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTeam = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await getManagerTeam();

      const normalizedEmployees = result.map((employee) => ({
        ...employee,
        name: employee.name || "Unnamed Employee",
        email: employee.email || "",
        department: employee.department || "Unassigned",
        status: employee.status || "active",
      }));

      setEmployees(normalizedEmployees);
    } catch (err) {
      setError(err.message || "Unable to load team members.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  const departments = useMemo(
    () =>
      [...new Set(employees.map((employee) => employee.department))]
        .sort(),
    [employees]
  );

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch = [
        employee.name,
        employee.email,
        employee.department,
        employee.employeeCode,
        employee.designation,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      const matchesDepartment =
        department === "all" ||
        employee.department === department;

      return matchesSearch && matchesDepartment;
    });
  }, [employees, search, department]);

  const selected = selectedEmployee
    ? employees.find((employee) => employee.id === selectedEmployee)
    : null;

  return (
    <Box className="toya-manager-team">
      {/* HEADER */}
      <Box className="tmt-header">
        <Box>
          <Typography className="tmt-title">
            My Team
          </Typography>

          <Typography className="tmt-subtitle">
            View your team members and employee details
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={<RefreshCw size={16} />}
          onClick={loadTeam}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {/* SUMMARY */}
      <Box className="tmt-summary">
        <Box className="tmt-summary-card">
          <Box className="tmt-summary-icon blue">
            <Users size={20} />
          </Box>

          <Box>
            <Typography className="tmt-summary-value">
              {loading ? "—" : employees.length}
            </Typography>

            <Typography className="tmt-summary-label">
              Team Members
            </Typography>
          </Box>
        </Box>

        <Box className="tmt-summary-card">
          <Box className="tmt-summary-icon green">
            <CalendarCheck size={20} />
          </Box>

          <Box>
            <Typography className="tmt-summary-value">
              —
            </Typography>

            <Typography className="tmt-summary-label">
              Present Today
            </Typography>
          </Box>
        </Box>

        <Box className="tmt-summary-card">
          <Box className="tmt-summary-icon cyan">
            <BriefcaseBusiness size={20} />
          </Box>

          <Box>
            <Typography className="tmt-summary-value">
              —
            </Typography>

            <Typography className="tmt-summary-label">
              Completed Tasks
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ERROR */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={loadTeam}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      )}

      {/* FILTERS */}
      <Box className="tmt-filter-bar">
        <TextField
          placeholder="Search employee, email or department"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          fullWidth
        />

        <TextField
          select
          label="Department"
          value={department}
          onChange={(event) => setDepartment(event.target.value)}
          size="small"
          sx={{ minWidth: 185 }}
        >
          <MenuItem value="all">All Departments</MenuItem>

          {departments.map((item) => (
            <MenuItem value={item} key={item}>
              {item}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* LOADING */}
      {loading && (
        <Box sx={{ display: "flex", justifyContent: "center", p: 5 }}>
          <CircularProgress />
        </Box>
      )}

      {/* TEAM GRID */}
      {!loading && !error && (
        <>
          <Box className="tmt-grid">
            {filteredEmployees.map((employee) => (
              <Box
                className="tmt-employee-card"
                key={employee.id}
              >
                <Box className="tmt-card-top">
                  <Box className="tmt-identity">
                    <Avatar className="tmt-avatar">
                      {employee.name.charAt(0).toUpperCase()}
                    </Avatar>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography className="tmt-name">
                        {employee.name}
                      </Typography>

                      <Typography className="tmt-department">
                        {employee.department}
                      </Typography>
                    </Box>
                  </Box>

                  <Chip
                    label={employee.status}
                    size="small"
                    color={
                      employee.status === "active"
                        ? "success"
                        : "default"
                    }
                    variant="outlined"
                  />
                </Box>

                <Typography className="tmt-email">
                  <Mail size={14} />
                  {employee.email || "No email available"}
                </Typography>

                <Divider className="tmt-divider" />

                <Box sx={{ py: 1.5 }}>
                  <Typography
                    fontSize={11}
                    color="text.secondary"
                  >
                    Employee Code
                  </Typography>

                  <Typography fontSize={13} fontWeight={700}>
                    {employee.employeeCode || "—"}
                  </Typography>

                  <Typography
                    fontSize={11}
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Designation
                  </Typography>

                  <Typography fontSize={13} fontWeight={700}>
                    {employee.designation || "Not specified"}
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  fullWidth
                  endIcon={<Eye size={15} />}
                  onClick={() => setSelectedEmployee(employee.id)}
                  className="tmt-details-button"
                >
                  View Details
                </Button>
              </Box>
            ))}
          </Box>

          {filteredEmployees.length === 0 && (
            <Box className="tmt-empty">
              <Users size={30} />

              <Typography fontWeight={700}>
                No employees found
              </Typography>

              <Typography fontSize={12} color="text.secondary">
                Try another search or department.
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* EMPLOYEE DETAILS */}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelectedEmployee(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: "90vh",
          },
        }}
      >
        {selected && (
          <>
            <DialogTitle className="tmt-dialog-title">
              <Box className="tmt-identity">
                <Avatar className="tmt-avatar">
                  {selected.name.charAt(0).toUpperCase()}
                </Avatar>

                <Box>
                  <Typography fontWeight={800}>
                    {selected.name}
                  </Typography>

                  <Typography fontSize={12} color="text.secondary">
                    Employee Details
                  </Typography>
                </Box>
              </Box>

              <IconButton
                size="small"
                onClick={() => setSelectedEmployee(null)}
                aria-label="Close employee details"
              >
                <X size={19} />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              <Box className="tmt-detail-grid">
                <Box>
                  <span>Employee Code</span>
                  <strong>{selected.employeeCode || "—"}</strong>
                </Box>

                <Box>
                  <span>Department</span>
                  <strong>{selected.department}</strong>
                </Box>

                <Box>
                  <span>Designation</span>
                  <strong>{selected.designation || "—"}</strong>
                </Box>

                <Box>
                  <span>Account Status</span>
                  <Chip
                    label={selected.status}
                    size="small"
                    color={
                      selected.status === "active"
                        ? "success"
                        : "default"
                    }
                    variant="outlined"
                  />
                </Box>

                <Box>
                  <span>Email</span>
                  <strong>{selected.email || "—"}</strong>
                </Box>

                <Box>
                  <span>Phone</span>
                  <strong>{selected.phone || "—"}</strong>
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography fontWeight={800} mb={1}>
                Team Activity
              </Typography>

              <Typography fontSize={13} color="text.secondary">
                Attendance, task progress and work-log metrics will
                appear here after their respective APIs are connected.
              </Typography>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
}
