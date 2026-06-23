import React from "react";
import { Box, Typography, Divider, Button } from "@mui/material";

const LabDashboard = () => {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <Box
      sx={{
        p: 2,
        m: -8,
        minHeight: "100vh",
        maxWidth: 1200,
        backgroundColor: "#f9f9f9",
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

      {/* Embedded Website */}
      <Box
        sx={{
          width: "100%",
          height: "80vh",
          border: "none",
          boxShadow: "0px 3px 10px rgba(0,0,0,0.2)",
        }}
      >
        <iframe
          src="https://www.biotechinst.com"
          title="Biotech Institute Website"
          width="100%"
          height="100%"
          style={{ border: "none" }}
        />
      </Box>
    </Box>
  );
};

export default LabDashboard;
