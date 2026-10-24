
import { useState } from "react";
import { useLocation } from "react-router-dom";

import {
  Avatar,
  Badge,
  Box,
  Divider,
  IconButton,
  InputBase,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  Menu as MenuIcon,
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  UserRound,
  Settings,
  LogOut,
  X,
  CheckCheck,
  ClipboardList,
  UserPlus,
  FileText,
} from "lucide-react";

import {
  motion,
  useReducedMotion,
} from "motion/react";

import "../../styles/layout/Header.css";

const PAGE_NAMES = {
  dashboard: "Dashboard",
  employees: "Employees",
  departments: "Departments",
  attendance: "Attendance",
  "work-logs": "Work Logs",
  tasks: "Tasks",
  reports: "Weekly Reports",
  analytics: "Analytics",
  "users-roles": "Users & Roles",
  settings: "Settings",
  team: "My Team",
  profile: "My Profile",
};

const DEMO_NOTIFICATIONS = [
  {
    id: 1,
    title: "New employee registered",
    description: "A new employee has joined the IT team.",
    time: "10 minutes ago",
    icon: UserPlus,
    read: false,
  },
  {
    id: 2,
    title: "Weekly report submitted",
    description: "Marketing team submitted a weekly report.",
    time: "45 minutes ago",
    icon: FileText,
    read: false,
  },
  {
    id: 3,
    title: "Daily work log updated",
    description: "Employee work log has been updated.",
    time: "Yesterday",
    icon: ClipboardList,
    read: true,
  },
];

export default function Header({
  user = {
    name: "TOYA Admin",
    role: "admin",
    department: "Administration",
  },
  onMenuClick,
  onLogout,
  onSearch,
  onProfileClick,
  onSettingsClick,
  notifications: providedNotifications,
  onMarkAllRead,
}) {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  const [search, setSearch] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);

  const [notificationAnchor, setNotificationAnchor] =
    useState(null);

  const [profileAnchor, setProfileAnchor] =
    useState(null);

  const [demoNotifications, setDemoNotifications] =
    useState(DEMO_NOTIFICATIONS);

  const notifications =
    providedNotifications ?? demoNotifications;

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  const pathParts = location.pathname
    .split("/")
    .filter(Boolean);

  const currentPageKey =
    pathParts[pathParts.length - 1] || "dashboard";

  const pageTitle =
    PAGE_NAMES[currentPageKey] ||
    currentPageKey.replace(/-/g, " ");

  const currentRole = pathParts[0] || "admin";

  const roleLabel =
    currentRole.charAt(0).toUpperCase() +
    currentRole.slice(1);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    setSearch(value);
    onSearch?.(value);
  };

  const handleClearSearch = () => {
    setSearch("");
    onSearch?.("");
  };

  const handleMarkAllRead = () => {
    if (providedNotifications) {
      onMarkAllRead?.();
    } else {
      setDemoNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read: true,
        }))
      );
    }
  };

  const closeProfile = () => setProfileAnchor(null);

  const openNotifications = Boolean(notificationAnchor);
  const openProfile = Boolean(profileAnchor);

  const initial = user.name?.charAt(0)?.toUpperCase() || "U";

  return (
    <header className="toya-header">
      {/* LEFT — Page information */}
      <Box className="toya-header-left">
        <IconButton
          className="toya-header-mobile-menu"
          aria-label="Open sidebar"
          onClick={onMenuClick}
        >
          <MenuIcon size={23} />
        </IconButton>

        <Box className="toya-header-page-info">
          <Typography className="toya-header-page-title">
            {pageTitle}
          </Typography>

          <Box className="toya-header-breadcrumb">
            <Typography component="span">
              {roleLabel}
            </Typography>

            <ChevronRight size={13} />

            <Typography component="span" className="current">
              {pageTitle}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* RIGHT — Search, notifications, profile */}
      <Box className="toya-header-right">
        <motion.div
          className={`toya-header-search ${
            searchFocused ? "is-focused" : ""
          }`}
          animate={
            reduceMotion
              ? undefined
              : { scale: searchFocused ? 1.01 : 1 }
          }
          transition={{ duration: 0.2 }}
        >
          <Search size={18} className="toya-header-search-icon" />

          <InputBase
            placeholder="Search workspace..."
            value={search}
            onChange={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            inputProps={{
              "aria-label": "Search workspace",
            }}
            fullWidth
          />

          {search && (
            <IconButton
              size="small"
              aria-label="Clear search"
              onClick={handleClearSearch}
            >
              <X size={15} />
            </IconButton>
          )}
        </motion.div>

        {/* Notification bell */}
        <Tooltip title="Notifications">
          <IconButton
            className="toya-header-icon-button"
            onClick={(event) =>
              setNotificationAnchor(event.currentTarget)
            }
            aria-label={`${unreadCount} unread notifications`}
            aria-haspopup="true"
            aria-expanded={openNotifications}
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              max={9}
            >
              <Bell size={21} />
            </Badge>
          </IconButton>
        </Tooltip>

        <Menu
          anchorEl={notificationAnchor}
          open={openNotifications}
          onClose={() => setNotificationAnchor(null)}
          className="toya-header-popover"
          slotProps={{
            paper: {
              className: "toya-notification-menu",
            },
          }}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <Box className="toya-notification-heading">
            <Box>
              <Typography fontWeight={800}>
                Notifications
              </Typography>

              <Typography variant="caption" color="text.secondary">
                {unreadCount} unread notifications
              </Typography>
            </Box>

            <Tooltip title="Mark all as read">
              <span>
                <IconButton
                  size="small"
                  onClick={handleMarkAllRead}
                  disabled={unreadCount === 0}
                  aria-label="Mark all as read"
                >
                  <CheckCheck size={19} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          <Divider />

          {notifications.length === 0 ? (
            <Box sx={{ p: 3 }}>
              <Typography color="text.secondary">
                No notifications yet.
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => {
              const Icon = notification.icon || Bell;

              return (
                <MenuItem
                  key={notification.id}
                  className={`toya-notification-item ${
                    !notification.read ? "unread" : ""
                  }`}
                  onClick={() =>
                    setNotificationAnchor(null)
                  }
                >
                  <Box className="toya-notification-icon">
                    <Icon size={19} />
                  </Box>

                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      fontWeight={700}
                      fontSize={13}
                    >
                      {notification.title}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        whiteSpace: "normal",
                        fontSize: 12,
                        mt: 0.5,
                      }}
                    >
                      {notification.description}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="primary"
                    >
                      {notification.time}
                    </Typography>
                  </Box>

                  {!notification.read && (
                    <span className="toya-unread-dot" />
                  )}
                </MenuItem>
              );
            })
          )}
        </Menu>

        {/* User profile */}
        <Box
          className="toya-header-profile"
          onClick={(event) =>
            setProfileAnchor(event.currentTarget)
          }
          role="button"
          tabIndex={0}
          aria-label="Open profile menu"
          onKeyDown={(event) => {
            if (
              event.key === "Enter" ||
              event.key === " "
            ) {
              event.preventDefault();
              setProfileAnchor(event.currentTarget);
            }
          }}
        >
          <Avatar className="toya-header-avatar">
            {initial}
          </Avatar>

          <Box className="toya-header-user-info">
            <Typography fontWeight={750} fontSize={13}>
              {user.name}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              {user.department}
            </Typography>
          </Box>

          <ChevronDown
            size={16}
            className="toya-header-profile-arrow"
          />
        </Box>

        <Menu
          anchorEl={profileAnchor}
          open={openProfile}
          onClose={closeProfile}
          className="toya-header-popover"
          slotProps={{
            paper: {
              className: "toya-profile-menu",
            },
          }}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "right",
          }}
          transformOrigin={{
            vertical: "top",
            horizontal: "right",
          }}
        >
          <Box className="toya-profile-menu-heading">
            <Typography fontWeight={750}>
              {user.name}
            </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              {user.role || currentRole}
            </Typography>
          </Box>

          <Divider />

          <MenuItem
            onClick={() => {
              closeProfile();
              onProfileClick?.();
            }}
          >
            <UserRound size={18} />
            <span>My Profile</span>
          </MenuItem>

          <MenuItem
            onClick={() => {
              closeProfile();
              onSettingsClick?.();
            }}
          >
            <Settings size={18} />
            <span>Settings</span>
          </MenuItem>

          <Divider />

          <MenuItem
            className="toya-profile-logout"
            onClick={() => {
              closeProfile();
              onLogout?.();
            }}
          >
            <LogOut size={18} />
            <span>Logout</span>
          </MenuItem>
        </Menu>
      </Box>
    </header>
  );
}
