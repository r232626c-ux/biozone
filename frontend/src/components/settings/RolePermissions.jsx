import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { API_URL } from "../../utils/api";

const permissionGroups = [
  {
    label: "Administration",
    permissions: [
      "Manage users and roles",
      "Configure system settings",
    ],
  },
  {
    label: "Laboratory tests",
    permissions: ["Add lab tests", "Delete lab tests"],
  },
  {
    label: "Requests and results",
    permissions: [
      "Access patient lab results",
      "Manage lab requests",
      "Enter results accurately",
      "Mark requests as completed",
    ],
  },
  {
    label: "Patients",
    permissions: [
      "Register new patients",
      "Initiate lab requests",
      "Access patient history",
    ],
  },
];

const defaultRoles = ["Admin", "Doctor", "Lab Technician", "User"];
const canonicalRoleName = (role) =>
  String(role)
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}`)
    .join(" ");

const RolePermissions = () => {
  const [availableRoles, setAvailableRoles] = useState(defaultRoles);
  const [selectedPermissions, setSelectedPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const token = localStorage.getItem("token");

  const fetchPermissions = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setLoaded(false);
    try {
      const response = await axios.get(`${API_URL}/admin/permissions/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const permissions = response.data?.permissions;
      if (!permissions || typeof permissions !== "object" || Array.isArray(permissions)) {
        throw new Error("The server returned an invalid permissions list.");
      }

      const roleNames = [
        ...new Set([
          ...defaultRoles,
          ...Object.keys(permissions).map(canonicalRoleName),
        ]),
      ];
      const permissionMap = Object.fromEntries(
        roleNames.map((role) => {
          const assignedPermissions = Object.entries(permissions)
            .filter(([savedRole]) => canonicalRoleName(savedRole) === role)
            .flatMap(([, assigned]) =>
              Array.isArray(assigned) ? assigned : []
            );
          return [role, [...new Set(assignedPermissions)]];
        })
      );
      setAvailableRoles(roleNames);
      setSelectedPermissions(permissionMap);
      setLoaded(true);
    } catch (error) {
      console.error("Failed to load role permissions", error);
      setLoadError(
        error.response?.data?.detail ||
          error.message ||
          "Could not load role permissions. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const permissionCountByRole = useMemo(
    () =>
      Object.fromEntries(
        availableRoles.map((role) => [
          role,
          (selectedPermissions[role] || []).length,
        ])
      ),
    [availableRoles, selectedPermissions]
  );

  const handleToggle = (role, permission) => {
    setSelectedPermissions((current) => {
      const rolePermissions = current[role] || [];
      const updatedPermissions = rolePermissions.includes(permission)
        ? rolePermissions.filter((item) => item !== permission)
        : [...rolePermissions, permission];
      return { ...current, [role]: updatedPermissions };
    });
  };

  const handleSave = async () => {
    if (!loaded || loadError) return;
    setSaving(true);
    try {
      await axios.put(
        `${API_URL}/admin/permissions/`,
        { permissions: selectedPermissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Role permissions saved successfully.");
      setMessageType("success");
      setSnackbarOpen(true);
    } catch (error) {
      console.error("Failed to save role permissions", error);
      setMessage(
        error.response?.data?.detail ||
          "Could not save role permissions. Please try again."
      );
      setMessageType("error");
      setSnackbarOpen(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Roles & permissions
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Review and configure permission assignments for each role.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!loaded || Boolean(loadError) || loading || saving}
          sx={{
            alignSelf: { xs: "flex-start", sm: "center" },
            bgcolor: "#0f8a3a",
            "&:hover": { bgcolor: "#0b6f2e" },
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          {saving ? "Saving…" : "Save permissions"}
        </Button>
      </Stack>

      {loadError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchPermissions}>
              Retry
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {loadError}
        </Alert>
      )}

      <Paper
        variant="outlined"
        sx={{ borderColor: "#dde6de", borderRadius: 2, overflow: "hidden" }}
      >
        <Box sx={{ p: 2, borderBottom: "1px solid #dde6de" }}>
          <Typography sx={{ fontWeight: 700 }}>Permission matrix</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            Select the permissions assigned to each role, then save your changes.
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ py: 7, display: "flex", justifyContent: "center" }}>
            <CircularProgress size={28} />
          </Box>
        ) : !loadError ? (
          <TableContainer>
            <Table
              aria-label="Role permissions matrix"
              sx={{ minWidth: 680, "& .MuiTableCell-root": { borderColor: "#e5ebe6" } }}
            >
              <TableHead>
                <TableRow sx={{ bgcolor: "#f6f9f6" }}>
                  <TableCell
                    sx={{
                      minWidth: 260,
                      color: "#4f6a55",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    What the role can do
                  </TableCell>
                  {availableRoles.map((role) => (
                    <TableCell
                      key={role}
                      align="center"
                      sx={{
                        minWidth: 120,
                        color: "#4f6a55",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.04em",
                        textTransform: "uppercase",
                      }}
                    >
                      <Box>{role}</Box>
                      <Typography variant="caption" color="text.secondary">
                        {permissionCountByRole[role]} enabled
                      </Typography>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {permissionGroups.map((group) => (
                  <React.Fragment key={group.label}>
                    <TableRow>
                      <TableCell
                        colSpan={availableRoles.length + 1}
                        sx={{
                          py: 1,
                          bgcolor: "#f6f9f6",
                          color: "#0b6f2e",
                          fontSize: 11,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        {group.label}
                      </TableCell>
                    </TableRow>
                    {group.permissions.map((permission) => (
                      <TableRow
                        key={permission}
                        hover
                        sx={{ "&:hover": { bgcolor: "#f6f9f6" } }}
                      >
                        <TableCell sx={{ fontWeight: 500 }}>{permission}</TableCell>
                        {availableRoles.map((role) => (
                          <TableCell key={role} align="center" sx={{ py: 0.5 }}>
                            <Checkbox
                              checked={(selectedPermissions[role] || []).includes(
                                permission
                              )}
                              onChange={() => handleToggle(role, permission)}
                              disabled={saving}
                              inputProps={{
                                "aria-label": `${permission} for ${role}`,
                              }}
                              sx={{
                                color: "#9bb6a0",
                                "&.Mui-checked": { color: "#0f8a3a" },
                              }}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ p: 3 }}>
            <Typography color="text.secondary">
              Permissions are unavailable until the server connection is restored.
            </Typography>
          </Box>
        )}

        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderTop: "1px solid #dde6de",
            bgcolor: "#f6f9f6",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Role assignments are saved to the permissions record.
          </Typography>
        </Box>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={messageType}
          sx={{ width: "100%" }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RolePermissions;
