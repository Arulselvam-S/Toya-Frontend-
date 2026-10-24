
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Box,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
} from "@mui/material";

import {
  Users,
  ClipboardList,
  CheckCircle2,
  Clock3,
  CalendarCheck,
  RefreshCw,
  Activity,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

import {
  getManagerTeamAttendance,
} from "../../api/attendanceApi";

import "../../styles/manager/ManagerDashboard.css";

function getTodayDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function MetricCard({ title, value, Icon, color, index }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className="toya-manager-stat"
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, delay: index * 0.06 }}
    >
      <Box
        className="toya-manager-stat-icon"
        sx={{
          backgroundColor: `${color}14`,
          color,
        }}
      >
        <Icon size={22} />
      </Box>

      <Typography className="toya-manager-stat-value">
        {value}
      </Typography>

      <Typography className="toya-manager-stat-label">
        {title}
      </Typography>
    </motion.div>
  );
}

function formatTime(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function AttendanceChip({ status }) {
  const isPresent = status === "present";

  return (
    <Chip
      size="small"
      label={isPresent ? "Present" : "Not Marked"}
      color={isPresent ? "success" : "default"}
      variant="outlined"
    />
  );
}

export default function ManagerDashboard() {
  const navigate = useNavigate();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const result = await getManagerTeamAttendance(
        getTodayDateKey()
      );

      if (!result?.success) {
        throw new Error(
          result?.message || "Unable to load team attendance."
        );
      }

      setRows(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(
        err?.message || "Unable to load manager dashboard."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const present = rows.filter(
    (member) => member.status === "present"
  ).length;

  const notMarked = rows.filter(
    (member) => member.status !== "present"
  ).length;

  const attendancePercentage =
    rows.length > 0
      ? Math.round((present / rows.length) * 100)
      : 0;

  const cards = [
    {
      title: "Team Members",
      value: loading ? "—" : rows.length,
      Icon: Users,
      color: "#0879ed",
    },
    {
      title: "Present Today",
      value: loading ? "—" : present,
      Icon: CheckCircle2,
      color: "#11966c",
    },
    {
      title: "Not Marked",
      value: loading ? "—" : notMarked,
      Icon: Clock3,
      color: "#dd951c",
    },
    {
      title: "Assigned Tasks",
      value: "—",
      Icon: ClipboardList,
      color: "#0b9fc0",
    },
  ];

  return (
    <Box className="toya-manager-page">
      {/* HEADER */}
      <Box className="toya-manager-heading">
        <Box>
          <Typography className="toya-manager-title">
            Manager Dashboard
          </Typography>

          <Typography className="toya-manager-subtitle">
            Monitor your team's daily performance and activities
          </Typography>
        </Box>

        <Chip
          icon={<Activity size={15} />}
          label="Live Attendance"
          color="success"
          variant="outlined"
        />
      </Box>

      {/* ERROR */}
      {error && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
            >
              Retry
            </button>
          }
        >
          {error}
        </Alert>
      )}

      {/* SUMMARY CARDS */}
      <Box className="toya-manager-stats">
        {cards.map((card, index) => (
          <MetricCard
            key={card.title}
            {...card}
            index={index}
          />
        ))}
      </Box>

      {/* ATTENDANCE OVERVIEW */}
      <Box className="toya-manager-content-grid">
        <Box className="toya-manager-panel">
          <Box className="toya-manager-panel-heading">
            <Box>
              <Typography fontWeight={800}>
                Today's Attendance
              </Typography>

              <Typography
                fontSize={12}
                color="text.secondary"
              >
                Live attendance from your department
              </Typography>
            </Box>

            <CalendarCheck size={20} color="#0879ed" />
          </Box>

          {loading ? (
            <Box sx={{ py: 5, textAlign: "center" }}>
              <CircularProgress size={28} />
              <Typography mt={2} fontSize={13}>
                Loading attendance...
              </Typography>
            </Box>
          ) : (
            <Box className="toya-manager-attendance-score">
              <Typography fontSize={37} fontWeight={800}>
                {present}/{rows.length}
              </Typography>

              <Typography color="text.secondary" fontSize={12}>
                Team members present
              </Typography>

              <LinearProgress
                variant="determinate"
                value={attendancePercentage}
                sx={{
                  width: "100%",
                  mt: 2,
                  borderRadius: 4,
                }}
              />

              <Typography
                fontSize={12}
                color="text.secondary"
                mt={1}
              >
                {attendancePercentage}% attendance marked
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => navigate("/manager/attendance")}
            >
              View Team Attendance
            </button>

            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
            >
              <RefreshCw
                size={14}
                style={{ verticalAlign: "middle", marginRight: 5 }}
              />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </Box>
        </Box>

        {/* TASK SUMMARY */}
        <Box className="toya-manager-panel">
          <Box className="toya-manager-panel-heading">
            <Box>
              <Typography fontWeight={800}>
                Task Overview
              </Typography>

              <Typography
                fontSize={12}
                color="text.secondary"
              >
                Task metrics will appear when task APIs are connected
              </Typography>
            </Box>

            <ClipboardList size={20} color="#0b9fc0" />
          </Box>

          <Box sx={{ py: 3 }}>
            <Typography fontSize={28} fontWeight={800}>
              Not connected
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={13}
              mt={1}
            >
              Assigned, completed and pending task counts
              are not yet connected to the live backend.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* TEAM ATTENDANCE TABLE */}
      <Box className="toya-manager-panel">
        <Box className="toya-manager-panel-heading">
          <Box>
            <Typography fontWeight={800}>
              Team Attendance Details
            </Typography>

            <Typography
              fontSize={12}
              color="text.secondary"
            >
              Today's check-in and check-out records
            </Typography>
          </Box>
        </Box>

        {loading ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <CircularProgress size={26} />
          </Box>
        ) : rows.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            {error
              ? "Attendance data could not be loaded."
              : "No team members found. Check the manager's department and employee records in Firestore."}
          </Alert>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Box
              component="table"
              sx={{
                width: "100%",
                borderCollapse: "collapse",
                "& th, & td": {
                  textAlign: "left",
                  padding: "13px 12px",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  fontSize: 13,
                  whiteSpace: "nowrap",
                },
                "& th": {
                  color: "text.secondary",
                  fontWeight: 700,
                },
              }}
            >
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {rows.map((member) => (
                  <tr key={member.employeeId || member.id}>
                    <td>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1.2,
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: 13,
                          }}
                        >
                          {(member.name || "E")
                            .charAt(0)
                            .toUpperCase()}
                        </Avatar>

                        <Box>
                          <Typography fontSize={13} fontWeight={700}>
                            {member.name || "Unnamed Employee"}
                          </Typography>

                          <Typography
                            fontSize={11}
                            color="text.secondary"
                          >
                            {member.employeeCode || "—"}
                          </Typography>
                        </Box>
                      </Box>
                    </td>

                    <td>{member.department || "—"}</td>
                    <td>{formatTime(member.checkIn)}</td>
                    <td>{formatTime(member.checkOut)}</td>

                    <td>
                      <AttendanceChip status={member.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}


