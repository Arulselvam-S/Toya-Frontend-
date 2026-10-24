
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
  getEmployees,
  updateMyProfile,
} from "../../api/employeeApi";
import "../../styles/admin/Profile.css";

const EMPTY_PROFILE = {
  name: "",
  email: "",
  phone: "",
  department: "Admin",
  designation: "Administrator",
};

export default function Profile() {
  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [originalProfile, setOriginalProfile] = useState(EMPTY_PROFILE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("Please sign in again to view your profile.");
      }

      const result = await getEmployees();

      const employees = Array.isArray(result)
        ? result
        : Array.isArray(result?.data)
          ? result.data
          : [];

      const currentProfile = employees.find(
        (employee) =>
          String(employee.id) === String(currentUser.uid)
      );

      if (!currentProfile) {
        throw new Error(
          "Admin profile not found. Check the Firebase UID and employee document."
        );
      }

      const loadedProfile = {
        name: currentProfile.name || "",
        email: currentProfile.email || currentUser.email || "",
        phone: currentProfile.phone || "",
        department: currentProfile.department || "Admin",
        designation: currentProfile.designation || "Administrator",
      };

      setProfile(loadedProfile);
      setOriginalProfile(loadedProfile);
    } catch (error) {
      console.error("Profile loading failed:", error);

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

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setMessage({
        type: "error",
        text: "Please sign in again.",
      });
      return;
    }

    if (!profile.name.trim()) {
      setMessage({
        type: "error",
        text: "Name is required.",
      });
      return;
    }

    if (
      profile.phone &&
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
      const payload = {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        designation: profile.designation.trim(),
      };

      const result = await updateMyProfile(payload);

      const returnedProfile = result?.data;

      const savedProfile = {
        ...profile,
        name: returnedProfile?.name ?? payload.name,
        phone: returnedProfile?.phone ?? payload.phone,
        designation:
          returnedProfile?.designation ?? payload.designation,
      };

      setProfile(savedProfile);
      setOriginalProfile(savedProfile);

      setMessage({
        type: "success",
        text: result?.message || "Profile updated successfully.",
      });
    } catch (error) {
      console.error("Admin profile update failed:", error);

      setMessage({
        type: "error",
        text: error.message || "Unable to save profile changes.",
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
      <Box className="toya-profile-loading">
        <CircularProgress />
        <Typography color="text.secondary">
          Loading your profile...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="toya-profile-page">
      <Box className="toya-profile-heading">
        <Box>
          <Typography className="toya-profile-title">
            My Profile
          </Typography>

          <Typography className="toya-profile-subtitle">
            Manage your administrator account information.
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

      <Box className="toya-profile-card">
        <Box className="toya-profile-banner" />

        <Box className="toya-profile-identity">
          <Avatar className="toya-profile-avatar">
            {profile.name ? (
              profile.name.charAt(0).toUpperCase()
            ) : (
              <UserRound size={30} />
            )}
          </Avatar>

          <Box className="toya-profile-identity-text">
            <Typography className="toya-profile-name">
              {profile.name || "Administrator"}
            </Typography>

            <Typography color="text.secondary" fontSize={13}>
              {profile.email}
            </Typography>

            <Box className="toya-profile-role">
              <ShieldCheck size={15} />
              Administrator
            </Box>
          </Box>
        </Box>

        <Divider />

        <Box
          component="form"
          onSubmit={handleSave}
          className="toya-profile-form"
        >
          <Typography className="toya-profile-section-title">
            Personal Information
          </Typography>

          <Box className="toya-profile-grid">
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
                      <UserRound
                        size={17}
                        className="toya-profile-input-icon"
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Email Address"
              name="email"
              value={profile.email}
              fullWidth
              size="small"
              disabled
              helperText="Email changes should use a separate verified account flow."
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail
                        size={17}
                        className="toya-profile-input-icon"
                      />
                    </InputAdornment>
                  ),
                },
              }}
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
                      <Phone
                        size={17}
                        className="toya-profile-input-icon"
                      />
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
              placeholder="Administrator"
            />

            <TextField
              label="Department"
              name="department"
              value={profile.department}
              fullWidth
              size="small"
              disabled
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Building2
                        size={17}
                        className="toya-profile-input-icon"
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Account Role"
              value="Admin"
              fullWidth
              size="small"
              disabled
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <ShieldCheck
                        size={17}
                        className="toya-profile-input-icon"
                      />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>

          <Box className="toya-profile-actions">
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
