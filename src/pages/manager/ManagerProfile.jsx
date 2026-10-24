
import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import {
  UserRound,
  Mail,
  Phone,
  Building2,
  ShieldCheck,
  Save,
  RefreshCw,
} from "lucide-react";
import { auth } from "../../firebase";
import {
  getMyManagerProfile,
  updateMyManagerProfile,
} from "../../api/managerProfileApi";
import "../../styles/manager/ManagerProfile.css";

const EMPTY_PROFILE = {
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  role: "manager",
};

export default function ManagerProfile() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [originalProfile, setOriginalProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      if (!auth.currentUser) {
        throw new Error("Please sign in again to view your profile.");
      }

      const result = await getMyManagerProfile();
      const data = result?.data;

      if (!data) {
        throw new Error("Manager profile was not returned by the server.");
      }

      const loadedProfile = {
        name: data.name || "",
        email: data.email || auth.currentUser.email || "",
        phone: data.phone || "",
        department: data.department || "",
        designation: data.designation || "",
        role: data.role || "manager",
      };

      setProfile(loadedProfile);
      setOriginalProfile(loadedProfile);
    } catch (error) {
      console.error("Manager profile loading failed:", error);

      setMessage({
        type: "error",
        text: error.message || "Unable to load your profile.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setMessage(null);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setMessage(null);

    if (!auth.currentUser) {
      setMessage({
        type: "error",
        text: "Please sign in again.",
      });
      return;
    }

    if (!profile.name.trim()) {
      setMessage({
        type: "error",
        text: "Full name is required.",
      });
      return;
    }

    if (
      profile.phone.trim() &&
      !/^[+\d\s()-]{7,20}$/.test(profile.phone.trim())
    ) {
      setMessage({
        type: "error",
        text: "Enter a valid phone number.",
      });
      return;
    }

    if (!profile.designation.trim()) {
      setMessage({
        type: "error",
        text: "Designation is required.",
      });
      return;
    }

    setSaving(true);

    try {
      const result = await updateMyManagerProfile({
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        designation: profile.designation.trim(),
      });

      const data = result?.data || {};

      const savedProfile = {
        ...profile,
        name: data.name ?? profile.name.trim(),
        phone: data.phone ?? profile.phone.trim(),
        designation: data.designation ?? profile.designation.trim(),
      };

      setProfile(savedProfile);
      setOriginalProfile(savedProfile);

      setMessage({
        type: "success",
        text: result?.message || "Profile updated successfully.",
      });
    } catch (error) {
      console.error("Manager profile update failed:", error);

      setMessage({
        type: "error",
        text: error.message || "Unable to update your profile.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setProfile(originalProfile);
    setMessage(null);
  };

  if (loading) {
    return (
      <Box className="toya-manager-profile-loading">
        <CircularProgress />
        <Typography color="text.secondary">
          Loading your profile...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="toya-manager-profile-page">
      <Box className="toya-manager-profile-heading">
        <Box>
          <Typography className="toya-manager-profile-title">
            My Profile
          </Typography>
          <Typography className="toya-manager-profile-subtitle">
            Manage your manager account information.
          </Typography>
        </Box>
      </Box>

      {message && (
        <Alert
          severity={message.type}
          onClose={() => setMessage(null)}
          sx={{ mb: 2, borderRadius: 3 }}
        >
          {message.text}
        </Alert>
      )}

      <Box className="toya-manager-profile-card">
        <Box className="toya-manager-profile-banner" />

        <Box className="toya-manager-profile-identity">
          <Avatar className="toya-manager-profile-avatar">
            {profile.name ? (
              profile.name.charAt(0).toUpperCase()
            ) : (
              <UserRound size={30} />
            )}
          </Avatar>

          <Box className="toya-manager-profile-identity-text">
            <Typography className="toya-manager-profile-name">
              {profile.name || "Manager"}
            </Typography>

            <Typography className="toya-manager-profile-email">
              {profile.email}
            </Typography>

            <Box className="toya-manager-profile-role">
              <ShieldCheck size={15} />
              Manager
            </Box>
          </Box>
        </Box>

        <Divider />

        <Box
          component="form"
          onSubmit={handleSave}
          className="toya-manager-profile-form"
        >
          <Typography className="toya-manager-profile-section-title">
            Personal Information
          </Typography>

          <Box className="toya-manager-profile-grid">
            <TextField
              label="Full Name"
              name="name"
              value={profile.name}
              onChange={handleChange}
              required
              fullWidth
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <UserRound size={17} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Email Address"
              value={profile.email}
              fullWidth
              size="small"
              disabled
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={17} />
                    </InputAdornment>
                  ),
                },
              }}
              helperText="Contact your administrator if your account email needs to change."
            />

            <TextField
              label="Phone Number"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              fullWidth
              size="small"
              placeholder="Enter phone number"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone size={17} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Designation"
              name="designation"
              value={profile.designation}
              onChange={handleChange}
              fullWidth
              required
              size="small"
              placeholder="Enter designation"
            />

            <TextField
              label="Department"
              value={profile.department}
              fullWidth
              size="small"
              disabled
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Building2 size={17} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Account Role"
              value="Manager"
              fullWidth
              size="small"
              disabled
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <ShieldCheck size={17} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box className="toya-manager-profile-actions">
            <Button
              type="button"
              variant="outlined"
              startIcon={<RefreshCw size={16} />}
              onClick={handleReset}
              disabled={saving}
            >
              Discard Changes
            </Button>

            <Button
              type="submit"
              variant="contained"
              startIcon={
                saving ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Save size={16} />
                )
              }
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Profile"}
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
