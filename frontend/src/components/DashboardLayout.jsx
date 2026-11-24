// src/components/DashboardLayout.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Alert,
  Box,
  AppBar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import ScienceIcon from "@mui/icons-material/Science";
import DescriptionIcon from "@mui/icons-material/Description";
import GroupIcon from "@mui/icons-material/Group";
import BiotechIcon from "@mui/icons-material/Biotech";
import SettingsIcon from "@mui/icons-material/Settings";
import LogoutIcon from "@mui/icons-material/Logout";
import HistoryIcon from "@mui/icons-material/History";
import MenuIcon from "@mui/icons-material/Menu";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import { API_URL } from "../utils/api";

const expandedWidth = 252;
const collapsedWidth = 72;
const toolbarHeight = 64;

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [user] = useState(() => {
    const rawUser = localStorage.getItem("user");
    try {
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  });
  const normalizedRole = String(user?.role ?? localStorage.getItem("role") ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  const canAccessAuditLogs = normalizedRole === "admin" || normalizedRole === "superadmin";
  const canRenewSubscription = canAccessAuditLogs;
  const [subscription, setSubscription] = useState(null);
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [renewalCode, setRenewalCode] = useState("");
  const [renewalError, setRenewalError] = useState("");
  const [renewing, setRenewing] = useState(false);
  const token = localStorage.getItem("token");

  const refreshSubscription = useCallback(async () => {
    const response = await axios.get(`${API_URL}/system-settings/`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setSubscription(response.data);
    setSubscriptionChecked(true);
    setSubscriptionError("");
  }, [token]);

  useEffect(() => {
    let active = true;
    refreshSubscription().catch((error) => {
      console.error("Could not load subscription status", error);
      if (active) {
        const detail = error.response?.data?.detail;
        setSubscriptionChecked(true);
        setSubscriptionError(
          typeof detail === "string"
            ? detail
            : detail?.message ||
              "Could not check the subscription status. Contact an administrator."
        );
      }
    });
    return () => {
      active = false;
    };
  }, [refreshSubscription]);

  const handleRenewSubscription = async () => {
    if (!renewalCode.trim()) {
      setRenewalError("Enter the subscription renewal code.");
      return;
    }

    setRenewing(true);
    setRenewalError("");
    try {
      const response = await axios.post(
        `${API_URL}/system-settings/verify-payment/`,
        { code: renewalCode.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.data.success) {
        setRenewalError(response.data.message || "Invalid renewal code.");
        return;
      }
      setRenewalCode("");
      await refreshSubscription();
    } catch (error) {
      console.error("Subscription renewal failed", error);
      const detail = error.response?.data?.detail;
      setRenewalError(
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
            ? detail.map((item) => item.msg).join(", ")
            : detail?.message || "Could not verify the subscription code."
      );
    } finally {
      setRenewing(false);
    }
  };

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard/lab" },
    { text: "Onedrive", icon: <LocalHospitalIcon />, path: "/dashboard/doctor" },
    { text: "New Request", icon: <DescriptionIcon />, path: "/dashboard/new-request" },
    { text: "Lab Requests", icon: <ScienceIcon />, path: "/dashboard/lab-requests" },
    { text: "Lab Results", icon: <AssignmentTurnedInIcon />, path: "/dashboard/lab-results" },
    { text: "Patients", icon: <GroupIcon />, path: "/dashboard/patients" },
    { text: "Emails", icon: <EmailOutlinedIcon />, path: "/dashboard/research" },
    { text: "Audit Logs", icon: <HistoryIcon />, path: "/dashboard/audit-logs" },
    { text: "Settings", icon: <SettingsIcon />, path: "/dashboard/settings" },
  ];
  const visibleMenuItems = menuItems.filter(
    (item) => item.text !== "Audit Logs" || canAccessAuditLogs
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/");
  };

  const drawerWidth = isMobile ? expandedWidth : open ? expandedWidth : collapsedWidth;

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "rgba(255,255,255,0.96)",
        }}
      >
        <Toolbar sx={{ minHeight: `${toolbarHeight}px !important`, px: { xs: 1.5, sm: 3 } }}>
          <Tooltip title={open ? "Collapse navigation" : "Expand navigation"}>
            <IconButton
              onClick={() => setOpen((current) => !current)}
              edge="start"
              aria-label="Toggle navigation"
              sx={{ mr: 2, color: "text.primary" }}
            >
              <MenuIcon />
            </IconButton>
          </Tooltip>
          <BiotechIcon sx={{ color: "primary.main", mr: 1 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary" }}>
            BIOZONE <Box component="span" sx={{ color: "primary.main" }}>LIMS</Box>
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "right" }}>
              <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                {user?.username ?? "Signed in"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {user?.role ?? "User"}
              </Typography>
            </Box>
            <Avatar
              sx={{
                width: 36,
                height: 36,
                bgcolor: "primary.main",
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
            </Avatar>
            <Tooltip title="Sign out">
              <IconButton onClick={handleLogout} aria-label="Sign out" sx={{ color: "text.secondary" }}>
                <LogoutIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? open : true}
        onClose={() => setOpen(false)}
        sx={{
          width: isMobile ? 0 : drawerWidth,
          flexShrink: 0,
          whiteSpace: "nowrap",
          transition: "width 180ms ease",
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            top: `${toolbarHeight}px`,
            height: `calc(100% - ${toolbarHeight}px)`,
            overflowX: "hidden",
            bgcolor: "#ffffff",
            boxSizing: "border-box",
            borderRight: "1px solid",
            borderColor: "divider",
            boxShadow: "none",
            transition: "width 180ms ease",
          },
        }}
      >
        <List sx={{ px: 1.25, py: 2 }}>
          {visibleMenuItems.map((item) => {
            const selected = location.pathname === item.path;

            return (
              <ListItem
                key={item.text}
                component={Link}
                to={item.path}
                onClick={() => isMobile && setOpen(false)}
                title={!open ? item.text : undefined}
                sx={{
                  mb: 0.5,
                  minHeight: 46,
                  borderRadius: 2,
                  color: selected ? "primary.dark" : "text.secondary",
                  bgcolor: selected ? "primary.light" : "transparent",
                  "&:hover": { bgcolor: selected ? "primary.light" : "#f4f7f4" },
                  justifyContent: open ? "flex-start" : "center",
                  px: open ? 1.5 : 0,
                  transition: "background-color 140ms ease",
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "inherit",
                    minWidth: open ? 38 : 0,
                    justifyContent: "center",
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                {open && (
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontSize: 14, fontWeight: selected ? 650 : 500 }}
                  />
                )}
              </ListItem>
            );
          })}
        </List>
      </Drawer>

      <Box
        component="main"
        className="dashboard-main"
        sx={{
          ml: isMobile ? 0 : `${drawerWidth}px`,
          width: isMobile ? "100%" : `calc(100% - ${drawerWidth}px)`,
          pt: `${toolbarHeight}px`,
          bgcolor: "background.default",
        }}
      >
        <Box className="dashboard-content" sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
          {subscriptionError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {subscriptionError}
            </Alert>
          )}
          {subscription &&
            !subscription.subscriptionExpired &&
            subscription.subscriptionDaysRemaining <= 7 && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Subscription expires{" "}
                {subscription.subscriptionExpiresAt
                  ? `on ${new Date(subscription.subscriptionExpiresAt).toLocaleDateString()}`
                  : "at the end of this month"}
                . Renew before month-end to avoid interruption.
              </Alert>
            )}
          {subscriptionChecked && !subscription?.subscriptionExpired ? (
            <Outlet />
          ) : !subscriptionChecked ? (
            <Typography role="status" color="text.secondary">
              Checking subscription...
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Dialog
        open={Boolean(subscription?.subscriptionExpired)}
        onClose={() => {}}
        disableEscapeKeyDown
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Subscription renewal required</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 2 }}>
            {subscription?.subscriptionExpiresAt
              ? "Biozone is locked because the subscription expired at the end of the month."
              : "Biozone is locked because no active subscription is recorded."}{" "}
            Verify a renewal code to restore access.
          </Alert>
          {canRenewSubscription ? (
            <>
              {renewalError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {renewalError}
                </Alert>
              )}
              <TextField
                autoFocus
                fullWidth
                label="Subscription renewal code"
                value={renewalCode}
                onChange={(event) => setRenewalCode(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !renewing) {
                    handleRenewSubscription();
                  }
                }}
                autoComplete="off"
                disabled={renewing}
              />
            </>
          ) : (
            <Typography color="text.secondary">
              Ask an administrator to verify the subscription renewal.
            </Typography>
          )}
        </DialogContent>
        {canRenewSubscription && (
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              variant="contained"
              onClick={handleRenewSubscription}
              disabled={renewing}
            >
              {renewing ? "Verifying..." : "Verify renewal"}
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </Box>
  );
};

export default DashboardLayout;
