// src/axiosConfig.js
import axios from 'axios';
import { logout } from './services/authService';


const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://localhost:7231/api',
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('employee_mgmt_token');

  // ✅ Use endsWith to check for login/register reliably
  const url = config.url?.toLowerCase() || '';

  const isPublicEndpoint = 
    url.endsWith('/account/registeremployee') ||
    url.endsWith('/account/login');

  if (isPublicEndpoint || config.headers['Skip-Auth']) {
    return config; // Do not attach token
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
// axiosConfig.js


api.interceptors.response.use(
  response => response,
  error => {
    const token = localStorage.getItem('employee_mgmt_token');
    
    // Only logout if token exists
    if (error.response?.status === 401 && token) {
      logout();
    }

     if (error.response?.status === 403) {
      window.location.href = '/access-denied';
    }

    return Promise.reject(error);
  }
)

export default api;