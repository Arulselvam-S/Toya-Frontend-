
import { Box, Typography, CircularProgress, Skeleton } from "@mui/material";
import { motion, useReducedMotion } from "motion/react";
import { Waves } from "lucide-react";

import "../../styles/components/CommonLoader.css";

export default function CommonLoader({
  variant = "water",
  message = "Loading...",
  size = 48,
  fullScreen = false,
  overlay = false,
  skeletonCount = 3,
  className = "",
}) {
  const reduceMotion = useReducedMotion();

  const containerClass = [
    "toya-loader-container",
    fullScreen ? "toya-loader-fullscreen" : "",
    overlay ? "toya-loader-overlay" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (variant === "skeleton") {
    return (
      <Box
        className={containerClass}
        role="status"
        aria-label={message}
        aria-busy="true"
      >
        <Box className="toya-skeleton-wrapper">
          {Array.from({
            length: Math.max(1, skeletonCount),
          }).map((_, index) => (
            <Box className="toya-skeleton-card" key={index}>
              <Skeleton
                variant="rounded"
                width={48}
                height={48}
                sx={{ borderRadius: "12px", mb: 2 }}
              />

              <Skeleton width="65%" height={25} />

              <Skeleton width="45%" height={42} />

              <Skeleton width="85%" height={20} />
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  if (variant === "spinner") {
    return (
      <Box className={containerClass} role="status" aria-live="polite">
        <CircularProgress
          size={size}
          thickness={4}
          sx={{ color: "#0879ED" }}
        />

        {message && (
          <Typography className="toya-loader-message">
            {message}
          </Typography>
        )}
      </Box>
    );
  }

  return (
    <Box className={containerClass} role="status" aria-live="polite">
      <motion.div
        className="toya-water-loader"
        style={{ width: size + 42, height: size + 42 }}
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, -10, 0],
                scale: [1, 1.04, 1],
              }
        }
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <motion.div
          className="toya-water-ring"
          animate={
            reduceMotion
              ? undefined
              : { rotate: 360 }
          }
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <Waves
          size={Math.round(size * 0.75)}
          color="#0879ED"
          strokeWidth={2.3}
        />
      </motion.div>

      {message && (
        <Typography className="toya-loader-message">
          {message}
        </Typography>
      )}
    </Box>
  );
}
