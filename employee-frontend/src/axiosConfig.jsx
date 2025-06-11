import axios from 'axios';
import { logout } from './services/authService';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('employee_mgmt_token');

  const url = config.url?.toLowerCase() || '';

  const isPublicEndpoint = 
    url.endsWith('/account/registeremployee') ||
    url.endsWith('/account/login');

  if (isPublicEndpoint || config.headers['Skip-Auth']) {
    return config; 
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  response => response,
  error => {
    const token = localStorage.getItem('employee_mgmt_token');
    
    if (error.response?.status === 401 && token) {
      logout();
    }

    if (error.response?.status === 403) {
      window.location.href = '/access-denied';
    }

    return Promise.reject(error);
  }
);

export default api;
