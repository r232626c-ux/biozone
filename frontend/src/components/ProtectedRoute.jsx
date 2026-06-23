import { Navigate } from "react-router-dom";

function normalizeRole(role = "") {
  const key = String(role).trim().toLowerCase().replace(/[\s_-]/g, "");
  const roleMap = {
    admin: "admin",
    doctor: "doctor",
    user: "user",
    labtech: "labtech",
    labtechnician: "labtech",
    lab: "labtech",
  };
  return roleMap[key] || key;
}

export default function ProtectedRoute({ children, allowedRoles }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) return <Navigate to="/" replace />;

  const normalizedRole = normalizeRole(user.role);
  const normalizedAllowed = allowedRoles.map(normalizeRole);

  if (!normalizedAllowed.includes(normalizedRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
