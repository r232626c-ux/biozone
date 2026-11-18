import React from "react";
import { Box, Typography, Divider, Button } from "@mui/material";
import DashboardAnalytics from "../components/dashboard/DashboardAnalytics";

const LabDashboard = () => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <Box
      sx={{
        p: 0,
        minHeight: "calc(100vh - 64px)",
        width: "100%",
        backgroundColor: "transparent",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography
          variant="h3"
          sx={{ fontWeight: "bold", color: "#080808ff" }}
        >
          Welcome To Biotech Institute LIMS
        </Typography>

        <Button
          variant="outlined"
          color="error"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      <Divider sx={{ mb: 3, borderColor: "#070707ff" }} />

      <DashboardAnalytics />
    </Box>
  );
};

export default LabDashboard;
