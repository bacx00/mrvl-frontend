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
    earnings: 0, // Team total earnings in USD
    // Missing team fields
    elo_rating: 1000, // Team ELO rating with Marvel Rivals default
    peak_elo: 1000,
    wins: 0,
    losses: 0,
    matches_played: 0,
    maps_won: 0,
    maps_lost: 0,
    win_rate: 0,
    map_win_rate: 0,
    points: 0,
    rank: 0,
    rating: 1000,
    current_streak_count: 0,
    current_streak_type: '',
    longest_win_streak: 0,
    tournaments_won: 0,
    achievements: '',
    captain: '',
    manager: '',
    owner: '',
    founded: '',
    founded_date: '',
    description: '',
    website: '',
    liquipedia_url: '',
    status: 'Active',
    platform: 'PC',
    game: 'Marvel Rivals',
    division: '',
    player_count: 0,
    // COACH DATA INTEGRATION - CRITICAL FIX
    coach: {
      name: '',
      avatar: '',
      country: 'US',
      image: '',
      nationality: ''
    },
    socialLinks: {
      twitter: '',
      instagram: '',
      youtube: '',
      website: '',
      discord: '',
      tiktok: '',
      facebook: '',
      twitch: ''
    },
    social_media: {}
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
      
      // Preserve ALL existing team data when editing
      const socialLinks = team.social_links || team.socialLinks || team.social_media || {};
      const socialMediaParsed = typeof socialLinks === 'string' ? JSON.parse(socialLinks) : socialLinks;
      
      setFormData({
        // Basic info
        name: team.name || '',
        shortName: team.short_name || team.shortName || '',
        region: team.region || '',
        logo: team.logo_url || team.logo || '',
        flag: team.flag_url || team.flag || '',
        country: team.country || '',
        
        // Financial
        earnings: team.earnings || team.total_earnings || 0,
        
        // Performance stats - PRESERVE ALL
        elo_rating: team.elo_rating || team.rating || 1000,
        peak_elo: team.peak_elo || team.peak || team.elo_rating || 1000,
        rating: team.rating || team.elo_rating || 1000,
        wins: team.wins || 0,
        losses: team.losses || 0,
        matches_played: team.matches_played || 0,
        maps_won: team.maps_won || 0,
        maps_lost: team.maps_lost || 0,
        win_rate: team.win_rate || 0,
        map_win_rate: team.map_win_rate || 0,
        points: team.points || 0,
        rank: team.rank || 0,
        
        // Streaks and records
        current_streak_count: team.current_streak_count || 0,
        current_streak_type: team.current_streak_type || '',
        longest_win_streak: team.longest_win_streak || 0,
        tournaments_won: team.tournaments_won || 0,
        record: team.record || '',
        
        // Organization info
        achievements: team.achievements || '',
        captain: team.captain || '',
        manager: team.manager || '',
        owner: team.owner || '',
        founded: team.founded || '',
        founded_date: team.founded_date || '',
        description: team.description || '',
        website: team.website || '',
        liquipedia_url: team.liquipedia_url || '',
        
        // Meta info
        status: team.status || 'Active',
        platform: team.platform || 'PC',
        game: team.game || 'Marvel Rivals',
        division: team.division || '',
        player_count: team.player_count || 0,
        
        // COACH DATA INTEGRATION - PRESERVE ALL COACH FIELDS
        coach: {
          name: team.coach_name || team.coach || '',
          avatar: team.coach_image || team.coach_avatar || '',
          country: team.coach_country || team.coach_nationality || 'US',
          image: team.coach_image || '',
          nationality: team.coach_nationality || team.coach_country || ''
        },
        
        // Social Links - merge all sources
        socialLinks: {
          twitter: socialMediaParsed.twitter || team.twitter || '',
          instagram: socialMediaParsed.instagram || team.instagram || '',
          youtube: socialMediaParsed.youtube || team.youtube || '',
          website: socialMediaParsed.website || team.website || '',
          discord: socialMediaParsed.discord || team.discord || '',
          tiktok: socialMediaParsed.tiktok || team.tiktok || '',
          facebook: socialMediaParsed.facebook || team.facebook || '',
          twitch: socialMediaParsed.twitch || team.twitch || ''
        },
        
        // Keep raw social_media for backend compatibility
        social_media: team.social_media || socialMediaParsed || {},
        
        // Preserve any additional fields from backend
        ...team
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
    // Handle decimal values for earnings field
    const numValue = name === 'earnings' ? parseFloat(value) : parseInt(value);
    setFormData(prev => ({
      ...prev,
      [name]: numValue || 0
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
      
      // CRITICAL FIX: Prepare proper data format for Laravel backend, preserving ALL existing data
      const submitData = {
        // Required fields
        name: formData.name.trim(),
        short_name: formData.shortName.trim(),
        region: formData.region,
        country: formData.country,
        
        // Ratings and performance - preserve existing values
        rating: parseInt(formData.rating) || parseInt(formData.elo_rating) || 1000,
        elo_rating: parseInt(formData.elo_rating) || parseInt(formData.rating) || 1000,
        peak_elo: parseInt(formData.peak_elo) || parseInt(formData.peak) || parseInt(formData.elo_rating) || 1000,
        
        // Statistics - preserve ALL existing stats
        wins: parseInt(formData.wins) || 0,
        losses: parseInt(formData.losses) || 0,
        matches_played: parseInt(formData.matches_played) || 0,
        maps_won: parseInt(formData.maps_won) || 0,
        maps_lost: parseInt(formData.maps_lost) || 0,
        win_rate: parseFloat(formData.win_rate) || 0,
        map_win_rate: parseFloat(formData.map_win_rate) || 0,
        points: parseInt(formData.points) || 0,
        rank: parseInt(formData.rank) || 0,
        
        // Streaks and records - preserve
        current_streak_count: parseInt(formData.current_streak_count) || 0,
        current_streak_type: formData.current_streak_type || '',
        longest_win_streak: parseInt(formData.longest_win_streak) || 0,
        tournaments_won: parseInt(formData.tournaments_won) || 0,
        record: formData.record || '',
        
        // Financial
        earnings: parseFloat(formData.earnings) || 0,
        
        // Organization
        achievements: formData.achievements || null,
        captain: formData.captain || null,
        manager: formData.manager || null,
        owner: formData.owner || null,
        founded: formData.founded || null,
        founded_date: formData.founded_date || null,
        description: formData.description || null,
        website: formData.website || null,
        liquipedia_url: formData.liquipedia_url || null,
        
        // Meta
        status: formData.status || 'Active',
        platform: formData.platform || 'PC',
        game: formData.game || 'Marvel Rivals',
        division: formData.division || '',
        player_count: parseInt(formData.player_count) || 0,
        
        // COACH DATA INTEGRATION - preserve all coach data
        coach: formData.coach.name || '',
        coach_name: formData.coach.name || '',
        coach_country: formData.coach.country || formData.coach.nationality || 'US',
        coach_nationality: formData.coach.nationality || formData.coach.country || 'US',
        coach_image: formData.coach.image || formData.coach.avatar || '',
        
        // Social links - merge all sources
        social_links: {
          twitter: formData.socialLinks.twitter || '',
          instagram: formData.socialLinks.instagram || '',
          youtube: formData.socialLinks.youtube || '',
          website: formData.socialLinks.website || formData.website || '',
          discord: formData.socialLinks.discord || '',
          tiktok: formData.socialLinks.tiktok || '',
          facebook: formData.socialLinks.facebook || '',
          twitch: formData.socialLinks.twitch || ''
        },
        
        // Include social_media for backend compatibility
        social_media: JSON.stringify(formData.social_media || formData.socialLinks || {})
      };
      
      // Only include fields that have been explicitly set (for update operations)
      if (isEdit) {
        // Remove null/undefined values to preserve existing data
        Object.keys(submitData).forEach(key => {
          if (submitData[key] === null || submitData[key] === undefined || submitData[key] === '') {
            // Keep zeros for numeric fields
            if (typeof formData[key] !== 'number') {
              delete submitData[key];
            }
          }
        });
      }

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

  // Countries list for coach selection
  const countries = [
    { value: 'US', label: '🇺🇸 United States' },
    { value: 'CA', label: '🇨🇦 Canada' },
    { value: 'MX', label: '🇲🇽 Mexico' },
    { value: 'BR', label: '🇧🇷 Brazil' },
    { value: 'AR', label: '🇦🇷 Argentina' },
    { value: 'UK', label: '🇬🇧 United Kingdom' },
    { value: 'DE', label: '🇩🇪 Germany' },
    { value: 'FR', label: '🇫🇷 France' },
    { value: 'ES', label: '🇪🇸 Spain' },
    { value: 'IT', label: '🇮🇹 Italy' },
    { value: 'NL', label: '🇳🇱 Netherlands' },
    { value: 'SE', label: '🇸🇪 Sweden' },
    { value: 'DK', label: '🇩🇰 Denmark' },
    { value: 'FI', label: '🇫🇮 Finland' },
    { value: 'NO', label: '🇳🇴 Norway' },
    { value: 'PL', label: '🇵🇱 Poland' },
    { value: 'RU', label: '🇷🇺 Russia' },
    { value: 'UA', label: '🇺🇦 Ukraine' },
    { value: 'KR', label: '🇰🇷 South Korea' },
    { value: 'JP', label: '🇯🇵 Japan' },
    { value: 'CN', label: '🇨🇳 China' },
    { value: 'TW', label: '🇹🇼 Taiwan' },
    { value: 'HK', label: '🇭🇰 Hong Kong' },
    { value: 'SG', label: '🇸🇬 Singapore' },
    { value: 'MY', label: '🇲🇾 Malaysia' },
    { value: 'TH', label: '🇹🇭 Thailand' },
    { value: 'VN', label: '🇻🇳 Vietnam' },
    { value: 'PH', label: '🇵🇭 Philippines' },
    { value: 'ID', label: '🇮🇩 Indonesia' },
    { value: 'IN', label: '🇮🇳 India' },
    { value: 'AU', label: '🇦🇺 Australia' },
    { value: 'NZ', label: '🇳🇿 New Zealand' },
    { value: 'ZA', label: '🇿🇦 South Africa' },
    { value: 'AE', label: '🇦🇪 UAE' },
    { value: 'SA', label: '🇸🇦 Saudi Arabia' },
    { value: 'INTL', label: '🌍 International' }
  ];

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

            {/* Achievements */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Achievements
              </label>
              <textarea
                name="achievements"
                value={formData.achievements}
                onChange={handleInputChange}
                className="form-input"
                rows="3"
                placeholder="Major tournament wins, championships, notable accomplishments..."
              />
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

            {/* Coach Country */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Coach Country
              </label>
              <select
                name="coach_country"
                value={formData.coach.country}
                onChange={handleInputChange}
                className="form-input"
              >
                {countries.map(country => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
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