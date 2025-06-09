import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService';

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = 'Email is invalid';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  setIsLoading(true);
  try {
    const response = await login(email, password);
    onLoginSuccess();

    const roles = response.roles || [];
    if (roles.includes('Admin')) {
      navigate('/admin/dashboard');
    } else if (roles.includes('Manager')) {
      navigate('/manager/dashboard');
    } else if (roles.includes('Employee')) {
      navigate('/employee/dashboard');
    } else {
      navigate('/');
    }
  } catch (err) {
  let errorMessage = 'Invalid credentials. Please try again.';

  if (err.response) {
    const data = err.response.data;
    if (data?.message) {
      errorMessage = data.message;
    } else if (typeof data === 'string') {
      errorMessage = data;
    }
  } else if (err.message) {
    errorMessage = err.message;
  }

  console.error('Login error:', err);
  setErrors({ general: errorMessage });
}

};


  return (
    <div className="container d-flex align-items-center justify-content-center min-vh-100" style={{ backgroundColor: '#f8faff' }}>
      <div className="col-md-6 col-lg-5">
        <div className="card shadow-sm border-0 rounded-4">
          <div className="card-body p-4 p-md-5">
            <h2 className="text-center mb-4" style={{ color: '#0d6efd', fontWeight: '700' }}>Sign In</h2>

            {errors.general && (
              <div className="alert alert-danger text-center">{errors.general}</div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-semibold">
                  Email address
                </label>
                <input
                  type="email"
                  className={`form-control ${errors.email ? 'is-invalid' : ''}`}
                  id="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                {errors.email && <div className="invalid-feedback">{errors.email}</div>}
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <label htmlFor="password" className="form-label fw-semibold">
                    Password
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="text-decoration-none text-end"
                    style={{ color: '#0d6efd', fontSize: '0.875rem' }}
                  >
                    Forgot Password?
                  </Link>
                </div>
                <input
                  type="password"
                  className={`form-control ${errors.password ? 'is-invalid' : ''}`}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                {errors.password && <div className="invalid-feedback">{errors.password}</div>}
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 fw-bold d-flex justify-content-center align-items-center py-2"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Logging in...
                  </>
                ) : 'Login'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <small className="text-muted">
                Don't have an account?{' '}
                <Link to="/register" className="text-decoration-none fw-medium" style={{ color: '#0d6efd' }}>
                  Sign Up
                </Link>
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;