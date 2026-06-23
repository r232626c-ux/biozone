import { useEffect, useState } from "react";
import {
  Box,
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
  Button,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

import { API_URL } from "../utils/api";

export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [userRole, setUserRole] = useState(null);

  // Fetch audit logs
  useEffect(() => {
    // Get user role from localStorage
    const role = localStorage.getItem("role");
    if (role) {
      setUserRole(role.toLowerCase());
    }

    const fetchAuditLogs = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token") || localStorage.getItem("access_token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        
        const response = await axios.get(`${API_URL}/api/audit-logs`, { headers });
        setAuditLogs(response.data || []);
      } catch (err) {
        console.error("Error fetching audit logs:", err);
        setAuditLogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  // Filter audit logs based on search and filters
  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = !filterRole || log.role === filterRole;
    const matchesAction = !filterAction || log.action === filterAction;

    return matchesSearch && matchesRole && matchesAction;
  });

  // Get unique values for filters
  const uniqueRoles = [...new Set(auditLogs.map((log) => log.role))];
  const uniqueActions = [...new Set(auditLogs.map((log) => log.action))];

  // Export to Excel
  const exportToExcel = () => {
    const data = filteredLogs.map((log) => ({
      ID: log.id,
      Username: log.username,
      Role: log.role,
      Action: log.action,
      Details: log.details,
      "IP Address": log.ip_address,
      "Created At": new Date(log.created_at).toLocaleString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs");
    XLSX.writeFile(workbook, `audit_logs_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Audit Logs Report", 14, 15);

    const data = filteredLogs.map((log) => [
      log.id,
      log.username,
      log.role,
      log.action,
      log.details || "",
      log.ip_address,
      new Date(log.created_at).toLocaleString(),
    ]);

    doc.autoTable({
      head: [["ID", "Username", "Role", "Action", "Details", "IP", "Timestamp"]],
      body: data,
      startY: 25,
    });

    doc.save(`audit_logs_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  if (loading) {
    return (
      <Container>
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
          📋 Audit Logs - System Access & Activity
        </Typography>

        {/* Filters */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            mb: 3,
            alignItems: "flex-end",
            flexWrap: "wrap",
            backgroundColor: "#fff",
            p: 2,
            borderRadius: 1,
            border: "1px solid #e0e0e0",
          }}
        >
          <TextField
            placeholder="Search by username, action, or details..."
            size="small"
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ flex: "1 1 300px", minWidth: 250, backgroundColor: "#fff" }}
          />

          <TextField
            select
            label="Filter by Role"
            size="small"
            variant="outlined"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            sx={{
              flex: "0 1 280px",
              minWidth: 280,
              backgroundColor: "#fff",
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#fff",
              },
            }}
            SelectProps={{
              native: true,
            }}
          >
            <option value="">All Roles</option>
            {uniqueRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </TextField>

          <TextField
            select
            label="Filter by Action"
            size="small"
            variant="outlined"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            sx={{
              flex: "0 1 280px",
              minWidth: 280,
              backgroundColor: "#fff",
              "& .MuiOutlinedInput-root": {
                backgroundColor: "#fff",
              },
            }}
            SelectProps={{
              native: true,
            }}
          >
            <option value="">All Actions</option>
            {uniqueActions.map((action) => (
              <option key={action} value={action}>
                {action}
              </option>
            ))}
          </TextField>

          {userRole && (userRole === "admin" || userRole === "super admin") ? (
            <>
              <Button variant="outlined" size="small" onClick={exportToExcel}>
                📊 Export to Excel
              </Button>
              <Button variant="outlined" size="small" onClick={exportToPDF}>
                📄 Export to PDF
              </Button>
            </>
          ) : (
            <Typography variant="caption" color="error">
              📌 Only admins can export audit logs
            </Typography>
          )}
        </Box>

        {/* Results Info */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ color: "#666" }}>
            Showing {filteredLogs.length} of {auditLogs.length} audit logs
          </Typography>
        </Box>

        {/* Table */}
        {filteredLogs.length > 0 ? (
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell sx={{ fontWeight: 700 }}>ID</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Username</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Details</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>IP Address</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Timestamp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}>
                    <TableCell>{log.id}</TableCell>
                    <TableCell>{log.username || "System"}</TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "inline-block",
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor:
                            log.role === "Admin"
                              ? "#FFE0E0"
                              : log.role === "Doctor"
                              ? "#E0F2FE"
                              : "#F0F0F0",
                          color:
                            log.role === "Admin"
                              ? "#C00000"
                              : log.role === "Doctor"
                              ? "#0066CC"
                              : "#333",
                          fontWeight: 500,
                          fontSize: "0.85rem",
                        }}
                      >
                        {log.role}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 500, color: "#0066CC" }}>
                      {log.action}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 250, whiteSpace: "normal" }}>
                      {log.details || "-"}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem", color: "#666" }}>
                      {log.ip_address || "-"}
                    </TableCell>
                    <TableCell sx={{ fontSize: "0.85rem", whiteSpace: "nowrap" }}>
                      {new Date(log.created_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <Typography variant="body1" sx={{ color: "#999" }}>
              {auditLogs.length === 0
                ? "No audit logs found. All user activities will be logged here."
                : "No logs match your filters."}
            </Typography>
          </Box>
        )}
      </Paper>
    </Container>
  );
}
