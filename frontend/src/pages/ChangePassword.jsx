import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Box, Button, Paper, TextField, Typography } from "@mui/material";
import BiotechIcon from "@mui/icons-material/Biotech";

import { API_URL } from "../utils/api";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (newPassword.length < 12 || newPassword.length > 72) {
      setError("Choose a password between 12 and 72 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("The new passwords do not match.");
      return;
    }
    if (newPassword === currentPassword) {
      setError("Choose a password different from your temporary password.");
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/auth/change-password`,
        {
          current_password: currentPassword,
          new_password: newPassword,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const user = JSON.parse(localStorage.getItem("user") || "{}");
      localStorage.setItem(
        "user",
        JSON.stringify({ ...user, must_change_password: false })
      );
      navigate("/dashboard/lab", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.detail ||
          "Could not change your password. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box className="auth-page">
      <Paper className="auth-card" elevation={0}>
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 3 }}>
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 52,
              height: 52,
              mb: 1.5,
              borderRadius: 2.5,
              color: "primary.main",
              bgcolor: "primary.light",
            }}
          >
            <BiotechIcon fontSize="large" />
          </Box>
          <Typography variant="h5" textAlign="center">
            Set a new password
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1 }}>
            Change your temporary password to continue.
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            required
            autoComplete="current-password"
            label="Temporary password"
            type="password"
            margin="normal"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
          <TextField
            fullWidth
            required
            autoComplete="new-password"
            label="New password"
            type="password"
            margin="normal"
            inputProps={{ minLength: 12, maxLength: 72 }}
            helperText="Use 12 to 72 characters."
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <TextField
            fullWidth
            required
            autoComplete="new-password"
            label="Confirm new password"
            type="password"
            margin="normal"
            inputProps={{ minLength: 12, maxLength: 72 }}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          {error && (
            <Typography role="alert" color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={saving || !currentPassword || !newPassword || !confirmPassword}
            sx={{ mt: 2 }}
          >
            {saving ? "Updating..." : "Change password"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
