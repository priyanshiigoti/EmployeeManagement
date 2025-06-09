import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar({ user, onLogout }) {
  return (
    <nav style={navStyle}>
      <h1 style={{ margin: 0 }}>Employee Management</h1>
      <div>
        {user ? (
          <>
            {/* Always show Dashboard link */}
            <Link style={linkStyle} to="/">Dashboard</Link>
              <Link style={linkStyle} to="/my-profile">My Profile</Link>

            {/* Logout button */}
            <button onClick={onLogout} style={buttonStyle}>Logout</button>
          </>
        ) : (
          <>
            <Link style={linkStyle} to="/login">Login</Link>
            <Link style={registerButtonStyle} to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

const navStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: '#007bff',
  padding: '10px 20px',
  color: 'white',
};

const linkStyle = {
  marginRight: '15px',
  color: 'white',
  textDecoration: 'none',
  fontWeight: 'bold',
};

const buttonStyle = {
  background: 'white',
  color: '#007bff',
  border: 'none',
  padding: '6px 12px',
  cursor: 'pointer',
  fontWeight: 'bold',
  borderRadius: '4px'
};

const registerButtonStyle = {
  ...buttonStyle,
  background: '#0056b3',
  color: 'white',
  textDecoration: 'none',
  padding: '6px 12px',
  display: 'inline-block'
};
