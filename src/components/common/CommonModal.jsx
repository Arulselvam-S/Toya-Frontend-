
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
  X,
  Info,
} from "lucide-react";

import {
  motion,
  useReducedMotion,
} from "motion/react";

import CommonButton from "./CommonButton";

import "../../styles/components/CommonModal.css";

const CommonModal = ({
  open = false,
  onClose,
  title = "Modal",
  description = "",
  icon,
  children,

  maxWidth = "sm",
  fullWidth = true,

  showFooter = true,
  showCloseButton = true,

  cancelText = "Cancel",
  confirmText = "Save Changes",

  onConfirm,
  loading = false,
  confirmDisabled = false,
  confirmColor = "primary",
  confirmType = "button",
  formId,

  disableBackdropClose = false,
}) => {
  const reduceMotion = useReducedMotion();

  const handleClose = (event, reason) => {
    if (loading) return;

    if (
      disableBackdropClose &&
      reason === "backdropClick"
    ) {
      return;
    }

    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      scroll="paper"
      aria-labelledby="toya-modal-title"
      slotProps={{
        paper: {
          className: "toya-common-modal",
        },
      }}
    >
      <motion.div
        initial={
          reduceMotion
            ? false
            : {
                opacity: 0,
                y: 25,
                scale: 0.96,
              }
        }
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <DialogTitle className="toya-modal-header">
          <Box className="toya-modal-header-content">
            <Box className="toya-modal-icon">
              {icon || <Info size={22} />}
            </Box>

            <Box sx={{ flex: 1 }}>
              <Typography
                id="toya-modal-title"
                variant="h6"
                fontWeight={800}
              >
                {title}
              </Typography>

              {description && (
                <Typography
                  color="text.secondary"
                  variant="body2"
                  sx={{ mt: 0.5 }}
                >
                  {description}
                </Typography>
              )}
            </Box>

            {showCloseButton && (
              <IconButton
                aria-label="Close modal"
                onClick={handleClose}
                disabled={loading}
                size="small"
              >
                <X size={21} />
              </IconButton>
            )}
          </Box>
        </DialogTitle>

        <DialogContent
          dividers
          className="toya-modal-content"
        >
          {children}
        </DialogContent>

        {showFooter && (
          <DialogActions className="toya-modal-footer">
            <CommonButton
              label={cancelText}
              variant="outlined"
              color="primary"
              onClick={handleClose}
              disabled={loading}
            />

            <CommonButton
              label={confirmText}
              variant="contained"
              color={confirmColor}
              onClick={onConfirm}
              loading={loading}
              disabled={confirmDisabled}
              type={confirmType}
              form={formId}
            />
          </DialogActions>
        )}
      </motion.div>
    </Dialog>
  );
};

export default CommonModal;
