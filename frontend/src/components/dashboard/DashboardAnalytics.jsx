import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { API_URL } from "../../utils/api";

const getRequestDate = (request) => {
  if (!request.created_at) return null;
  const date = new Date(request.created_at);
  return Number.isNaN(date.getTime()) ? null : date;
};

const StatCard = ({ label, value, note, color }) => (
  <Card variant="outlined" sx={{ borderColor: "#dde6de", borderRadius: 2 }}>
    <CardContent>
      <Typography
        variant="overline"
        sx={{ color: "text.secondary", fontWeight: 700, letterSpacing: "0.06em" }}
      >
        {label}
      </Typography>
      <Typography variant="h4" sx={{ color, fontWeight: 700, lineHeight: 1.2 }}>
        {value}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {note}
      </Typography>
    </CardContent>
  </Card>
);

const DashboardAnalytics = () => {
  const [patients, setPatients] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    try {
      const [patientsResult, requestsResult] = await Promise.allSettled([
        axios.get(`${API_URL}/patients/`, { headers }),
        axios.get(`${API_URL}/lab-requests/`, { headers }),
      ]);

      const nextPatients =
        patientsResult.status === "fulfilled" &&
        Array.isArray(patientsResult.value.data)
          ? patientsResult.value.data
          : [];
      const nextRequests =
        requestsResult.status === "fulfilled" &&
        Array.isArray(requestsResult.value.data)
          ? requestsResult.value.data
          : [];

      setPatients(nextPatients);
      setRequests(nextRequests);

      if (
        patientsResult.status === "rejected" ||
        requestsResult.status === "rejected"
      ) {
        const failedResult =
          patientsResult.status === "rejected"
            ? patientsResult.reason
            : requestsResult.reason;
        throw failedResult;
      }
    } catch (requestError) {
      console.error("Failed to load dashboard analytics", requestError);
      setError(
        requestError.response?.data?.detail ||
          (requestError.code === "ERR_NETWORK" ||
          requestError.message === "Network Error"
            ? "Dashboard analytics are temporarily unavailable. Check the backend connection and try again."
            : "") ||
          requestError.message ||
          "Could not load dashboard analytics. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const analytics = useMemo(() => {
    const datedRequests = requests
      .map((request) => ({ request, date: getRequestDate(request) }))
      .filter(({ date }) => date);

    const now = new Date();
    const earliestDate = datedRequests.reduce(
      (earliest, { date }) => (date < earliest ? date : earliest),
      now
    );
    const firstMonth = new Date(
      earliestDate.getFullYear(),
      earliestDate.getMonth(),
      1
    );
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthKeys = [];
    for (
      let month = new Date(firstMonth);
      month <= currentMonth;
      month = new Date(month.getFullYear(), month.getMonth() + 1, 1)
    ) {
      monthKeys.push(
        `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`
      );
    }

    const monthlyData = monthKeys.map((monthKey) => {
      const [year, monthNumber] = monthKey.split("-").map(Number);
      const monthlyPatientIds = new Set();
      let pending = 0;
      let completed = 0;

      datedRequests.forEach(({ request, date }) => {
        if (
          date.getFullYear() === year &&
          date.getMonth() === monthNumber - 1
        ) {
          if (request.patient_id != null) monthlyPatientIds.add(request.patient_id);
          const status = String(request.status || "").trim().toLowerCase();
          if (status === "pending") pending += 1;
          if (status === "completed") completed += 1;
        }
      });

      return {
        label: new Date(year, monthNumber - 1, 1).toLocaleDateString(
          undefined,
          { month: "short", year: "2-digit" }
        ),
        patients: monthlyPatientIds.size,
        pending,
        completed,
      };
    });

    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentMonthData =
      monthlyData.find((point) => point.label ===
        new Date(now.getFullYear(), now.getMonth(), 1).toLocaleDateString(
          undefined,
          { month: "short", year: "2-digit" }
        )) || { patients: 0 };

    const pendingRequests = requests.filter(
      (request) => String(request.status || "").trim().toLowerCase() === "pending"
    ).length;
    const completedRequests = requests.filter(
      (request) => String(request.status || "").trim().toLowerCase() === "completed"
    ).length;

    return {
      monthlyPatients: currentMonthData.patients,
      currentMonthKey,
      monthlyData,
      pendingRequests,
      completedRequests,
    };
  }, [requests]);

  return (
    <Box sx={{ mb: 3 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box>
          <Typography
            variant="overline"
            sx={{ color: "#0f8a3a", fontWeight: 700, letterSpacing: "0.1em" }}
          >
            OVERVIEW
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Patient & lab request analysis
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monthly patient activity and current lab request workload.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={fetchAnalytics}
            disabled={loading}
            sx={{ borderColor: "#c3d2c6", color: "#0b6f2e", textTransform: "none" }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {error && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchAnalytics}>
              Retry
            </Button>
          }
          sx={{ mb: 2 }}
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
              gap: 1.5,
              mb: 2,
            }}
          >
            <StatCard
              label="Patients this month"
              value={analytics.monthlyPatients}
              note="Unique patients with requests in the current month"
              color="#0f8a3a"
            />
            <StatCard
              label="Pending requests"
              value={analytics.pendingRequests}
              note="Awaiting completion"
              color="#a8510a"
            />
            <StatCard
              label="Completed requests"
              value={analytics.completedRequests}
              note="All completed lab requests"
              color="#0f8a3a"
            />
            <StatCard
              label="Patient records"
              value={patients.length}
              note="Total records in Biozone"
              color="#1f6f8b"
            />
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
              gap: 1.5,
            }}
          >
            <Card
              variant="outlined"
              sx={{ borderColor: "#dde6de", borderRadius: 2, gridColumn: { lg: "1 / -1" } }}
            >
              <CardContent>
                <Typography sx={{ fontWeight: 700 }}>
                  Patient activity trend
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Monthly unique patients with lab requests, across all recorded months.
                </Typography>
                <Box sx={{ width: "100%", height: 260 }}>
                  <ResponsiveContainer>
                    <LineChart
                      data={analytics.monthlyData}
                      margin={{ top: 8, right: 16, bottom: 0, left: -20 }}
                    >
                      <CartesianGrid stroke="#e5ebe6" vertical={false} />
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={18}
                      />
                      <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="patients"
                        name="Unique patients"
                        stroke="#0f8a3a"
                        strokeWidth={3}
                        dot={{ r: 3, fill: "#0f8a3a" }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="pending"
                        name="Pending requests"
                        stroke="#a8510a"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="completed"
                        name="Completed requests"
                        stroke="#1f6f8b"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </>
      )}
    </Box>
  );
};

export default DashboardAnalytics;
