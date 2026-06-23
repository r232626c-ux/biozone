// src/components/DashboardLayout.jsx
import React, { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Divider,
  Avatar,
  Button,
  IconButton,
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

const expandedWidth = 240;
const collapsedWidth = 70;

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const [user] = useState(() => {
    const rawUser = localStorage.getItem("user");
    try {
      return rawUser ? JSON.parse(rawUser) : null;
    } catch {
      return null;
    }
  });

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard/lab" },
    { text: "Onedrive", icon: <LocalHospitalIcon />, path: "/dashboard/doctor" },
    { text: "New Request", icon: <DescriptionIcon />, path: "/dashboard/new-request" },
    { text: "Lab Requests", icon: <ScienceIcon />, path: "/dashboard/lab-results" },
    { text: "Patients", icon: <GroupIcon />, path: "/dashboard/patients" },
    { text: "Research", icon: <BiotechIcon />, path: "/dashboard/research" },
    { text: "Audit Logs", icon: <HistoryIcon />, path: "/dashboard/audit-logs" },
    { text: "Settings", icon: <SettingsIcon />, path: "/dashboard/settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    navigate("/");
  };

  const logoUrl =
    "https://d24naddg1rhy2p.cloudfront.net/67005/127/0/biotechinst_logo_new_2020-03-05_v4.png";

  const logoPositions = [
    { top: "5%", left: "20%", rotate: "-10deg", size: "200px" },
    { top: "25%", left: "45%", rotate: "10deg", size: "240px" },
    { top: "60%", left: "30%", rotate: "-5deg", size: "260px" },
  ];

  return (
    <Box sx={{ display: "flex", backgroundColor: "white" }}>
      {/* COLLAPSIBLE SIDEBAR */}
      <Drawer
        variant="permanent"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        sx={{
          width: open ? expandedWidth : collapsedWidth,
          flexShrink: 0,
          whiteSpace: "nowrap",
          transition: "0.3s ease",
          [`& .MuiDrawer-paper`]: {
            width: open ? expandedWidth : collapsedWidth,
            transition: "0.3s ease",
            overflowX: "hidden",
            backgroundColor: "#aaf0c9", // mint solid
            boxSizing: "border-box",
            borderRight: "none",
            boxShadow: "none",
          },
        }}
      >
        <Toolbar sx={{ justifyContent: open ? "flex-start" : "center" }}>
          {open ? (
            <Typography variant="h6" noWrap sx={{ color: "black", fontWeight: 700 }}>
              BIOZONE LIMS
            </Typography>
          ) : (
            <BiotechIcon sx={{ color: "black" }} />
          )}
        </Toolbar>

        <Divider sx={{ borderColor: "#d5f5e3" }} />

        <List>
          {menuItems.map((item) => {
            const selected = location.pathname === item.path;

            return (
              <ListItem
                key={item.text}
                component={Link}
                to={item.path}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  backgroundColor: selected ? "#7cd992" : "inherit",
                  "&:hover": { backgroundColor: "#81e6a8" },
                  justifyContent: open ? "flex-start" : "center",
                  px: open ? 2 : 1,
                  transition: "0.2s",
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "black",
                    minWidth: open ? "40px" : "0px",
                  }}
                >
                  {item.icon}
                </ListItemIcon>

                {open && (
                  <ListItemText
                    primary={item.text}
                    sx={{ opacity: open ? 1 : 0, transition: "opacity 0.2s" }}
                  />
                )}
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ flexGrow: 1 }} />
        <Divider sx={{ borderColor: "#d5f5e3" }} />

        <Box
          sx={{
            display: "flex",
            flexDirection: open ? "row" : "column",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            p: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              minWidth: 0,
            }}
          >
            <Avatar sx={{ bgcolor: "#7cd992", color: "black", width: 40, height: 40 }}>
              {user?.username?.charAt(0)?.toUpperCase() ?? "U"}
            </Avatar>

            {open && (
              <Box sx={{ ml: 1, minWidth: 0, overflow: "hidden" }}>
                <Typography
                  variant="subtitle2"
                  noWrap
                  sx={{ fontWeight: 700, color: "black" }}
                >
                  {user?.username ?? "Signed In"}
                </Typography>
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ color: "rgba(0,0,0,0.75)" }}
                >
                  {user?.role ?? "Unknown Role"}
                </Typography>
              </Box>
            )}
          </Box>

          {open ? (
            <Button
              startIcon={<LogoutIcon />}
              variant="outlined"
              onClick={handleLogout}
              sx={{
                color: "black",
                borderColor: "rgba(0,0,0,0.3)",
                textTransform: "none",
                width: "100%",
              }}
            >
              Logout
            </Button>
          ) : (
            <IconButton onClick={handleLogout} sx={{ color: "black" }}>
              <LogoutIcon />
            </IconButton>
          )}
        </Box>
      </Drawer>

      {/* MAIN CONTENT */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: "100vw",
          minHeight: "100vh",
          backgroundColor: "white",
          position: "relative",
          p: 8,
          overflow: "hidden",
          transition: "margin-left 0.3s ease",
          ml: open ? `${expandedWidth}px` : `${collapsedWidth}px`,
        }}
      >
        <Toolbar />

        {/* FAINT BACKGROUND LOGOS */}
        {logoPositions.map((pos, i) => (
          <Box
            key={i}
            component="img"
            src={logoUrl}
            sx={{
              position: "absolute",
              top: pos.top,
              left: pos.left,
              width: pos.size,
              opacity: 0.1,
              transform: `rotate(${pos.rotate})`,
              pointerEvents: "none",
              zIndex: 0,
            }}
          />
        ))}

        {/* PAGE CONTENT */}
        <Box sx={{ position: "relative", zIndex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardLayout;
