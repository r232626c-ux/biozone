import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Divider,
  Button,
  CircularProgress,
} from "@mui/material";

const LabDashboard = () => {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [showIframe, setShowIframe] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowIframe(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  return (
    <Box
      sx={{
        p: 2,
        m: -8,
        minHeight: "100vh",
        maxWidth: 1200,
        backgroundColor: "#f9f9f9",
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 1,
        }}
      >
        <Typography
          variant="h3"
          sx={{ fontWeight: "bold", color: "#080808" }}
        >
          OneDrive Access
        </Typography>

        <Button
          variant="outlined"
          color="error"
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>

      <Divider sx={{ mb: 3, borderColor: "#070707" }} />

      {/* OneDrive Access */}
      <Box
        sx={{
          width: "100%",
          height: "80vh",
          boxShadow: "0px 3px 10px rgba(0,0,0,0.2)",
          borderRadius: 2,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          position: "relative",
          backgroundColor: "#ffffff",
        }}
      >
        {!iframeLoaded && showIframe && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              transform: "translateY(-50%)",
              textAlign: "center",
            }}
          >
            <CircularProgress />
            <Typography sx={{ mt: 2 }}>
              Loading OneDrive...
            </Typography>
          </Box>
        )}

        {showIframe ? (
          <iframe
            src="https://www.microsoft.com/en/microsoft-365/onedrive/online-cloud-storage?market=af"
            title="Microsoft OneDrive"
            width="100%"
            height="100%"
            style={{ border: "none" }}
            loading="lazy"
            onLoad={() => setIframeLoaded(true)}
          />
        ) : (
          <Button
            variant="contained"
            size="large"
            href="https://www.microsoft.com/en/microsoft-365/onedrive/online-cloud-storage?market=af"
          >
            Open OneDrive
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default LabDashboard;
