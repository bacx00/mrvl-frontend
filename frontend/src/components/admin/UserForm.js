import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { getImageUrl } from '../../utils/imageUtils';

function UserForm({ navigateTo, userId = null }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roles: ['user'], // Default to user role
    avatar: null,
    hero_flair: '',
    use_hero_as_avatar: false,
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [availableHeroes, setAvailableHeroes] = useState({});
  const { api } = useAuth();

  const isEdit = !!userId;

  useEffect(() => {
    if (isEdit) {
      fetchUser();
    }
    fetchAvailableHeroes();
  }, [userId]);

  const fetchAvailableHeroes = async () => {
    try {
      const response = await api.get('/user/profile/available-flairs');
      const flairsData = response.data?.data || response.data || { heroes: {} };
      setAvailableHeroes(flairsData.heroes || {});
    } catch (error) {
      console.error('Error fetching heroes:', error);
      // Fallback heroes data
      setAvailableHeroes({
        "Vanguard": [
          {name: "Captain America", role: "Vanguard"},
          {name: "Doctor Strange", role: "Vanguard"},
          {name: "Emma Frost", role: "Vanguard"},
          {name: "Hulk", role: "Vanguard"},
          {name: "Magneto", role: "Vanguard"},
          {name: "Thor", role: "Vanguard"},
          {name: "Venom", role: "Vanguard"}
        ],
        "Duelist": [
          {name: "Black Panther", role: "Duelist"},
          {name: "Black Widow", role: "Duelist"},
          {name: "Iron Man", role: "Duelist"},
          {name: "Spider-Man", role: "Duelist"},
          {name: "Wolverine", role: "Duelist"}
        ],
        "Strategist": [
          {name: "Loki", role: "Strategist"},
          {name: "Luna Snow", role: "Strategist"},
          {name: "Mantis", role: "Strategist"}
        ]
      });
    }
  };

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/users/${userId}`);
      const user = response.data || response;
      
      setFormData({
        ...user,
        password: '', // Don't populate password field for security
        roles: user.roles || ['user']
      });
      
    } catch (error) {
      console.error('Error fetching user:', error);
      alert('Error loading user data. Please try again.');
      navigateTo('admin-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Validate roles
      if (formData.roles.length === 0) {
        alert('Please select at least one role');
        return;
      }

      // Don't send empty password on edit
      const dataToSend = {...formData};
      if (isEdit && !dataToSend.password) {
        delete dataToSend.password;
      }
      
      // FIXED: Backend expects 'role' string, not 'roles' array
      // Use the exact backend-supported values: "admin", "moderator", "user"
      if (dataToSend.roles && dataToSend.roles.length > 0) {
        dataToSend.role = dataToSend.roles[0]; // Take first role as primary
        delete dataToSend.roles; // Remove roles array to avoid confusion
      }

      // The backend will handle hero avatar path generation
      // Just ensure use_hero_as_avatar is set correctly

      let response;
      if (isEdit) {
        // FIXED: Use POST with method spoofing for Laravel backend updates
        dataToSend._method = 'PUT';
        response = await api.post(`/admin/users/${userId}`, dataToSend);
      } else {
        // Create new user
        response = await api.post('/admin/users', dataToSend);
      }


      alert(`User ${isEdit ? 'updated' : 'created'} successfully!`);
      navigateTo('admin-dashboard');
    } catch (error) {
      console.error('Error saving user:', error);
      alert(`Error ${isEdit ? 'updating' : 'creating'} user: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleChange = (role) => {
    setFormData(prev => {
      const newRoles = [...prev.roles];
      
      if (newRoles.includes(role)) {
        // Remove role if already selected
        return { ...prev, roles: newRoles.filter(r => r !== role) };
      } else {
        // Add role if not selected
        return { ...prev, roles: [...newRoles, role] };
      }
    });
  };


  
  // FIXED: Use exact backend-supported role values (lowercase)
  const roleOptions = [
    { id: 'admin', label: 'Administrator', description: 'Full access to all features' },
    { id: 'moderator', label: 'Moderator', description: 'Can moderate content and users' },
    { id: 'user', label: 'Regular User', description: 'Standard user account' }
  ];
  
  const statusOptions = ['active', 'inactive', 'banned'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading user data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
          {isEdit ? 'Edit User' : 'Create New User'}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {isEdit ? 'Update user information and permissions' : 'Add a new user to the platform'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Password {isEdit && '(leave blank to keep current)'}
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  className="form-input"
                  required={!isEdit}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className="form-input"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Roles and Avatar */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Roles & Appearance</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  User Roles *
                </label>
                <div className="space-y-3">
                  {roleOptions.map(role => (
                    <div key={role.id} className="flex items-start">
                      <input
                        type="checkbox"
                        id={`role-${role.id}`}
                        checked={formData.roles.includes(role.id)}
                        onChange={() => handleRoleChange(role.id)}
                        className="mt-1 mr-3"
                      />
                      <label htmlFor={`role-${role.id}`} className="cursor-pointer">
                        <div className="font-medium text-gray-900 dark:text-white">{role.label}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{role.description}</div>
                      </label>
                    </div>
                  ))}
                </div>
                {formData.roles.length === 0 && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-2">
                    Please select at least one role
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                  Hero Avatar
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="use_hero_as_avatar"
                      checked={formData.use_hero_as_avatar}
                      onChange={(e) => handleChange('use_hero_as_avatar', e.target.checked)}
                      className="form-checkbox"
                    />
                    <label htmlFor="use_hero_as_avatar" className="text-gray-900 dark:text-white">
                      Use hero as avatar
                    </label>
                  </div>
                  
                  {formData.use_hero_as_avatar && (
                    <div className="space-y-3">
                      <select
                        value={formData.hero_flair || ''}
                        onChange={(e) => handleChange('hero_flair', e.target.value)}
                        className="form-input"
                      >
                        <option value="">Select a hero...</option>
                        {Object.entries(availableHeroes).map(([role, heroes]) => (
                          <optgroup key={role} label={role}>
                            {Array.isArray(heroes) && heroes.map(hero => (
                              <option key={hero.name} value={hero.name}>
                                {hero.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      
                      {formData.hero_flair && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                            Preview
                          </label>
                          <img 
                            src={getImageUrl(`/images/heroes/${formData.hero_flair.toLowerCase().replace(/\s+/g, '-').replace(/[&.]/g, '')}-headbig.webp`)}
                            alt={formData.hero_flair}
                            className="w-20 h-20 rounded-full border-2 border-gray-300 dark:border-gray-600"
                            onError={(e) => {
                              // Handle special cases for hero image names
                              const specialCases = {
                                'cloak & dagger': 'cloak-dagger',
                                'mr. fantastic': 'mister-fantastic',
                                'the punisher': 'the-punisher',
                                'the thing': 'the-thing'
                              };
                              const heroNameLower = formData.hero_flair.toLowerCase();
                              const slug = specialCases[heroNameLower] || heroNameLower.replace(/\s+/g, '-').replace(/[&.]/g, '');
                              e.target.src = getImageUrl(`/images/heroes/${slug}-headbig.webp`);
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Form Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={() => navigateTo('admin-dashboard')}
            className="btn btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={submitting || formData.roles.length === 0}
          >
            {submitting ? 'Saving...' : isEdit ? 'Update User' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default UserForm;