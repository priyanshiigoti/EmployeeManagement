import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig'; // adjust path if needed
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://localhost:7231/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setProfileData(response.data);
        setFormData({
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          phoneNumber: response.data.phoneNumber || '',
          currentPassword: '',
          newPassword: '',
        });
        setLoading(false);
      } catch (error) {
        toast.error('Failed to load profile. Please login again.');
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleEdit = () => {
    setIsEditing(prev => !prev);
    if (!isEditing) {
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
      }));
    }
  };

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const token = localStorage.getItem('token');
    
    // Use camelCase for all properties
    const updateData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    };

    console.log('Update payload:', updateData);
    
    await axios.put('https://localhost:7231/api/profile', updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });

    toast.success('Profile updated successfully');
    setProfileData(prev => ({
      ...prev,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.phoneNumber,
    }));
    setIsEditing(false);
  } catch (error) {
    // Handle different error response formats
    const serverError = error.response?.data;
    const errorMessage = 
      serverError?.message ||    // If using new { message }
      serverError?.Message ||    // If using new { Message }
      serverError?.title ||      // Validation error format
      'Failed to update profile';
    
    toast.error(errorMessage);
    console.error('Update failed:', error.response?.data);
  }
};

  if (loading) {
    return <div className="text-center mt-5">Loading profile...</div>;
  }

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h3>My Profile</h3>
              <button
                className="btn btn-sm btn-primary"
                onClick={toggleEdit}
              >
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="card-body">
              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="firstName" className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="lastName" className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-control"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                    <input
                      type="text"
                      className="form-control"
                      id="phoneNumber"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="currentPassword" className="form-label">
                      Current Password (for password change)
                    </label>
                    <input
                      type="password"
                      className="form-control"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="newPassword" className="form-label">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                    />
                    <small className="text-muted">
                      Leave blank to keep current password
                    </small>
                  </div>

                  <button type="submit" className="btn btn-primary">
                    Save Changes
                  </button>
                </form>
              ) : (
                <div className="profile-info">
                  <p><strong>Name:</strong> {profileData.firstName} {profileData.lastName}</p>
                  <p><strong>Email:</strong> {profileData.email}</p>
                  <p><strong>Phone:</strong> {profileData.phoneNumber || 'Not provided'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
