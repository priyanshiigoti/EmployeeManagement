import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = ({ roles = [] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center mt-5"><h2>Loading...</h2></div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has any of the required roles
  if (roles.length > 0) {
    const hasRequiredRole = roles.some(role => 
      user.roles && user.roles.includes(role)
    );
    
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return <Outlet />;
};

export default ProtectedRoute;