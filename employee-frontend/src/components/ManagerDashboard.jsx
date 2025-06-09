import React from 'react';
import { Link } from 'react-router-dom';

export default function ManagerDashboard() {
  return (
    <div className="container">
      <h2 className="my-4">Manager Dashboard</h2>
      <div className="row">
        <div className="col-md-6 mb-4">
          <div className="card h-100 border-primary">
            <div className="card-body text-center">
              <i className="bi bi-people fs-1 text-primary mb-3"></i>
              <h5 className="card-title">My Team</h5>
              <p className="card-text">View and manage your team members</p>
              <Link to="/employees" className="btn btn-primary">View Team</Link>
            </div>
          </div>
        </div>
        
        <div className="col-md-6 mb-4">
          <div className="card h-100 border-primary">
            <div className="card-body text-center">
              <i className="bi bi-list-task fs-1 text-primary mb-3"></i>
              <h5 className="card-title">Tasks</h5>
              <p className="card-text">Assign and track tasks</p>
              <Link to="/tasks" className="btn btn-primary">Manage Tasks</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}