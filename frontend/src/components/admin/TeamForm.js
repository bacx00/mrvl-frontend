import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { useMentionAutocomplete } from '../../hooks/useMentionAutocomplete';
import { API_CONFIG } from '../../config';
import ImageUpload from '../shared/ImageUpload';
import MentionDropdown from '../shared/MentionDropdown';

function TeamForm({ teamId, navigateTo }) {
  const [formData, setFormData] = useState({
    name: '',
    shortName: '',
    region: '',
    logo: '',
    flag: '',
    country: '',
    rating: 1000, // Team ELO rating with Marvel Rivals default
    earnings: 0, // Team total earnings in USD
    // Missing team fields
    elo_rating: '',
    peak_elo: '',
    wins: '',
    losses: '',
    matches_played: '',
    win_rate: '',
    current_streak_count: '',
    current_streak_type: 'none',
    founded: '',
    founded_date: '',
    description: '',
    achievements: '',
    manager: '',
    owner: '',
    captain: '',
    status: 'Active',
    // COACH DATA INTEGRATION - CRITICAL FIX
    coach: {
      name: '',
      realName: '',
      nationality: '',
      experience: '',
      achievements: '',
      avatar: ''
    },
    socialLinks: {
      twitter: '',
      instagram: '',
      youtube: '',
      website: '',
      discord: '',
      tiktok: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [flagFile, setFlagFile] = useState(null);
  const [coachAvatarFile, setCoachAvatarFile] = useState(null); // COACH DATA INTEGRATION
  const [error, setError] = useState(null);
  const { api } = useAuth();


  const isEdit = Boolean(teamId);

  const fetchTeam = async () => {
    if (!isEdit) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/admin/teams/${teamId}`);
      const team = response.data || response;
      
      console.log('TeamForm - Fetched team data:', team);
      
      setFormData({
        name: team.name || '',
        shortName: team.short_name || team.shortName || '',
        region: team.region || '',
        logo: team.logo_url || team.logo || '',
        flag: team.flag_url || team.flag || '',
        country: team.country || '',
        rating: team.rating || team.elo_rating || 1000, // Load ELO rating from backend
        earnings: team.earnings || 0, // Load team earnings from backend
        // Load missing team fields
        elo_rating: team.elo_rating || team.rating || '',
        peak_elo: team.peak_elo || '',
        wins: team.wins || '',
        losses: team.losses || '',
        matches_played: team.matches_played || '',
        win_rate: team.win_rate || '',
        current_streak_count: team.current_streak_count || '',
        current_streak_type: team.current_streak_type || 'none',
        founded: team.founded || '',
        founded_date: team.founded_date || '',
        description: team.description || '',
        achievements: team.achievements || '',
        manager: team.manager || '',
        owner: team.owner || '',
        captain: team.captain || '',
        status: team.status || 'Active',
        // COACH DATA INTEGRATION - CRITICAL FIX
        coach: team.coach || team.coach_data || {
          name: '',
          realName: '',
          nationality: '',
          experience: '',
          achievements: '',
          avatar: ''
        },
        socialLinks: team.social_links || team.socialLinks || {
          twitter: '',
          instagram: '',
          youtube: '',
          website: '',
          discord: '',
          tiktok: ''
        }
      });
    } catch (error) {
      console.error('Error fetching team:', error);
      setError('Error loading team data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, [teamId, isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('social_')) {
      const socialKey = name.replace('social_', '');
      setFormData(prev => ({
        ...prev,
        socialLinks: {
          ...prev.socialLinks,
          [socialKey]: value
        }
      }));
    } else if (name.startsWith('coach_')) {
      // COACH DATA INTEGRATION - Handle coach fields
      const coachKey = name.replace('coach_', '');
      setFormData(prev => ({
        ...prev,
        coach: {
          ...prev.coach,
          [coachKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };


  const handleNumberInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handleLogoSelect = (file, previewUrl) => {
    console.log('TeamForm - Logo selected:', file?.name, previewUrl);
    setLogoFile(file);
    setFormData(prev => ({
      ...prev,
      logo: previewUrl || ''
    }));
  };

  const handleFlagSelect = (file, previewUrl) => {
    console.log('TeamForm - Flag selected:', file?.name, previewUrl);
    setFlagFile(file);
    setFormData(prev => ({
      ...prev,
      flag: previewUrl || ''
    }));
  };

  // COACH DATA INTEGRATION - Handle coach avatar selection
  const handleCoachAvatarSelect = (file, previewUrl) => {
    console.log('TeamForm - Coach avatar selected:', file?.name, previewUrl);
    setCoachAvatarFile(file);
    setFormData(prev => ({
      ...prev,
      coach: {
        ...prev.coach,
        avatar: previewUrl || ''
      }
    }));
  };

  const uploadImage = async (file, teamId, type) => {
    if (!file) return null;
    
    try {
      console.log(`TeamForm - Uploading ${type} for team ${teamId}:`, file.name);
      
      const uploadFormData = new FormData();
      // CRITICAL FIX: Use correct field names based on backend documentation
      if (type === 'logo') {
        uploadFormData.append('logo', file); // Backend expects 'logo' field
      } else if (type === 'flag') {
        uploadFormData.append('flag', file); // Backend expects 'flag' field
      } else if (type === 'coach_avatar') {
        uploadFormData.append('coach_avatar', file); // Backend expects 'coach_avatar' field
      }
      
      const endpoint = type === 'logo' 
        ? `/upload/team/${teamId}/logo`
        : type === 'flag'
        ? `/upload/team/${teamId}/flag`
        : `/upload/team/${teamId}/coach-avatar`; // COACH DATA INTEGRATION
      
      console.log(`TeamForm - Upload endpoint: ${endpoint}`);
      
      const response = await api.postFile(endpoint, uploadFormData);
      
      console.log(`TeamForm - ${type} upload response:`, response);
      
      // CRITICAL FIX: Extract URL based on backend documentation
      const data = response.data || response;
      
      // Backend returns: {"success": true, "message": "...", "data": {"logo": "path", "logo_url": "full_url"}}
      let imageUrl;
      if (data.data) {
        imageUrl = data.data.logo_url || data.data.flag_url || data.data.logo || data.data.flag;
      } else {
        imageUrl = data.logo_url || data.flag_url || data.url || data.logo || data.flag;
      }
      
      console.log(`TeamForm - Extracted ${type} URL:`, imageUrl);
      
      if (!imageUrl) {
        console.error(`TeamForm - No ${type} URL found in response:`, data);
        throw new Error(`No ${type} URL returned from upload`);
      }
      
      return imageUrl;
    } catch (error) {
      console.error(`TeamForm - Error uploading ${type}:`, error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Team name is required');
      return;
    }
    
    if (!formData.shortName.trim()) {
      setError('Short name is required');
      return;
    }
    
    if (!formData.region) {
      setError('Region is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      console.log('TeamForm - Starting save process...');
      
      // CRITICAL FIX: Prepare proper data format for Laravel backend
      const submitData = {
        name: formData.name.trim(),
        short_name: formData.shortName.trim(),
        region: formData.region,
        country: formData.country,
        rating: parseInt(formData.elo_rating) || parseInt(formData.rating) || 1000, // Include ELO rating
        earnings: parseFloat(formData.earnings) || 0, // Include team earnings
        // Include missing team fields
        elo_rating: formData.elo_rating ? parseInt(formData.elo_rating) : (parseInt(formData.rating) || null),
        peak_elo: formData.peak_elo ? parseInt(formData.peak_elo) : null,
        wins: formData.wins ? parseInt(formData.wins) : null,
        losses: formData.losses ? parseInt(formData.losses) : null,
        matches_played: formData.matches_played ? parseInt(formData.matches_played) : null,
        win_rate: formData.win_rate ? parseFloat(formData.win_rate) : null,
        current_streak_count: formData.current_streak_count ? parseInt(formData.current_streak_count) : null,
        current_streak_type: formData.current_streak_type || 'none',
        founded: formData.founded || null,
        founded_date: formData.founded_date || null,
        description: formData.description || null,
        achievements: formData.achievements || null,
        manager: formData.manager || null,
        owner: formData.owner || null,
        captain: formData.captain || null,
        status: formData.status || 'Active',
        // COACH DATA INTEGRATION - CRITICAL FIX
        coach_data: {
          name: formData.coach.name || '',
          real_name: formData.coach.realName || '',
          nationality: formData.coach.nationality || '',
          experience: formData.coach.experience || '',
          achievements: formData.coach.achievements || '',
          avatar: formData.coach.avatar || ''
        },
        // CRITICAL FIX: Ensure social_links is properly formatted
        social_links: {
          twitter: formData.socialLinks.twitter || '',
          instagram: formData.socialLinks.instagram || '',
          youtube: formData.socialLinks.youtube || '',
          website: formData.socialLinks.website || '',
          discord: formData.socialLinks.discord || '',
          tiktok: formData.socialLinks.tiktok || ''
        }
      };

      console.log('TeamForm - Submit data prepared:', submitData);

      let teamIdForUpload = teamId;
      
      // If creating new team, save team first to get ID
      if (!isEdit) {
        console.log('Creating new team first to get ID...');
        const response = await api.post('/admin/teams', submitData);
        const savedTeam = response.data || response;
        teamIdForUpload = savedTeam.id;
        console.log('New team created with ID:', teamIdForUpload);
      } else {
        // Update existing team
        console.log('Updating existing team with ID:', teamId);
        await api.put(`/admin/teams/${teamId}`, submitData);
        console.log('Team updated successfully');
      }

      // CRITICAL FIX: Upload images AFTER team creation/update (fresh CSRF token)
      let logoUrl = formData.logo;
      let flagUrl = formData.flag;
      let coachAvatarUrl = formData.coach.avatar; // COACH DATA INTEGRATION
      
      try {
        if (logoFile) {
          console.log('TeamForm - Uploading logo...');
          logoUrl = await uploadImage(logoFile, teamIdForUpload, 'logo');
          if (logoUrl) {
            console.log('TeamForm - Logo uploaded successfully:', logoUrl);
          }
        }

        if (flagFile) {
          console.log('TeamForm - Uploading flag...');
          flagUrl = await uploadImage(flagFile, teamIdForUpload, 'flag');
          if (flagUrl) {
            console.log('TeamForm - Flag uploaded successfully:', flagUrl);
          }
        }

        // COACH DATA INTEGRATION - Upload coach avatar
        if (coachAvatarFile) {
          console.log('TeamForm - Uploading coach avatar...');
          coachAvatarUrl = await uploadImage(coachAvatarFile, teamIdForUpload, 'coach_avatar');
          if (coachAvatarUrl) {
            console.log('TeamForm - Coach avatar uploaded successfully:', coachAvatarUrl);
          }
        }
      } catch (uploadError) {
        console.error('TeamForm - Image upload failed:', uploadError);
        alert('Team saved but image upload failed: ' + uploadError.message);
      }

      // Final update with image URLs if they were uploaded
      if ((logoFile && logoUrl) || (flagFile && flagUrl) || (coachAvatarFile && coachAvatarUrl)) {
        console.log('TeamForm - Updating team with image URLs...');
        const finalUpdateData = {
          ...submitData,
          // Include uploaded image paths
          logo: logoUrl && logoUrl.includes('storage/') ? logoUrl.replace(`${API_CONFIG.BASE_URL}/storage/`, '') : logoUrl,
          flag: flagUrl && flagUrl.includes('storage/') ? flagUrl.replace(`${API_CONFIG.BASE_URL}/storage/`, '') : flagUrl,
          // COACH DATA INTEGRATION - Include coach avatar
          coach_data: {
            ...submitData.coach_data,
            avatar: coachAvatarUrl && coachAvatarUrl.includes('storage/') ? coachAvatarUrl.replace(`${API_CONFIG.BASE_URL}/storage/`, '') : coachAvatarUrl
          }
        };

        await api.put(`/admin/teams/${teamIdForUpload}`, finalUpdateData);
        console.log('TeamForm - Team updated with images');
      }

      // Update form data with final URLs
      setFormData(prev => ({
        ...prev,
        logo: logoUrl,
        flag: flagUrl,
        coach: {
          ...prev.coach,
          avatar: coachAvatarUrl
        }
      }));

      alert(`Team ${isEdit ? 'updated' : 'created'} successfully!`);
      
      // Delay navigation to let user see the success
      setTimeout(() => {
        if (navigateTo) {
          navigateTo('admin-dashboard');
        }
      }, 1500);
      
    } catch (error) {
      console.error('TeamForm - Error saving team:', error);
      
      // Enhanced error handling for backend issues
      if (error.message.includes('500')) {
        setError('BACKEND ISSUE: Server error. Please check backend team validation and database constraints.');
      } else if (error.message.includes('422')) {
        if (error.message.includes('name') && error.message.includes('unique')) {
          setError('BACKEND ISSUE: Team name already exists. Check unique constraints.');
        } else if (error.message.includes('social_links')) {
          setError('BACKEND ISSUE: Social links validation failed. Check backend social_links field format.');
        } else {
          setError('BACKEND ISSUE: Validation error. Check backend validation rules for team fields.');
        }
      } else if (error.message.includes('404')) {
        setError('BACKEND ISSUE: Team API endpoint not found. Implement /api/admin/teams routes.');
      } else {
        setError(`Failed to save team: ${error.message}`);
      }
      
      // Keep form data so user doesn't lose their input
      console.log('TeamForm - Form data preserved for retry');
      
      // Update form data with any server-returned values to prevent field resets
      if (error.response?.data?.data) {
        const serverData = error.response.data.data;
        setFormData(prev => ({
          ...prev,
          ...serverData,
          socialLinks: {
            ...prev.socialLinks,
            ...(serverData.social_links || serverData.socialLinks || {})
          }
        }));
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading team data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Team' : 'Create New Team'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update team information and social links' : 'Add a new team to the database'}
          </p>
        </div>
        <button 
          onClick={() => navigateTo && navigateTo('admin-dashboard')}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          ← Back to Dashboard
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Display with Backend Issue Highlighting */}
        {error && (
          <div className={`border px-4 py-3 rounded mb-4 ${
            error.includes('BACKEND ISSUE') 
              ? 'bg-red-100 border-red-400 text-red-700' 
              : 'bg-yellow-100 border-yellow-400 text-yellow-700'
          }`}>
            {error}
            {error.includes('BACKEND ISSUE') && (
              <div className="mt-2 text-sm">
                <strong>For Backend Developer:</strong> Please check Laravel team model validation and API routes.
              </div>
            )}
          </div>
        )}

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Team Logo */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Team Logo
              </label>
              <ImageUpload
                onImageSelect={handleLogoSelect}
                currentImage={formData.logo}
                placeholder="Upload Team Logo"
                className="w-full max-w-md"
              />
              {formData.logo && (
                <div className="mt-2">
                  <img 
                    src={formData.logo} 
                    alt="Current logo" 
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Team Flag */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Team Flag/Banner
              </label>
              <ImageUpload
                onImageSelect={handleFlagSelect}
                currentImage={formData.flag}
                placeholder="Upload Team Flag"
                className="w-full max-w-md"
              />
              {formData.flag && (
                <div className="mt-2">
                  {/* Check if flag is emoji or URL */}
                  {formData.flag.startsWith('http') || formData.flag.startsWith('/') ? (
                    <img 
                      src={formData.flag} 
                      alt="Current flag" 
                      className="w-16 h-16 object-cover rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-4xl">{formData.flag}</div>
                  )}
                </div>
              )}
            </div>

            {/* Team Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Team Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Team Stark Industries"
                required
              />
            </div>

            {/* Short Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Short Name *
              </label>
              <input
                type="text"
                name="shortName"
                value={formData.shortName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., STARK"
                maxLength="8"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Maximum 8 characters
              </p>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Region *
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="">Select Region</option>
                <option value="NA">North America</option>
                <option value="EU">Europe</option>
                <option value="APAC">Asia-Pacific</option>
                <option value="SA">South America</option>
                <option value="MENA">Middle East & North Africa</option>
                <option value="OCE">Oceania</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., United States"
              />
            </div>

            {/* Current ELO Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Current ELO Rating
              </label>
              <input
                type="number"
                name="elo_rating"
                value={formData.elo_rating}
                onChange={handleInputChange}
                className="form-input"
                placeholder="2400"
                min="0"
                max="5000"
                step="1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Current team ELO rating (0-5000)
              </p>
            </div>

            {/* Team Earnings */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Total Earnings (USD)
              </label>
              <input
                type="number"
                name="earnings"
                value={formData.earnings}
                onChange={handleNumberInputChange}
                className="form-input"
                placeholder="0"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Total prize earnings in USD. Example: 50000.00
              </p>
            </div>

            {/* Peak ELO */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Peak ELO
              </label>
              <input
                type="number"
                name="peak_elo"
                value={formData.peak_elo}
                onChange={handleInputChange}
                className="form-input"
                placeholder="2550"
                min="0"
                max="5000"
                step="1"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Team Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Disbanded">Disbanded</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>

            {/* Founded Date */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Founded Date
              </label>
              <input
                type="date"
                name="founded_date"
                value={formData.founded_date}
                onChange={handleInputChange}
                className="form-input"
              />
            </div>

            {/* Manager */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Manager
              </label>
              <input
                type="text"
                name="manager"
                value={formData.manager}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., John Smith"
              />
            </div>

            {/* Owner */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Owner
              </label>
              <input
                type="text"
                name="owner"
                value={formData.owner}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Team Organization LLC"
              />
            </div>

            {/* Team Description */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Team Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="form-input"
                rows="3"
                placeholder="Team background, history, and achievements..."
              />
            </div>

            {/* Achievements */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Team Achievements
              </label>
              <textarea
                name="achievements"
                value={formData.achievements}
                onChange={handleInputChange}
                className="form-input"
                rows="3"
                placeholder="Major tournament wins, championships, notable accomplishments..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                List major achievements and tournament victories
              </p>
            </div>

          </div>
        </div>

        {/* Team Statistics */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Statistics</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Wins */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Wins
              </label>
              <input
                type="number"
                name="wins"
                value={formData.wins}
                onChange={handleInputChange}
                className="form-input"
                placeholder="100"
                min="0"
                step="1"
              />
            </div>

            {/* Losses */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Losses
              </label>
              <input
                type="number"
                name="losses"
                value={formData.losses}
                onChange={handleInputChange}
                className="form-input"
                placeholder="30"
                min="0"
                step="1"
              />
            </div>

            {/* Matches Played */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Matches Played
              </label>
              <input
                type="number"
                name="matches_played"
                value={formData.matches_played}
                onChange={handleInputChange}
                className="form-input"
                placeholder="130"
                min="0"
                step="1"
              />
            </div>

            {/* Win Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Win Rate (%)
              </label>
              <input
                type="number"
                name="win_rate"
                value={formData.win_rate}
                onChange={handleInputChange}
                className="form-input"
                placeholder="76.9"
                min="0"
                max="100"
                step="0.1"
              />
            </div>

            {/* Current Streak Count */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Current Streak Count
              </label>
              <input
                type="number"
                name="current_streak_count"
                value={formData.current_streak_count}
                onChange={handleInputChange}
                className="form-input"
                placeholder="0"
                min="0"
                step="1"
              />
            </div>

            {/* Current Streak Type */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Current Streak Type
              </label>
              <select
                name="current_streak_type"
                value={formData.current_streak_type}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="none">None</option>
                <option value="win">Win Streak</option>
                <option value="loss">Loss Streak</option>
              </select>
            </div>
          </div>
        </div>

        {/* COACH DATA INTEGRATION - CRITICAL FIX */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Coach Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Coach Avatar */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Coach Avatar
              </label>
              <ImageUpload
                onImageSelect={handleCoachAvatarSelect}
                currentImage={formData.coach.avatar}
                placeholder="Upload Coach Avatar"
                className="w-full max-w-md"
              />
              {formData.coach.avatar && (
                <div className="mt-2">
                  <img 
                    src={formData.coach.avatar} 
                    alt="Current coach avatar" 
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Coach Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Coach Name
              </label>
              <input
                type="text"
                name="coach_name"
                value={formData.coach.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., John 'Coach' Smith"
              />
            </div>

            {/* Coach Real Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Real Name
              </label>
              <input
                type="text"
                name="coach_realName"
                value={formData.coach.realName}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., John Smith"
              />
            </div>

            {/* Coach Nationality */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Nationality
              </label>
              <input
                type="text"
                name="coach_nationality"
                value={formData.coach.nationality}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., United States"
              />
            </div>

            {/* Coach Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Experience (Years)
              </label>
              <input
                type="text"
                name="coach_experience"
                value={formData.coach.experience}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., 5 years in Marvel Rivals"
              />
            </div>

            {/* Coach Achievements */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Achievements
              </label>
              <textarea
                name="coach_achievements"
                value={formData.coach.achievements}
                onChange={handleInputChange}
                className="form-input"
                rows="3"
                placeholder="e.g., Marvel Rivals World Championship 2024, Regional Coach of the Year..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                List major achievements and accolades
              </p>
            </div>
          </div>
        </div>

        {/* Social Links - CRITICAL FIX */}
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Social Links</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Twitter
              </label>
              <input
                type="url"
                name="social_twitter"
                value={formData.socialLinks.twitter}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://twitter.com/teamname"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Full Twitter URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Instagram
              </label>
              <input
                type="url"
                name="social_instagram"
                value={formData.socialLinks.instagram}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://instagram.com/teamname"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Full Instagram URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                YouTube
              </label>
              <input
                type="url"
                name="social_youtube"
                value={formData.socialLinks.youtube}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://youtube.com/c/teamname"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Full YouTube URL
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Website
              </label>
              <input
                type="url"
                name="social_website"
                value={formData.socialLinks.website}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://teamname.com"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Official team website
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Discord
              </label>
              <input
                type="text"
                name="social_discord"
                value={formData.socialLinks.discord}
                onChange={handleInputChange}
                className="form-input"
                placeholder="Discord server invite or team handle"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Team Discord server
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                TikTok
              </label>
              <input
                type="url"
                name="social_tiktok"
                value={formData.socialLinks.tiktok}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://tiktok.com/teamname"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Team TikTok account
              </p>
            </div>
          </div>

          {/* Social Links Preview */}
          {(formData.socialLinks.twitter || formData.socialLinks.instagram || formData.socialLinks.youtube || formData.socialLinks.website || formData.socialLinks.discord || formData.socialLinks.tiktok) && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Social Links Preview:</h4>
              <div className="flex flex-wrap gap-2">
                {formData.socialLinks.twitter && (
                  <a href={formData.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 text-sm">
                    Twitter
                  </a>
                )}
                {formData.socialLinks.instagram && (
                  <a href={formData.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="text-pink-500 hover:text-pink-700 text-sm">
                    Instagram
                  </a>
                )}
                {formData.socialLinks.youtube && (
                  <a href={formData.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="text-red-500 hover:text-red-700 text-sm">
                    YouTube
                  </a>
                )}
                {formData.socialLinks.website && (
                  <a href={formData.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-green-500 hover:text-green-700 text-sm">
                    Website
                  </a>
                )}
                {formData.socialLinks.discord && (
                  <span className="text-indigo-500 text-sm">
                    Discord: {formData.socialLinks.discord}
                  </span>
                )}
                {formData.socialLinks.tiktok && (
                  <a href={formData.socialLinks.tiktok} target="_blank" rel="noopener noreferrer" className="text-purple-500 hover:text-purple-700 text-sm">
                    TikTok
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigateTo && navigateTo('admin-dashboard')}
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <span className="flex items-center">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                {isEdit ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              isEdit ? 'Update Team' : 'Create Team'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default TeamForm;