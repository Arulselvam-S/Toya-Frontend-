
import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import {
  Avatar,
  IconButton,
  Tooltip,
  Typography,
} from "@mui/material";

import {
  LayoutDashboard,
  Users,
  Clock3,
  ClipboardList,
  FileBarChart2,
  Settings,
  UserRound,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "motion/react";

import "../../styles/layout/Sidebar.css";

// ========================================
// TOYA MANAGEMENT SYSTEM
// MVP ROLE-BASED NAVIGATION
// ========================================

// Only essential menus are displayed.
// Existing future modules are not deleted.

const NAVIGATION = {
  // =====================================
  // ADMIN
  // =====================================
  admin: [
    {
      title: "MAIN MENU",
      links: [
        [
          "Dashboard",
          "/admin/dashboard",
          LayoutDashboard,
        ],
        [
          "Employees",
          "/admin/employees",
          Users,
        ],
        [
          "Attendance",
          "/admin/attendance",
          Clock3,
        ],
        [
          "Work Reports",
          "/admin/reports",
          FileBarChart2,
        ],
        [
          "Work Logs",
          "/admin/work-logs",
          ClipboardList,
        ],
         [
          "My Profile",
          "/admin/profile",
          UserRound,
        ],
      ],
    },
  ],

  // =====================================
  // MANAGER
  // =====================================
  manager: [
    {
      title: "MAIN MENU",
      links: [
        [
          "Dashboard",
          "/manager/dashboard",
          LayoutDashboard,
        ],
        [
          "Team Attendance",
          "/manager/attendance",
          Clock3,
        ],
        [
          "Team Reports",
          "/manager/reports",
          FileBarChart2,
        ],
        [
          "My Profile",
          "/manager/profile",
          UserRound,
        ],
      ],
    },
  ],

  // =====================================
  // EMPLOYEE
  // =====================================
  employee: [
    {
      title: "MY WORKSPACE",
      links: [
        [
          "Dashboard",
          "/employee/dashboard",
          LayoutDashboard,
        ],
        [
          "My Attendance",
          "/employee/attendance",
          Clock3,
        ],
        [
          "Daily Work Log",
          "/employee/work-logs",
          ClipboardList,
        ],
        [
          "My Profile",
          "/employee/profile",
          UserRound,
        ],
      ],
    },
  ],
};

// ========================================
// SIDEBAR COMPONENT
// ========================================

export default function Sidebar({
  role = "admin",

  user = {
    name: "TOYA Admin",
    department: "Administration",
  },

  mobileOpen = false,
  onMobileClose,
  onLogout,
}) {
  const [collapsed, setCollapsed] =
    useState(false);

  const location = useLocation();

  const reduceMotion = useReducedMotion();

  const sections =
    NAVIGATION[role] || NAVIGATION.employee;

  // =====================================
  // CLOSE MOBILE MENU USING ESC
  // =====================================

  useEffect(() => {
    if (!mobileOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        onMobileClose?.();
      }
    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [mobileOpen, onMobileClose]);

  // =====================================
  // CLOSE MOBILE MENU ON ROUTE CHANGE
  // =====================================

  useEffect(() => {
    if (mobileOpen) {
      onMobileClose?.();
    }

    // onMobileClose may be recreated by the
    // parent layout, so listen for route changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // =====================================
  // RENDER NAVIGATION LINKS
  // =====================================

  const renderLinks = (compact, mobile) => (
    <nav
      className="toyaSide-nav"
      aria-label={`${role} navigation`}
    >
      {sections.map((section) => (
        <div
          className="toyaSide-section"
          key={section.title}
        >
          {/* SECTION TITLE */}
          <div
            className={[
              "toyaSide-sectionTitle",
              compact ? "compact" : "",
            ].join(" ")}
          >
            {compact ? (
              <span className="toyaSide-sectionLine" />
            ) : (
              section.title
            )}
          </div>

          {/* MENU ITEMS */}
          {section.links.map(
            ([label, path, Icon]) => {
              const active =
                location.pathname === path ||
                location.pathname.startsWith(
                  `${path}/`
                );

              return (
                <Tooltip
                  key={path}
                  title={compact ? label : ""}
                  placement="right"
                  arrow
                >
                  <NavLink
                    to={path}
                    aria-label={label}
                    aria-current={
                      active ? "page" : undefined
                    }
                    onClick={
                      mobile
                        ? onMobileClose
                        : undefined
                    }
                    className={[
                      "toyaSide-link",
                      active ? "active" : "",
                      compact ? "compact" : "",
                    ].join(" ")}
                  >
                    {/* ICON */}
                    <span className="toyaSide-icon">
                      <Icon
                        size={20}
                        strokeWidth={1.9}
                      />
                    </span>

                    {/* MENU LABEL */}
                    {!compact && (
                      <span className="toyaSide-label">
                        {label}
                      </span>
                    )}
                  </NavLink>
                </Tooltip>
              );
            }
          )}
        </div>
      ))}
    </nav>
  );

  // =====================================
  // SIDEBAR BODY
  // =====================================

  const renderContent = (compact, mobile) => (
    <div className="toyaSide-inner">
      {/* BRAND HEADER */}
     
{/* BRAND HEADER */}
<div
  className={[
    "toyaSide-brand",
    compact ? "compact" : "",
  ].join(" ")}
>
  <div className="toyaSide-logo">
    <img
      src="/images/toya-logo.jpeg"
      alt="TOYA WaterTech Innovation"
      className="toyaSide-logoImage"
    />
  </div>

  {/* Keep the company caption when expanded */}
  {!compact && (
    <div className="toyaSide-brandText">
      <Typography className="toyaSide-name">
        TOYA
      </Typography>

      <Typography className="toyaSide-caption">
        WaterTech Innovation
      </Typography>
    </div>
  )}

  {/* COLLAPSE / MOBILE CLOSE */}
  <IconButton
    className="toyaSide-toggle"
    size="small"
    aria-label={
      mobile
        ? "Close sidebar"
        : compact
          ? "Expand sidebar"
          : "Collapse sidebar"
    }
    onClick={
      mobile
        ? onMobileClose
        : () => setCollapsed((previous) => !previous)
    }
  >
    {mobile ? (
      <X size={19} />
    ) : compact ? (
      <PanelLeftOpen size={19} />
    ) : (
      <PanelLeftClose size={19} />
    )}
  </IconButton>
</div>


      {/* MENU */}
      {renderLinks(compact, mobile)}

      {/* ACCOUNT FOOTER */}
      <div className="toyaSide-footer">
        <div
          className={[
            "toyaSide-user",
            compact ? "compact" : "",
          ].join(" ")}
        >
          <Avatar className="toyaSide-avatar">
            {user?.name?.[0]?.toUpperCase() ||
              "U"}
          </Avatar>

          {!compact && (
            <div className="toyaSide-userText">
              <strong>
                {user?.name || "TOYA User"}
              </strong>

              <span>
                {user?.department ||
                  "TOYA Team"}
              </span>
            </div>
          )}
        </div>

        {/* LOGOUT */}
        <Tooltip
          title={compact ? "Logout" : ""}
        >
          <button
            type="button"
            className={[
              "toyaSide-logout",
              compact ? "compact" : "",
            ].join(" ")}
            aria-label="Logout"
            onClick={() => {
              if (mobile) {
                onMobileClose?.();
              }

              onLogout?.();
            }}
          >
            <LogOut size={19} />

            {!compact && (
              <span>Logout</span>
            )}
          </button>
        </Tooltip>
      </div>
    </div>
  );

  // =====================================
  // FINAL SIDEBAR UI
  // =====================================

  return (
    <>
      {/* DESKTOP SIDEBAR */}
      <aside
        className={[
          "toyaSide-desktop",
          collapsed ? "collapsed" : "",
        ].join(" ")}
      >
        {renderContent(
          collapsed,
          false
        )}
      </aside>

      {/* MOBILE SIDEBAR */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* BACKDROP */}
            <motion.div
              className="toyaSide-backdrop"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: reduceMotion
                  ? 0
                  : 0.2,
              }}
              onClick={onMobileClose}
            />

            {/* SLIDING SIDEBAR */}
            <motion.aside
              className="toyaSide-mobile"
              initial={{
                x: "-100%",
              }}
              animate={{
                x: 0,
              }}
              exit={{
                x: "-100%",
              }}
              transition={{
                duration: reduceMotion
                  ? 0
                  : 0.3,
              }}
              aria-label="Mobile sidebar"
            >
              {renderContent(false, true)}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
