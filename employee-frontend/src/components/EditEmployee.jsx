import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEmployee, updateEmployee } from '../services/employeeService';
import { 
  TextField, 
  Button, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Container, 
  Typography, 
  Box, 
  CircularProgress,
  Alert,
  FormControlLabel,
  Checkbox
} from '@mui/material';
import axios from '../axiosConfig';

const EditEmployee = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    id: parseInt(id),
    userId: '',
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    departmentId: '',
    isActive: true
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [departmentLoading, setDepartmentLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch employee data
        const employee = await getEmployee(id);
        setFormData({
          id: employee.id,
          userId: employee.userId,
          firstName: employee.firstName,
          lastName: employee.lastName,
          email: employee.email,
          phoneNumber: employee.phoneNumber,
          departmentId: employee.departmentId,
          isActive: employee.isActive
        });
        
      } catch (err) {
        const errorMsg = 
          err.response?.data?.title || 
          err.response?.data?.message || 
          'Failed to load employee data';
        setError(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id]);

 useEffect(() => {
  const fetchDepartments = async () => {
    try {
      const response = await axios.get('https://localhost:7231/api/Employee/active-departments');
      setDepartments(response.data);
    } catch (error) {
      console.error('Failed to fetch departments:', error);
    } finally {
      setDepartmentLoading(false);  // stop loading spinner here
    }
  };
  fetchDepartments();
}, []);



  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Convert departmentId to number
    const finalValue = name === 'departmentId' 
      ? parseInt(value, 10) 
      : type === 'checkbox' 
        ? checked 
        : value;
    
    setFormData(prev => ({
      ...prev, 
      [name]: finalValue
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Prepare clean payload with only necessary fields
      const payload = {
        id: formData.id,
        userId: formData.userId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        departmentId: formData.departmentId,
        isActive: formData.isActive
      };

      await updateEmployee(id, payload);
      navigate('/employees');
    } catch (err) {
      if (err.response?.data?.errors) {
        // Handle validation errors
        const messages = Object.values(err.response.data.errors)
          .flat()
          .join(' ');
        setError(messages);
      } else if (err.response?.data) {
        // Handle API error responses
        const errorData = err.response.data;
        const errorMsg = 
          errorData.title || 
          errorData.message || 
          'Failed to update employee';
        setError(errorMsg);
      } else {
        // Handle network/other errors
        setError('Network error. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>Edit Employee</Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            margin="normal"
          />
          
          <TextField
            fullWidth
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            required
            margin="normal"
            disabled
          />
          
          <TextField
            fullWidth
            label="Phone Number"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            margin="normal"
          />
          
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Department</InputLabel>
            {departmentLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : (
              <Select
                name="departmentId"
                value={formData.departmentId}
                onChange={handleChange}
                label="Department"
              >
                {departments.map(dept => (
                  <MenuItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </MenuItem>
                ))}
              </Select>
            )}
          </FormControl>
          
          <FormControlLabel
            control={
              <Checkbox 
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                color="primary"
              />
            }
            label="Active Employee"
            sx={{ mt: 2, mb: 2 }}
          />
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              color="secondary"
              fullWidth
              onClick={() => navigate('/employees')}
              sx={{ height: '50px' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting || departmentLoading}
              fullWidth
              sx={{ height: '50px' }}
            >
              {submitting ? <CircularProgress size={24} /> : 'Update Employee'}
            </Button>
          </Box>
        </form>
      </Box>
    </Container>
  );
};

export default EditEmployee;