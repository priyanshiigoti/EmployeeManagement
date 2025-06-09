import React, { useState, useEffect, useCallback } from "react";
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, TextField, Select, MenuItem,
  FormControl, InputLabel, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, Tooltip,
  Snackbar, Alert, CircularProgress, Chip, TablePagination
} from "@mui/material";
import { Add, Edit, Delete, Cancel, Save } from "@mui/icons-material";
import api from "../axiosConfig"; // Your Axios instance

const Task = ({ assignedOnly = false, currentUser = null }) => {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  // Pagination + Filtering State
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [sortColumn, setSortColumn] = useState("title");
  const [sortDirection, setSortDirection] = useState("asc");
  const [totalCount, setTotalCount] = useState(0);

  const [form, setForm] = useState({
    id: 0,
    title: "",
    description: "",
    assignedUserId: "",
    dueDate: "",
    status: "Pending",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.post("/Task/paged", {
        page: page + 1,
        pageSize,
        searchTerm: search,
        sortColumn,
        sortDirection,
        draw: 1
      });

      setTasks(response.data.items);
      setTotalCount(response.data.totalCount);

      if (!assignedOnly) {
        const empRes = await api.get("/Task/employees");
        setEmployees(empRes.data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
      showSnackbar("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, sortColumn, sortDirection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormErrors(prev => ({ ...prev, [name]: undefined }));
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    let errors = {};
    if (!form.title.trim()) errors.title = "Title is required";
    if (!form.assignedUserId && !(editing && currentUser?.roles.includes("Employee"))) errors.assignedUserId = "Please select an employee";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const assignedEmployee = employees.find(e => e.userId.toString() === form.assignedUserId);
      const assignedEmployeeName = assignedEmployee
        ? assignedEmployee.fullName || `${assignedEmployee.firstName} ${assignedEmployee.lastName}`
        : "";

      const payload = {
        id: form.id,
        title: form.title.trim(),
        description: form.description.trim(),
        assignedUserId: form.assignedUserId,
        assignedEmployeeName,
        dueDate: form.dueDate ? `${form.dueDate}T00:00:00` : null,
        status: form.status,
        createdById: currentUser?.id
      };

      if (editing) {
        await api.put(`/Task/${form.id}`, payload);
        showSnackbar("Task updated");
      } else {
        await api.post("/Task", payload);
        showSnackbar("Task created");
      }

      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error("Error submitting form:", error);
      showSnackbar("Failed to save task", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/Task/${id}`);
      showSnackbar("Task deleted");
      fetchData();
    } catch (error) {
      console.error("Delete error:", error);
      showSnackbar("Failed to delete task", "error");
    }
  };

  const handleOpenDialog = (task = null) => {
    if (task) {
      setForm({
        id: task.id,
        title: task.title,
        description: task.description || "",
        assignedUserId: task.assignedUserId?.toString() || "",
        dueDate: task.dueDate?.split("T")[0] || "",
        status: task.status || "Pending",
      });
      setEditing(true);
    } else {
      setForm({
        id: 0,
        title: "",
        description: "",
        assignedUserId: "",
        dueDate: "",
        status: "Pending",
      });
      setEditing(false);
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormErrors({});
  };

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" mb={2}>
        <Typography variant="h5">Task Management</Typography>
        {!assignedOnly && (
          <Button variant="contained" onClick={() => handleOpenDialog()} startIcon={<Add />}>
            Add Task
          </Button>
        )}
      </Box>

      <Box display="flex" justifyContent="space-between" mb={2}>
        <TextField
          label="Search by title or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && setPage(0)}
          fullWidth
        />
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              {["Title", "Assigned", "Due Date", "Status", "Actions"].map((label, index) => (
                <TableCell key={index}>{label}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : tasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">No tasks found</TableCell>
              </TableRow>
            ) : (
              tasks.map(task => (
                <TableRow key={task.id}>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{task.assignedEmployeeName || "Unassigned"}</TableCell>
                  <TableCell>{task.dueDate?.split("T")[0]}</TableCell>
                  <TableCell>
                    <Chip label={task.status} color={
                      task.status === "Completed" ? "success" :
                        task.status === "In Progress" ? "warning" : "default"
                    } />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton onClick={() => handleOpenDialog(task)}><Edit /></IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton onClick={() => handleDelete(task.id)}><Delete color="error" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalCount}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        rowsPerPage={pageSize}
        onRowsPerPageChange={(e) => {
          setPageSize(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[5, 10, 25]}
      />

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editing ? "Edit Task" : "Add Task"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Title" name="title" margin="dense"
            value={form.title} onChange={handleChange} error={!!formErrors.title}
            helperText={formErrors.title}
          />
          <TextField
            fullWidth multiline rows={3} label="Description" name="description" margin="dense"
            value={form.description} onChange={handleChange}
          />
          {!currentUser?.roles.includes("Employee") && (
            <FormControl fullWidth margin="dense">
              <InputLabel>Assign To</InputLabel>
              <Select name="assignedUserId" value={form.assignedUserId} onChange={handleChange}>
                <MenuItem value="">Select</MenuItem>
                {employees.map(emp => (
                  <MenuItem key={emp.userId} value={emp.userId.toString()}>
                    {emp.fullName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField
            fullWidth type="date" label="Due Date" name="dueDate" margin="dense"
            InputLabelProps={{ shrink: true }} value={form.dueDate}
            onChange={handleChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>
            <Select name="status" value={form.status} onChange={handleChange}>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<Cancel />}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" startIcon={<Save />} disabled={submitting}>
            {editing ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Task;
