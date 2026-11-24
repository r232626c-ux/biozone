import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
} from "@mui/material";
import BiotechIcon from "@mui/icons-material/Biotech";
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
  const [role, setRole] = useState("reception");

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
      const user = {
        username: data.username,
        role: data.role,
        must_change_password: data.must_change_password === true,
      };
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", data.role || "");

      navigate(user.must_change_password ? "/change-password" : "/dashboard/lab");
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
      setRole("reception");
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
            BIOZONE LIMS
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 0.75 }}>
            Laboratory information and quality management
          </Typography>
        </Box>

        <Typography variant="h6" textAlign="left" sx={{ mb: 1 }}>
          {isSignup ? "Create your account" : "Sign in"}
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
              <MenuItem value="reception">Reception</MenuItem>
              <MenuItem value="doctor">Doctor</MenuItem>
              <MenuItem value="medical_laboratory_scientist">Medical Laboratory Scientist</MenuItem>
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

        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", mt: 2, gap: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            {isSignup ? "Already have an account?" : "Don't have an account?"}
          </Typography>
          <Button onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Login" : "Sign Up"}
          </Button>
        </Box>

        {message && (
          <Typography color="error" textAlign="center" sx={{ mt: 2 }}>
            {message}
          </Typography>
        )}
      </Paper>
    </Box>
  );
}
