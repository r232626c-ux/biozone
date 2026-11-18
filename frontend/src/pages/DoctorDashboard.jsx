import React from "react";
import { Box } from "@mui/material";
import OneDriveAccess from "../components/dashboard/OneDriveAccess";

const LabDashboard = () => {
  return (
    <Box
      sx={{
        width: "100%",
      }}
    >
      <OneDriveAccess />
    </Box>
  );
};

export default LabDashboard;
