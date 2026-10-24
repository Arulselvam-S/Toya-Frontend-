
import { Box } from "@mui/material";
import { motion, useReducedMotion } from "motion/react";

import {
  CheckCircle2,
  Clock3,
  Circle,
  AlertCircle,
  UserCheck,
  UserX,
  CalendarCheck,
  CalendarX,
  FileCheck2,
  Hourglass,
} from "lucide-react";

import "../../styles/components/CommonStatusBadge.css";

const statusConfig = {
  completed: {
    label: "Completed",
    color: "success",
    icon: CheckCircle2,
  },
  in_progress: {
    label: "In Progress",
    color: "warning",
    icon: Clock3,
  },
  not_started: {
    label: "Not Started",
    color: "neutral",
    icon: Circle,
  },
  blocked: {
    label: "Blocked",
    color: "error",
    icon: AlertCircle,
  },
  pending: {
    label: "Pending",
    color: "warning",
    icon: Hourglass,
  },
  active: {
    label: "Active",
    color: "info",
    icon: UserCheck,
  },
  inactive: {
    label: "Inactive",
    color: "neutral",
    icon: UserX,
  },
  present: {
    label: "Present",
    color: "success",
    icon: CalendarCheck,
  },
  absent: {
    label: "Absent",
    color: "error",
    icon: CalendarX,
  },
  approved: {
    label: "Approved",
    color: "success",
    icon: FileCheck2,
  },
  rejected: {
    label: "Rejected",
    color: "error",
    icon: AlertCircle,
  },
};

const normalizeStatus = (value) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

export default function CommonStatusBadge({
  status = "pending",
  label,
  size = "medium",
  showIcon = true,
  animated = true,
  className = "",
}) {
  const reduceMotion = useReducedMotion();

  const normalized = normalizeStatus(status);

  const config = statusConfig[normalized] || {
    label: normalized
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase()) ||
      "Unknown",
    color: "neutral",
    icon: Circle,
  };

  const Icon = config.icon;

  return (
    <motion.span
      className={`toya-status-badge toya-status-${config.color} toya-status-${size} ${className}`}
      initial={
        animated && !reduceMotion
          ? { opacity: 0, scale: 0.85 }
          : false
      }
      animate={{ opacity: 1, scale: 1 }}
      whileHover={
        animated && !reduceMotion
          ? { scale: 1.06 }
          : undefined
      }
      transition={{
        duration: 0.2,
        ease: "easeOut",
      }}
    >
      {showIcon && (
        <Icon
          size={size === "small" ? 13 : 15}
          aria-hidden="true"
        />
      )}

      <Box component="span">
        {label ?? config.label}
      </Box>
    </motion.span>
  );
}
