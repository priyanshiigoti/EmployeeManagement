import React from 'react';
import { Link } from 'react-router-dom';
import defaultProfilePic from '../assets/default-profile.png';

// Helper function defined outside the component
const getProfileImageUrl = (path, apiUrl) => {
  if (!path) return defaultProfilePic;
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/^\/?/, '');
  return `${apiUrl.replace(/\/api$/, '')}/${cleanPath}`;
};


export default function Navbar({ user, onLogout, userProfile }) {
  return (
    <nav style={navStyle}>
      <h1 style={{ margin: 0 }}>Employee Management</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        {user ? (
          <>
            {/* User profile section */}
           

            {/* Navigation links */}
            <Link style={linkStyle} to="/">Dashboard</Link>
            <Link style={linkStyle} to="/my-profile"> <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
             <img 
  src={getProfileImageUrl(userProfile?.profileImagePath, process.env.REACT_APP_API_URL)} 

                alt="Profile" 
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid white'
                }} 
                onError={(e) => {
                  e.target.src = defaultProfilePic;
                }}  
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ color: 'white', fontWeight: 'bold' }}>
                  {userProfile?.FirstName} {userProfile?.LastName}
                </span>
                <span style={{ color: '#e0e0e0', fontSize: '0.8rem' }}>
                  {user?.email}
                </span>
              </div>
            </div></Link>

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