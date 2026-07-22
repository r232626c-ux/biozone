// Centralized API Configuration
// Determines the API URL based on environment

const getApiUrl = () => {
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl && typeof envApiUrl === "string") {
    return envApiUrl.replace(/\/$/, "");
  }

  // In development, use the current host with port 8000 for backend
  if (import.meta.env.DEV) {
    const host = window.location.hostname;
    const port = 8000;
    return `http://${host}:${port}`;
  }

  // In production, use the current origin
  return window.location.origin;
};

export const API_URL = getApiUrl();

console.log('🔌 API URL:', API_URL);

// Create axios instance with default configuration
import axios from "axios";

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
