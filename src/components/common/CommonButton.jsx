
import React from "react";
import { Button, CircularProgress } from "@mui/material";
import { motion, useReducedMotion } from "motion/react";

import "../../styles/components/CommonButton.css";

const MotionButton = motion.create(Button);

const CommonButton = ({
  label,
  children,
  type = "button",
  variant = "contained",
  color = "primary",
  size = "medium",
  startIcon,
  endIcon,
  onClick,
  disabled = false,
  loading = false,
  fullWidth = false,
  className = "",
  sx = {},
  ...rest
}) => {
  const reduceMotion = useReducedMotion();

  return (
    <MotionButton
      type={type}
      variant={variant}
      color={color}
      size={size}
      startIcon={
        loading ? undefined : startIcon
      }
      endIcon={loading ? undefined : endIcon}
      onClick={onClick}
      disabled={disabled || loading}
      fullWidth={fullWidth}
      className={`toyo-common-button ${className}`}
      whileHover={
        disabled || loading || reduceMotion
          ? undefined
          : { y: -3, scale: 1.02 }
      }
      whileTap={
        disabled || loading || reduceMotion
          ? undefined
          : { scale: 0.97 }
      }
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 22,
      }}
      sx={{
        ...sx,
      }}
      {...rest}
    >
      {loading ? (
        <>
          <CircularProgress
            size={18}
            thickness={5}
            color="inherit"
            sx={{ mr: 1.5 }}
          />
          Processing...
        </>
      ) : (
        children || label
      )}
    </MotionButton>
  );
};

export default CommonButton;
