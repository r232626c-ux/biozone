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
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(`${API_URL}/lab-requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => setRequest(res.data))
      .catch((err) => console.error(err));
  }, [id, token]);

  if (!request) return <Typography sx={{ p: 4 }}>Loading...</Typography>;

  return (
    <ViewResults
      selectedTests={request.lab_results.map((lr) => ({
        id: lr.id,
        name: lr.lab_test?.name || lr.test_name,
        category: lr.lab_test?.category,
        result: lr.results,
        unit: lr.unit ?? "",
refRange: lr.ref_range ?? lr.refrange ?? "",
flag: lr.flag ?? "",
comment: lr.comment ?? "",
      }))}
      patient={{
        firstName: request.patient.first_name,
        lastName: request.patient.last_name,
        dob: request.patient.dob,
        gender: request.patient.gender,
        facility: request.patient.facility,
        funding: request.patient.funding,
        clinicalData: request.patient.clinical_data,
        doctorName: request.patient.doctor_name,
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
 