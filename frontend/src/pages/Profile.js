import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Edit, Camera, Loader2 } from 'lucide-react';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  
  const [userData, setUserData] = useState({
    username: '',
    email: '',
    name: '',
    phone: '',
    location: '',
    bio: '',
    profilePhoto: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/profile', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Failed to fetch profile');
        
        setUserData({
          username: data.username || '',
          email: data.email || '',
          name: data.name || '',
          phone: data.phone || '',
          location: data.location || '',
          bio: data.bio || '',
          profilePhoto: data.profilePhoto || ''
        });
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        alert('File is too large. Please select an image under 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Photo = reader.result;
        
        // Update local state immediately for preview
        setUserData(prev => ({
          ...prev,
          profilePhoto: base64Photo
        }));

        // Automatically save to backend
        const token = localStorage.getItem('token');
        try {
          const response = await fetch('http://localhost:5000/api/profile', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ profilePhoto: base64Photo })
          });
          
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || 'Failed to update photo');
          
          // Update localStorage
          localStorage.setItem('user', JSON.stringify({ 
            ...JSON.parse(localStorage.getItem('user') || '{}'),
            profilePhoto: data.profilePhoto
          }));

          alert('Profile photo updated successfully!');
          window.location.reload();
        } catch (err) {
          console.error(err);
          alert('Failed to update photo: ' + err.message);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoClick = () => {
    if (userData.profilePhoto) {
      setShowPhotoModal(true);
    }
  };

  const closeModal = () => {
    setShowPhotoModal(false);
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch('http://localhost:5000/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Update failed');
      
      setIsEditing(false);
      
      // Update localStorage for Navbar and Profile consistency
      localStorage.setItem('user', JSON.stringify({ 
        id: data._id, 
        name: data.name, 
        email: data.email, 
        profilePhoto: data.profilePhoto,
        username: data.username,
        phone: data.phone,
        location: data.location,
        bio: data.bio
      }));



      
      alert('Profile updated successfully!');
      // Reload to ensure all components sync
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="placeholder">
          <Loader2 className="animate-spin" size={48} />
          <p style={{ marginTop: '1rem' }}>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="placeholder">
          <p style={{ color: 'red' }}>Error: {error}</p>
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="page-container" style={{ alignItems: 'flex-start' }}>
      <div className="profile-wrapper">
        
        <div className="profile-header-section">
          <h1 className="profile-page-title">Profile</h1>
          <p className="profile-subtitle">Manage your account information and preferences</p>
        </div>

        <div className="profile-grid">
          
          {/* Left Sidebar */}
          <div className="profile-sidebar panel-card">
            <div className="profile-avatar-container">
              <div 
                className="avatar-circle" 
                onClick={handlePhotoClick}
                style={{ cursor: userData.profilePhoto ? 'pointer' : 'default' }}
                title={userData.profilePhoto ? 'Click to view full size' : ''}
              >
                {userData.profilePhoto ? (
                  <img 
                    src={userData.profilePhoto} 
                    alt="Profile" 
                    className="avatar-image-full"
                  />
                ) : (
                  <span className="avatar-initials">{getInitials(userData.name)}</span>
                )}
              </div>
              <input 
                type="file" 
                id="photo-upload" 
                hidden 
                accept="image/*" 
                onChange={handlePhotoChange}
              />
              <button 
                className="avatar-upload-btn" 
                title="Change photo"
                onClick={() => document.getElementById('photo-upload').click()}
              >
                <Camera size={14} />
              </button>
            </div>
            
            <div className="profile-identity">
              <h2 className="profile-name">{userData.name || 'Set your name'}</h2>
              <p className="profile-username">{userData.username ? `@${userData.username}` : (userData.email || 'Set username')}</p>
              <div className="role-badge">Citizen</div>
            </div>

            <div className="profile-bio-summary">
              <p>{userData.bio || 'Your bio will appear here.'}</p>
            </div>

            <div className="profile-joined">
              <p>Member of CleanStreet</p>
            </div>
          </div>


          {/* Right Main Content */}
          <div className="profile-main panel-card">
            
            <div className="profile-main-header">
              <div className="main-header-title">
                <div className="header-icon bg-blue-light text-blue">
                  <User size={24} strokeWidth={2} />
                </div>
                <div>
                  <h2>Account Information</h2>
                  <p>Update your personal details</p>
                </div>
              </div>
              
              {!isEditing && (
                <button className="btn btn-outline edit-btn" onClick={toggleEdit}>
                  <Edit size={16} />
                  <span>Edit</span>
                </button>
              )}
            </div>

            <form className="profile-form" onSubmit={handleSave}>
              <div className="form-grid-2col">
                
                <div className="form-group">
                  <label className="label-with-icon">
                    <User size={16} className="text-light" />
                    Username
                  </label>
                  <input 
                    type="text" 
                    name="username" 
                    value={userData.username} 
                    onChange={handleChange}
                    readOnly={!isEditing}
                    placeholder="Set a username"
                    className={`form-input ${!isEditing ? 'input-readonly' : ''}`}
                  />
                </div>

                <div className="form-group">
                  <label className="label-with-icon">
                    <Mail size={16} className="text-light" />
                    Email
                  </label>
                  <input 
                    type="email" 
                    name="email" 
                    value={userData.email} 
                    onChange={handleChange}
                    readOnly={!isEditing}
                    required
                    className={`form-input ${!isEditing ? 'input-readonly' : ''}`}
                  />
                </div>

                <div className="form-group">
                  <label>Full Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={userData.name} 
                    onChange={handleChange}
                    readOnly={!isEditing}
                    required
                    className={`form-input ${!isEditing ? 'input-readonly' : ''}`}
                  />
                </div>

                <div className="form-group">
                  <label className="label-with-icon">
                    <Phone size={16} className="text-light" />
                    Phone Number
                  </label>
                  <input 
                    type="tel" 
                    name="phone" 
                    value={userData.phone} 
                    onChange={handleChange}
                    readOnly={!isEditing}
                    placeholder="+1 234 567 890"
                    className={`form-input ${!isEditing ? 'input-readonly' : ''}`}
                  />
                </div>

                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="label-with-icon">
                    <MapPin size={16} className="text-light" />
                    Location
                  </label>
                  <input 
                    type="text" 
                    name="location" 
                    value={userData.location} 
                    onChange={handleChange}
                    readOnly={!isEditing}
                    placeholder="Neighborhood or District"
                    className={`form-input ${!isEditing ? 'input-readonly' : ''}`}
                  />
                </div>
                
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label>Bio</label>
                  <textarea 
                    name="bio"
                    value={userData.bio}
                    onChange={handleChange}
                    readOnly={!isEditing}
                    rows="3"
                    placeholder="Tell us about yourself..."
                    className={`form-textarea ${!isEditing ? 'input-readonly' : ''}`}
                  />
                </div>
              </div>

              {isEditing && (
                <div className="profile-actions">
                  <button type="button" className="btn btn-outline" onClick={toggleEdit}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                </div>
              )}
            </form>

          </div>
        </div>
        
        {/* Photo Modal */}
        {showPhotoModal && (
          <div className="photo-modal" onClick={closeModal}>
            <button className="photo-modal-close" onClick={closeModal}>
              ×
            </button>
            <div className="photo-modal-content" onClick={(e) => e.stopPropagation()}>
              <img 
                src={userData.profilePhoto} 
                alt="Profile Full Size" 
                className="photo-modal-image"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;

