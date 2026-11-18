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

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" });
  };

  const requestMonth = (request) => {
    const dateValue = request.created_at;
    if (!dateValue) return null;
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date.getMonth() + 1;
  };

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

  const visitRows = useMemo(() => {
    const patientsById = new Map(patients.map((patient) => [patient.id, patient]));
    const rows = labRequests
      .filter(
        (request) =>
          selectedMonth === 0 || requestMonth(request) === selectedMonth
      )
      .map((request) => ({
        request,
        patient: request.patient || patientsById.get(request.patient_id) || null,
      }))
      .sort((a, b) => {
        const timeA = new Date(a.request.created_at || 0).getTime();
        const timeB = new Date(b.request.created_at || 0).getTime();
        return timeB - timeA;
      });

    if (selectedMonth === 0) {
      const patientsWithRequests = new Set(
        labRequests.map((request) => request.patient_id).filter(Boolean)
      );
      patients
        .filter((patient) => !patientsWithRequests.has(patient.id))
        .forEach((patient) => rows.push({ request: null, patient }));
    }

    return rows;
  }, [patients, labRequests, selectedMonth]);

  const tableRows = useMemo(() => {
    return visitRows.map(({ request, patient }) => {
      const deliveryKey = request?.id ?? patient?.id;
      return {
        id: patient?.id ?? request?.patient_id ?? "—",
        visitId: request?.id ?? "—",
        date: formatDateTime(request?.created_at),
        requests: requestCountsByPatient[patient?.id] || 0,
        firstName: patient?.first_name || "Unknown",
        lastName: patient?.last_name || "patient",
        gender: patient?.gender || "—",
        dob: formatDOB(patient?.dob),
        facility: patient?.facility || "—",
        funding: patient?.funding || "—",
        deliveryKey,
        delivered: deliveredStatus[deliveryKey] || "",
      };
    });
  }, [visitRows, requestCountsByPatient, deliveredStatus]);

  const exportToExcel = () => {
    const exportRows = tableRows.map((row) => ({
      id: row.id,
      visitId: row.visitId,
      date: row.date,
      requests: row.requests,
      firstName: row.firstName,
      lastName: row.lastName,
      gender: row.gender,
      dob: row.dob,
      facility: row.facility,
      funding: row.funding,
      delivered: row.delivered,
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportRows, {
      header: [
        "id",
        "visitId",
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
      "Visit ID",
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
      row.visitId,
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
    <Container maxWidth="xl" sx={{ mt: 0, mb: 4, width: "100%", maxWidth: "100%" }}>
      <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden", width: "100%" }}>
        {/* HEADER BAR */}
        <Toolbar sx={{ backgroundColor: "#f4f8f4", borderBottom: "1px solid", borderColor: "divider" }}>
          <Typography variant="h5" sx={{ fontWeight: 600 }}>
            Patient Monthly Records
          </Typography>
        </Toolbar>

        <Box sx={{ p: 2, display: "flex", flexWrap: "wrap", gap: 1, backgroundColor: "#fafcf9" }}>
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
            Showing patient visits from: <strong>{selectedMonth === 0 ? "All Months" : monthNames[selectedMonth - 1]}</strong>
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Total visits displayed: {visitRows.length}
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
                <TableCell sx={{ fontWeight: "bold", width: 50 }}>Patient ID</TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 80 }}>Visit ID</TableCell>
                <TableCell sx={{ fontWeight: "bold", width: 180 }}>Date &amp; Time</TableCell>
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
              {tableRows.map((row, index) => (
                <TableRow
                  key={`${row.visitId}-${row.id}`}
                  hover
                  sx={{ backgroundColor: index % 2 === 0 ? "#fafafa" : "white" }}
                >
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.visitId}</TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>{row.date}</TableCell>
                  <TableCell>{row.requests}</TableCell>
                  <TableCell>{row.firstName}</TableCell>
                  <TableCell>{row.lastName}</TableCell>
                  <TableCell>{row.gender}</TableCell>
                  <TableCell>{row.dob}</TableCell>
                  <TableCell>{row.facility}</TableCell>
                  <TableCell>{row.funding}</TableCell>
                  <TableCell>
                    <TextField
                      size="small"
                      value={row.delivered}
                      onChange={(e) => handleDeliveredChange(row.deliveryKey, e.target.value)}
                      placeholder="Delivered"
                      fullWidth
                    />
                  </TableCell>
                </TableRow>
              ))}
              {visitRows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
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
