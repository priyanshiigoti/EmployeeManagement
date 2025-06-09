import React from 'react';
import { Link } from 'react-router-dom';
import './AdminDashboard.css'; // Custom styles

export default function AdminDashboard() {
  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">Admin Dashboard</h2>
      <div className="row g-4 justify-content-center">

        <div className="col-md-4 col-sm-6">
          <div className="card h-100 shadow-sm dashboard-card border-0">
            <div className="card-body text-center">
              <i className="bi bi-building fs-1 text-primary mb-3"></i>
              <h5 className="card-title">Departments</h5>
              <p className="card-text">Manage departments and assign managers</p>
              <Link to="/departments" className="btn btn-outline-primary">Manage</Link>
            </div>
          </div>
        </div>

        <div className="col-md-4 col-sm-6">
          <div className="card h-100 shadow-sm dashboard-card border-0">
            <div className="card-body text-center">
              <i className="bi bi-person-gear fs-1 text-success mb-3"></i>
              <h5 className="card-title">Managers</h5>
              <p className="card-text">Create and manage manager accounts</p>
              <Link to="/managers" className="btn btn-outline-success">Manage</Link>
            </div>
          </div>
        </div>

        <div className="col-md-4 col-sm-6">
          <div className="card h-100 shadow-sm dashboard-card border-0">
            <div className="card-body text-center">
              <i className="bi bi-people fs-1 text-warning mb-3"></i>
              <h5 className="card-title">Employees</h5>
              <p className="card-text">View and manage all employees</p>
              <Link to="/employees" className="btn btn-outline-warning">Manage</Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
