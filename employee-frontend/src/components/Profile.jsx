import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
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
    profileImagePath: '',
  });
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    currentPassword: '',
    newPassword: '',
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

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
      setSelectedImage(null);
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      let imagePath = profileData.profileImagePath;

      // Upload new image if selected
      if (selectedImage) {
        setIsUploading(true);
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedImage);

        try {
          await axios.post('https://localhost:7231/api/profile/upload-image', uploadFormData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            }
          });

          // Refresh profile to get new image path
          const profileResponse = await axios.get('https://localhost:7231/api/profile', {
            headers: { Authorization: `Bearer ${token}` }
          });
          imagePath = profileResponse.data.profileImagePath;
          setProfileData(profileResponse.data);
        } catch (uploadError) {
          const errMsg = uploadError.response?.data?.message || 'Failed to upload image';
          toast.error(errMsg);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // Update profile data
      const updateData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
        profileImagePath: imagePath
      };

      const updateResponse = await axios.put('https://localhost:7231/api/profile', updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Profile updated successfully');
      
      // Refresh profile data after update
      const refreshedProfile = await axios.get('https://localhost:7231/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileData(refreshedProfile.data);
      setIsEditing(false);
      setSelectedImage(null);
    } catch (error) {
      const serverError = error.response?.data;
      const errorMessage = 
        serverError?.message || 
        serverError?.Message || 
        serverError?.title || 
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
              <button className="btn btn-sm btn-primary" onClick={toggleEdit}>
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            <div className="card-body">
              <div className="mb-3 text-center">
                {profileData.profileImagePath ? (
                  <img
                    src={`https://localhost:7231${profileData.profileImagePath.startsWith('/') ? '' : '/'}${profileData.profileImagePath}`}
                    alt="Profile"
                    style={{ width: 120, height: 120, objectFit: 'cover', borderRadius: '50%' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/120';
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      lineHeight: '120px',
                      borderRadius: '50%',
                      backgroundColor: '#ccc',
                      display: 'inline-block',
                      color: '#fff',
                      fontSize: 24,
                    }}
                  >
                    No Image
                  </div>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="profileImage" className="form-label">Profile Image</label>
                    <input
                      type="file"
                      className="form-control"
                      id="profileImage"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                    {selectedImage && (
                      <div className="mt-2">
                        <span className="ms-2">{selectedImage.name}</span>
                      </div>
                    )}
                  </div>

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

                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isUploading}
                  >
                    {isUploading ? 'Saving...' : 'Save Changes'}
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