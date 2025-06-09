import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../axiosConfig';

const RegisterEmployee = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    departmentId: '',
    role: 'Employee',
  });

  const [departments, setDepartments] = useState([]);
  const [errors, setErrors] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
const response = await axios.get('Employee/active');
        setDepartments(response.data);
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSuccessMessage('');
    setIsSubmitting(true);

    if (formData.password !== formData.confirmPassword) {
      setErrors(['Passwords do not match.']);
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        role: formData.role,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
      };

      const response = await axios.post('Account/RegisterEmployee', payload, {
        headers: { 'Skip-Auth': 'true' },  // <---- HERE is the key change
      });

      if (response.status === 200 || response.status === 201) {
        setSuccessMessage('Account created successfully! Check your mail!');
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.data?.errors) {
        setErrors(Object.values(error.response.data.errors).flat());
      } else if (error.response?.data?.title) {
        setErrors([error.response.data.title]);
      } else {
        setErrors(['Registration failed. Please try again.']);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{
      backgroundColor: '#f0f5ff',
      backgroundImage: 'linear-gradient(120deg, #e0f0ff 0%, #f8fbff 100%)'
    }}>
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-7">
            <div className="card border-0 shadow rounded-4 overflow-hidden">
              <div className="card-header bg-primary text-white text-center py-4">
                <h2 className="mb-0 fw-bold">Create Account</h2>
                <p className="mb-0 opacity-75">Join our employee management system</p>
              </div>

              <div className="card-body p-4 p-lg-5">
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

                <form onSubmit={handleSubmit} className="mt-3">
                  {/* First & Last Name */}
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <label className="form-label text-primary">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="col-md-6 mb-4">
                      <label className="form-label text-primary">Last Name</label>
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

                  {/* Email */}
                  <div className="mb-4">
                    <label className="form-label text-primary">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  {/* Phone Number */}
                  <div className="mb-4">
                    <label className="form-label text-primary">Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="row">
                    <div className="col-md-6 mb-4">
                      <label className="form-label text-primary">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                      />
                      <div className="form-text">At least 6 characters</div>
                    </div>

                    <div className="col-md-6 mb-4">
                      <label className="form-label text-primary">Confirm Password</label>
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

                  {/* Department */}
                  <div className="mb-4">
                    <label className="form-label text-primary">Department</label>
                    <select
                      className="form-select"
                      name="departmentId"
                      value={formData.departmentId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role hidden */}
                  <input type="hidden" name="role" value={formData.role} />

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-bold"
                    disabled={isSubmitting}
                  >
                    {isSubmitting && (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    )}
                    {isSubmitting ? 'Creating Account...' : 'Create Account'}
                  </button>
                </form>

                <div className="text-center mt-4 pt-3 border-top">
                  <p className="text-muted mb-0">Already have an account?</p>
                  <Link to="/login" className="btn btn-outline-primary mt-2">
                    Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterEmployee;
