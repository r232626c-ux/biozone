import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Paper,
  Typography,
  Grid,
  Checkbox,
  FormControlLabel,
  Divider,
  Box,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
} from "@mui/material";

import { API_URL } from "../../utils/api";

// All possible permissions
const allPermissions = [
  "Manage users and roles",
  "Configure system settings",
  "Access audit logs",
  "Add lab tests",
  "Delete lab tests",
  "Access patient lab results",
  "Manage lab requests",
  "Enter results accurately",
  "Mark requests as completed",
  "Register new patients",
  "Initiate lab requests",
  "Access patient history",
];

const roles = ["Admin", "Doctor", "Lab Technician", "User"];

const RolePermissions = () => {
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  // Load permissions from backend on component mount
  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${API_URL}/admin/permissions/`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Convert API response to local state format
      const permsMap = {};
      if (response.data.permissions) {
        Object.entries(response.data.permissions).forEach(([role, perms]) => {
          permsMap[role] = perms || [];
        });
      }
      
      setSelectedPermissions(permsMap);
    } catch (error) {
      console.error("Failed to load permissions:", error);
      setMessage("Failed to load permissions from server");
      setMessageType("error");
      setSnackbarOpen(true);
      // Initialize with empty permissions on error
      const emptyPerms = {};
      roles.forEach((role) => {
        emptyPerms[role] = [];
      });
      setSelectedPermissions(emptyPerms);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (role, permission) => {
    setSelectedPermissions((prev) => {
      const rolePerms = prev[role] || [];
      if (rolePerms.includes(permission)) {
        return { ...prev, [role]: rolePerms.filter((p) => p !== permission) };
      } else {
        return { ...prev, [role]: [...rolePerms, permission] };
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem("token");
      
      await axios.put(
        `${API_URL}/admin/permissions/`,
        { permissions: selectedPermissions },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setMessage("Permissions saved successfully!");
      setMessageType("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to save permissions:", error);
      setMessage(
        error.response?.data?.detail || 
        "Failed to save permissions. Please try again."
      );
      setMessageType("error");
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Paper sx={{ p: 3, borderRadius: 2, maxHeight: "80vh", overflowY: "auto" }}>
      <Typography variant="h5" gutterBottom textAlign="center">
        Role Selection & Permissions
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {roles.map((role) => (
        <Box key={role} sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 1, color: "primary.main" }}>
            {role}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={1}>
            {allPermissions.map((perm) => (
              <Grid item xs={12} sm={6} md={4} key={perm}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        selectedPermissions[role]
                          ? selectedPermissions[role].includes(perm)
                          : false
                      }
                      onChange={() => handleToggle(role, perm)}
                      disabled={saving}
                    />
                  }
                  label={perm}
                />
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      <Box textAlign="center" mt={3}>
        <Button 
          variant="contained" 
          onClick={handleSave}
          disabled={saving}
          sx={{ minWidth: 150 }}
        >
          {saving ? "Saving..." : "Save Permissions"}
        </Button>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={messageType}>
          {message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default RolePermissions;
