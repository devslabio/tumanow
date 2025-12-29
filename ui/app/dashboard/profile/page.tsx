'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { AuthAPI } from '@/lib/api';
import Icon, { 
  faUser,
  faEnvelope,
  faPhone,
  faLock,
  faCheck,
  faEdit,
  faBell,
} from '@/app/components/Icon';
import { toast } from '@/app/components/Toaster';
import { Button } from '@/app/components';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export default function ProfilePage() {
  const { user, loadUser } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications'>('profile');

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    profile_picture: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    email: true,
    sms: true,
    push: true,
    in_app: true,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const profile = await AuthAPI.profile();
        setProfileData({
          name: profile.name || '',
          email: profile.email || '',
          phone: profile.phone || '',
          profile_picture: profile.profile_picture || '',
        });

        // Parse notification preferences
        if (profile.notification_preferences) {
          try {
            const prefs = JSON.parse(profile.notification_preferences);
            setNotificationPrefs({
              email: prefs.email !== false,
              sms: prefs.sms !== false,
              push: prefs.push !== false,
              in_app: prefs.in_app !== false,
            });
          } catch (e) {
            // Use defaults if parsing fails
          }
        }
      } catch (error: any) {
        console.error('Failed to fetch profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const validateProfile = () => {
    const newErrors: Record<string, string> = {};

    if (!profileData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (profileData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!profileData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePassword = () => {
    const newErrors: Record<string, string> = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateProfile()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSaving(true);
    try {
      await AuthAPI.updateProfile({
        name: profileData.name.trim(),
        email: profileData.email.trim() || undefined,
        phone: profileData.phone.trim(),
        profile_picture: profileData.profile_picture.trim() || undefined,
      });
      
      await loadUser(); // Reload user data
      setEditMode(false);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!validatePassword()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setChangingPassword(true);
    try {
      await AuthAPI.changePassword(passwordData.currentPassword, passwordData.newPassword);
      toast.success('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setErrors({});
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error?.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      await AuthAPI.updateProfile({
        notification_preferences: JSON.stringify(notificationPrefs),
      });
      
      await loadUser(); // Reload user data
      toast.success('Notification preferences updated successfully');
    } catch (error: any) {
      console.error('Failed to update preferences:', error);
      toast.error(error?.response?.data?.message || 'Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'profile', label: 'Profile', icon: faUser },
            { id: 'password', label: 'Password', icon: faLock },
            { id: 'notifications', label: 'Notifications', icon: faBell },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-[#0b66c2] text-[#0b66c2]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon icon={tab.icon} size="sm" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
            {!editMode ? (
              <Button
                onClick={() => setEditMode(true)}
                variant="primary"
                size="sm"
                icon={faEdit}
              >
                Edit Profile
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  onClick={async () => {
                    setEditMode(false);
                    // Reset form data - reload from API
                    try {
                      const profile = await AuthAPI.profile();
                      setProfileData({
                        name: profile.name || '',
                        email: profile.email || '',
                        phone: profile.phone || '',
                        profile_picture: profile.profile_picture || '',
                      });
                    } catch (error) {
                      // If reload fails, just reset to current user data
                      if (user) {
                        setProfileData({
                          name: user.name || '',
                          email: user.email || '',
                          phone: user.phone || '',
                          profile_picture: (user as any).profile_picture || '',
                        });
                      }
                    }
                    setErrors({});
                  }}
                  variant="secondary"
                  size="sm"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  variant="primary"
                  size="sm"
                  icon={faCheck}
                  loading={saving}
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Profile Picture */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-[#0b66c2]/10 rounded-full flex items-center justify-center overflow-hidden">
                  {profileData.profile_picture ? (
                    <img
                      src={profileData.profile_picture}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Icon icon={faUser} className="text-[#0b66c2]" size="2x" />
                  )}
                </div>
                {editMode && (
                  <div className="flex-1">
                    <input
                      type="text"
                      value={profileData.profile_picture}
                      onChange={(e) => setProfileData({ ...profileData, profile_picture: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm"
                      placeholder="Enter image URL"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter a URL to your profile picture</p>
                  </div>
                )}
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              {editMode ? (
                <>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => {
                      setProfileData({ ...profileData, name: e.target.value });
                      if (errors.name) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.name;
                          return newErrors;
                        });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm ${
                      errors.name ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
                </>
              ) : (
                <p className="text-sm text-gray-900">{profileData.name}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              {editMode ? (
                <>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => {
                      setProfileData({ ...profileData, email: e.target.value });
                      if (errors.email) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.email;
                          return newErrors;
                        });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm ${
                      errors.email ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
                </>
              ) : (
                <p className="text-sm text-gray-900">{profileData.email || 'Not provided'}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              {editMode ? (
                <>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => {
                      setProfileData({ ...profileData, phone: e.target.value });
                      if (errors.phone) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.phone;
                          return newErrors;
                        });
                      }
                    }}
                    className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm ${
                      errors.phone ? 'border-red-300' : 'border-gray-200'
                    }`}
                    placeholder="+250788123456"
                  />
                  {errors.phone && <p className="mt-1 text-xs text-red-600">{errors.phone}</p>}
                </>
              ) : (
                <p className="text-sm text-gray-900">{profileData.phone}</p>
              )}
            </div>

            {/* Account Info */}
            {!editMode && (
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-4">Account Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Account Status</p>
                    <p className="text-sm font-medium text-gray-900">{(user as any)?.status || 'ACTIVE'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Member Since</p>
                    <p className="text-sm font-medium text-gray-900">
                      {(user as any)?.created_at
                        ? new Date((user as any).created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'N/A'}
                    </p>
                  </div>
                  {(user as any)?.operator && (
                    <div>
                      <p className="text-xs text-gray-500">Operator</p>
                      <p className="text-sm font-medium text-gray-900">{(user as any).operator.name}</p>
                    </div>
                  )}
                  {user?.roles && user.roles.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500">Roles</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.roles.map((role: any) => (
                          <span
                            key={role.id || role.code}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {role.code || role.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h2>
          <div className="space-y-6 max-w-md">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => {
                  setPasswordData({ ...passwordData, currentPassword: e.target.value });
                  if (errors.currentPassword) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.currentPassword;
                      return newErrors;
                    });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm ${
                  errors.currentPassword ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Enter current password"
              />
              {errors.currentPassword && <p className="mt-1 text-xs text-red-600">{errors.currentPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => {
                  setPasswordData({ ...passwordData, newPassword: e.target.value });
                  if (errors.newPassword) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.newPassword;
                      return newErrors;
                    });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm ${
                  errors.newPassword ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Enter new password (min 6 characters)"
              />
              {errors.newPassword && <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => {
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value });
                  if (errors.confirmPassword) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.confirmPassword;
                      return newErrors;
                    });
                  }
                }}
                className={`w-full px-3 py-2 border rounded-sm focus:outline-none focus:ring-1 focus:ring-[#0b66c2] focus:border-[#0b66c2] text-sm ${
                  errors.confirmPassword ? 'border-red-300' : 'border-gray-200'
                }`}
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>

            <Button
              onClick={handleChangePassword}
              variant="primary"
              size="md"
              icon={faLock}
              loading={changingPassword}
            >
              Change Password
            </Button>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-gray-200 rounded-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
            <Button
              onClick={handleSaveNotifications}
              variant="primary"
              size="sm"
              icon={faCheck}
              loading={saving}
            >
              Save Preferences
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-600 mb-4">
              Choose how you want to receive notifications
            </p>

            {[
              { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
              { key: 'sms', label: 'SMS Notifications', description: 'Receive notifications via SMS' },
              { key: 'push', label: 'Push Notifications', description: 'Receive push notifications on your device' },
              { key: 'in_app', label: 'In-App Notifications', description: 'Show notifications in the application' },
            ].map((pref) => (
              <div key={pref.key} className="flex items-center justify-between p-4 border border-gray-200 rounded-sm">
                <div>
                  <p className="text-sm font-medium text-gray-900">{pref.label}</p>
                  <p className="text-xs text-gray-500 mt-1">{pref.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notificationPrefs[pref.key as keyof typeof notificationPrefs]}
                    onChange={(e) =>
                      setNotificationPrefs({
                        ...notificationPrefs,
                        [pref.key]: e.target.checked,
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#0b66c2] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0b66c2]"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

