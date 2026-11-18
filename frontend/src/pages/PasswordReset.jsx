import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import axios from "axios";

import { API_URL } from "../utils/api";

export default function PasswordReset({ onBack }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleReset = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // 🔒 Backend endpoint (adjust when ready)
      await axios.post(`${API_URL}/auth/password-reset/`, {
        email,
      });

      setSuccess(
        "If an account exists for this email, a password reset link has been sent."
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to process password reset. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box className="auth-page">
      <Paper className="auth-card" elevation={0}>
        <Typography variant="h5" textAlign="center">
          Password Reset
        </Typography>

        <Typography
          variant="body2"
          textAlign="center"
          sx={{ mt: 1, mb: 3 }}
        >
          Enter your registered email address. A reset link will be sent if the
          account exists.
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <TextField
          fullWidth
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          margin="normal"
        />

        <Button
          fullWidth
          variant="contained"
          sx={{ mt: 2 }}
          onClick={handleReset}
          disabled={loading || !email}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Button variant="text" onClick={onBack}>
            Back to Login
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
