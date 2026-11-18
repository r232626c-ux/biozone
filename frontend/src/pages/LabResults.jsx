import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";

import { API_URL } from "../utils/api";
import ViewResults from "../components/NewRequest/ViewResults";

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" });
};

const getApiErrorMessage = (error, fallback) => {
  const detail = error.response?.data?.detail;
  if (typeof detail === "string" && detail.trim()) return detail;
  if (detail) return JSON.stringify(detail);
  if (typeof error.response?.data === "string" && error.response.data.trim()) {
    return error.response.data;
  }
  if (error.response) return `${fallback} (HTTP ${error.response.status}).`;
  return error.message || fallback;
};

const LabResults = () => {
  const [results, setResults] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedResult, setSelectedResult] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");
  const token = localStorage.getItem("token");

  const loadResults = useCallback(async () => {
    if (!token) {
      setError("You must sign in to view lab results.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await axios.get(`${API_URL}/lab-results/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(Array.isArray(response.data) ? response.data : []);
    } catch (requestError) {
      console.error("Failed to load lab results", requestError);
      setError(getApiErrorMessage(requestError, "Could not load lab results."));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const filteredResults = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return results;

    return results.filter((result) =>
      [
        result.patient_first_name,
        result.patient_last_name,
        result.test_name,
        result.results,
        result.flag,
        result.comment,
        result.patient_id,
        result.lab_request_id,
        result.request_status,
      ]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [results, search]);

  const recordedCount = filteredResults.filter(
    (result) => String(result.results ?? "").trim() !== ""
  ).length;
  const flaggedCount = filteredResults.filter(
    (result) => String(result.flag ?? "").trim() !== ""
  ).length;

  const openReport = async (result) => {
    setSelectedResult(result);
    setSelectedRequest(null);
    setReportError("");
    setReportLoading(true);

    try {
      const response = await axios.get(
        `${API_URL}/lab-requests/${result.lab_request_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSelectedRequest(response.data);
    } catch (requestError) {
      console.error("Failed to load request details for lab report", requestError);
      setReportError(getApiErrorMessage(requestError, "Could not load the lab report."));
    } finally {
      setReportLoading(false);
    }
  };

  const closeReport = () => {
    setSelectedResult(null);
    setSelectedRequest(null);
    setReportError("");
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 0, px: { xs: 0, md: 1 }, mb: 4 }}>
      <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden" }}>
        <Toolbar
          sx={{
            minHeight: 64,
            borderBottom: "1px solid",
            borderColor: "divider",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h5" fontWeight={650}>
              Lab Results
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All recorded test results, independently of the request list
            </Typography>
          </Box>
          <Button
            startIcon={<RefreshIcon />}
            onClick={loadResults}
            disabled={loading}
            variant="outlined"
          >
            Refresh
          </Button>
        </Toolbar>

        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            size="small"
            label="Search results"
            placeholder="Patient, test, result, flag, or request ID"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 1.5 }}>
            <Chip label={`${filteredResults.length} results`} color="primary" size="small" />
            <Chip label={`${recordedCount} with values`} variant="outlined" size="small" />
            <Chip
              label={`${flaggedCount} flagged`}
              color={flaggedCount ? "warning" : "default"}
              variant={flaggedCount ? "filled" : "outlined"}
              size="small"
            />
          </Stack>
        </Box>

        {error && (
          <Alert
            severity="error"
            sx={{ mx: 2, mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={loadResults}>
                Retry
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer sx={{ maxHeight: "70vh" }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Recorded</TableCell>
                  <TableCell>Patient</TableCell>
                  <TableCell>Test</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Flag</TableCell>
                  <TableCell>Request</TableCell>
                  <TableCell>Request status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredResults.map((result) => (
                  <TableRow key={result.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {formatDate(result.created_at)}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Typography variant="body2" fontWeight={600}>
                        {[result.patient_first_name, result.patient_last_name]
                          .filter(Boolean)
                          .join(" ") || "Unknown patient"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Patient #{result.patient_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {result.test_name || "—"}
                      </Typography>
                      {result.category && (
                        <Typography variant="caption" color="text.secondary">
                          {result.category}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {String(result.results ?? "").trim() || (
                        <Typography component="span" color="text.secondary">
                          Pending
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      {result.flag ? (
                        <Chip size="small" color="warning" label={result.flag} />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>#{result.lab_request_id}</TableCell>
                    <TableCell>{result.request_status || "—"}</TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => openReport(result)}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!error && filteredResults.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5 }}>
                      <Typography color="text.secondary">
                        {search
                          ? "No results match your search."
                          : "No lab results have been recorded yet."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
      <Dialog
        open={Boolean(selectedResult)}
        onClose={closeReport}
        fullWidth
        maxWidth="lg"
      >
        <DialogTitle>Lab report</DialogTitle>
        {reportLoading ? (
          <DialogContent dividers>
            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
              <CircularProgress />
            </Box>
          </DialogContent>
        ) : reportError ? (
          <DialogContent dividers>
            <Alert
              severity="error"
              action={
                selectedResult && (
                  <Button color="inherit" size="small" onClick={() => openReport(selectedResult)}>
                    Retry
                  </Button>
                )
              }
            >
              {reportError}
            </Alert>
          </DialogContent>
        ) : selectedResult && selectedRequest ? (
          <DialogContent dividers>
            <ViewResults
              selectedTests={results
                .filter(
                  (result) =>
                    String(result.lab_request_id) ===
                    String(selectedResult.lab_request_id)
                )
                .map((result) => ({
                  id: result.id,
                  name: result.test_name || "Unknown Test",
                  category: result.category || "Other",
                  result: result.results ?? "",
                  unit: result.unit ?? "",
                  refRange: result.ref_range ?? "",
                  flag: result.flag ?? "",
                  comment: result.comment ?? "",
                }))}
              patient={{
                firstName:
                  selectedRequest.patient?.first_name ||
                  selectedResult.patient_first_name ||
                  "",
                lastName:
                  selectedRequest.patient?.last_name ||
                  selectedResult.patient_last_name ||
                  "",
                dob: selectedRequest.patient?.dob || "",
                gender: selectedRequest.patient?.gender || "",
                facility: selectedRequest.patient?.facility || "",
                funding: selectedRequest.patient?.funding || "",
                clinicalData: selectedRequest.patient?.clinical_data || "",
                doctorName: selectedRequest.patient?.doctor_name || "",
              }}
              requestId={selectedRequest.id}
              sampleDate={
                selectedRequest.sample_date ||
                formatDate(selectedRequest.created_at)
              }
            />
          </DialogContent>
        ) : null}
        <DialogActions>
          <Button onClick={closeReport}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default LabResults;
