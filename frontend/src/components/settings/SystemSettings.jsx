import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";

import { API_URL } from "../../utils/api";

const defaultSettings = {
  labName: "",
  turnaroundTime: "24",
  enableNotifications: true,
  maintenanceMode: false,
  defaultReportFormat: "PDF",
  dataRetentionDays: 365,
  lastPaymentDate: null,
  paymentStatus: "inactive",
};

const getErrorMessage = (error, fallback) => {
  const detail = error.response?.data?.detail;
  return typeof detail === "string" ? detail : error.message || fallback;
};

const SystemSettings = () => {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [paymentCode, setPaymentCode] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [systemLocked, setSystemLocked] = useState(false);
  const [daysUntilPayment, setDaysUntilPayment] = useState(0);

  const checkPaymentStatus = (lastPayment) => {
    if (!lastPayment) {
      setSystemLocked(true);
      setDaysUntilPayment(0);
      return;
    }

    const lastPaymentDate = new Date(lastPayment);
    if (Number.isNaN(lastPaymentDate.getTime())) {
      setSystemLocked(true);
      setDaysUntilPayment(0);
      return;
    }

    const daysElapsed = Math.floor(
      (Date.now() - lastPaymentDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = 60 - daysElapsed;

    if (daysRemaining <= 0) {
      setSystemLocked(true);
      setPaymentDialogOpen(true);
      setDaysUntilPayment(0);
      return;
    }

    setDaysUntilPayment(daysRemaining);
    setSystemLocked(false);
  };

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setLoaded(false);
    setLoadError("");
    try {
      const response = await axios.get(`${API_URL}/system-settings/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!response.data || typeof response.data !== "object") {
        throw new Error("The server returned invalid system settings.");
      }

      setSettings({ ...defaultSettings, ...response.data });
      setLoaded(true);
      checkPaymentStatus(response.data.lastPaymentDate);
    } catch (error) {
      console.error("Failed to load system settings", error);
      setLoadError(getErrorMessage(error, "Failed to load settings."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setSettings((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePaymentVerification = async () => {
    if (!paymentCode.trim()) {
      setMessage("Enter the payment verification code.");
      setMessageType("error");
      return;
    }

    setVerifyingPayment(true);
    setMessage("");
    try {
      const response = await axios.post(
        `${API_URL}/system-settings/verify-payment/`,
        { code: paymentCode.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (!response.data.success) {
        setMessage(response.data.message || "Invalid payment code. Please try again.");
        setMessageType("error");
        return;
      }

      const paymentDate = response.data.lastPaymentDate || new Date().toISOString();
      setSettings((current) => ({
        ...current,
        lastPaymentDate: paymentDate,
        paymentStatus: "active",
      }));
      setMessage(response.data.message || "Payment verified. System unlocked.");
      setMessageType("success");
      setPaymentCode("");
      setPaymentDialogOpen(false);
      checkPaymentStatus(paymentDate);
    } catch (error) {
      console.error("Payment verification failed", error);
      setMessage(getErrorMessage(error, "Payment verification failed."));
      setMessageType("error");
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleSave = async () => {
    if (!loaded || systemLocked) return;

    if (!settings.labName.trim()) {
      setMessage("Enter a laboratory name.");
      setMessageType("error");
      return;
    }

    const retentionDays = Number(settings.dataRetentionDays);
    if (!Number.isInteger(retentionDays) || retentionDays < 0) {
      setMessage("Data retention must be a whole number of days (0 or more).");
      setMessageType("error");
      return;
    }

    setSaving(true);
    setMessage("");
    try {
      await axios.put(
        `${API_URL}/system-settings/`,
        {
          labName: settings.labName.trim(),
          turnaroundTime: String(settings.turnaroundTime),
          enableNotifications: Boolean(settings.enableNotifications),
          maintenanceMode: Boolean(settings.maintenanceMode),
          defaultReportFormat: settings.defaultReportFormat,
          dataRetentionDays: retentionDays,
        },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setMessage("System settings saved successfully.");
      setMessageType("success");
    } catch (error) {
      console.error("Failed to update system settings", error);
      setMessage(getErrorMessage(error, "Failed to save settings."));
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 960 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            System settings
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Configure laboratory defaults and system behavior.
          </Typography>
        </Box>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!loaded || saving || systemLocked}
          sx={{
            alignSelf: { xs: "flex-start", sm: "center" },
            bgcolor: "#0f8a3a",
            "&:hover": { bgcolor: "#0b6f2e" },
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          {saving ? "Saving…" : systemLocked ? "System locked" : "Save settings"}
        </Button>
      </Stack>

      {loadError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchSettings}>
              Retry
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {loadError}
        </Alert>
      )}

      {message && (
        <Alert
          severity={messageType}
          onClose={() => setMessage("")}
          sx={{ mb: 2 }}
        >
          {message}
        </Alert>
      )}

      <Card
        variant="outlined"
        sx={{
          mb: 2.5,
          borderColor: systemLocked ? "#f1b8b8" : "#cfe5d4",
          bgcolor: systemLocked ? "#fff8f8" : "#f7fbf7",
          borderRadius: 2,
        }}
      >
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
                Subscription status
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Status: {systemLocked ? "Locked" : "Active"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Last payment:{" "}
                {settings.lastPaymentDate
                  ? new Date(settings.lastPaymentDate).toLocaleDateString()
                  : "No payment recorded"}
              </Typography>
              {daysUntilPayment > 0 && daysUntilPayment <= 7 && (
                <Typography variant="body2" sx={{ mt: 0.5, color: "#a8510a" }}>
                  Payment due in {daysUntilPayment} days.
                </Typography>
              )}
            </Box>
            <Button
              variant={systemLocked ? "contained" : "outlined"}
              color={systemLocked ? "error" : "inherit"}
              onClick={() => setPaymentDialogOpen(true)}
              sx={{ alignSelf: { xs: "flex-start", sm: "center" }, textTransform: "none" }}
            >
              Verify payment
            </Button>
          </Stack>
          {systemLocked && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              System settings are read-only until payment is verified.
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderColor: "#dde6de", borderRadius: 2 }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>
            Laboratory defaults
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            These values are used as the system-wide defaults.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              gap: 2,
            }}
          >
            <TextField
              label="Laboratory name"
              name="labName"
              value={settings.labName}
              onChange={handleChange}
              required
              fullWidth
              disabled={!loaded || systemLocked}
            />
            <TextField
              label="Default turnaround time (hours)"
              name="turnaroundTime"
              type="number"
              value={settings.turnaroundTime}
              onChange={handleChange}
              inputProps={{ min: 1 }}
              fullWidth
              disabled={!loaded || systemLocked}
            />
            <TextField
              label="Data retention (days)"
              name="dataRetentionDays"
              type="number"
              value={settings.dataRetentionDays}
              onChange={handleChange}
              inputProps={{ min: 0, step: 1 }}
              fullWidth
              disabled={!loaded || systemLocked}
            />
            <TextField
              select
              label="Default report format"
              name="defaultReportFormat"
              value={settings.defaultReportFormat}
              onChange={handleChange}
              fullWidth
              disabled={!loaded || systemLocked}
            >
              {["PDF", "DOCX", "XLSX"].map((format) => (
                <MenuItem key={format} value={format}>
                  {format}
                </MenuItem>
              ))}
              {!["PDF", "DOCX", "XLSX"].includes(settings.defaultReportFormat) && (
                <MenuItem value={settings.defaultReportFormat}>
                  {settings.defaultReportFormat}
                </MenuItem>
              )}
            </TextField>
          </Box>

          <Divider sx={{ my: 2.5 }} />

          <Stack spacing={0.5}>
            <FormControlLabel
              control={
                <Checkbox
                  name="enableNotifications"
                  checked={Boolean(settings.enableNotifications)}
                  onChange={handleChange}
                  disabled={!loaded || systemLocked}
                  sx={{ "&.Mui-checked": { color: "#0f8a3a" } }}
                />
              }
              label="Enable system notifications"
            />
            <FormControlLabel
              control={
                <Checkbox
                  name="maintenanceMode"
                  checked={Boolean(settings.maintenanceMode)}
                  onChange={handleChange}
                  disabled={!loaded || systemLocked}
                  sx={{ "&.Mui-checked": { color: "#0f8a3a" } }}
                />
              }
              label="Enable maintenance mode"
            />
          </Stack>
        </CardContent>
      </Card>

      <Dialog
        open={paymentDialogOpen}
        onClose={() => {
          if (!systemLocked && !verifyingPayment) setPaymentDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Verify payment</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Enter the payment verification code provided by your system administrator.
          </Alert>
          <TextField
            label="Payment verification code"
            value={paymentCode}
            onChange={(event) => setPaymentCode(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") handlePaymentVerification();
            }}
            fullWidth
            autoComplete="off"
            disabled={verifyingPayment}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setPaymentDialogOpen(false)}
            disabled={systemLocked || verifyingPayment}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePaymentVerification}
            variant="contained"
            disabled={verifyingPayment}
            sx={{
              bgcolor: "#0f8a3a",
              "&:hover": { bgcolor: "#0b6f2e" },
              textTransform: "none",
            }}
          >
            {verifyingPayment ? "Verifying…" : "Verify"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemSettings;
