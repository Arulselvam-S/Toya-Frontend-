
import { useState } from "react";
import { Navigate } from "react-router-dom";

import {
  Box,
  Typography,
  Alert,
  TextField,
  InputAdornment,
} from "@mui/material";

import {
  Mail,
  LockKeyhole,
  ArrowRight,
} from "lucide-react";

import { motion } from "motion/react";

import CommonButton from "../../components/common/CommonButton";
import { useAuth, ROLE_HOME } from "../../context/AuthContext";

import "../../styles/auth/Login.css";

export default function Login() {
  const {
    user,
    loading: authLoading,
    loginFirebase,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect only when a trusted role has been configured.
  if (!authLoading && user?.role && ROLE_HOME[user.role]) {
    return <Navigate to={ROLE_HOME[user.role]} replace />;
  }

  const handleLogin = async () => {
    setError("");
    setSuccess("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);

    try {
      const result = await loginFirebase(email, password);

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccess(
        "Firebase login successful! Your TOYA role must be configured before opening a dashboard."
      );
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box className="toya-login-page">
      <motion.div
        className="toya-login-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* TOYA WaterTech logo */}
        <Box className="toya-login-brand">
          <img
            className="toya-login-logo-image"
            src="/images/toya-logo.jpeg"
            alt="TOYA WaterTech Innovation"
          />
        </Box>

        <Typography className="toya-login-title">
          Welcome Back
        </Typography>

        <Typography className="toya-login-subtitle">
          Sign in to your TOYA Management System account.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
            {success}
          </Alert>
        )}

        {user && !user.role && (
          <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
            You are signed in, but your employee role has not
            been configured yet. Dashboard access is not available.
          </Alert>
        )}

        <Box sx={{ display: "grid", gap: 2, mt: 3 }}>
          <TextField
            fullWidth
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting || authLoading}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={18} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            fullWidth
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !submitting) {
                handleLogin();
              }
            }}
            disabled={submitting || authLoading}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockKeyhole size={18} />
                </InputAdornment>
              ),
            }}
          />

          <CommonButton
            label={submitting ? "Signing in..." : "Sign In"}
            startIcon={<ArrowRight size={17} />}
            onClick={handleLogin}
            disabled={submitting || authLoading}
          />
        </Box>

        <Typography
          className="toya-login-footnote"
          sx={{ mt: 3 }}
        >
          Secure sign-in powered by Firebase Authentication.
        </Typography>
      </motion.div>
    </Box>
  );
}
