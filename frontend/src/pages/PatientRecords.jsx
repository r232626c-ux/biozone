import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Toolbar,
  TextField,
} from "@mui/material";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

import { API_URL } from "../utils/api";

export default function PatientRecords() {
  const [patients, setPatients] = useState([]);
  const [labRequests, setLabRequests] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(0);
  const [deliveredStatus, setDeliveredStatus] = useState({});
  const [userRole, setUserRole] = useState(null);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  useEffect(() => {
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    // Get user role from localStorage
    const role = localStorage.getItem("role");
    if (role) {
      setUserRole(role.toLowerCase());
    }

    axios
      .get(`${API_URL}/patients/`, { headers })
      .then((res) => {
        const sortedPatients = [...res.data].sort((a, b) => (a.id || 0) - (b.id || 0));
        setPatients(sortedPatients);
      })
      .catch((err) => {
        console.error(err);
        alert("❌ Could not load patient records");
      });

    axios
      .get(`${API_URL}/lab-requests/`, { headers })
      .then((res) => {
        const sortedRequests = [...res.data].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        setLabRequests(sortedRequests);
      })
      .catch((err) => {
        console.error(err);
        alert("❌ Could not load lab request records");
      });
  }, []);

  const getCurrentDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Function to format DOB without time
  const formatDOB = (dob) => {
    if (!dob) return "-";
    return dob.split("T")[0]; // Remove time if ISO string
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toISOString().split("T")[0];
  };

  const requestMonth = (request) => {
    const dateValue = request.sample_date || request.created_at;
    if (!dateValue) return null;
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date.getMonth() + 1;
  };

  const patientRecordedDates = useMemo(() => {
    const dates = {};
    labRequests.forEach((request) => {
      const patientId = request.patient_id;
      if (!patientId) return;
      const dateValue = request.sample_date || request.created_at;
      if (!dateValue) return;
      const requestDate = new Date(dateValue);
      if (Number.isNaN(requestDate.getTime())) return;
      const month = requestDate.getMonth() + 1;
      if (selectedMonth !== 0 && month !== selectedMonth) return;
      if (!dates[patientId] || requestDate > dates[patientId]) {
        dates[patientId] = requestDate;
      }
    });
    return dates;
  }, [labRequests, selectedMonth]);

  const monthlyRequestCounts = useMemo(() => {
    const counts = Array(12).fill(0);
    labRequests.forEach((request) => {
      const month = requestMonth(request);
      if (month) counts[month - 1] += 1;
    });
    return counts;
  }, [labRequests]);

  const requestCountsByPatient = useMemo(() => {
    const counts = {};
    labRequests.forEach((request) => {
      if (!request.patient_id) return;
      counts[request.patient_id] = (counts[request.patient_id] || 0) + 1;
    });
    return counts;
  }, [labRequests]);

  const filteredPatients = useMemo(() => {
    const filteredRequestIds = new Set(
      labRequests
        .filter((request) => selectedMonth === 0 || requestMonth(request) === selectedMonth)
        .map((request) => request.patient_id)
    );

    const matchingPatients = selectedMonth === 0 && labRequests.length === 0
      ? patients
      : patients.filter((patient) => filteredRequestIds.has(patient.id));

    return matchingPatients.sort((a, b) => {
      const dateA = patientRecordedDates[a.id]?.getTime() ?? Number.MAX_SAFE_INTEGER;
      const dateB = patientRecordedDates[b.id]?.getTime() ?? Number.MAX_SAFE_INTEGER;
      if (dateA !== dateB) return dateA - dateB;
      return (a.id || 0) - (b.id || 0);
    });
  }, [patients, labRequests, selectedMonth, patientRecordedDates]);

  const tableRows = useMemo(() => {
    return filteredPatients.map((patient) => ({
      id: patient.id,
      date: formatDate(patientRecordedDates[patient.id]),
      requests: requestCountsByPatient[patient.id] || 0,
      firstName: patient.first_name,
      lastName: patient.last_name,
      gender: patient.gender,
      dob: formatDOB(patient.dob),
      facility: patient.facility,
      funding: patient.funding,
      delivered: deliveredStatus[patient.id] || "",
    }));
  }, [filteredPatients, patientRecordedDates, requestCountsByPatient, deliveredStatus]);

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(tableRows, {
      header: [
        "id",
        "date",
        "requests",
        "firstName",
        "lastName",
        "gender",
        "dob",
        "facility",
        "funding",
        "delivered",
      ],
    });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PatientRecords");
    const filename = `patient-records-${getCurrentDate()}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const exportToPdf = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const headers = [
      "ID",
      "Date",
      "Requests",
      "First Name",
      "Last Name",
      "Gender",
      "Date of Birth",
      "Facility",
      "Funding",
      "Delivered",
    ];
    const data = tableRows.map((row) => [
      row.id,
      row.date,
      row.requests,
      row.firstName,
      row.lastName,
      row.gender,
      row.dob,
      row.facility,
      row.funding,
      row.delivered,
    ]);
    doc.text("Patient Records", 14, 15);
    doc.autoTable({
      head: [headers],
      body: data,
      startY: 22,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [33, 150, 243] },
      alternateRowStyles: { fillColor: [240, 240, 240] },
      margin: { left: 10, right: 10 },
    });
    doc.save(`patient-records-${getCurrentDate()}.pdf`);
  };

  const handleDeliveredChange = (patientId, value) => {
    setDeliveredStatus((prev) => ({ ...prev, [patientId]: value }));
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 5, m: -5, width: "100%", maxWidth: "100%" }}>
      <Paper elevation={4} sx={{ borderRadius: 10, overflow: "hidden", width: "100%" }}>
        {/* HEADER BAR */}
        <Toolbar sx={{ backgroundColor: "#e3f2fd", borderBottom: "1px solid #ddd" }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Patient Monthly Records
          </Typography>
        </Toolbar>

        <Box sx={{ p: 2, display: "flex", flexWrap: "wrap", gap: 1, backgroundColor: "#f9fbfd" }}>
          <Button
            size="small"
            variant={selectedMonth === 0 ? "contained" : "outlined"}
            color={selectedMonth === 0 ? "primary" : "inherit"}
            onClick={() => setSelectedMonth(0)}
          >
            All Months ({labRequests.length})
          </Button>
          {monthNames.map((month, index) => (
            <Button
              key={month}
              size="small"
              variant={selectedMonth === index + 1 ? "contained" : "outlined"}
              color={selectedMonth === index + 1 ? "primary" : "inherit"}
              onClick={() => setSelectedMonth(index + 1)}
            >
              {month} ({monthlyRequestCounts[index]})
            </Button>
          ))}
        </Box>

        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Showing patients linked to: <strong>{selectedMonth === 0 ? "All Months" : monthNames[selectedMonth - 1]}</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Total patients displayed: {filteredPatients.length}
          </Typography>
          {userRole && (userRole === "admin" || userRole === "super admin") ? (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
              <Button size="small" variant="contained" color="primary" onClick={exportToExcel}>
                Download Excel
              </Button>
              <Button size="small" variant="contained" color="secondary" onClick={exportToPdf}>
                Download PDF
              </Button>
            </Box>
          ) : (
            <Typography variant="body2" color="error" sx={{ mb: 1 }}>
              📌 Only admins can download patient records
            </Typography>
          )}
        </Box>

        <TableContainer sx={{ maxHeight: "70vh" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", width: 50 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 110 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 90 }}>Requests</TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 120 }}>First Name</TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 120 }}>Last Name</TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 80 }}>Gender</TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 110 }}>Date of Birth</TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 120 }}>Facility</TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 160 }}>Funding</TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 140 }}>Delivered</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredPatients.map((patient, index) => (
                <TableRow
                  key={patient.id}
                  hover
                  sx={{ backgroundColor: index % 2 === 0 ? "#fafafa" : "white" }}
                >
                  <TableCell>{patient.id}</TableCell>
                  <TableCell>{formatDate(patientRecordedDates[patient.id])}</TableCell>
                  <TableCell>{requestCountsByPatient[patient.id] || 0}</TableCell>
                  <TableCell>{patient.first_name}</TableCell>
                  <TableCell>{patient.last_name}</TableCell>
                  <TableCell>{patient.gender}</TableCell>
                  <TableCell>{formatDOB(patient.dob)}</TableCell>
                  <TableCell>{patient.facility}</TableCell>
                  <TableCell>{patient.funding}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={deliveredStatus[patient.id] || ""}
                      onChange={(e) => handleDeliveredChange(patient.id, e.target.value)}
                      placeholder="Delivered"
                      fullWidth
                    />
                  </TableCell>
                </TableRow>
              ))}
              {filteredPatients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                    No patient records found for {selectedMonth === 0 ? "All Months" : monthNames[selectedMonth - 1]}.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
