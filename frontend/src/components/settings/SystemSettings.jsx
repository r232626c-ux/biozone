import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  TextField,
  FormControlLabel,
  Checkbox,
  Button,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Card,
  CardContent,
} from "@mui/material";
import axios from "axios";

import { API_URL } from "../../utils/api";

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    labname: "",
    turnaroundtime: "",
    enablenotifications: false,
    maintenancemode: false,
    defaultteportformat: "PDF",
    dataretentiondays: 365,
    lastpaymentdate: null,
    paymentstatus: "active",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [paymentCode, setPaymentCode] = useState("");
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [systemLocked, setSystemLocked] = useState(false);
  const [daysUntilPayment, setDaysUntilPayment] = useState(0);

  // Check if system needs payment
  const checkPaymentStatus = (lastPayment) => {
    if (!lastPayment) {
      setSystemLocked(true);
      setDaysUntilPayment(0);
      return;
    }

    const lastPaymentDate = new Date(lastPayment);
    const today = new Date();
    const daysElapsed = Math.floor(
      (today - lastPaymentDate) / (1000 * 60 * 60 * 24)
    );
    const daysRemaining = 60 - daysElapsed; // 2 months = 60 days

    if (daysRemaining <= 0) {
      setSystemLocked(true);
      setPaymentDialogOpen(true);
      setDaysUntilPayment(0);
    } else if (daysRemaining <= 7) {
      // Warning if less than 7 days left
      setDaysUntilPayment(daysRemaining);
    } else {
      setDaysUntilPayment(daysRemaining);
      setSystemLocked(false);
    }
  };

  // Fetch system settings from backend on component mount
  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/system-settings/`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setSettings((prev) => ({ ...prev, ...response.data }));
        checkPaymentStatus(response.data.lastPaymentDate);
      } catch (error) {
        console.error("Failed to load system settings:", error);
        setMessage("Failed to load settings. Try refreshing.");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle input changes dynamically
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Verify payment code and unlock system
  const handlePaymentVerification = async () => {
    if (!paymentCode.trim()) {
      setMessage("Please enter the payment verification code");
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/system-settings/verify-payment/`,
        { code: paymentCode },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      if (response.data.success) {
        setMessage("Payment verified! System unlocked successfully.");
        setSettings((prev) => ({
          ...prev,
          lastPaymentDate: new Date().toISOString(),
          paymentStatus: "active",
        }));
        setPaymentCode("");
        setPaymentDialogOpen(false);
        setSystemLocked(false);
        checkPaymentStatus(new Date().toISOString());
      } else {
        setMessage("Invalid payment code. Please try again.");
      }
    } catch (error) {
      console.error("Payment verification failed:", error);
      setMessage("Payment verification failed. Please try again.");
    }
  };

  // Save updated settings to backend
  const handleSave = async () => {
    if (systemLocked) {
      setMessage("System is locked. Please verify payment before saving.");
      return;
    }

    setSaving(true);
    try {
      await axios.put(
        `${API_URL}/system-settings/`,
        settings,
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      setMessage("Settings updated successfully!");
    } catch (error) {
      console.error("Failed to update settings:", error);
      setMessage("Failed to save settings. Try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(""), 3000);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 700, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>
        System Settings
      </Typography>

      {/* System Status & Payment Section */}
      <Card sx={{ mb: 3, backgroundColor: systemLocked ? "#ffebee" : "#e8f5e9" }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Status & Payment
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Status:</strong> {systemLocked ? "🔒 LOCKED" : "🔓 ACTIVE"}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>Last Payment Date:</strong>{" "}
            {settings.lastPaymentDate
              ? new Date(settings.lastPaymentDate).toLocaleDateString()
              : "Never"}
          </Typography>
          {daysUntilPayment > 0 && !systemLocked && (
            <Typography variant="body2" color="warning" sx={{ mb: 2 }}>
              ⚠️ Payment due in {daysUntilPayment} days
            </Typography>
          )}
          {systemLocked && (
            <Alert severity="error" sx={{ mb: 2 }}>
              System is locked. Please verify payment to continue.
            </Alert>
          )}
          {systemLocked && (
            <Button
              variant="contained"
              color="error"
              onClick={() => setPaymentDialogOpen(true)}
            >
              Verify Payment
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Lab Configuration */}
      <TextField
        label="Lab Name"
        name="labName"
        value={settings.labname}
        onChange={handleChange}
        fullWidth
        sx={{ mb: 2 }}
        disabled={systemLocked}
      />

      <TextField
        label="Default Turnaround Time (hrs)"
        name="turnaroundTime"
        type="number"
        value={settings.turnaroundtime}
        onChange={handleChange}
        fullWidth
        sx={{ mb: 2 }}
        disabled={systemLocked}
      />

      <FormControlLabel
        control={
          <Checkbox
            name="enableNotifications"
            checked={settings.enablenotifications}
            onChange={handleChange}
            disabled={systemLocked}
          />
        }
        label="Enable Notifications"
        sx={{ mb: 2 }}
      />

      <Divider sx={{ my: 3 }} />

      {/* Additional System Settings */}
      <TextField
        label="Data Retention (days)"
        name="dataRetentionDays"
        type="number"
        value={settings.dataretentiondays}
        onChange={handleChange}
        fullWidth
        sx={{ mb: 2 }}
        disabled={systemLocked}
      />

      <TextField
        label="Default Report Format"
        name="defaultReportFormat"
        value={settings.defaultreportformat}
        onChange={handleChange}
        fullWidth
        sx={{ mb: 2 }}
        disabled={systemLocked}
      />

      <FormControlLabel
        control={
          <Checkbox
            name="maintenanceMode"
            checked={settings.maintenancemode}
            onChange={handleChange}
            disabled={systemLocked}
          />
        }
        label="Enable Maintenance Mode"
        sx={{ mb: 2 }}
      />

      {message && (
        <Typography
          variant="body2"
          color={message.includes("failed") || message.includes("Invalid") ? "error" : "success"}
          sx={{ mb: 2 }}
        >
          {message}
        </Typography>
      )}

      <Button
        variant="contained"
        color="primary"
        onClick={handleSave}
        disabled={saving || systemLocked}
      >
        {saving ? "Saving..." : systemLocked ? "System Locked" : "Save Settings"}
      </Button>

      {/* Payment Verification Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onClose={() => {
          if (!systemLocked) setPaymentDialogOpen(false);
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Verify Payment</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Your subscription requires payment. Please enter the payment verification code
            to unlock the system.
          </Alert>
          <TextField
            label="Payment Verification Code"
            type="password"
            value={paymentCode}
            onChange={(e) => setPaymentCode(e.target.value)}
            fullWidth
            placeholder="Enter the code provided by the system administrator"
            onKeyPress={(e) => {
              if (e.key === "Enter") handlePaymentVerification();
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setPaymentDialogOpen(false)}
            disabled={systemLocked}
          >
            Cancel
          </Button>
          <Button
            onClick={handlePaymentVerification}
            variant="contained"
            color="primary"
          >
            Verify
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SystemSettings;
