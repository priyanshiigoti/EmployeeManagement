import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment
} from '../services/departmentService';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TextField, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Tooltip, Snackbar, Alert, CircularProgress, Avatar, Chip,
  Checkbox, FormControlLabel, TableSortLabel, Pagination, Select, MenuItem, InputLabel, FormControl
} from '@mui/material';
import {
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Check as CheckIcon, 
  Close as CloseIcon, 
  Groups as DepartmentsIcon,
  Search as SearchIcon
} from '@mui/icons-material';

function DepartmentList() {
  const [pagedData, setPagedData] = useState({
    items: [],
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalCount: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState(null);
  const [departmentName, setDepartmentName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  
  const [pagination, setPagination] = useState({
  page: 1,
  pageSize: 10,
});

  const [sorting, setSorting] = useState({
    column: 'Name',
    direction: 'asc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const fetchDepartments = async () => {
  setLoading(true);
  try {
    const params = {
  draw: 1, // or just hardcoded 1
      page: pagination.page,
      pageSize: pagination.pageSize,
      sortColumn: sorting.column,
      sortDirection: sorting.direction,
      searchTerm: searchTerm
    };

    const data = await getDepartments(params);

    setPagedData({
      items: data.items,
      currentPage: data.currentPage,
      totalPages: data.totalPages,
      pageSize: data.pageSize,
      totalCount: data.totalCount
    });

    } catch (err) {
    setError(err.message);
    showSnackbar(err.message || 'Failed to load departments', 'error');
  } finally {
    setLoading(false);
  }
};


  useEffect(() => {
    fetchDepartments();
  }, [pagination, sorting, searchTerm]);

  const handlePageChange = (event, newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  const handlePageSizeChange = (e) => {
    setPagination({
      page: 1,
      pageSize: Number(e.target.value)
    });
  };

  const handleSort = (frontendColumn) => {
    // Map frontend column names to backend property names
    const columnMapping = {
      'Department Name': 'Name',
      'Description': 'Description',
      'Is Active': 'IsActive'
    };

    const backendColumn = columnMapping[frontendColumn] || 'Name';

    setSorting(prev => ({
      column: backendColumn,
      direction: prev.column === backendColumn && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const validateDepartment = () => {
    if (!departmentName.trim()) return 'Department name is required';
    if (departmentName.length < 3) return 'Name must be at least 3 characters';
    if (departmentName.length > 50) return 'Name cannot exceed 50 characters';
    return null;
  };

  const handleOpenDialog = (dept = null) => {
    setCurrentDepartment(dept);
    setDepartmentName(dept ? dept.name : '');
    setDescription(dept ? dept.description || '' : '');
    setIsActive(dept ? dept.isActive : true);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentDepartment(null);
    setDepartmentName('');
    setDescription('');
    setIsActive(true);
  };

  const handleSubmit = async () => {
    const validationError = validateDepartment();
    if (validationError) {
      showSnackbar(validationError, 'error');
      return;
    }

    const departmentData = {
      name: departmentName,
      description,
      isActive
    };

    setIsSubmitting(true);
    try {
      if (currentDepartment) {
        await updateDepartment(currentDepartment.id, departmentData);
        showSnackbar('Department updated successfully', 'success');
      } else {
        await createDepartment(departmentData);
        showSnackbar('Department created successfully', 'success');
      }
      handleCloseDialog();
      fetchDepartments();
     } catch (err) {
  console.error('Full error response:', err.response);

  let errorMsg = 'Operation failed';

  if (err.response) {
    const data = err.response.data;

    if (typeof data === 'string') {
      // Sometimes backend might return plain text error
      errorMsg = data;
    } else if (data) {
      if (data.message) {
        // Your backend message property
        errorMsg = data.message;
      } else if (data.errors && typeof data.errors === 'object') {
        // Model validation errors, flatten all messages into one string
        errorMsg = Object.values(data.errors)
          .flat()
          .join(', ');
      } else {
        // Fallback stringify unknown error shape
        errorMsg = JSON.stringify(data);
      }
    }
  }

  showSnackbar(errorMsg, 'error');
}


 finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      try {
        await deleteDepartment(id);
        fetchDepartments();
        showSnackbar('Department deleted successfully', 'success');
      } catch (error) {
        let errorMsg = 'Delete failed';
        if (error.response) {
          if (error.response.status === 409) {
            errorMsg = 'Cannot delete: Department is in use';
          } else if (error.response.data && error.response.data.message) {
            errorMsg = error.response.data.message;
          }
        }
        showSnackbar(errorMsg, 'error');
      }
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
            <DepartmentsIcon />
          </Avatar>
          <h1 style={{ margin: 0 }}>Department Management</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', marginTop: '16px', width: '100%' }}>
          <TextField
            variant="outlined"
            placeholder="Search departments..."
            size="small"
            fullWidth
            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment: <SearchIcon color="action" />
            }}
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Add Department
          </Button>
        </div>
      </div>

      <TableContainer component={Paper} elevation={3} sx={{ mb: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: 'primary.main' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={sorting.column === 'Name'}
                  direction={sorting.column === 'Name' ? sorting.direction : 'asc'}
                  onClick={() => handleSort('Department Name')}
                >
                  Department Name
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={sorting.column === 'Description'}
                  direction={sorting.column === 'Description' ? sorting.direction : 'asc'}
                  onClick={() => handleSort('Description')}
                >
                  Description
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>
                <TableSortLabel
                  active={sorting.column === 'IsActive'}
                  direction={sorting.column === 'IsActive' ? sorting.direction : 'asc'}
                  onClick={() => handleSort('Is Active')}
                >
                  Is Active
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : pagedData.items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  No departments found
                </TableCell>
              </TableRow>
            ) : (
              pagedData.items.map((dept) => (
                <TableRow key={dept.id} hover>
                  <TableCell>
                    <Chip label={dept.name} color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell>{dept.description || '—'}</TableCell>
                  <TableCell>{dept.isActive ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton color="primary" onClick={() => handleOpenDialog(dept)} sx={{ mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleDelete(dept.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Page Size</InputLabel>
            <Select
              value={pagination.pageSize}
              onChange={handlePageSizeChange}
              label="Page Size"
            >
              {[5, 10, 20, 50].map(size => (
                <MenuItem key={size} value={size}>
                  {size} per page
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <span>
            Showing {(pagination.page - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(pagination.page * pagination.pageSize, pagedData.totalCount)} of{' '}
            {pagedData.totalCount} departments
          </span>
        </div>
        
        <Pagination
          count={pagedData.totalPages}
          page={pagination.page}
          onChange={handlePageChange}
          color="primary"
          showFirstButton
          showLastButton
        />
      </div>

      {/* Department Form Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{currentDepartment ? 'Edit Department' : 'Add Department'}</DialogTitle>
        <DialogContent sx={{ pt: 2, minWidth: 400 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Department Name"
            fullWidth
            variant="outlined"
            value={departmentName}
            onChange={(e) => setDepartmentName(e.target.value)}
            error={!!validateDepartment()}
            helperText={validateDepartment()}
            disabled={isSubmitting}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            variant="outlined"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={3}
            disabled={isSubmitting}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                disabled={isSubmitting}
              />
            }
            label="Is Active"
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDialog} 
            startIcon={<CloseIcon />} 
            color="secondary" 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            startIcon={<CheckIcon />}
            color="primary"
            variant="contained"
            disabled={isSubmitting || !!validateDepartment()}
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : currentDepartment ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity} 
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default DepartmentList;