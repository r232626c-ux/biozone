import { Navigate } from "react-router-dom";

function normalizeRole(role = "") {
  const key = String(role).trim().toLowerCase().replace(/[\s_-]/g, "");
  const roleMap = {
    admin: "admin",
    doctor: "doctor",
    user: "reception",
    reception: "reception",
    receptionist: "reception",
    labtech: "medicallaboratoryscientist",
    labtechnician: "medicallaboratoryscientist",
    lab: "medicallaboratoryscientist",
    labscientist: "medicallaboratoryscientist",
    medicallabscientist: "medicallaboratoryscientist",
    medicallaboratoryscientist: "medicallaboratoryscientist",
    mls: "medicallaboratoryscientist",
  };
  return roleMap[key] || key;
}

export default function ProtectedRoute({
  children,
  allowedRoles,
  passwordChangeOnly = false,
}) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return <Navigate to="/" replace />;
  if (user.must_change_password && !passwordChangeOnly) {
    return <Navigate to="/change-password" replace />;
  }
  if (passwordChangeOnly && !user.must_change_password) {
    return <Navigate to="/dashboard/lab" replace />;
  }

  const normalizedRole = normalizeRole(user.role);
  const normalizedAllowed = (allowedRoles ?? []).map(normalizeRole);

  if (allowedRoles && !normalizedAllowed.includes(normalizedRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
