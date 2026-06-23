import { useState } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import PasswordReset from "./PasswordReset";
import { API_URL } from "../utils/api";

export default function Login() {
  // ======================
  // STATE
  // ======================
  const [isSignup, setIsSignup] = useState(false);
  const [showReset, setShowReset] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");

  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  // ======================
  // LOGIN
  // ======================
  const handleLogin = async () => {
    try {
      setMessage("");

      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const { data } = await axios.post(`${API_URL}/token`, formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!data.access_token) {
        setMessage("Authentication failed");
        return;
      }

      // Persist token and user info
      localStorage.setItem("token", data.access_token);
      const user = { username: data.username, role: data.role };
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", data.role || "");

      // Role-based navigation
      navigate("/dashboard/lab");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMessage(
        Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : detail?.msg || "Invalid username or password"
      );
    }
  };

  // ======================
  // SIGNUP
  // ======================
  const handleSignup = async () => {
    try {
      setMessage("");

      await axios.post(`${API_URL}/users/`, {
        username,
        password,
        email,
        role,
      });

      setMessage("Signup successful. Please login.");
      setIsSignup(false);

      setUsername("");
      setPassword("");
      setEmail("");
      setRole("user");
    } catch (err) {
      const detail = err.response?.data?.detail;
      setMessage(
        Array.isArray(detail)
          ? detail.map((d) => d.msg).join(", ")
          : detail?.msg || "Signup failed"
      );
    }
  };

  const handleSubmit = () => {
    isSignup ? handleSignup() : handleLogin();
  };

  // ======================
  // CONDITIONAL VIEWS
  // ======================
  if (showReset) return <PasswordReset onBack={() => setShowReset(false)} />;

  // ======================
  // UI
  // ======================
  return (
    <Container maxWidth="sm" sx={{ mt: 10, m: 38 }}>
      <Paper sx={{ p: 4, boxShadow: 3 }}>
        <Typography variant="h5" textAlign="center" gutterBottom>
          {isSignup ? "Sign Up" : "Login"}
        </Typography>

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

        {isSignup && (
          <>
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
              <MenuItem value="Admin">Admin</MenuItem>
            </TextField>
          </>
        )}

        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleSubmit}>
          {isSignup ? "Sign Up" : "Login"}
        </Button>

        {!isSignup && (
          <Typography textAlign="center" sx={{ mt: 1 }}>
            <Button size="small" onClick={() => setShowReset(true)}>
              Forgot Password?
            </Button>
          </Typography>
        )}

        <Typography textAlign="center" sx={{ mt: 2 }}>
          {isSignup ? "Already have an account?" : "Don't have an account?"}
          <Button onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Login" : "Sign Up"}
          </Button>
        </Typography>

        {message && (
          <Typography color="error" textAlign="center" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
      </Paper>
    </Container>
  );
}
