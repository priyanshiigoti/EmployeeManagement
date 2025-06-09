import React from 'react';
import { Link } from 'react-router-dom';

export default function EmployeeDashboard() {
  return (
    <div className="container">
      <h2 className="my-4">Employee Dashboard</h2>
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card h-100 border-primary">
            <div className="card-body text-center">
              <i className="bi bi-person fs-1 text-primary mb-3"></i>
              <h5 className="card-title">My Profile</h5>
              <p className="card-text">View and update your profile information</p>
              <Link to="/my-profile" className="btn btn-primary">View Profile</Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card h-100 border-primary">
            <div className="card-body text-center">
              <i className="bi bi-list-check fs-1 text-primary mb-3"></i>
              <h5 className="card-title">My Tasks</h5>
              <p className="card-text">View and update your assigned tasks</p>
              <Link to="/my-tasks" className="btn btn-primary">View Tasks</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}