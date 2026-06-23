import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Container,
  Dialog,
} from "@mui/material";
import AdminCreateUserModal from "../../pages/AdminCreateUserModal";
import axios from "axios";

import { API_URL } from "../../utils/api";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // null → add, object → edit
  const token = localStorage.getItem("token");

  // Fetch all users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      console.error(err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Open modal to add user
  const handleAddUser = () => {
    setEditingUser(null);
    setModalOpen(true);
  };

  // Open modal to edit user
  const handleEditUser = (user) => {
    setEditingUser(user);
    setModalOpen(true);
  };

  // Deactivate user
  const handleDeactivateUser = async (userId) => {
    if (!window.confirm("Are you sure you want to deactivate this account?")) return;

    try {
      await axios.patch(
        `${API_URL}/admin/users/${userId}/deactivate`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers(); // Refresh table after deactivation
    } catch (err) {
      console.error(err);
      alert("Failed to deactivate user.");
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Account Management
      </Typography>

      <Button variant="contained" sx={{ mb: 2 }} onClick={handleAddUser}>
        Add User
      </Button>

      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Loading.....
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.is_active ? "Active" : "Inactive"}</TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      sx={{ mr: 1 }}
                      onClick={() => handleEditUser(user)}
                    >
                      Edit
                    </Button>
                    {user.role.toLowerCase() !== "admin" && (
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeactivateUser(user.id)}
                      >
                        Deactivate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      {/* Add/Edit Modal */}
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
            fetchUsers(); // Refresh table after modal close
          }}
        />
      </Dialog>
    </Container>
  );
};

export default UserManagement;
