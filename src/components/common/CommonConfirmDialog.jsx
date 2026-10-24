
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
} from "@mui/material";

import {
  AlertTriangle,
  Trash2,
  LogOut,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";

import { motion, useReducedMotion } from "motion/react";

import CommonButton from "./CommonButton";

import "../../styles/components/CommonConfirmDialog.css";

const variants = {
  danger: {
    icon: Trash2,
    color: "error",
    confirmColor: "error",
  },
  warning: {
    icon: AlertTriangle,
    color: "warning",
    confirmColor: "warning",
  },
  success: {
    icon: CheckCircle2,
    color: "success",
    confirmColor: "success",
  },
  info: {
    icon: Info,
    color: "info",
    confirmColor: "primary",
  },
  logout: {
    icon: LogOut,
    color: "warning",
    confirmColor: "primary",
  },
};

export default function CommonConfirmDialog({
  open = false,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message = "Do you want to continue?",
  variant = "warning",
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  disabled = false,
}) {
  const reduceMotion = useReducedMotion();

  const config = variants[variant] || variants.warning;
  const Icon = config.icon;

  const handleClose = () => {
    if (!loading) {
      onClose?.();
    }
  };

  const handleConfirm = () => {
    if (!loading && !disabled) {
      onConfirm?.();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick" || loading) return;
        handleClose();
      }}
      maxWidth="xs"
      fullWidth
      aria-labelledby="toya-confirm-title"
      aria-describedby="toya-confirm-message"
      slotProps={{
        paper: {
          className: "toya-confirm-dialog",
        },
      }}
    >
      <motion.div
        initial={
          reduceMotion
            ? false
            : { opacity: 0, scale: 0.92, y: 24 }
        }
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <Box className="toya-confirm-top">
          <Box
            className={`toya-confirm-icon toya-confirm-${config.color}`}
          >
            <Icon size={27} />
          </Box>

          <IconButton
            size="small"
            aria-label="Close confirmation dialog"
            onClick={handleClose}
            disabled={loading}
            className="toya-confirm-close"
          >
            <X size={20} />
          </IconButton>
        </Box>

        <DialogTitle
          id="toya-confirm-title"
          className="toya-confirm-title"
        >
          {title}
        </DialogTitle>

        <DialogContent className="toya-confirm-content">
          <Typography
            id="toya-confirm-message"
            color="text.secondary"
          >
            {message}
          </Typography>
        </DialogContent>

        <DialogActions className="toya-confirm-actions">
          <CommonButton
            label={cancelText}
            variant="outlined"
            onClick={handleClose}
            disabled={loading}
          />

          <CommonButton
            label={confirmText}
            color={config.confirmColor}
            loading={loading}
            disabled={disabled}
            onClick={handleConfirm}
          />
        </DialogActions>
      </motion.div>
    </Dialog>
  );
}
