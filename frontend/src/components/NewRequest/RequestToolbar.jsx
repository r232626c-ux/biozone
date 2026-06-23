// src/components/NewRequest/RequestToolbar.jsx
import React from "react";
import {
  Box,
  Button,
  IconButton,
  Tooltip,
  TextField,
} from "@mui/material";

import NoteAddIcon from "@mui/icons-material/NoteAdd";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import SaveIcon from "@mui/icons-material/Save";
import SearchIcon from "@mui/icons-material/Search";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import VerifiedIcon from "@mui/icons-material/Verified";
import EditIcon from "@mui/icons-material/Edit";

const RequestToolbar = ({
  onNewRequest,
  onNewPatient,
  onSave,
  onSearch,
  onUpdate,
  onDrop,
  onVerify,
  saving,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button startIcon={<NoteAddIcon />} variant="contained" onClick={onNewRequest}>
          New Request
        </Button>

        <Button startIcon={<PersonAddIcon />} variant="contained" color="secondary" onClick={onNewPatient}>
          New Patient
        </Button>

        <Button
          startIcon={<SaveIcon />}
          variant="outlined"
          color="success"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </Button>

        <Button
          startIcon={<EditIcon />}
          variant="outlined"
          color="info"
          onClick={onUpdate}
        >
          Update Patient
        </Button>

        <Button
          startIcon={<RestartAltIcon />}
          variant="outlined"
          color="error"
          onClick={onDrop}
        >
          Drop
        </Button>
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          size="small"
          placeholder="Search patient name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ minWidth: 240 }}
        />

        <Button startIcon={<SearchIcon />} variant="outlined" onClick={onSearch}>
          Search
        </Button>
      </Box>

      <Tooltip title="Verify request">
        <IconButton color="primary" onClick={onVerify}>
          <VerifiedIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default RequestToolbar;
