import { useState, useEffect } from "react";
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

export default function AdminCreateUserModal({ onClose, editingUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("success");
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  // Prefill fields if editing
  useEffect(() => {
    if (editingUser) {
      setUsername(editingUser.username);
      setEmail(editingUser.email);
      setRole(editingUser.role);
      setPassword(""); // Password is optional on edit
    } else {
      setUsername("");
      setEmail("");
      setRole("user");
      setPassword("");
    }
    setMessage(null);
  }, [editingUser]);

  const handleSubmit = async () => {
    setMessage(null);

    if (!username || !email || (!editingUser && !password)) {
      setMessageType("error");
      setMessage("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);

    try {
      if (editingUser) {
        // Edit user (PUT)
        await axios.put(
          `${API_URL}/admin/users/${editingUser.id}`,
          { username, email, role, password: password || undefined },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessageType("success");
        setMessage(`User '${username}' updated successfully`);
      } else {
        // Add user (POST)
        await axios.post(
          `${API_URL}/admin/create-user`,
          { username, email, role, password },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setMessageType("success");
        setMessage(`User '${username}' created successfully`);
        setUsername("");
        setEmail("");
        setRole("user");
        setPassword("");
      }

      // Close modal after 1s
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      let detail = err.response?.data?.detail;
      if (Array.isArray(detail)) detail = detail.map(d => d.msg).join(", ");
      else if (typeof detail === "object") detail = detail?.msg;

      setMessageType("error");
      setMessage(detail || "Operation failed.");
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
            <Typography variant="h5" gutterBottom textAlign="center">
              {editingUser ? "Edit User" : "Admin – Create New User"}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              textAlign="center"
              sx={{ mb: 3 }}
            >
              {editingUser
                ? "Modify user details below. Leave password blank to keep the current password."
                : "Only administrators can add new accounts. Ensure details are correct before submission."}
            </Typography>

            {message && (
              <Alert severity={messageType} sx={{ mb: 2 }}>
                {message}
              </Alert>
            )}

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
              helperText={editingUser ? "Leave blank to keep current password" : ""}
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
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="labtech">Lab Technician</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </Paper>
        </Container>
      </DialogContent>

      <DialogActions sx={{ px: 4, pb: 3 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting
            ? editingUser
              ? "Updating..."
              : "Creating..."
            : editingUser
            ? "Update User"
            : "Create User"}
        </Button>
      </DialogActions>
    </>
  );
}
