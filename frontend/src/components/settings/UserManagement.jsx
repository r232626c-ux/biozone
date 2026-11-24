import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import SearchIcon from "@mui/icons-material/Search";
import AdminCreateUserModal from "../../pages/AdminCreateUserModal";

import { API_URL } from "../../utils/api";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionNotice, setActionNotice] = useState("");
  const [actionUserId, setActionUserId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const token = localStorage.getItem("token");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const response = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!Array.isArray(response.data)) {
        throw new Error("The server returned an invalid user list.");
      }
      setUsers(response.data);
    } catch (error) {
      console.error("Failed to load user accounts", error);
      setUsers([]);
      setFetchError(
        error.response?.data?.detail ||
          error.message ||
          "Could not load user accounts. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        [user.username, user.email, user.role]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(query));
      const isActive = Boolean(user.is_active);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);
      return matchesSearch && matchesStatus;
    });
  }, [search, statusFilter, users]);

  const handleAddUser = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  const handleSetUserActive = async (user) => {
    const shouldActivate = !user.is_active;
    const action = shouldActivate ? "activate" : "deactivate";
    if (
      !window.confirm(
        `Are you sure you want to ${action} ${user.username}'s account?`
      )
    ) {
      return;
    }

    setActionUserId(user.id);
    setActionError("");
    setActionNotice("");
    try {
      await axios.patch(
        `${API_URL}/admin/users/${user.id}/${action}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setActionNotice(
        `${user.username}'s account was ${shouldActivate ? "activated" : "deactivated"}.`
      );
      await fetchUsers();
    } catch (error) {
      console.error(`Failed to ${action} user account`, error);
      setActionError(
        error.response?.data?.detail ||
          `Could not ${action} this account. Please try again.`
      );
    } finally {
      setActionUserId(null);
    }
  };

  const activeCount = users.filter((user) => user.is_active).length;
  const inactiveCount = users.length - activeCount;

  return (
    <Box>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2.5 }}
      >
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            Account management
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Each person uses an individual account. Roles determine the areas
            and actions available to them.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<PersonAddAlt1Icon />}
          onClick={handleAddUser}
          sx={{
            alignSelf: { xs: "flex-start", sm: "center" },
            bgcolor: "#0f8a3a",
            "&:hover": { bgcolor: "#0b6f2e" },
            textTransform: "none",
            fontWeight: 600,
          }}
        >
          Add user
        </Button>
      </Stack>

      <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap" }}>
        <Chip label={`${users.length} total accounts`} variant="outlined" />
        <Chip
          label={`${activeCount} active`}
          sx={{ bgcolor: "#e3f4e8", color: "#0b6f2e", fontWeight: 600 }}
        />
        <Chip
          label={`${inactiveCount} inactive`}
          sx={{ bgcolor: "#f3f5f7", color: "#5b6977", fontWeight: 600 }}
        />
      </Stack>

      {(fetchError || actionError || actionNotice) && (
        <Stack spacing={1} sx={{ mb: 2 }}>
          {fetchError && (
            <Alert severity="error" action={
              <Button color="inherit" size="small" onClick={fetchUsers}>
                Retry
              </Button>
            }>
              {fetchError}
            </Alert>
          )}
          {actionError && <Alert severity="error">{actionError}</Alert>}
          {actionNotice && (
            <Alert severity="success" onClose={() => setActionNotice("")}>
              {actionNotice}
            </Alert>
          )}
        </Stack>
      )}

      <Paper
        variant="outlined"
        sx={{ borderColor: "#dde6de", borderRadius: 2, overflow: "hidden" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ p: 2, bgcolor: "#fff", borderBottom: "1px solid #dde6de" }}
        >
          <TextField
            size="small"
            placeholder="Search username, email, or role"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ color: "text.secondary", mr: 1 }} />,
            }}
            sx={{ flex: 1, minWidth: 220 }}
          />
          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            sx={{ minWidth: { xs: "100%", sm: 160 } }}
          >
            <MenuItem value="all">All accounts</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </Stack>

        <TableContainer>
          <Table sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "#f6f9f6" }}>
                {["Account", "Email", "Role", "Status", "Actions"].map((label) => (
                  <TableCell
                    key={label}
                    sx={{
                      color: "#4f6a55",
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      borderBottomColor: "#dde6de",
                    }}
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={24} />
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      Loading accounts…
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography sx={{ fontWeight: 600 }}>
                      {users.length ? "No accounts match your filters" : "No user accounts found"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {users.length
                        ? "Try a different search or status."
                        : "Add a user account to get started."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => {
                  const rawRole = String(user.role || "Reception");
                  const normalizedRole = rawRole.trim().toLowerCase().replace(/[\s_-]/g, "");
                  const role = ["user", "receptionist", "reception"].includes(normalizedRole)
                    ? "Reception"
                    : ["labtech", "labtechnician", "labscientist", "medicallabscientist", "medicallaboratoryscientist", "mls"].includes(normalizedRole)
                      ? "Medical Laboratory Scientist"
                      : rawRole;
                  const isPrivileged = ["admin", "super admin"].includes(
                    role.toLowerCase()
                  );
                  return (
                    <TableRow
                      key={user.id}
                      hover
                      sx={{
                        "&:last-child td": { borderBottom: 0 },
                        "&:hover": { bgcolor: "#f6f9f6" },
                      }}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1.25}>
                          <Avatar
                            sx={{
                              width: 34,
                              height: 34,
                              bgcolor: "#e3f4e8",
                              color: "#0b6f2e",
                              fontSize: 13,
                              fontWeight: 700,
                            }}
                          >
                            {String(user.username || "?").slice(0, 1).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontWeight: 600 }}>
                              {user.username || "Unnamed account"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Account #{user.id}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>{user.email || "—"}</TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={role}
                          variant="outlined"
                          sx={{ borderColor: "#c3d2c6", fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={user.is_active ? "Active" : "Inactive"}
                          sx={{
                            bgcolor: user.is_active ? "#e3f4e8" : "#f3f5f7",
                            color: user.is_active ? "#0b6f2e" : "#5b6977",
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleEditUser(user)}
                            sx={{
                              borderColor: "#c3d2c6",
                              color: "#0b6f2e",
                              textTransform: "none",
                            }}
                          >
                            Edit
                          </Button>
                          {!isPrivileged && (
                            <Button
                              size="small"
                              variant="text"
                              color={user.is_active ? "error" : "success"}
                              disabled={actionUserId === user.id}
                              onClick={() => handleSetUserActive(user)}
                              sx={{ textTransform: "none" }}
                            >
                              {actionUserId === user.id
                                ? "Saving…"
                                : user.is_active
                                  ? "Deactivate"
                                  : "Activate"}
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <Box
          sx={{
            px: 2,
            py: 1.25,
            borderTop: "1px solid #dde6de",
            bgcolor: "#f6f9f6",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Showing {filteredUsers.length} of {users.length} accounts
          </Typography>
        </Box>
      </Paper>

      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <AdminCreateUserModal
          editingUser={editingUser}
          onClose={() => {
            setModalOpen(false);
            fetchUsers();
          }}
        />
      </Dialog>
    </Box>
  );
};

export default UserManagement;
