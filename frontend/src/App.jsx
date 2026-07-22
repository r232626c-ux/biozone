import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useParams, useEffect, useState } from "react";
import axios from "axios";
import { Typography } from "@mui/material";

import { API_URL } from "./utils/api";

// Layouts & Components
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ViewResults from "./components/NewRequest/ViewResults";

// Pages
import Login from "./pages/Login";
import DoctorDashboard from "./pages/DoctorDashboard";
import LabDashboard from "./pages/LabDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import NewRequestPage from "./pages/NewRequestPage";
import PatientRecords from "./pages/PatientRecords";
import AdminCreateUser from "./pages/AdminCreateUser";
import LabResults from "./pages/LabResults";
import Settings from "./pages/Settings";
import AuditLogs from "./pages/AuditLogs";

// -----------------------------------------
// Wrapper to fetch lab request data before showing ViewResults
// -----------------------------------------
const ViewResultsWrapper = () => {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    let active = true;

    const fetchRequest = async () => {
      setLoading(true);
      setError("");

      try {
        const res = await axios.get(`${API_URL}/lab-requests/${id}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!active) return;
        setRequest(res.data ?? null);
      } catch (err) {
        if (!active) return;
        console.error("Failed to load lab request", err);
        setError("Could not load lab request results. Please refresh and try again.");
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchRequest();

    return () => {
      active = false;
    };
  }, [id, token]);

  if (loading) return <Typography sx={{ p: 4 }}>Loading...</Typography>;
  if (error) return <Typography color="error" sx={{ p: 4 }}>{error}</Typography>;
  if (!request) return <Typography color="error" sx={{ p: 4 }}>No request data found.</Typography>;

  const rawResults =
    (Array.isArray(request.lab_results) && request.lab_results) ||
    (Array.isArray(request.labresult_set) && request.labresult_set) ||
    (Array.isArray(request.results) && request.results) ||
    (Array.isArray(request.test_results) && request.test_results) ||
    [];

  const mappedTests = rawResults.map((lr) => ({
    id: lr.id ?? lr.lab_test_id ?? lr.test_name ?? `${lr.test_name}-${Math.random()}`,
    name: lr.lab_test?.name || lr.test_name || lr.name || "Unknown Test",
    category: lr.lab_test?.category || lr.category || "Other",
    result: lr.results ?? lr.test_result ?? lr.result ?? "",
    unit: lr.unit ?? lr.test_unit ?? "",
    refRange: lr.ref_range ?? lr.refrange ?? lr.refRange ?? "",
    flag: lr.flag ?? "",
    comment: lr.comment ?? "",
    incubation: lr.incubation ?? "",
    subTab: lr.subTab ?? "",
  }));

  const patient = request.patient ?? {};

  return (
    <ViewResults
      selectedTests={mappedTests}
      patient={{
        firstName: patient.first_name,
        lastName: patient.last_name,
        dob: patient.dob,
        gender: patient.gender,
        facility: patient.facility,
        funding: patient.funding,
        clinicalData: patient.clinical_data,
        doctorName: patient.doctor_name,
      }}
      requestId={request.id}
      sampleDate={request.sample_date}
    />
  );
};

// -----------------------------------------
// Main App Routes
// -----------------------------------------
function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />

        {/* Admin-only Pages */}
        <Route
          path="/admin/create-user"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminCreateUser />
            </ProtectedRoute>
          }
        />

        {/* Lab Requests */}
        <Route path="/lab-requests/:id/view" element={<ViewResultsWrapper />} />

        {/* Protected Dashboard Layout */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute allowedRoles={["doctor", "labtech", "admin","user" ]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          {/* Default redirect */}
          <Route index element={<Navigate to="doctor" replace />} />

          {/* Dashboards */}
          <Route path="doctor" element={<DoctorDashboard />} />
          <Route path="lab" element={<LabDashboard />} />
          <Route path="admin" element={<LabDashboard />} />
           <Route path="user" element={<LabDashboard />} />

          {/* Pages */}
          <Route path="new-request" element={<NewRequestPage />} />
          <Route path="lab-results" element={<LabResults />} />
          <Route path="patients" element={<PatientRecords />} />
          <Route path="settings" element={<Settings />} />
          <Route path="audit-logs" element={<AuditLogs />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
 