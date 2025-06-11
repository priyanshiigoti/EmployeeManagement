import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import api from './axiosConfig';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import DepartmentList from './components/DepartmentList';
import ManagerList from './components/ManagerList';
import EmployeeList from './components/EmployeeList';
import RegisterEmployee from './components/RegisterEmployee';
import AdminDashboard from './components/AdminDashboard';
import ManagerDashboard from './components/ManagerDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import { getCurrentUser, logout } from './services/authService';
import Navbar from './components/Navbar';
import Task from './components/Task';
import Profile from './components/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AccessDenied from './pages/AccessDenied';

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/profile');
      setUserProfile(response.data);
      setProfileError(null);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfileError('Failed to load profile data');
      // Set default profile data if available from user
      if (user) {
        setUserProfile({
          FirstName: 'User',
          LastName: '',
          Email: user.email
        });
      }
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          await fetchUserProfile();
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLoginSuccess = async () => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
    await fetchUserProfile();
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setUserProfile(null);
    return <Navigate to="/login" />;
  };

  const ProtectedRoute = ({ children, roles = [] }) => {
    if (isLoading) {
      return <div className="text-center mt-5">Loading...</div>;
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (roles.length > 0) {
      let userRoles = [];
      if (Array.isArray(user.roles)) {
        userRoles = user.roles;
      } else if (typeof user.roles === 'string') {
        userRoles = user.roles.split(',').map(r => r.trim());
      }

      const hasRequiredRole = roles.some(role => 
        userRoles.includes(role)
      );

      if (!hasRequiredRole) {
        return <Navigate to="/access-denied" replace />;
      }
    }

    return children;
  };

  const RoleBasedDashboard = () => {
    if (isLoading) return null;
    
    if (!user) return <Navigate to="/login" replace />;

    if (user.roles.includes('Admin')) {
      return <AdminDashboard />;
    }
    if (user.roles.includes('Manager')) {
      return <ManagerDashboard />;
    }
    if (user.roles.includes('Employee')) {
      return <EmployeeDashboard />;
    }
    
    return <Dashboard />;
  };

  return (
    <Router>
      <Navbar user={user} onLogout={handleLogout} userProfile={userProfile} />
      <div className="container mt-4">
        <Routes>
          {/* Home/Dashboard Route */}
          <Route path="/" element={
            <ProtectedRoute>
              <RoleBasedDashboard />
            </ProtectedRoute>
          } />

          {/* Authentication Routes */}
          <Route path="/login" element={
            user ? <Navigate to="/" replace /> : <Login onLoginSuccess={handleLoginSuccess} />
          } />
          <Route path="/register" element={
            user ? <Navigate to="/" replace /> : <RegisterEmployee />
          } />
          <Route path="/forgot-password" element={
            user ? <Navigate to="/" replace /> : <ForgotPassword />
          } />
          <Route path="/reset-password" element={
            user ? <Navigate to="/" replace /> : <ResetPassword />
          } />
          <Route path="/access-denied" element={<AccessDenied />} />

          {/* Admin Routes */}
          <Route path="/departments" element={
            <ProtectedRoute roles={['Admin']}>
              <DepartmentList />
            </ProtectedRoute>
          } />
          {/* <Route path="/admin/users/create" element={
            <ProtectedRoute roles={['Admin']}>
              <AdminUserCreate />
            </ProtectedRoute>
          } /> */}
          <Route path="/managers" element={
            <ProtectedRoute roles={['Admin']}>
              <ManagerList />
            </ProtectedRoute>
          } />
          {/* <Route path="/managers/add" element={
            <ProtectedRoute roles={['Admin']}>
              <AddManager />
            </ProtectedRoute>
          } /> */}
          {/* <Route path="/managers/edit/:id" element={
            <ProtectedRoute roles={['Admin']}>
              <EditManager />
            </ProtectedRoute>
          } /> */}

          {/* Manager Routes */}
          <Route path="/employees" element={
            <ProtectedRoute roles={['Admin', 'Manager']}>
              <EmployeeList />
            </ProtectedRoute>
          } />
          {/* <Route path="/employees/edit/:id" element={
            <ProtectedRoute roles={['Admin', 'Manager']}>
              <EditEmployee />
            </ProtectedRoute>
          } /> */}

          {/* Shared Routes */}
          <Route path="/tasks" element={
            <ProtectedRoute roles={['Admin', 'Manager', 'Employee']}>
              <Task currentUser={user} />
            </ProtectedRoute>
          } />

          {/* Employee Routes */}
          <Route path="/my-profile" element={
            <ProtectedRoute roles={['Admin','Manager','Employee']}>
              <Profile user={user} />
            </ProtectedRoute>
          } />
          <Route path="/my-tasks" element={
            <ProtectedRoute roles={['Employee']}>
              <Task assignedOnly={true} currentUser={user} />
            </ProtectedRoute>
          } />

          {/* Fallback Route */}
          <Route path="*" element={<h2 className="text-center mt-5">Page Not Found</h2>} />
        </Routes>
      </div>
    </Router>
  );
}