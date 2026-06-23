import React, { useEffect, useState, useMemo } from "react";
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

  const token = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user");
  const parsedUser = storedUser ? JSON.parse(storedUser) : null;
  const role = parsedUser?.role || localStorage.getItem("role") || "";
  const normalizedRole = String(role).trim().toLowerCase().replace(/[\s_-]/g, "");

  /* ================= FETCH LAB REQUESTS ================= */
  useEffect(() => {
    if (!token) return;
    
    axios
      .get(`${API_URL}/lab-requests/`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        console.log("Lab Requests fetched:", res.data);
        // Pre-load results for all requests
        if (Array.isArray(res.data)) {
          res.data.forEach((req) => {
            fetchLabResults(req.id);
          });
        }
        setRequests(res.data);
      })
      .catch((err) => console.error("Failed to load lab requests:", err));
  }, [token]);

  /* ================= FETCH LAB RESULTS FOR SPECIFIC REQUEST ================= */
  const fetchLabResults = async (requestId) => {
    // Skip if already cached and has data
    if (labResultsCache[requestId]?.length > 0) {
      console.log("Using cached results for request", requestId);
      return labResultsCache[requestId];
    }

    setLoading((prev) => ({ ...prev, [requestId]: true }));
    try {
      console.log("Fetching lab results for request:", requestId);
      
      // Try to get the full request with nested results
      const mainRes = await axios.get(
        `${API_URL}/lab-requests/${requestId}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Full request data:", mainRes.data);
      
      let results = [];
      
      // Try different possible field names for results
      if (mainRes.data?.lab_results && Array.isArray(mainRes.data.lab_results)) {
        results = mainRes.data.lab_results;
        console.log("Found results in lab_results field");
      } else if (mainRes.data?.labresult_set && Array.isArray(mainRes.data.labresult_set)) {
        results = mainRes.data.labresult_set;
        console.log("Found results in labresult_set field");
      } else if (mainRes.data?.results && Array.isArray(mainRes.data.results)) {
        results = mainRes.data.results;
        console.log("Found results in results field");
      } else if (mainRes.data?.test_results && Array.isArray(mainRes.data.test_results)) {
        results = mainRes.data.test_results;
        console.log("Found results in test_results field");
      }
      
      console.log("Extracted results:", results, "Length:", results.length);
      
      setLabResultsCache((prev) => ({ 
        ...prev, 
        [requestId]: Array.isArray(results) ? results : [] 
      }));
      
      return results;
    } catch (err) {
      console.error(`Failed to load lab results for request ${requestId}:`, err.message);
      // Cache empty array to prevent infinite retries
      setLabResultsCache((prev) => ({ ...prev, [requestId]: [] }));
      return [];
    } finally {
      setLoading((prev) => ({ ...prev, [requestId]: false }));
    }
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
    console.log("Opening modal for request:", request);
    setSelectedRequest(request);
    const results = await fetchLabResults(request.id);
    console.log("Results loaded in modal:", results);
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

        {/* TABLE */}
        <TableContainer sx={{ maxHeight: "70vh" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell><b>ID</b></TableCell>
                <TableCell><b>Patient</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Total Tests</b></TableCell>
                <TableCell><b>Completed</b></TableCell>
                <TableCell><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {tabData[tab].length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
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
                      onClick={() => setExpandedRow(expandedRow === req.id ? null : req.id)}
                    >
                      <TableCell>{req.id}</TableCell>
                      <TableCell>
                        {req.patient?.first_name} {req.patient?.last_name}
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
                        {getRequestTests(req).filter((r) => r.results || r.test_result || r.result).length}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} onClick={(e) => e.stopPropagation()}>
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
                        <Collapse in={expandedRow === req.id} timeout="auto" unmountOnExit>
                          <Box sx={{ p: 2, bgcolor: "#fafafa" }}>
                            <Typography fontWeight="bold" gutterBottom>
                              Lab Results
                            </Typography>

                            {loading[req.id] ? (
                              <Box sx={{ display: "flex", justifyContent: "center", p: 2 }}>
                                <CircularProgress size={32} />
                              </Box>
                            ) : !labResultsCache[req.id] || labResultsCache[req.id].length === 0 ? (
                              <Box>
                                <Typography color="textSecondary" sx={{ mb: 2 }}>
                                  No lab results yet for this request
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
                                        <TableCell>{lr.results || lr.test_result || "—"}</TableCell>
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
            <ViewResults
              selectedTests={(labResultsCache[selectedRequest.id] || []).map((lr) => ({
                id: lr.id,
                name: lr.test_name || lr.lab_test?.name || "—",
                category: lr.lab_test?.category || lr.category || "Other",
                result: lr.results || lr.test_result || "",
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
        </Box>
      </Modal>
    </Container>
  );
};

export default LabRequestsPage;
