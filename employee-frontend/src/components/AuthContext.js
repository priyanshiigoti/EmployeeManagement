import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../axiosConfig';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Ensure roles are always an array
  const normalizeRoles = (roles) => {
    if (!roles) return [];
    if (Array.isArray(roles)) return roles;
    if (typeof roles === 'string') return [roles];
    return [];
  };

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('employee_mgmt_token');
      if (token) {
        try {
          const response = await axios.get('/Account/VerifyToken');
          const roles = normalizeRoles(response.data.user?.roles);
          setUser({ ...response.data.user, roles });
        } catch (error) {
          localStorage.removeItem('employee_mgmt_token');
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post('/Account/Login', { email, password });
      localStorage.setItem('employee_mgmt_token', response.data.token);
      
      const roles = normalizeRoles(response.data.roles);
      const userData = {
        id: response.data.userId,
        email: email,
        roles: roles
      };
      
      setUser(userData);
      
      // Redirect based on primary role
      if (roles.includes('Admin')) {
        navigate('/admin');
      } else if (roles.includes('Manager')) {
        navigate('/manager');
      } else {
        navigate('/employee');
      }
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.errors || ['Login failed. Please try again.']
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('employee_mgmt_token');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);