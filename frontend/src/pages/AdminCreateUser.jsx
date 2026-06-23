// src/pages/AdminCreateUser.jsx
import { useEffect, useState } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  CircularProgress,
  Box,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { API_URL } from "../utils/api";

export default function AdminCreateUser() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  const [loading, setLoading] = useState(true);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");

  const navigate = useNavigate();

  // ================================
  // VERIFY ADMIN ACCESS
  // ================================
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const checkAdmin = async () => {
      try {
        const res = await axios.get(`${API_URL}/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data || res.data.role.toLowerCase() !== "admin") {
          navigate("/dashboard");
          return;
        }

        setCheckingAdmin(false);
      } catch (err) {
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };

    checkAdmin();
  }, [navigate]);

  // ================================
  // CREATE USER
  // ================================
  const handleCreateUser = async () => {
    setMessage("");
    if (!username || !password || !email) {
      setMessageType("error");
      setMessage("All fields are required.");
      return;
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/admin/create-user`,
        { username, password, email, role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessageType("success");
      setMessage(`User '${username}' created successfully!`);
      setUsername("");
      setPassword("");
      setEmail("");
      setRole("user");
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

  // ================================
  // LOADING SCREEN
  // ================================
  if (loading || checkingAdmin) {
    return (
      <Container maxWidth="sm" sx={{ mt: 10, textAlign: "center" }}>
        <CircularProgress size={60} />
        <Typography sx={{ mt: 2 }}>Verifying Admin Access...</Typography>
      </Container>
    );
  }

  // ================================
  // MAIN FORM
  // ================================
  return (
    <Container maxWidth="sm" sx={{ mt: 10, m: 38 }}>
      <Paper sx={{ p: 4, boxShadow: 3 }}>
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

        <Button
          variant="contained"
          fullWidth
          sx={{ mt: 3, py: 1.5 }}
          onClick={handleCreateUser}
          disabled={submitting}
        >
          {submitting ? "Creating..." : "Create User"}
        </Button>

        <Box sx={{ mt: 3, textAlign: "center" }}>
          <Button variant="text" onClick={() => navigate("/dashboard/admin")}>
            Back to Login
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
