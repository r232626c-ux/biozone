import React, { useCallback, useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
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
  Alert,
} from "@mui/material";
import ViewResults from "../components/NewRequest/ViewResults";

import { API_URL } from "../utils/api";

const getApiErrorMessage = (error, fallback) => {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (detail) return JSON.stringify(detail);

  const responseBody = error.response?.data;
  if (typeof responseBody === "string" && responseBody.trim()) return responseBody;
  if (error.response) return `${fallback} (HTTP ${error.response.status}).`;
  if (error.code === "ERR_NETWORK") {
    return `Cannot reach the backend at ${API_URL}. Check that the backend is running and accessible.`;
  }
  return error.message || fallback;
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" });
};

const LabRequestsPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [expandedRow, setExpandedRow] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [labResultsCache, setLabResultsCache] = useState({});
  const [loading, setLoading] = useState({});
  const [loadErrors, setLoadErrors] = useState({});
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [requestsError, setRequestsError] = useState("");

  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const role = parsedUser?.role || localStorage.getItem("role") || "";
  const normalizedRole = String(role).trim().toLowerCase().replace(/[\s_-]/g, "");
  const canEditRequests = [
    "admin",
    "superadmin",
    "medicallaboratoryscientist",
    "reception",
  ].includes(normalizedRole);

  /* ================= FETCH LAB REQUESTS ================= */
  const loadRequests = useCallback(async () => {
    if (!token) {
      setRequestsError("You must sign in to view lab requests.");
      setRequestsLoading(false);
      return;
    }

    setRequestsLoading(true);
    setRequestsError("");
    try {
      const response = await axios.get(`${API_URL}/lab-requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to load lab requests:", err);
      setRequestsError(getApiErrorMessage(err, "Could not load lab requests."));
    } finally {
      setRequestsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  /* ================= FETCH LAB RESULTS FOR SPECIFIC REQUEST ================= */
  const fetchLabResults = async (requestId) => {
    if (Array.isArray(labResultsCache[requestId])) {
      return labResultsCache[requestId];
    }

    setLoading((prev) => ({ ...prev, [requestId]: true }));
    setLoadErrors((prev) => ({ ...prev, [requestId]: "" }));
    try {
      const response = await axios.get(
        `${API_URL}/lab-requests/${requestId}/results/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const results = Array.isArray(response.data) ? response.data : [];
      setLabResultsCache((prev) => ({ ...prev, [requestId]: results }));
      return results;
    } catch (err) {
      console.error(`Failed to load lab results for request ${requestId}:`, err);
      setLoadErrors((prev) => ({
        ...prev,
        [requestId]: err.response?.data?.detail || "Could not load results for this request.",
      }));
      return [];
    } finally {
      setLoading((prev) => ({ ...prev, [requestId]: false }));
    }
  };

  const getRequestTests = (request) => {
    if (!request) return [];
    if (Array.isArray(labResultsCache[request.id])) {
      return labResultsCache[request.id];
    }
    if (Array.isArray(request.lab_results)) return request.lab_results;
    if (Array.isArray(request.labresult_set)) return request.labresult_set;
    return [];
  };

  const handleToggleRow = (request) => {
    const nextExpanded = expandedRow === request.id ? null : request.id;
    setExpandedRow(nextExpanded);
    if (nextExpanded !== null && !labResultsCache[request.id]) {
      fetchLabResults(request.id);
    }
  };

  const handleEditRequest = (request) => {
    navigate("/dashboard/new-request", {
      state: {
        mode: "edit",
        requestId: request.id,
        patientId: request.patient_id,
      },
    });
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

  /* ================= STATUS TABS ================= */
  const pending = filteredRequests.filter((r) => r.status === "Pending");
  const partial = filteredRequests.filter((r) => r.status === "Partially Completed");
  const completed = filteredRequests.filter((r) => r.status === "Completed");
  const tabData = [pending, partial, completed];

  const statusColor = (status) => {
    if (status === "Completed") return "success";
    if (status === "Partially Completed") return "warning";
    return "error";
  };

  /* ================= MODAL HANDLERS ================= */
  const openModal = async (request) => {
    setSelectedRequest(request);
    await fetchLabResults(request.id);
    setModalOpen(true);
  };
  const closeModal = () => {
    setSelectedRequest(null);
    setModalOpen(false);
  };

  /* ================= UI ================= */
  return (
    <Container maxWidth="lg" sx={{ mt: 0, p: { xs: 0, md: 1 }, mb: 4 }}>
      <Paper elevation={0} sx={{ borderRadius: 2 }}>
        {/* HEADER */}
        <Toolbar sx={{ borderBottom: "1px solid #ddd" }}>
          <Typography variant="h5" fontWeight={600}>
            Lab Requests
          </Typography>
        </Toolbar>

        {/* TABS */}
        <Tabs value={tab} onChange={(_, v) => setTab(v)} centered>
          <Tab label={`Pending (${pending.length})`} />
          <Tab label={`Partially Completed (${partial.length})`} />
          <Tab label={`Completed (${completed.length})`} />
        </Tabs>

        {/* SEARCH */}
        <Box sx={{ p: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search patient or request ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Box>

        {requestsError && (
          <Alert
            severity="error"
            sx={{ mx: 2, mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={loadRequests}>
                Retry
              </Button>
            }
          >
            {requestsError}
          </Alert>
        )}

        {/* TABLE */}
        <TableContainer sx={{ maxHeight: "70vh" }}>
          <Table stickyHeader size="small" sx={{ minWidth: 850 }}>
            <TableHead>
              <TableRow>
                <TableCell><b>ID</b></TableCell>
                <TableCell><b>Patient</b></TableCell>
                <TableCell><b>Date &amp; Time</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Total Tests</b></TableCell>
                <TableCell><b>Completed</b></TableCell>
                <TableCell><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {requestsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <CircularProgress size={28} />
                  </TableCell>
                </TableRow>
              ) : tabData[tab].length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                    <Typography color="textSecondary">
                      No {["Pending", "Partially Completed", "Completed"][tab]} requests found.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                tabData[tab].map((req) => (
                  <React.Fragment key={req.id}>
                    {/* MAIN ROW */}
                    <TableRow
                      sx={{ cursor: "pointer" }}
                      onClick={() => handleToggleRow(req)}
                    >
                      <TableCell>{req.id}</TableCell>
                      <TableCell>
                        {[req.patient?.first_name, req.patient?.last_name]
                          .filter(Boolean)
                          .join(" ") || "Unknown patient"}
                      </TableCell>
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {formatDateTime(req.created_at)}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={req.status}
                          size="small"
                          color={statusColor(req.status)}
                        />
                      </TableCell>
                      <TableCell>
                        {getRequestTests(req).length}
                      </TableCell>
                      <TableCell>
                        {getRequestTests(req).filter(
                          (r) => String(r.results ?? r.test_result ?? r.result ?? "").trim() !== ""
                        ).length}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
                          {canEditRequests && (
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => handleEditRequest(req)}
                            >
                              Edit
                            </Button>
                          )}
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

                          {canEditRequests && (
                            <Button size="small" color="secondary">
                              Authorize
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>

                    {/* EXPANDED LAB RESULTS */}
                    <TableRow>
                      <TableCell colSpan={7} sx={{ p: 0 }}>
                        <Collapse in={expandedRow === req.id} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, bgcolor: "#fafafa" }}>
                            <Typography fontWeight="bold" gutterBottom>
                              Lab Results
                            </Typography>

                            {loading[req.id] ? (
                              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                                <CircularProgress size={32} />
                              </Box>
                            ) : loadErrors[req.id] ? (
                              <Alert
                                severity="error"
                                action={
                                  <Button
                                    color="inherit"
                                    size="small"
                                    onClick={() => {
                                      setLabResultsCache((prev) => {
                                        const next = { ...prev };
                                        delete next[req.id];
                                        return next;
                                      });
                                      fetchLabResults(req.id);
                                    }}
                                  >
                                    Retry
                                  </Button>
                                }
                              >
                                {loadErrors[req.id]}
                              </Alert>
                            ) : !labResultsCache[req.id] || labResultsCache[req.id].length === 0 ? (
                              <Box>
                                <Typography color="textSecondary" sx={{ mb: 2 }}>
                                  No results have been recorded for this request yet.
                                </Typography>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => {
                                    setLabResultsCache((prev) => {
                                      const newCache = { ...prev };
                                      delete newCache[req.id];
                                      return newCache;
                                    });
                                    fetchLabResults(req.id);
                                  }}
                                >
                                  Retry
                                </Button>
                              </Box>
                            ) : (
                              <TableContainer>
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
                                    {labResultsCache[req.id]?.map((lr) => (
                                      <TableRow key={lr.id}>
                                        <TableCell>{lr.test_name || lr.lab_test?.name || "—"}</TableCell>
                                        <TableCell>
                                          {String(lr.results ?? lr.test_result ?? "").trim() || "—"}
                                        </TableCell>
                                        <TableCell>{lr.unit || "—"}</TableCell>
                                        <TableCell>{lr.ref_range || lr.refrange || "—"}</TableCell>
                                        <TableCell>{lr.flag || "—"}</TableCell>
                                        <TableCell>{lr.comment || "—"}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </TableContainer>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))
              )}
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
            <>
              {loading[selectedRequest.id] ? (
                <Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
                  <CircularProgress />
                </Box>
              ) : loadErrors[selectedRequest.id] ? (
                <Alert
                  severity="error"
                  action={
                    <Button
                      color="inherit"
                      size="small"
                      onClick={() => {
                        setLabResultsCache((prev) => {
                          const next = { ...prev };
                          delete next[selectedRequest.id];
                          return next;
                        });
                        fetchLabResults(selectedRequest.id);
                      }}
                    >
                      Retry
                    </Button>
                  }
                >
                  {loadErrors[selectedRequest.id]}
                </Alert>
              ) : (labResultsCache[selectedRequest.id] || []).length === 0 ? (
                <Typography color="text.secondary">
                  No results have been recorded for this request yet.
                </Typography>
              ) : (
                <ViewResults
                  selectedTests={(labResultsCache[selectedRequest.id] || []).map((lr) => ({
                    id: lr.id,
                    name: lr.test_name || lr.lab_test?.name || "—",
                    category: lr.lab_test?.category || lr.category || "Other",
                    result: lr.results ?? lr.test_result ?? "",
                    unit: lr.unit ?? "",
                    refRange: lr.ref_range || lr.refrange || "",
                    flag: lr.flag || lr.test_flag || lr.result_flag || "",
                    comment: lr.comment || "",
                  }))}
                  patient={{
                    firstName: selectedRequest.patient?.first_name || "",
                    lastName: selectedRequest.patient?.last_name || "",
                    dob: selectedRequest.patient?.dob || "",
                    gender: selectedRequest.patient?.gender || "",
                    facility: selectedRequest.patient?.facility || "",
                    funding: selectedRequest.patient?.funding || "",
                    clinicalData: selectedRequest.patient?.clinical_data || "",
                    doctorName: selectedRequest.patient?.doctor_name || "",
                  }}
                  requestId={selectedRequest.id}
                  sampleDate={selectedRequest.sample_date}
                />
              )}
            </>
          )}
        </Box>
      </Modal>
    </Container>
  );
};

export default LabRequestsPage;
