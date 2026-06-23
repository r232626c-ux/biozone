// src/components/NewRequest/DoctorsTab.jsx
import React, { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  ListItemText,
} from "@mui/material";

const DoctorsTab = ({ selectedDoctor, setSelectedDoctor, doctorsList }) => {
  return (
    <Paper sx={{ p: 2, borderRadius: 2 }}>
      <Typography variant="h6" mb={2}>
        Assign Doctor
      </Typography>

      {doctorsList.length === 0 ? (
        <Typography>No doctors available. Please add doctors in the system.</Typography>
      ) : (
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="doctor-label">Doctor</InputLabel>
              <Select
                labelId="doctor-label"
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
              >
                {doctorsList.map((doc) => (
                  <MenuItem key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialty})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      )}
    </Paper>
  );
};

export default DoctorsTab;
