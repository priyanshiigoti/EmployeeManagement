import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}/Account/`;
const TOKEN_KEY = 'employee_mgmt_token';

const NAME_IDENTIFIER = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier';
const EMAIL = 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';
const ROLE = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

export const login = async (email, password) => {
  try {
    const response = await axios.post(API_URL + 'Login', { email, password });

    if (response.data.token) {
      localStorage.setItem(TOKEN_KEY, response.data.token);
      return response.data;
    }
    throw new Error('Login failed: No token received');
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const extractRolesFromClaims = (decodedToken) => {
  let roles = decodedToken[ROLE];
  if (!roles) return [];

  if (typeof roles === 'string') {
    return [roles];
  }
  if (Array.isArray(roles)) {
    return roles;
  }
  return [];
};

export const getCurrentUser = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return null;

  try {
    const decoded = parseJwt(token);
    if (!decoded) return null;

    return {
      id: decoded[NAME_IDENTIFIER],
      email: decoded[EMAIL],
      roles: extractRolesFromClaims(decoded)
    };
  } catch (ex) {
    console.error('Token processing error:', ex);
    return null;
  }
};

export const getAuthHeader = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const isAuthenticated = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;

  const decoded = parseJwt(token);
  return decoded && decoded.exp * 1000 > Date.now();
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);

  const currentPath = window.location.pathname.toLowerCase();
  if (currentPath !== '/login' && currentPath !== '/register') {
    window.location.href = '/login';
  }
};
