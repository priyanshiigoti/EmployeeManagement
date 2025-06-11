import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Tooltip, Snackbar, Alert, CircularProgress, Avatar, Chip,
  Checkbox, FormControl, InputLabel, Select, MenuItem, FormControlLabel,
  TableFooter, TablePagination, Box
} from '@mui/material';

import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';

import {
  getManagersPaginated,
  createManager,
  updateManager,
  deleteManager
} from '../services/managerService';

import { getActiveDepartments } from '../services/departmentService';

function ManagerList() {
  const [managers, setManagers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('firstName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [departmentLoading, setDepartmentLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentManager, setCurrentManager] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    departmentId: '',
    isActive: true,
    password: '',
    confirmPassword: '',
    profileImagePath: '',
    profileImageFile: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const columnMap = {
    'Full Name': 'firstName',
    'Email': 'email',
    'Department': 'departmentName',
    'Status': 'isActive'
  };

  const fetchManagers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getManagersPaginated({
        page: page + 1,
        pageSize,
        sortColumn,
        sortDirection,
        searchTerm,
      });

      setManagers(data.items);
      setTotalCount(data.totalCount);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load managers';
      setSnackbar({ open: true, message: errorMsg, severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortColumn, sortDirection, searchTerm]);

  const fetchDepartments = async () => {
    setDepartmentLoading(true);
    try {
      const data = await getActiveDepartments();
      setDepartments(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to load departments',
        severity: 'error'
      });
    } finally {
      setDepartmentLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchManagers();
  }, [fetchManagers]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const validateManager = (isEdit = false) => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.match(/^\S+@\S+\.\S+$/)) errors.email = 'Valid email is required';
    if (!formData.departmentId) errors.departmentId = 'Department is required';

    if (!isEdit || formData.password || formData.confirmPassword) {
      if (formData.password.length < 6) errors.password = 'Password must be at least 6 characters';
      if (formData.password !== formData.confirmPassword) errors.confirmPassword = 'Passwords do not match';
    }
    return Object.keys(errors).length === 0 ? null : errors;
  };

  const handleOpenDialog = (manager = null) => {
    setFormData(manager ? {
      id: manager.id,
      firstName: manager.firstName || '',
      lastName: manager.lastName || '',
      email: manager.email || '',
      phoneNumber: manager.phoneNumber || '',
      departmentId: manager.departmentId || '',
      isActive: manager.isActive ?? true,
      password: '',
      confirmPassword: '',
      profileImagePath: manager.profileImagePath || '',
      profileImageFile: null
    } : {
      id: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      departmentId: '',
      isActive: true,
      password: '',
      confirmPassword: '',
      profileImagePath: '',
      profileImageFile: null
    });
    setCurrentManager(manager);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (!isSubmitting) {
      setOpenDialog(false);
      setCurrentManager(null);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setFormData(prev => ({
        ...prev,
        profileImagePath: imageUrl,
        profileImageFile: file
      }));
    }
  };

  const handleSubmit = async () => {
    const errors = validateManager(!!currentManager);
    if (errors) {
      const firstError = Object.values(errors)[0];
      showSnackbar(firstError, 'error');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('FirstName', formData.firstName);
    formDataToSend.append('LastName', formData.lastName);
    formDataToSend.append('Email', formData.email);
    formDataToSend.append('PhoneNumber', formData.phoneNumber);
    formDataToSend.append('DepartmentId', formData.departmentId);
    formDataToSend.append('IsActive', formData.isActive.toString());
    if (formData.password) {
      formDataToSend.append('Password', formData.password);
      formDataToSend.append('ConfirmPassword', formData.confirmPassword);
    }
    if (formData.profileImageFile) {
      formDataToSend.append('ProfileImage', formData.profileImageFile);
    }

    setIsSubmitting(true);
    try {
      if (currentManager) {
        await updateManager(currentManager.id, formDataToSend);
        showSnackbar('Manager updated successfully', 'success');
      } else {
        await createManager(formDataToSend);
        showSnackbar('Manager created successfully', 'success');
      }
      handleCloseDialog();
      fetchManagers();
    } catch (err) {
      console.error("Operation failed", err.response?.data);
      const errorMsg = err.response?.data?.message || err.response?.data?.title || err.message || 'Operation failed';
      showSnackbar(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!id) {
      showSnackbar('Invalid manager ID', 'error');
      return;
    }

    const confirmDelete = window.confirm('Are you sure you want to delete this manager?');
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await deleteManager(id);
      showSnackbar('Manager deleted successfully', 'success');
      fetchManagers();
    } catch (error) {
      console.error("Delete failed:", error);
      const errorMsg = error.response?.data?.message || error.message || 'Delete failed';
      showSnackbar(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => setPage(newPage);
  const handlePageSizeChange = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (columnKey) => {
    const backendColumn = columnMap[columnKey] || 'firstName';
    if (sortColumn === backendColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(backendColumn);
      setSortDirection('asc');
    }
    setPage(0);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setPage(0);
  };

  const renderSortIcon = (columnKey) => {
    const backendColumn = columnMap[columnKey];
    if (sortColumn !== backendColumn) return null;
    return sortDirection === 'asc' ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />;
  };

  return (
    <Box sx={{ padding: 3 }}>
      {/* Header & Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <PersonIcon />
          </Avatar>
          <h1 style={{ margin: 0 }}>Manager Management</h1>
        </Box>

        <TextField
          label="Search"
          value={searchTerm}
          onChange={handleSearchChange}
          variant="outlined"
          size="small"
          sx={{ width: 300, mr: 2 }}
        />

        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog(null)}
        >
          Add Manager
        </Button>
      </Box>

      {/* Manager Table */}
      <TableContainer component={Paper} elevation={3} sx={{ mb: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell
                sx={{ color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => handleSort('Full Name')}
              >
                Full Name {renderSortIcon('Full Name')}
              </TableCell>
              <TableCell
                sx={{ color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => handleSort('Email')}
              >
                Email {renderSortIcon('Email')}
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Phone</TableCell>
              <TableCell
                sx={{ color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => handleSort('Department')}
              >
                Department {renderSortIcon('Department')}
              </TableCell>
              <TableCell
                sx={{ color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
                onClick={() => handleSort('Status')}
              >
                Status {renderSortIcon('Status')}
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : managers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  No managers found
                </TableCell>
              </TableRow>
            ) : (
              managers.map(manager => (
                <TableRow key={manager.id || manager.email}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Avatar 
src={
  manager.profileImagePath
    ? (manager.profileImagePath.startsWith('http')
        ? manager.profileImagePath
        : `${process.env.REACT_APP_API_URL.replace(/\/api$/, '')}/${manager.profileImagePath.replace(/^\/?/, '')}`
      )
    : ''
}

                        sx={{ width: 40, height: 40, mr: 2 }}
                        alt={`${manager.firstName} ${manager.lastName}`}
                      >
                        {manager.firstName?.charAt(0)}{manager.lastName?.charAt(0)}
                      </Avatar>
                      {`${manager.firstName} ${manager.lastName}`}
                    </Box>
                  </TableCell>
                  <TableCell>{manager.email}</TableCell>
                  <TableCell>{manager.phoneNumber || '-'}</TableCell>
                  <TableCell>{manager.departmentName || 'Unassigned'}</TableCell>
                  <TableCell>
                    {manager.isActive ? (
                      <Chip icon={<ActiveIcon />} label="Active" color="success" variant="outlined" />
                    ) : (
                      <Chip icon={<InactiveIcon />} label="Inactive" color="error" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton color="primary" onClick={() => handleOpenDialog(manager)} sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleDelete(manager.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>

          <TableFooter>
            <TableRow>
              <TablePagination
                count={totalCount}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={pageSize}
                onRowsPerPageChange={handlePageSizeChange}
                rowsPerPageOptions={[5, 10, 25, 50]}
                labelRowsPerPage="Managers per page"
                showFirstButton
                showLastButton
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentManager ? 'Edit Manager' : 'Add Manager'}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Avatar 
              src={formData.profileImagePath} 
              sx={{ width: 100, height: 100 }}
            >
              {formData.firstName?.charAt(0)}{formData.lastName?.charAt(0)}
            </Avatar>
          </Box>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            sx={{ mb: 2 }}
          >
            Upload Profile Image
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileChange}
            />
          </Button>
          <TextField
            autoFocus
            margin="dense"
            label="First Name"
            name="firstName"
            fullWidth
            variant="outlined"
            value={formData.firstName}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Last Name"
            name="lastName"
            fullWidth
            variant="outlined"
            value={formData.lastName}
            onChange={handleChange}
            required
            disabled={isSubmitting}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Email"
            name="email"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={!!currentManager || isSubmitting}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Phone Number"
            name="phoneNumber"
            fullWidth
            variant="outlined"
            value={formData.phoneNumber}
            onChange={handleChange}
            disabled={isSubmitting}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth margin="dense" required sx={{ mb: 2 }}>
            <InputLabel>Department</InputLabel>
            <Select
              name="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              label="Department"
              disabled={isSubmitting || departmentLoading}
            >
              {departments.map(dept => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                color="primary"
                disabled={isSubmitting}
              />
            }
            label="Active Manager"
            sx={{ mb: 2 }}
          />

          <TextField
            margin="dense"
            label={currentManager ? "New Password" : "Password"}
            name="password"
            type="password"
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={handleChange}
            disabled={isSubmitting}
            sx={{ mb: 2 }}
            helperText={currentManager ? "Leave blank to keep current password" : ""}
          />
          <TextField
            margin="dense"
            label={currentManager ? "Confirm New Password" : "Confirm Password"}
            name="confirmPassword"
            type="password"
            fullWidth
            variant="outlined"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isSubmitting}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} startIcon={<CloseIcon />} color="secondary" disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            startIcon={<CheckIcon />}
            color="primary"
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : (currentManager ? 'Update' : 'Create')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ManagerList;