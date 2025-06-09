import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getAuthHeader } from "../services/authService";
import {
  Box,
  Button,
  TextField,
  Typography,
  FormControlLabel,
  Checkbox,
  Alert,
  MenuItem,
  CircularProgress,
} from "@mui/material";

const AddManager = () => {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingDepartments, setFetchingDepartments] = useState(true);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    departmentId: "",
    isActive: true,
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get(
          "https://localhost:7231/api/Employee/active-departments",
          { headers: getAuthHeader() }
        );
        setDepartments(response.data);
      } catch (error) {
        setError("Failed to load departments.");
      } finally {
        setFetchingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = "First name is required";
    if (!formData.lastName.trim()) errors.lastName = "Last name is required";
    if (!formData.email.trim()) errors.email = "Email is required";
    else if (
      !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email.trim())
    )
      errors.email = "Invalid email address";

    if (!formData.departmentId) errors.departmentId = "Department is required";

    if (!formData.password) errors.password = "Password is required";
    else if (formData.password.length < 6)
      errors.password = "Password must be at least 6 characters";

    if (!formData.confirmPassword)
      errors.confirmPassword = "Please confirm your password";
    else if (formData.password !== formData.confirmPassword)
      errors.confirmPassword = "Passwords do not match";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const postData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        departmentId: parseInt(formData.departmentId, 10),
        isActive: formData.isActive,
        password: formData.password,
      };

      const response = await axios.post(
        "https://localhost:7231/api/Employee/manager",
        postData,
        { headers: getAuthHeader() }
      );

      if (response.status === 200) {
        navigate("/managers");
      }
    } catch (err) {
      if (err.response) {
        if (err.response.data && err.response.data.Message) {
          setError(err.response.data.Message);
        } else if (err.response.data && err.response.data.errors) {
          const backendErrors = {};
          Object.entries(err.response.data.errors).forEach(([key, value]) => {
            backendErrors[key] = value.join(", ");
          });
          setFormErrors(backendErrors);
        }
      } else {
        setError("Network error. Please check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchingDepartments) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress size={50} />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 600, mx: "auto", p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Add New Manager
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="First Name"
          name="firstName"
          value={formData.firstName}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={!!formErrors.firstName}
          helperText={formErrors.firstName || " "}
          required
        />

        <TextField
          label="Last Name"
          name="lastName"
          value={formData.lastName}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={!!formErrors.lastName}
          helperText={formErrors.lastName || " "}
          required
        />

        <TextField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={!!formErrors.email}
          helperText={formErrors.email || " "}
          required
        />

        <TextField
          label="Phone Number"
          name="phoneNumber"
          value={formData.phoneNumber}
          onChange={handleChange}
          fullWidth
          margin="normal"
          placeholder="+1234567890"
          helperText=" "
        />

        <TextField
          label="Department"
          name="departmentId"
          select
          value={formData.departmentId}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={!!formErrors.departmentId}
          helperText={formErrors.departmentId || " "}
          required
        >
          {departments.map((dept) => (
            <MenuItem key={dept.id} value={dept.id}>
              {dept.name}
            </MenuItem>
          ))}
        </TextField>

        <FormControlLabel
          control={
            <Checkbox
              checked={formData.isActive}
              onChange={handleChange}
              name="isActive"
              color="primary"
            />
          }
          label="Active"
          sx={{ mt: 1, mb: 2 }}
        />

        <TextField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={!!formErrors.password}
          helperText={formErrors.password || "Must be at least 6 characters"}
          required
        />

        <TextField
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          fullWidth
          margin="normal"
          error={!!formErrors.confirmPassword}
          helperText={formErrors.confirmPassword || " "}
          required
        />

        <Box sx={{ mt: 3, display: "flex", justifyContent: "space-between" }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/managers")}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            type="submit"
            color="primary"
            disabled={loading}
            sx={{ minWidth: 140 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Save Manager"}
          </Button>
        </Box>
      </form>
    </Box>
  );
};

export default AddManager;
