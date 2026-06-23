
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  TextField,
  Chip,
  Stack,
  Button,
  Container,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Toolbar,
  Collapse,
  Modal,
  CircularProgress,
  IconButton,
} from "@mui/material";
import { ExpandMore, ExpandLess } from "@mui/icons-material";
import ViewResults from "../components/NewRequest/ViewResults";

import { API_URL } from "../utils/api";

const LabRequestsPage = () => {
  const [tab, setTab] = useState(0);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [labResultsCache, setLabResultsCache] = useState({});
  const [loading, setLoading] = useState({});

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const role = parsedUser?.role || localStorage.getItem("role") || "";
  const normalizedRole = String(role).trim().toLowerCase().replace(/[\s_-]/g, "");

  /* ================= FETCH LAB REQUESTS ================= */
  useEffect(() => {
    axios
      .get(`${API_URL}/lab-requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setRequests(res.data))
      .catch((err) => console.error("Failed to load lab requests", err));
  }, [token]);

  /* ================= FETCH LAB RESULTS FOR SPECIFIC REQUEST ================= */
  const fetchLabResults = async (requestId) => {
    if (labResultsCache[requestId]) {
      return labResultsCache[requestId];
    }

    setLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      const res = await axios.get(
        `${API_URL}/lab-requests/${requestId}/results/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const results = Array.isArray(res.data) ? res.data : [];
      setLabResultsCache((prev) => ({ ...prev, [requestId]: results }));
      return results;
    } catch (err) {
      console.error(`Failed to load lab results for request ${requestId}`, err);
      return [];
    } finally {
      setLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const normalizeLabResult = (lr) => ({
    id: lr.id ?? lr.lab_test_id ?? lr.test_name ?? `${lr.test_name}-${Math.random()}`,
    test_name: lr.test_name ?? lr.name ?? "Unknown Test",
    results: lr.results ?? lr.test_result ?? lr.result ?? "",
    unit: lr.unit ?? lr.test_unit ?? "",
    ref_range: lr.ref_range ?? lr.refRange ?? "",
    flag: lr.flag ?? "",
    comment: lr.comment ?? "",
    category: lr.category ?? lr.lab_test?.category ?? "Other",
  });

  const groupTestsByCategory = (tests) =>
    tests
      .map(normalizeLabResult)
      .reduce((groups, lr) => {
        const category = lr.category || "Other";
        if (!groups[category]) groups[category] = [];
        groups[category].push(lr);
        return groups;
      }, {});

  const getRequestTests = (req) => {
    if (!req) return [];
    const cached = labResultsCache[req.id];
    if (Array.isArray(cached) && cached.length > 0) return cached;

    if (Array.isArray(req.lab_results) && req.lab_results.length > 0) return req.lab_results;
    if (Array.isArray(req.labresult_set) && req.labresult_set.length > 0) return req.labresult_set;
    return [];
  };

  const handleToggleRow = (req) => {
    const nextExpanded = expandedRow === req.id ? null : req.id;
    if (nextExpanded === req.id && !labResultsCache[req.id]) {
      fetchLabResults(req.id);
    }
    setExpandedRow(nextExpanded);
  };

  const handleEditRequest = async (req) => {
    const patientData = {
      lastName: req.patient?.last_name ?? "",
      firstName: req.patient?.first_name ?? "",
      dob: req.patient?.dob ?? "",
      gender: req.patient?.gender ?? "",
      phone: req.patient?.phone ?? "",
      email: req.patient?.email ?? "",
      address: req.patient?.address ?? "",
      funding: req.patient?.funding ?? "CASH (ZWL)",
      memberNumber: req.patient?.member_number ?? "",
      memberSuffix: req.patient?.member_suffix ?? "",
      relationship: req.patient?.relationship ?? "Self",
      principal: req.patient?.principal ?? true,
      facility: req.patient?.facility ?? "",
      doctorName: req.patient?.doctor_name ?? "",
      ahFoz: req.patient?.ah_foz ?? "",
      clinicalData: req.patient?.clinical_data ?? "",
    };

    let requestTests = getRequestTests(req);
    if (requestTests.length === 0) {
      requestTests = await fetchLabResults(req.id);
    }

    const selectedTestsForEdit = requestTests.map((lr) => {
      const row = normalizeLabResult(lr);
      const labTestId = lr.lab_test_id ?? lr.labTestId ?? row.lab_test_id ?? row.id;
      return {
        id: Number(labTestId) || row.id,
        name: row.test_name,
        category: row.category || "Other",
        result: row.results || "",
        unit: row.unit || "",
        refRange: row.ref_range || "",
        flag: row.flag || "",
        comment: row.comment || "",
      };
    });

    localStorage.setItem("newRequest_patient", JSON.stringify(patientData));
    localStorage.setItem("newRequest_selectedTests", JSON.stringify(selectedTestsForEdit));
    localStorage.setItem("newRequest_requestId", JSON.stringify(req.id));
    localStorage.setItem("newRequest_patientId", JSON.stringify(req.patient?.id ?? null));
    localStorage.setItem("newRequest_selectedRequest", JSON.stringify({ id: req.id, patient_id: req.patient?.id ?? null }));
    localStorage.setItem("newRequest_sampleDate", JSON.stringify(req.sample_date ?? ""));

    navigate("/dashboard/new-request");
  };

  /* ================= SEARCH ================= */
  const filteredRequests = useMemo(() => {
    const term = search.toLowerCase();
    return requests.filter((r) => {
      const patientName = `${r.patient?.first_name ?? ""} ${r.patient?.last_name ?? ""}`.toLowerCase();
      const idMatch = String(r.id).includes(term);
      return patientName.includes(term) || idMatch;
    });
  }, [requests, search]);

  const requestCounts = useMemo(() => {
    let totalTests = 0;
    let recordedTests = 0;

    filteredRequests.forEach((req) => {
      const requestTests = getRequestTests(req);
      totalTests += requestTests.length;
      recordedTests += requestTests.filter((r) => r.results || r.test_result || r.result).length;
    });

    return { totalTests, recordedTests };
  }, [filteredRequests, labResultsCache]);

  /* ================= STATUS TABS ================= */
  const allRequests = filteredRequests;
  const pending = filteredRequests.filter((r) => r.status === "Pending");
  const partial = filteredRequests.filter((r) => r.status === "Partially Completed");
  const completed = filteredRequests.filter((r) => r.status === "Completed");
  const tabData = [allRequests, pending, partial, completed];

  const statusColor = (status) => {
    if (status === "Completed") return "success";
    if (status === "Partially Completed") return "warning";
    return "error";
  };

  /* ================= MODAL HANDLERS ================= */
  const openModal = async (request) => {
    setSelectedRequest(request);
    const requestTests = getRequestTests(request);
    if (requestTests.length > 0 && !labResultsCache[request.id]) {
      setLabResultsCache((prev) => ({
        ...prev,
        [request.id]: requestTests.map(normalizeLabResult),
      }));
    } else {
      await fetchLabResults(request.id);
    }
    setModalOpen(true);
  };
  const closeModal = () => {
    setSelectedRequest(null);
    setModalOpen(false);
  };

  /* ================= UI ================= */
  return (
    <Container maxWidth="lg" sx={{ mt: 2, p: 2, m: -10 }}>
      <Paper elevation={4} sx={{ borderRadius: 3 }}>
        {/* HEADER */}
        <Toolbar sx={{ borderBottom: "1px solid #ddd" }}>
          <Typography variant="h5" fontWeight={600}>
            Lab Requests
          </Typography>
        </Toolbar>

        {/* TABS */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
          <Tab label={`All (${allRequests.length})`} />
          <Tab label={`Pending (${pending.length})`} />
          <Tab label={`Partially Completed (${partial.length})`} />
          <Tab label={`Completed (${completed.length})`} />
        </Tabs>

        {/* SEARCH */}
        <Box sx={{ p: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search patient, test, or request ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, p: 1 }}>
          <Chip label={`Displayed requests: ${filteredRequests.length}`} color="primary" size="small" />
          <Chip label={`Total tests: ${requestCounts.totalTests}`} variant="outlined" size="small" />
          <Chip label={`Recorded results: ${requestCounts.recordedTests}`} variant="outlined" size="small" />
        </Box>

        {/* TABLE */}
        <TableContainer sx={{ maxHeight: "70vh" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell><b>ID</b></TableCell>
                <TableCell><b>Patient</b></TableCell>
                <TableCell><b>Request Date</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Total Tests</b></TableCell>
                <TableCell><b>Completed</b></TableCell>
                <TableCell><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {tabData[tab].map((req) => (
                <React.Fragment key={req.id}>
                  {/* MAIN ROW */}
                  <TableRow
                    hover
                    sx={{ cursor: "pointer" }}
                    onClick={() => handleToggleRow(req)}
                  >
                    <TableCell>{req.id}</TableCell>
                    <TableCell>
                      {req.patient.first_name} {req.patient.last_name}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: 12, color: "text.secondary" }}>
                        {req.sample_date || req.created_at ? `${req.sample_date || ""}${req.sample_date && req.created_at ? " / " : ""}${req.created_at ? new Date(req.created_at).toLocaleString() : ""}` : "—"}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={req.status}
                        size="small"
                        color={statusColor(req.status)}
                      />
                    </TableCell>
                    <TableCell>{getRequestTests(req).length}</TableCell>
                    <TableCell>
                      {getRequestTests(req).filter((r) => r.results || r.test_result || r.result).length}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            openModal(req);
                          }}
                        >
                          View
                        </Button>

                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRequest(req);
                          }}
                        >
                          Edit
                        </Button>

                        {(normalizedRole === "admin" || normalizedRole === "labtech" || normalizedRole === "labtechnician") && (
                          <Button size="small" color="secondary">
                            Authorize
                          </Button>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>

                  {/* EXPANDED LAB RESULTS */}
                  <TableRow>
                    <TableCell colSpan={6} sx={{ p: 0 }}>
                      <Collapse in={expandedRow === req.id}>
                        <Box sx={{ p: 2, bgcolor: "#fafafa" }}>
                          <Typography fontWeight="bold" gutterBottom>
                            Lab Results
                          </Typography>

                          {loading[req.id] ? (
                            <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                              <CircularProgress size={32} />
                            </Box>
                          ) : (() => {
                            const requestTests = getRequestTests(req);
                            if (requestTests.length === 0) {
                              return (
                                <Typography color="textSecondary">
                                  No lab results yet for this request
                                </Typography>
                              );
                            }

                            const grouped = groupTestsByCategory(requestTests);
                            const categories = Object.keys(grouped).sort();

                            return (
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell><b>Test</b></TableCell>
                                    <TableCell><b>Result</b></TableCell>
                                    <TableCell><b>Unit</b></TableCell>
                                    <TableCell><b>Ref Range</b></TableCell>
                                    <TableCell><b>Flag</b></TableCell>
                                    <TableCell><b>Comment</b></TableCell>
                                  </TableRow>
                                </TableHead>

                                <TableBody>
                                  {categories.map((category) => (
                                    <React.Fragment key={category}>
                                      <TableRow sx={{ backgroundColor: "#f7f7f7" }}>
                                        <TableCell colSpan={6} sx={{ fontWeight: 700 }}>
                                          {category}
                                        </TableCell>
                                      </TableRow>
                                      {grouped[category].map((lr, idx) => {
                                        const row = normalizeLabResult(lr);
                                        return (
                                          <TableRow key={row.id ?? `${category}-${idx}`}>
                                            <TableCell>{row.test_name}</TableCell>
                                            <TableCell>{row.results || "—"}</TableCell>
                                            <TableCell>{row.unit || "—"}</TableCell>
                                            <TableCell>{row.ref_range || "—"}</TableCell>
                                            <TableCell>{row.flag || "—"}</TableCell>
                                            <TableCell>{row.comment || "—"}</TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </React.Fragment>
                                  ))}
                                </TableBody>
                              </Table>
                            );
                          })()}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* MODAL VIEW RESULTS */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        aria-labelledby="view-results-modal"
        aria-describedby="view-results-description"
      >
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto",
            bgcolor: "background.paper",
            boxShadow: 24,
            borderRadius: 2,
            p: 3,
          }}
        >
          {selectedRequest && (
            <ViewResults
              selectedTests={getRequestTests(selectedRequest).map((lr) => {
                const row = normalizeLabResult(lr);
                return {
                  id: row.id,
                  name: row.test_name,
                  result: row.results,
                  unit: row.unit,
                  refRange: row.ref_range,
                  flag: row.flag,
                  comment: row.comment,
                  category: row.category,
                  labTestId: lr.lab_test_id ?? row.id,
                };
              })}
              labResults={getRequestTests(selectedRequest).map(normalizeLabResult)}
              patient={{
                firstName: selectedRequest.patient.first_name,
                lastName: selectedRequest.patient.last_name,
                dob: selectedRequest.patient.dob,
                gender: selectedRequest.patient.gender,
                facility: selectedRequest.patient.facility,
                funding: selectedRequest.patient.funding,
                clinicalData: selectedRequest.patient.clinical_data,
                doctorName: selectedRequest.patient.doctor_name,
              }}
              requestId={selectedRequest.id}
              sampleDate={selectedRequest.sample_date}
            />
          )}
        </Box>
      </Modal>
    </Container>
  );
};

export default LabRequestsPage;