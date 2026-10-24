
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  FormControlLabel,
  MenuItem,
  Switch,
  Tabs,
  Tab,
  TextField,
  Typography,
} from "@mui/material";
import {
  Building2,
  Clock3,
  Bell,
  ShieldCheck,
  Save,
  RotateCcw,
  Settings2,
} from "lucide-react";

import CommonButton from "../../components/common/CommonButton";
import CommonModal from "../../components/common/CommonModal";
import {
  getSettings,
  saveSettings,
  resetSettings,
} from "../../api/settingsApi";

import "../../styles/admin/Settings.css";

const DEFAULT_SETTINGS = {
  company: {
    name: "TOYA",
    email: "",
    phone: "",
    address: "",
    website: "",
    timezone: "Asia/Kolkata",
  },
  attendance: {
    workStart: "09:00",
    workEnd: "18:00",
    breakMinutes: 60,
    lateGraceMinutes: 15,
    minimumHours: 8,
    workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    allowManualAttendance: true,
  },
  notifications: {
    taskAssignment: true,
    taskDeadline: true,
    dailySummary: false,
    weeklyReports: true,
    attendanceAlerts: true,
    systemUpdates: true,
  },
  security: {
    sessionTimeoutMinutes: 30,
    requireTwoFactor: false,
    allowMultipleSessions: true,
  },
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TABS = [
  { label: "Company Profile", icon: Building2 },
  { label: "Attendance", icon: Clock3 },
  { label: "Notifications", icon: Bell },
  { label: "Security", icon: ShieldCheck },
];

function mergeSettings(value = {}) {
  return {
    company: { ...DEFAULT_SETTINGS.company, ...(value.company || {}) },
    attendance: {
      ...DEFAULT_SETTINGS.attendance,
      ...(value.attendance || {}),
    },
    notifications: {
      ...DEFAULT_SETTINGS.notifications,
      ...(value.notifications || {}),
    },
    security: { ...DEFAULT_SETTINGS.security, ...(value.security || {}) },
  };
}

function SettingSwitch({ title, description, checked, onChange }) {
  return (
    <Box className="toya-setting-switch-row">
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography fontWeight={750} fontSize={13}>
          {title}
        </Typography>
        <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.4 }}>
          {description}
        </Typography>
      </Box>
      <Switch
        checked={Boolean(checked)}
        onChange={(event) => onChange(event.target.checked)}
        inputProps={{ "aria-label": title }}
      />
    </Box>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState(DEFAULT_SETTINGS);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);

      try {
        const data = await getSettings();

        if (!mounted) return;

        const merged = mergeSettings(data);
        setSettings(merged);
        setSavedSettings(merged);
      } catch (error) {
        if (mounted) {
          setMessage({
            severity: "error",
            text: error.message || "Unable to load settings.",
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const update = (section, field, value) => {
    setSettings((previous) => ({
      ...previous,
      [section]: {
        ...previous[section],
        [field]: value,
      },
    }));
    setMessage(null);
  };

  const toggleWorkingDay = (day) => {
    const selected = settings.attendance.workingDays;
    const workingDays = selected.includes(day)
      ? selected.filter((item) => item !== day)
      : [...selected, day];

    update("attendance", "workingDays", workingDays);
  };

  const validate = () => {
    const { company, attendance, security } = settings;

    if (!company.name.trim()) return "Company name is required.";

    if (
      company.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.email)
    ) {
      return "Enter a valid company email address.";
    }

    if (company.website) {
      try {
        const url = new URL(company.website);
        if (!["http:", "https:"].includes(url.protocol)) {
          return "Website must use HTTP or HTTPS.";
        }
      } catch {
        return "Enter a valid website URL, including https://.";
      }
    }

    if (attendance.workEnd <= attendance.workStart) {
      return "Work end time must be after start time.";
    }

    const numericValues = [
      attendance.breakMinutes,
      attendance.lateGraceMinutes,
      attendance.minimumHours,
      security.sessionTimeoutMinutes,
    ];

    if (
      numericValues.some(
        (value) => !Number.isFinite(Number(value)) || Number(value) < 0
      )
    ) {
      return "Enter valid non-negative numeric values.";
    }

    if (
      Number(attendance.breakMinutes) > 480 ||
      Number(attendance.lateGraceMinutes) > 120 ||
      Number(attendance.minimumHours) > 24
    ) {
      return "Check the attendance settings limits.";
    }

    if (
      Number(security.sessionTimeoutMinutes) < 5 ||
      Number(security.sessionTimeoutMinutes) > 720
    ) {
      return "Session timeout must be between 5 and 720 minutes.";
    }

    if (!attendance.workingDays.length) {
      return "Select at least one working day.";
    }

    return "";
  };

  const handleSave = async (event) => {
    event?.preventDefault();

    const validationError = validate();

    if (validationError) {
      setMessage({ severity: "error", text: validationError });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const data = await saveSettings(settings);
      const merged = mergeSettings(data || settings);

      setSettings(merged);
      setSavedSettings(merged);
      setMessage({
        severity: "success",
        text: "Settings saved to Firebase successfully.",
      });
    } catch (error) {
      setMessage({
        severity: "error",
        text: error.message || "Unable to save settings.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const data = await resetSettings();
      const merged = mergeSettings(data || DEFAULT_SETTINGS);

      setSettings(merged);
      setSavedSettings(merged);
      setMessage({
        severity: "success",
        text: "Settings reset to default values in Firebase.",
      });
    } catch (error) {
      setMessage({
        severity: "error",
        text: error.message || "Unable to reset settings.",
      });
    } finally {
      setSaving(false);
      setResetOpen(false);
    }
  };

  const discardChanges = () => {
    setSettings(mergeSettings(savedSettings));
    setMessage(null);
  };

  if (loading) {
    return (
      <Box className="toya-profile-loading">
        <CircularProgress />
        <Typography color="text.secondary">Loading system settings...</Typography>
      </Box>
    );
  }

  return (
    <Box className="toya-settings-page">
      <Box className="toya-settings-heading">
        <Box>
          <Typography className="toya-settings-title">
            System Settings
          </Typography>
          <Typography className="toya-settings-subtitle">
            Configure your company and system preferences.
          </Typography>
        </Box>

        <Box className="toya-settings-heading-actions">
          <CommonButton
            label="Reset Defaults"
            variant="outlined"
            startIcon={<RotateCcw size={17} />}
            onClick={() => setResetOpen(true)}
            disabled={saving}
          />
          <CommonButton
            label={saving ? "Saving..." : "Save Changes"}
            startIcon={<Save size={17} />}
            onClick={handleSave}
            disabled={saving}
          />
        </Box>
      </Box>

      <Alert severity="info" sx={{ borderRadius: 3, mb: 2 }}>
        Settings are stored in Firestore and shared through this backend.
        Attendance and security preferences require separate backend enforcement
        before they affect system behavior.
      </Alert>

      {message && (
        <Alert
          severity={message.severity}
          onClose={() => setMessage(null)}
          sx={{ borderRadius: 3, mb: 2 }}
        >
          {message.text}
        </Alert>
      )}

      <Box className="toya-settings-layout">
        <Box className="toya-settings-navigation">
          <Box className="toya-settings-nav-heading">
            <Settings2 size={20} />
            <Typography fontWeight={800}>Preferences</Typography>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
            orientation="vertical"
            variant="scrollable"
            className="toya-settings-tabs"
            aria-label="System setting sections"
          >
            {TABS.map(({ label, icon: Icon }) => (
              <Tab
                key={label}
                icon={<Icon size={18} />}
                iconPosition="start"
                label={label}
              />
            ))}
          </Tabs>
        </Box>

        <Box className="toya-settings-content">
          <Box component="form" onSubmit={handleSave}>
            {activeTab === 0 && (
              <Box>
                <Box className="toya-settings-section-title">
                  <Building2 size={21} />
                  <Box>
                    <Typography fontWeight={800}>Company Profile</Typography>
                    <Typography fontSize={12} color="text.secondary">
                      Basic organization information
                    </Typography>
                  </Box>
                </Box>

                <Box className="toya-settings-form-grid">
                  <TextField
                    label="Company Name"
                    value={settings.company.name}
                    onChange={(e) => update("company", "name", e.target.value)}
                    required
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Company Email"
                    type="email"
                    value={settings.company.email}
                    onChange={(e) => update("company", "email", e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Phone Number"
                    value={settings.company.phone}
                    onChange={(e) => update("company", "phone", e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Website"
                    placeholder="https://example.com"
                    value={settings.company.website}
                    onChange={(e) => update("company", "website", e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    select
                    label="Timezone"
                    value={settings.company.timezone}
                    onChange={(e) => update("company", "timezone", e.target.value)}
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="Asia/Kolkata">India (IST)</MenuItem>
                    <MenuItem value="Asia/Dubai">Dubai (GST)</MenuItem>
                    <MenuItem value="UTC">UTC</MenuItem>
                  </TextField>
                  <TextField
                    label="Company Address"
                    value={settings.company.address}
                    onChange={(e) => update("company", "address", e.target.value)}
                    multiline
                    minRows={2}
                    fullWidth
                    size="small"
                    className="toya-settings-grid-wide"
                  />
                </Box>
              </Box>
            )}

            {activeTab === 1 && (
              <Box>
                <Box className="toya-settings-section-title">
                  <Clock3 size={21} />
                  <Box>
                    <Typography fontWeight={800}>
                      Attendance & Working Hours
                    </Typography>
                    <Typography fontSize={12} color="text.secondary">
                      Configure the intended working schedule
                    </Typography>
                  </Box>
                </Box>

                <Box className="toya-settings-form-grid">
                  <TextField
                    type="time"
                    label="Work Start"
                    value={settings.attendance.workStart}
                    onChange={(e) => update("attendance", "workStart", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    type="time"
                    label="Work End"
                    value={settings.attendance.workEnd}
                    onChange={(e) => update("attendance", "workEnd", e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    type="number"
                    label="Break (minutes)"
                    value={settings.attendance.breakMinutes}
                    onChange={(e) => update("attendance", "breakMinutes", Number(e.target.value))}
                    inputProps={{ min: 0, max: 480 }}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    type="number"
                    label="Late Grace (minutes)"
                    value={settings.attendance.lateGraceMinutes}
                    onChange={(e) => update("attendance", "lateGraceMinutes", Number(e.target.value))}
                    inputProps={{ min: 0, max: 120 }}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    type="number"
                    label="Minimum Hours / Day"
                    value={settings.attendance.minimumHours}
                    onChange={(e) => update("attendance", "minimumHours", Number(e.target.value))}
                    inputProps={{ min: 0, max: 24 }}
                    fullWidth
                    size="small"
                  />
                </Box>

                <Box className="toya-settings-days">
                  <Typography fontSize={13} fontWeight={800} sx={{ mb: 1.5 }}>
                    Working Days
                  </Typography>
                  <Box className="toya-settings-days-grid">
                    {DAYS.map((day) => (
                      <FormControlLabel
                        key={day}
                        label={day}
                        control={
                          <Switch
                            size="small"
                            checked={settings.attendance.workingDays.includes(day)}
                            onChange={() => toggleWorkingDay(day)}
                          />
                        }
                      />
                    ))}
                  </Box>
                </Box>

                <SettingSwitch
                  title="Allow Manual Attendance"
                  description="Preference only until the backend enforces it."
                  checked={settings.attendance.allowManualAttendance}
                  onChange={(value) => update("attendance", "allowManualAttendance", value)}
                />
              </Box>
            )}

            {activeTab === 2 && (
              <Box>
                <Box className="toya-settings-section-title">
                  <Bell size={21} />
                  <Box>
                    <Typography fontWeight={800}>Notification Settings</Typography>
                    <Typography fontSize={12} color="text.secondary">
                      Store notification preferences
                    </Typography>
                  </Box>
                </Box>

                <SettingSwitch
                  title="Task Assignment"
                  description="Alerts when new tasks are assigned"
                  checked={settings.notifications.taskAssignment}
                  onChange={(v) => update("notifications", "taskAssignment", v)}
                />
                <SettingSwitch
                  title="Task Deadline"
                  description="Deadline reminders for pending tasks"
                  checked={settings.notifications.taskDeadline}
                  onChange={(v) => update("notifications", "taskDeadline", v)}
                />
                <SettingSwitch
                  title="Daily Summary"
                  description="Daily work activity summary"
                  checked={settings.notifications.dailySummary}
                  onChange={(v) => update("notifications", "dailySummary", v)}
                />
                <SettingSwitch
                  title="Weekly Reports"
                  description="Weekly employee work reports"
                  checked={settings.notifications.weeklyReports}
                  onChange={(v) => update("notifications", "weeklyReports", v)}
                />
                <SettingSwitch
                  title="Attendance Alerts"
                  description="Notifications about missed attendance"
                  checked={settings.notifications.attendanceAlerts}
                  onChange={(v) => update("notifications", "attendanceAlerts", v)}
                />
                <SettingSwitch
                  title="System Updates"
                  description="General system announcements"
                  checked={settings.notifications.systemUpdates}
                  onChange={(v) => update("notifications", "systemUpdates", v)}
                />
              </Box>
            )}

            {activeTab === 3 && (
              <Box>
                <Box className="toya-settings-section-title">
                  <ShieldCheck size={21} />
                  <Box>
                    <Typography fontWeight={800}>Security Preferences</Typography>
                    <Typography fontSize={12} color="text.secondary">
                      Preferences that need separate security implementation
                    </Typography>
                  </Box>
                </Box>

                <Alert severity="warning" sx={{ mb: 2, borderRadius: 3 }}>
                  Saving these values does not enable two-factor authentication
                  or enforce session restrictions by itself.
                </Alert>

                <TextField
                  select
                  label="Session Timeout Preference"
                  value={settings.security.sessionTimeoutMinutes}
                  onChange={(e) => update("security", "sessionTimeoutMinutes", Number(e.target.value))}
                  fullWidth
                  size="small"
                  sx={{ mb: 2 }}
                >
                  {[5, 15, 30, 60, 120, 720].map((minutes) => (
                    <MenuItem key={minutes} value={minutes}>
                      {minutes} minutes
                    </MenuItem>
                  ))}
                </TextField>

                <SettingSwitch
                  title="Require Two-Factor Authentication"
                  description="Preference only; actual MFA must be configured in authentication."
                  checked={settings.security.requireTwoFactor}
                  onChange={(v) => update("security", "requireTwoFactor", v)}
                />
                <SettingSwitch
                  title="Allow Multiple Sessions"
                  description="Preference only; session enforcement is not implemented here."
                  checked={settings.security.allowMultipleSessions}
                  onChange={(v) => update("security", "allowMultipleSessions", v)}
                />
              </Box>
            )}

            <Divider sx={{ my: 3 }} />

            <Box className="toya-settings-form-footer">
              <CommonButton
                label="Discard Changes"
                variant="outlined"
                onClick={discardChanges}
                disabled={saving}
              />
              <CommonButton
                label={saving ? "Saving..." : "Save Settings"}
                startIcon={
                  saving ? <CircularProgress size={16} /> : <Save size={17} />
                }
                onClick={handleSave}
                disabled={saving}
              />
            </Box>
          </Box>
        </Box>
      </Box>

      <CommonModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset System Settings?"
        description="Restore the default settings for the entire TOYA workspace."
        icon={<RotateCcw size={21} />}
        maxWidth="xs"
        showFooter={false}
      >
        <Typography fontSize={13}>
          This resets the shared Firestore settings document. It affects all
          admins who use these global settings.
        </Typography>

        <Box className="toya-settings-reset-actions">
          <CommonButton
            label="Cancel"
            variant="outlined"
            onClick={() => setResetOpen(false)}
            disabled={saving}
          />
          <CommonButton
            label={saving ? "Resetting..." : "Reset Defaults"}
            color="error"
            onClick={handleReset}
            disabled={saving}
          />
        </Box>
      </CommonModal>
    </Box>
  );
}
