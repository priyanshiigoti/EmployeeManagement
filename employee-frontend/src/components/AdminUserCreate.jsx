import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';

const AdminUserCreate = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'Employee',
    departmentId: ''
  });

  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await axios.get('/api/Department');
        setDepartments(response.data);
      } catch (error) {
        console.error('Failed to load departments', error);
      }
    };
    
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors([]);
    
    // Client validation
    const newErrors = [];
    if (formData.password !== formData.confirmPassword) {
      newErrors.push('Passwords do not match');
    }
    if (newErrors.length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        ...formData,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null
      };

      const response = await axios.post('/api/Account/RegisterByAdmin', payload);
      
      if (response.status === 200) {
        setSuccessMessage('User created successfully!');
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error) {
      console.error('Registration error:', error.response);
      if (error.response?.data?.errors) {
        setErrors(Object.values(error.response.data.errors).flat());
      } else {
        setErrors(['Registration failed. Please try again.']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h3 className="mb-0">Create New User</h3>
            </div>
            <div className="card-body">
              {successMessage && (
                <div className="alert alert-success">{successMessage}</div>
              )}
              
              {errors.length > 0 && (
                <div className="alert alert-danger">
                  <ul className="mb-0">
                    {errors.map((error, i) => <li key={i}>{error}</li>)}
                  </ul>
                </div>
              )}
              
              <form onSubmit={handleSubmit}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">First Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Last Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Confirm Password *</label>
                    <input
                      type="password"
                      className="form-control"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Role *</label>
                  <select
                    className="form-select"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    required
                  >
                    <option value="Employee">Employee</option>
                    <option value="Manager">Manager</option>
                    <option value="Admin">Admin</option>
                  </select>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    name="departmentId"
                    value={formData.departmentId}
                    onChange={handleChange}
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="d-grid">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Creating User...
                      </>
                    ) : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserCreate;