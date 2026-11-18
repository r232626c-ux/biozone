import React from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import CloudQueueIcon from "@mui/icons-material/CloudQueue";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

const OneDriveAccess = () => (
  <Card
    variant="outlined"
    sx={{ borderColor: "#d6e5f5", borderRadius: 2, bgcolor: "#f8fbff" }}
  >
    <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        alignItems={{ xs: "flex-start", sm: "center" }}
      >
        <Box
          sx={{
            width: 52,
            height: 52,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: "#e7f0fd",
            color: "#1a56c4",
            flexShrink: 0,
          }}
        >
          <CloudQueueIcon sx={{ fontSize: 32 }} />
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Microsoft OneDrive
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Open your OneDrive files and folders using your Microsoft work account.
            Microsoft does not allow its authenticated OneDrive app to be embedded
            inside another website.
          </Typography>
        </Box>
        <Button
          component="a"
          href="https://www.office.com/launch/onedrive"
          target="_blank"
          rel="noopener noreferrer"
          variant="contained"
          endIcon={<OpenInNewIcon />}
          sx={{
            flexShrink: 0,
            bgcolor: "#1a56c4",
            "&:hover": { bgcolor: "#1649a6" },
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Open OneDrive
        </Button>
      </Stack>
    </CardContent>
  </Card>
);

export default OneDriveAccess;
