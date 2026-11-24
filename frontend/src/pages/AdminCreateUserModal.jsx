import { useState, useEffect } from "react";
import {
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Alert,
  Typography,
} from "@mui/material";
import axios from "axios";

import { API_URL } from "../utils/api";

const getRoleValue = (role) => {
  const normalized = String(role || "").trim().toLowerCase().replace(/[\s_-]/g, "");
  if (["user", "receptionist", "reception"].includes(normalized)) return "reception";
  if (
    ["labtech", "labtechnician", "labscientist", "medicallabscientist", "medicallaboratoryscientist", "mls"].includes(normalized)
  ) {
    return "medical_laboratory_scientist";
  }
  return normalized || "reception";
};

export default function AdminCreateUserModal({ onClose, editingUser }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("reception");

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState("success");
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  // Prefill fields if editing
  useEffect(() => {
    if (editingUser) {
      setUsername(editingUser.username);
      setEmail(editingUser.email);
      setRole(getRoleValue(editingUser.role));
      setPassword(""); // Password is optional on edit
    } else {
      setUsername("");
      setEmail("");
      setRole("reception");
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
        setRole("reception");
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
      <DialogTitle sx={{ color: "#0b6f2e", fontWeight: 700 }}>
        {editingUser ? "Edit user account" : "Add user account"}
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: "#dde6de" }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {editingUser
            ? "Update this person's account details. Leave the password blank to keep it unchanged."
            : "Create an individual account and assign the appropriate role."}
        </Typography>

        {message && (
          <Alert severity={messageType} sx={{ mb: 2 }}>
            {message}
          </Alert>
        )}

        <TextField
          label="Username"
          fullWidth
          margin="dense"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <TextField
          label="Password"
          type="password"
          fullWidth
          margin="dense"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          helperText={editingUser ? "Leave blank to keep current password" : ""}
        />

        <TextField
          label="Email"
          fullWidth
          margin="dense"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          select
          label="Role"
          fullWidth
          margin="dense"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <MenuItem value="reception">Reception</MenuItem>
          <MenuItem value="doctor">Doctor</MenuItem>
          <MenuItem value="medical_laboratory_scientist">Medical Laboratory Scientist</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
        </TextField>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}>Close</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={submitting}
          sx={{
            bgcolor: "#0f8a3a",
            "&:hover": { bgcolor: "#0b6f2e" },
            textTransform: "none",
            fontWeight: 600,
          }}
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
