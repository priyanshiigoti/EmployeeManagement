import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Tooltip, Snackbar, Alert, CircularProgress, Avatar, Chip,
  Checkbox, FormControl, InputLabel, Select, MenuItem, FormControlLabel,
  TableFooter, TablePagination
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
  getEmployeesPaginated,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../services/employeeService';

import api from '../axiosConfig'; // adjust the path as needed

function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0); // zero-based index for MUI TablePagination
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState('Name'); // backend expects field names
  const [sortDirection, setSortDirection] = useState('asc');
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [departmentLoading, setDepartmentLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    departmentId: '',
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Map frontend visible column names to backend property names for sorting
  const columnMap = {
    'Full Name': 'Name',
    'Email': 'Email',
    'Department': 'DepartmentName', // Adjust if backend property differs
    'Status': 'IsActive'
  };

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEmployeesPaginated({
        page: page + 1,          // backend page is 1-based
        pageSize,
        sortColumn,
        sortDirection,
        searchTerm,
      });
      setEmployees(data.items || []);
      setTotalCount(data.totalCount || 0);
      setError(null);
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to load employees';
      setError(errorMsg);
      showSnackbar(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, sortColumn, sortDirection, searchTerm]);

 const fetchDepartments = async () => {
  setDepartmentLoading(true);
  try {
    const response = await api.get('/Employee/active');
    setDepartments(response.data);
  } catch (error) {
    console.error('Failed to fetch departments:', error);
  } finally {
    setDepartmentLoading(false);
  }
};

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const validateEmployee = () => {
    if (!formData.firstName.trim()) return 'First name is required';
    if (!formData.lastName.trim()) return 'Last name is required';
    if (formData.firstName.length < 2) return 'First name must be at least 2 characters';
    if (formData.lastName.length < 2) return 'Last name must be at least 2 characters';
    if (!formData.email.match(/^\S+@\S+\.\S+$/)) return 'Valid email is required';
    if (!formData.departmentId) return 'Department is required';
    return null;
  };

  const handleOpenDialog = (emp = null) => {
    setFormData(emp ? {
      firstName: emp.firstName || '',
      lastName: emp.lastName || '',
      email: emp.email || '',
      phoneNumber: emp.phoneNumber || '',
      departmentId: emp.departmentId || '',
      isActive: emp.isActive ?? true,
    } : {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      departmentId: '',
      isActive: true,
    });
    setCurrentEmployee(emp);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentEmployee(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    const validationError = validateEmployee();
    if (validationError) {
      showSnackbar(validationError, 'error');
      return;
    }

    const employeeData = {
      id: currentEmployee?.id,
      userId: currentEmployee?.userId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: formData.phoneNumber,
      departmentId: formData.departmentId,
      isActive: formData.isActive,
    };

    setIsSubmitting(true);
    try {
      if (currentEmployee) {
        await updateEmployee(currentEmployee.id, employeeData);
        showSnackbar('Employee updated successfully', 'success');
      } else {
        await createEmployee(employeeData);
        showSnackbar('Employee created successfully', 'success');
      }
      handleCloseDialog();
      fetchEmployees();
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Operation failed';
      showSnackbar(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

 const handleDelete = async (id) => {
  if (!window.confirm('Are you sure you want to delete this employee?')) return;

  try {
    const response = await deleteEmployee(id);
    alert(response.message); // or use Snackbar
    fetchEmployees(); // refresh list
  } catch (error) {
    if (error.response?.data) {
      alert(error.response.data); // show backend error message
    } else {
      alert("An error occurred while deleting.");
    }
  }
};

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSort = (columnKey) => {
    const backendColumn = columnMap[columnKey] || 'Name';
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
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}><PersonIcon /></Avatar>
          <h1 style={{ margin: 0 }}>Employee Management</h1>
        </div>

        <TextField
          label="Search"
          value={searchTerm}
          onChange={handleSearchChange}
          variant="outlined"
          size="small"
          sx={{ width: 300 }}
        />
      </div>

      <TableContainer component={Paper} elevation={3} sx={{ mb: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleSort('Full Name')}>
                Full Name {renderSortIcon('Full Name')}
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleSort('Email')}>
                Email {renderSortIcon('Email')}
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Phone</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleSort('Department')}>
                Department {renderSortIcon('Department')}
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold', cursor: 'pointer' }} onClick={() => handleSort('Status')}>
                Status {renderSortIcon('Status')}
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : employees.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  No employees found
                </TableCell>
              </TableRow>
            ) : (
              employees.map((emp) => (
                <TableRow key={emp.id} hover>
                  <TableCell>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
  src={
    emp.profileImagePath
      ? `${process.env.REACT_APP_API_URL.replace(/\/api$/, '')}/${emp.profileImagePath.replace(/^\/?/, '')}`
      : undefined
  }
  sx={{ width: 40, height: 40, mr: 2 }}
>
  {!emp.profileImagePath &&
    `${emp.firstName?.charAt(0) ?? ''}${emp.lastName?.charAt(0) ?? ''}`}
</Avatar>

                      {`${emp.firstName} ${emp.lastName}`}
                    </div>
                  </TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>{emp.phoneNumber || '-'}</TableCell>
                  <TableCell>
                    <Chip
                      label={emp.departmentName || 'Unassigned'}
                      color={emp.departmentName ? 'primary' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {emp.isActive ? (
                      <Chip icon={<ActiveIcon />} label="Active" color="success" variant="outlined" />
                    ) : (
                      <Chip icon={<InactiveIcon />} label="Inactive" color="error" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton color="primary" onClick={() => handleOpenDialog(emp)} sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleDelete(emp.id)}>
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
                labelRowsPerPage="Employees per page"
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentEmployee ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
       <DialogContent sx={{ pt: 2, minWidth: 400 }}>
  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
  <Avatar
  src={
    currentEmployee?.profileImagePath
      ? `${process.env.REACT_APP_API_URL.replace(/\/api$/, '')}/${currentEmployee.profileImagePath.replace(/^\/?/, '')}`
      : undefined
  }
  sx={{ width: 100, height: 100 }}
>
  {currentEmployee?.firstName?.charAt(0)}
  {currentEmployee?.lastName?.charAt(0)}
</Avatar>

  </div>

  {/* Rest of the form fields below */}
  <TextField
    margin="dense"
    label="First Name"
    fullWidth
    name="firstName"
    value={formData.firstName}
    onChange={handleChange}
    required
  />
  <TextField
    margin="dense"
    label="Last Name"
    fullWidth
    name="lastName"
    value={formData.lastName}
    onChange={handleChange}
    required
  />
  <TextField
    margin="dense"
    label="Email"
    fullWidth
    name="email"
    type="email"
    value={formData.email}
    onChange={handleChange}
    required
      InputProps={{ readOnly: true }}  // <-- added this line

  />
  <TextField
    margin="dense"
    label="Phone Number"
    fullWidth
    name="phoneNumber"
    value={formData.phoneNumber}
    onChange={handleChange}
  />
  <FormControl fullWidth margin="dense">
    <InputLabel>Department</InputLabel>
    <Select
      name="departmentId"
      value={formData.departmentId}
      onChange={handleChange}
      required
    >
      {departments.map((dept) => (
        <MenuItem key={dept.id} value={dept.id}>
          {dept.name}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
  <FormControlLabel
    control={
      <Checkbox
        checked={formData.isActive}
        onChange={handleChange}
        name="isActive"
      />
    }
    label="Active"
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
            {isSubmitting ? <CircularProgress size={24} color="inherit" /> : currentEmployee ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default EmployeeList;
