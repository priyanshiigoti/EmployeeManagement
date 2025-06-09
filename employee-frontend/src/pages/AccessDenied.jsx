// src/pages/AccessDenied.jsx

import React from 'react';
import { Link } from 'react-router-dom';

const AccessDenied = () => {
  return (
    <div style={{ textAlign: 'center', marginTop: '80px' }}>
      <h1 style={{ fontSize: '4rem', color: '#d32f2f' }}>403</h1>
      <h2>Access Denied</h2>
      <p>You do not have permission to access this page.</p>
      <Link to="/" style={{ color: '#1976d2', fontWeight: 'bold' }}>
        Go to Dashboard
      </Link>
    </div>
  );
};

export default AccessDenied;
