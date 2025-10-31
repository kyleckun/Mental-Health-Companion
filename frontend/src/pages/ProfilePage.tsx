import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { UserType } from '../types/auth.types';
import './ProfilePage.css';
// MODIFICATION: Import new component
import EmergencyContactManager from '../components/Profile/EmergencyContactManager';

interface UserProfile {
  id: string;
  username: string;
  email: string;
  user_type: UserType;
  created_at: string;
}

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<UserType>('general');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.getCurrentUserFromServer();
      setProfile(response);
      setEmail(response.email || '');
      setUserType(response.user_type || 'general');
    } catch (err: any) {
      setError('Failed to load profile. Please try again.');
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await authService.updateProfile({ email, user_type: userType });
      setSuccessMessage('Profile updated successfully!');
      setEditing(false);
      await loadProfile(); // Reload to get updated data

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (profile) {
      setEmail(profile.email || '');
      setUserType(profile.user_type || 'general');
    }
    setError(null);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const getUserTypeLabel = (type: UserType): string => {
    const labels: Record<UserType, string> = {
      general: 'General User',
      student: 'Student',
      young_professional: 'Young Professional',
      pregnant_woman: 'Pregnant Woman',
    };
    return labels[type] || type;
  };

  const getUserTypeDescription = (type: UserType): string => {
    const descriptions: Record<UserType, string> = {
      general: 'Receive general mental health suggestions and support',
      student: 'Get suggestions tailored for academic stress, study breaks, and student life',
      young_professional: 'Receive workplace-focused suggestions for stress management and work-life balance',
      pregnant_woman: 'Get prenatal care suggestions, pregnancy-safe activities, and maternal wellness tips',
    };
    return descriptions[type] || '';
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="error-container">
          <h2>Unable to Load Profile</h2>
          <p>{error || 'Please try logging in again.'}</p>
          <button onClick={() => navigate('/login')} className="primary-button">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="header-content">
            <button onClick={() => navigate('/app')} className="back-button">
              ← Back to App
            </button>
            <h1>My Profile</h1>
            <p className="subtitle">Manage your account settings</p>
          </div>
        </div>

        {successMessage && (
          <div className="success-message">
            <span className="success-icon">✓</span>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="error-message">
            <span className="error-icon">!</span>
            {error}
          </div>
        )}

        <div className="profile-card">
          <div className="card-section">
            <h2>Account Information</h2>

            <div className="info-row">
              <label>Username</label>
              <div className="info-value">
                <span className="username-badge">{profile.username}</span>
              </div>
            </div>

            <div className="info-row">
              <label>User ID</label>
              <div className="info-value">
                <span className="id-text">{profile.id}</span>
              </div>
            </div>

            <div className="info-row">
              <label>Member Since</label>
              <div className="info-value">
                {new Date(profile.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </div>
            </div>
          </div>

          <div className="card-section">
            <div className="section-header">
              <h2>Profile Settings</h2>
              {!editing && (
                <button onClick={() => setEditing(true)} className="edit-button">
                  Edit Profile
                </button>
              )}
            </div>

            <div className="info-row">
              <label>Email Address</label>
              {editing ? (
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="your.email@example.com"
                />
              ) : (
                <div className="info-value">{profile.email || 'Not provided'}</div>
              )}
            </div>

            <div className="info-row">
              <label>User Type</label>
              {editing ? (
                <div className="user-type-selector">
                  <select
                    value={userType}
                    onChange={(e) => setUserType(e.target.value as UserType)}
                    className="select-field"
                  >
                    <option value="general">General User</option>
                    <option value="student">Student</option>
                    <option value="young_professional">Young Professional</option>
                    <option value="pregnant_woman">Pregnant Woman</option>
                  </select>
                  <p className="help-text">{getUserTypeDescription(userType)}</p>
                </div>
              ) : (
                <div className="info-value">
                  <span className="user-type-badge" data-type={profile.user_type}>
                    {getUserTypeLabel(profile.user_type)}
                  </span>
                  <p className="help-text">{getUserTypeDescription(profile.user_type)}</p>
                </div>
              )}
            </div>

            {editing && (
              <div className="action-buttons">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="save-button"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MODIFICATION: Emergency Contact Management Section */}
        <EmergencyContactManager />

        <div className="danger-zone">
          <h3>Account Actions</h3>
          <button onClick={handleLogout} className="logout-button">
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;