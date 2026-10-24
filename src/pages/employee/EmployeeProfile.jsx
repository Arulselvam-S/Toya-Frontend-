
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Avatar,
  Chip,
  Alert,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";

import {
  UserRound,
  Save,
  Camera,
  Trash2,
} from "lucide-react";

import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

import CommonButton from "../../components/common/CommonButton";
import { useAuth } from "../../context/AuthContext";
import { auth, storage } from "../../firebase";

import "../../styles/workspace/WorkspacePage.css";
const API_URL = `${
  import.meta.env.VITE_API_URL ||
  "https://toya-backend.onrender.com"
}/api/me`;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const EMPTY_PROFILE = {
  name: "",
  email: "",
  phone: "",
  department: "",
  designation: "",
  address: "",
  photoURL: "",
  role: "employee",
};

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export default function EmployeeProfile() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [profile, setProfile] = useState(EMPTY_PROFILE);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Always obtain the Firebase Auth user from auth.currentUser.
  // The user returned by useAuth() may be a custom profile object.
  const getCurrentFirebaseUser = () => {
    const currentUser = auth.currentUser;

    if (!currentUser || typeof currentUser.getIdToken !== "function") {
      throw new Error("Please sign in again.");
    }

    return currentUser;
  };

  // Load profile from backend.
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const currentUser = getCurrentFirebaseUser();
      const token = await currentUser.getIdToken();

      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result.message || "Unable to load your employee profile."
        );
      }

      const employee =
        result.employee ??
        result.data?.employee ??
        result.data?.profile ??
        result.profile ??
        result.data;

      if (!employee || typeof employee !== "object") {
        throw new Error("Employee profile data was not returned.");
      }

      setProfile({
        ...EMPTY_PROFILE,
        ...employee,
        name: employee.name || "",
        email: employee.email || currentUser.email || user?.email || "",
        phone: employee.phone || "",
        department: employee.department || "",
        designation: employee.designation || "",
        address: employee.address || "",
        photoURL: employee.photoURL || "",
      });
    } catch (err) {
      setError(err.message || "Unable to load your profile.");
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Preview the selected image without uploading it yet.
  const previewURL = useMemo(() => {
    if (selectedPhoto) {
      return URL.createObjectURL(selectedPhoto);
    }

    return removePhoto ? "" : profile.photoURL || "";
  }, [selectedPhoto, removePhoto, profile.photoURL]);

  useEffect(() => {
    if (!selectedPhoto || !previewURL.startsWith("blob:")) {
      return undefined;
    }

    return () => URL.revokeObjectURL(previewURL);
  }, [selectedPhoto, previewURL]);

  const updateField = (field, value) => {
    setProfile((previous) => ({
      ...previous,
      [field]: value,
    }));

    setMessage("");
    setError("");
  };

  const handlePhotoSelect = (event) => {
    const file = event.target.files?.[0];

    // Allow the same file to be selected again.
    event.target.value = "";

    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Choose a JPG, PNG or WebP image.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setError("Profile photo must be 5 MB or smaller.");
      return;
    }

    setSelectedPhoto(file);
    setRemovePhoto(false);
    setMessage("");
    setError("");
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    setRemovePhoto(true);
    setMessage("");
    setError("");
  };


const handleSave = async (event) => {
  event.preventDefault();
  setMessage("");
  setError("");

  if (!profile.name.trim()) {
    setError("Name is required.");
    return;
  }

  if (
    profile.phone &&
    !/^[+\d\s()-]{7,20}$/.test(profile.phone.trim())
  ) {
    setError("Enter a valid phone number.");
    return;
  }

  setSaving(true);

  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error("Please sign in again.");
    }

    const token = await currentUser.getIdToken();

    let photoURL = removePhoto ? "" : profile.photoURL;

    if (selectedPhoto) {
      const photoRef = ref(
        storage,
        `employee-profiles/${currentUser.uid}/${Date.now()}-${selectedPhoto.name}`
      );

      await uploadBytes(photoRef, selectedPhoto);
      photoURL = await getDownloadURL(photoRef);
    }

    const response = await fetch(API_URL, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: profile.name.trim(),
        phone: profile.phone.trim(),
        address: profile.address.trim(),
        photoURL,
      }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message || "Unable to update employee profile."
      );
    }

    const savedEmployee =
      result.employee ?? result.data?.employee ?? result.data;

    setProfile((previous) => ({
      ...previous,
      ...(savedEmployee || {}),
      name: savedEmployee?.name ?? profile.name.trim(),
      phone: savedEmployee?.phone ?? profile.phone.trim(),
      address: savedEmployee?.address ?? profile.address.trim(),
      photoURL: savedEmployee?.photoURL ?? photoURL,
    }));

    setSelectedPhoto(null);
    setRemovePhoto(false);
    setMessage("Profile updated successfully.");
  } catch (err) {
    console.error("Employee profile update failed:", err);
    setError(err.message || "Unable to save profile changes.");
  } finally {
    setSaving(false);
  }
};

  return (
    <Box className="toya-workspace">
      {/* Page header */}
      <Box className="toya-workspace-header">
        <Box>
          <Typography className="toya-workspace-title">
            My Profile
          </Typography>

          <Typography color="text.secondary" fontSize={13}>
            View and update your employee information
          </Typography>
        </Box>

        <Chip
          label={profile.role || "Employee"}
          color="info"
          variant="outlined"
        />
      </Box>

      {/* Profile card */}
      <Box
        className="toya-workspace-table"
        sx={{
          maxWidth: 1000,
          mx: "auto",
        }}
      >
        {/* Photo section */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2.5,
            mb: 4,
            p: { xs: 2, sm: 3 },
            bgcolor: "#f4faff",
            border: "1px solid #e0edff",
            borderRadius: 4,
            flexWrap: "wrap",
          }}
        >
          <Box sx={{ position: "relative" }}>
            <Avatar
              src={previewURL || undefined}
              alt={profile.name || "Employee"}
              sx={{
                width: 116,
                height: 116,
                bgcolor: "#e2f3ff",
                color: "#0879ed",
                border: "3px solid #fff",
                boxShadow: "0 5px 20px rgba(8,121,237,0.16)",
                fontSize: 36,
                fontWeight: 800,
              }}
            >
              {!previewURL &&
                (profile.name.trim().charAt(0).toUpperCase() || (
                  <UserRound size={40} />
                ))}
            </Avatar>

            <Tooltip title="Upload profile photo">
              <IconButton
                aria-label="Upload profile photo"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving || loading}
                sx={{
                  position: "absolute",
                  right: -4,
                  bottom: 2,
                  width: 38,
                  height: 38,
                  bgcolor: "#0879ed",
                  color: "#fff",
                  border: "3px solid #fff",
                  "&:hover": {
                    bgcolor: "#0564c7",
                  },
                }}
              >
                <Camera size={17} />
              </IconButton>
            </Tooltip>
          </Box>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={handlePhotoSelect}
          />

          <Box sx={{ flex: 1, minWidth: 200 }}>
            <Typography fontSize={21} fontWeight={800}>
              {profile.name || "Employee Name"}
            </Typography>

            <Typography color="text.secondary" fontSize={14}>
              {profile.designation || "Employee"}
            </Typography>

            <Typography
              color="text.secondary"
              fontSize={12}
              sx={{ mt: 0.5 }}
            >
              JPG, PNG or WebP · Maximum 5 MB
            </Typography>

            <Box
              sx={{
                display: "flex",
                gap: 1,
                mt: 1.5,
                flexWrap: "wrap",
              }}
            >
              <CommonButton
                label={selectedPhoto ? "Change Photo" : "Upload Photo"}
                variant="outlined"
                startIcon={<Camera size={16} />}
                onClick={() => fileInputRef.current?.click()}
                disabled={saving || loading}
              />

              {(profile.photoURL || selectedPhoto) && !removePhoto && (
                <CommonButton
                  label="Remove Photo"
                  variant="outlined"
                  startIcon={<Trash2 size={16} />}
                  onClick={handleRemovePhoto}
                  disabled={saving || loading}
                />
              )}

              {removePhoto && (
                <Chip
                  label="Photo will be removed on save"
                  color="warning"
                  variant="outlined"
                />
              )}
            </Box>
          </Box>
        </Box>

        {loading && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <CircularProgress size={18} />
              Loading your employee profile...
            </Box>
          </Alert>
        )}

        {message && (
          <Alert
            severity="success"
            sx={{ mb: 3 }}
            onClose={() => setMessage("")}
          >
            {message}
          </Alert>
        )}

        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setError("")}
          >
            {error}
          </Alert>
        )}

        {/* Profile form */}
        <Box
          component="form"
          onSubmit={handleSave}
          className="toya-workspace-form"
        >
          <Box className="toya-workspace-form-grid">
            <TextField
              label="Full Name"
              value={profile.name}
              onChange={(event) =>
                updateField("name", event.target.value)
              }
              size="small"
              required
              fullWidth
              disabled={loading || saving}
            />

            <TextField
              label="Email Address"
              value={user?.email || profile.email}
              size="small"
              disabled
              fullWidth
            />

            <TextField
              label="Phone Number"
              value={profile.phone}
              onChange={(event) =>
                updateField("phone", event.target.value)
              }
              size="small"
              fullWidth
              disabled={loading || saving}
            />

            <TextField
              label="Department"
              value={profile.department || "Not assigned"}
              size="small"
              disabled
              fullWidth
            />

            <TextField
              label="Designation"
              value={profile.designation || "Not assigned"}
              size="small"
              disabled
              fullWidth
            />
          </Box>

          <TextField
            label="Address"
            value={profile.address}
            onChange={(event) =>
              updateField("address", event.target.value)
            }
            multiline
            minRows={3}
            size="small"
            fullWidth
            disabled={loading || saving}
          />

          <Box
            className="toya-workspace-modal-actions"
            sx={{ mt: 3 }}
          >
            <CommonButton
              label={saving ? "Saving..." : "Save Profile"}
              startIcon={
                saving ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <Save size={17} />
                )
              }
              type="submit"
              disabled={loading || saving}
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
