import React, { useState } from "react";
import { Box, Tab, Tabs, Typography } from "@mui/material";

import UserManagement from "../components/settings/UserManagement";
import RolePermissions from "../components/settings/RolePermissions";
import SystemSettings from "../components/settings/SystemSettings";

const Settings = () => {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <Box sx={{ maxWidth: 1320, mx: "auto", pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="overline"
          sx={{ color: "#0f8a3a", fontWeight: 700, letterSpacing: "0.1em" }}
        >
          ADMINISTRATION
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: "-0.03em" }}>
          Settings
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>
          Manage user accounts, access permissions, and laboratory settings.
        </Typography>
      </Box>

      <Tabs
        value={tabIndex}
        onChange={(_, newIndex) => setTabIndex(newIndex)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          mb: 2.5,
          borderBottom: "1px solid #dde6de",
          "& .MuiTabs-indicator": { height: 3, borderRadius: "3px 3px 0 0", bgcolor: "#0f8a3a" },
          "& .MuiTab-root": { minHeight: 48, textTransform: "none", fontWeight: 600 },
          "& .Mui-selected": { color: "#0b6f2e !important" },
        }}
      >
        <Tab label="Account Management" />
        <Tab label="Roles & Permissions" />
        <Tab label="System Settings" />
      </Tabs>

      <Box>
        {tabIndex === 0 && <UserManagement />}
        {tabIndex === 1 && <RolePermissions />}
        {tabIndex === 2 && <SystemSettings />}
      </Box>
    </Box>
  );
};

export default Settings;
