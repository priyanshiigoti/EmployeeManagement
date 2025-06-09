import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getAuthHeader } from '../services/authService';
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

const EditManager = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    departmentId: '',
    isActive: false
  });
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
useEffect(() => {
  const fetchData = async () => {
    try {
      setLoading(true); // Start loading

      // Fetch manager data
      const response = await axios.get(
        `https://localhost:7231/api/Employee/manager/${id}`,
        { headers: getAuthHeader() }
      );
      const manager = response.data;

      // Set form data including isActive, ensure no undefined fields
      setFormData({
        firstName: manager.firstName || "",
        lastName: manager.lastName || "",
        email: manager.email || "",
        phoneNumber: manager.phoneNumber || "",
        departmentId: manager.departmentId || "",
        isActive: manager.isActive ?? false,
        password: "",
        confirmPassword: "",
      });

      // Fetch departments
      const deptsResponse = await axios.get(
        "https://localhost:7231/api/Employee/active-departments",
        { headers: getAuthHeader() }
      );

      // Assuming departments come as an array directly or under `items`
      setDepartments(deptsResponse.data.items || deptsResponse.data || []);
    } catch (err) {
      setError("Failed to load manager details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev, 
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    try {
      await axios.put(
        `https://localhost:7231/api/Employee/manager/${id}`,
        formData, 
        { headers: getAuthHeader() }
      );
      navigate('/managers');
    } catch (err) {
      // FIX: Properly extract error message from response
      let errorMessage = 'Failed to update manager';
      
      if (err.response) {
        // Handle ASP.NET Core ProblemDetails format
        if (err.response.data && typeof err.response.data === 'object') {
          errorMessage = err.response.data.title || 
                        err.response.data.message || 
                        JSON.stringify(err.response.data);
        } 
        // Handle string errors
        else if (typeof err.response.data === 'string') {
          errorMessage = err.response.data;
        }
        // Handle status-only errors
        else {
          errorMessage = err.response.statusText || `Error ${err.response.status}`;
        }
      } 
      // Handle network errors
      else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
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
        <Typography variant="h4" gutterBottom>Edit Manager</Typography>
        
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
          </FormControl>

          <FormControlLabel
            control={
              <Checkbox
                checked={formData.isActive}
                onChange={handleChange}
                name="isActive"
                color="primary"
              />
            }
            label="Is Active"
            sx={{ mt: 2 }}
          />
          
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={submitting}
            fullWidth
            sx={{ mt: 2, height: '50px' }}
          >
            {submitting ? <CircularProgress size={24} /> : 'Update Manager'}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default EditManager;