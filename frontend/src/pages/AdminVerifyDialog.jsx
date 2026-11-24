import { useState } from "react";
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Alert,
  Paper,
  Container,
  Typography,
} from "@mui/material";
import axios from "axios";

import { API_URL } from "../utils/api";

export default function AdminCreateUserModal({ onClose }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("reception");

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("success");
  const [submitting, setSubmitting] = useState(false);

  const handleCreateUser = async () => {
    setMessage(null);

    if (!username || !password || !email) {
      setMessageType("error");
      setMessage("All fields are required.");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");

      await axios.post(
        `${API_URL}/admin/create-user`,
        { username, password, email, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessageType("success");
      setMessage(`User '${username}' created successfully`);

      setUsername("");
      setPassword("");
      setEmail("");
      setRole("reception");
    } catch (err) {
      let detail = err.response?.data?.detail;
      if (Array.isArray(detail)) detail = detail.map(d => d.msg).join(", ");
      else if (typeof detail === "object") detail = detail?.msg;

      setMessageType("error");
      setMessage(detail || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <DialogTitle disableTypography />

      <DialogContent>
        <Container maxWidth="sm" sx={{ mt: 2, m: 8 }}>
          <Paper elevation={3} sx={{ p: 4 }}>
            {/* HEADER */}
            <Typography variant="h5" gutterBottom textAlign="center">
              Admin – Create New User
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 3 }}
            >
              Only administrators can add new accounts.
              Ensure user details are correct before submission.
            </Typography>

            {/* FEEDBACK */}
            {message && (
              <Alert severity={messageType} sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}

            {/* FORM */}
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />

            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <TextField
              label="Email"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              select
              label="Role"
              fullWidth
              margin="normal"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <MenuItem value="reception">Reception</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="medical_laboratory_scientist">Medical Laboratory Scientist</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Paper>
        </Container>
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 3 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={handleCreateUser}
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create User"}
        </Button>
      </DialogActions>
    </>
  );
}
