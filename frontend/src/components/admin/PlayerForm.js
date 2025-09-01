import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { API_CONFIG } from '../../config';
import ImageUpload from '../shared/ImageUpload';

function PlayerForm({ playerId, navigateTo }) {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    real_name: '',
    team: '',
    team_id: '',
    role: '',
    main_hero: '',
    alt_heroes: [],
    hero_pool: [],
    region: '',
    country: 'US',
    nationality: '',
    age: '',
    birth_date: '',
    earnings: 0,
    total_earnings: 0,
    avatar: '',
    // Performance stats
    elo_rating: 1000,
    rating: 1000,
    peak_elo: 1000,
    peak_rating: 1000,
    skill_rating: 1000,
    rank: 0,
    wins: 0,
    losses: 0,
    kda: 0,
    total_matches: 0,
    win_rate: 0,
    // Career stats
    total_eliminations: 0,
    total_deaths: 0,
    total_assists: 0,
    overall_kda: 0,
    average_damage_per_match: 0,
    average_healing_per_match: 0,
    average_damage_blocked_per_match: 0,
    // Streaks and achievements
    longest_win_streak: 0,
    current_win_streak: 0,
    most_played_hero: '',
    best_winrate_hero: '',
    tournaments_played: 0,
    // Organization
    jersey_number: '',
    team_position: '',
    position_order: 0,
    // Meta
    status: 'active',
    biography: '',
    liquipedia_url: '',
    // Social links
    socialLinks: {
      twitter: '',
      twitch: '',
      youtube: '',
      instagram: '',
      discord: '',
      tiktok: '',
      facebook: ''
    },
    social_media: {}
  });
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const { api } = useAuth();

  const isEdit = Boolean(playerId);

  const fetchPlayer = async () => {
    if (!isEdit) return;
    
    try {
      setLoading(true);
      const response = await api.get(`/players/${playerId}`);
      const player = response.data || response;
      
      console.log(' PlayerForm - Fetched player data:', player);
      
      // Parse social media if it's a string
      const socialData = player.social_media || player.social_links || player.socialLinks || {};
      const socialParsed = typeof socialData === 'string' ? JSON.parse(socialData) : socialData;
      
      // PRESERVE ALL PLAYER DATA when editing
      setFormData({
        // Basic info
        name: player.real_name || player.name || '',
        username: player.username || player.gamer_tag || '',
        real_name: player.real_name || player.name || '',
        team: player.team_id || player.team?.id || '',
        team_id: player.team_id || player.team?.id || '',
        
        // Game info
        role: player.role || '',
        main_hero: player.main_hero || '',
        alt_heroes: player.alt_heroes || [],
        hero_pool: player.hero_pool || [],
        
        // Personal info
        region: player.region || '',
        country: player.country || 'US',
        nationality: player.nationality || player.country || '',
        age: player.age || '',
        birth_date: player.birth_date || '',
        avatar: player.avatar_url || player.avatar || '',
        
        // Financial
        earnings: player.earnings || 0,
        total_earnings: player.total_earnings || player.earnings || 0,
        
        // Performance stats - PRESERVE ALL
        elo_rating: player.elo_rating || player.rating || 1000,
        rating: player.rating || player.elo_rating || 1000,
        peak_elo: player.peak_elo || player.peak_rating || 1000,
        peak_rating: player.peak_rating || player.peak_elo || 1000,
        skill_rating: player.skill_rating || 1000,
        rank: player.rank || 0,
        wins: player.wins || 0,
        losses: player.losses || 0,
        kda: player.kda || 0,
        total_matches: player.total_matches || 0,
        win_rate: player.win_rate || 0,
        
        // Career stats - PRESERVE ALL
        total_eliminations: player.total_eliminations || 0,
        total_deaths: player.total_deaths || 0,
        total_assists: player.total_assists || 0,
        overall_kda: player.overall_kda || player.kda || 0,
        average_damage_per_match: player.average_damage_per_match || 0,
        average_healing_per_match: player.average_healing_per_match || 0,
        average_damage_blocked_per_match: player.average_damage_blocked_per_match || 0,
        
        // Streaks and achievements
        longest_win_streak: player.longest_win_streak || 0,
        current_win_streak: player.current_win_streak || 0,
        most_played_hero: player.most_played_hero || '',
        best_winrate_hero: player.best_winrate_hero || '',
        tournaments_played: player.tournaments_played || 0,
        
        // Organization
        jersey_number: player.jersey_number || '',
        team_position: player.team_position || '',
        position_order: player.position_order || 0,
        
        // Meta
        status: player.status || 'active',
        biography: player.biography || '',
        liquipedia_url: player.liquipedia_url || '',
        
        // Social links - merge all sources
        socialLinks: {
          twitter: socialParsed.twitter || player.twitter || '',
          twitch: socialParsed.twitch || player.twitch || '',
          youtube: socialParsed.youtube || player.youtube || '',
          instagram: socialParsed.instagram || player.instagram || '',
          discord: socialParsed.discord || player.discord || '',
          tiktok: socialParsed.tiktok || player.tiktok || '',
          facebook: socialParsed.facebook || player.facebook || ''
        },
        
        // Keep raw social_media
        social_media: player.social_media || socialParsed || {},
        
        // Preserve any additional fields
        ...player
      });
    } catch (error) {
      console.error('Error fetching player:', error);
      alert('Error loading player data: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await api.get('/admin/teams');
      setTeams(response.data || response || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  useEffect(() => {
    fetchPlayer();
    fetchTeams();
  }, [playerId, isEdit]); // eslint-disable-line react-hooks/exhaustive-deps

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
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleImageSelect = (file, previewUrl) => {
    console.log('🖼️ PlayerForm - Avatar selected:', file?.name, previewUrl);
    setAvatarFile(file);
    
    // Don't use blob URL for display - use a placeholder or wait for actual upload
    if (file) {
      setFormData(prev => ({
        ...prev,
        avatar: '' // Clear current avatar URL since we have a new file
      }));
    }
  };

  const uploadAvatar = async (file, playerId) => {
    if (!file) return null;
    
    try {
      console.log(' PlayerForm - Uploading avatar for player', playerId, ':', file.name);
      
      const uploadFormData = new FormData();
      uploadFormData.append('avatar', file);
      
      const endpoint = `/upload/player/${playerId}/avatar`;
      console.log(' PlayerForm - Upload endpoint:', endpoint);
      
      const response = await api.postFile(endpoint, uploadFormData);
      
      console.log(' PlayerForm - Avatar upload response:', response);
      
      const data = response.data || response;
      
      let avatarUrl;
      if (data.data) {
        avatarUrl = data.data.avatar_url || data.data.avatar;
      } else {
        avatarUrl = data.avatar_url || data.url || data.avatar;
      }
      
      console.log(' PlayerForm - Extracted avatar URL:', avatarUrl);
      
      if (!avatarUrl) {
        console.error(' PlayerForm - No avatar URL found in response:', data);
        throw new Error('No avatar URL returned from upload');
      }
      
      return avatarUrl;
    } catch (error) {
      console.error(' PlayerForm - Error uploading avatar:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    console.log(' PlayerForm - Starting save process...');

    // Frontend validation
    if (!formData.name.trim()) {
      setError('Player name is required');
      return;
    }
    
    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }
    if (!formData.role) {
      setError('Player role is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let currentPlayerId = playerId;

      // CRITICAL FIX: Prepare proper data format for Laravel backend, preserving ALL data
      const submitData = {
        // Basic info
        username: formData.username.trim(),
        real_name: formData.name.trim() || formData.real_name.trim(),
        team_id: formData.team ? parseInt(formData.team) : (formData.team_id ? parseInt(formData.team_id) : null),
        
        // Game info
        role: formData.role,
        main_hero: formData.main_hero || null,
        alt_heroes: formData.alt_heroes || [],
        hero_pool: formData.hero_pool || [],
        
        // Personal info
        region: formData.region,
        country: formData.country,
        nationality: formData.nationality || formData.country,
        age: formData.age ? parseInt(formData.age) : null,
        birth_date: formData.birth_date || null,
        
        // Financial - preserve existing earnings
        earnings: parseFloat(formData.earnings) || 0,
        total_earnings: parseFloat(formData.total_earnings) || parseFloat(formData.earnings) || 0,
        
        // Performance stats - PRESERVE ALL
        elo_rating: parseInt(formData.elo_rating) || parseInt(formData.rating) || 1000,
        rating: parseInt(formData.rating) || parseInt(formData.elo_rating) || 1000,
        peak_elo: parseInt(formData.peak_elo) || parseInt(formData.peak_rating) || parseInt(formData.elo_rating) || 1000,
        peak_rating: parseInt(formData.peak_rating) || parseInt(formData.peak_elo) || parseInt(formData.rating) || 1000,
        skill_rating: parseInt(formData.skill_rating) || 1000,
        rank: parseInt(formData.rank) || 0,
        wins: parseInt(formData.wins) || 0,
        losses: parseInt(formData.losses) || 0,
        kda: parseFloat(formData.kda) || 0,
        total_matches: parseInt(formData.total_matches) || 0,
        
        // Career stats - PRESERVE ALL
        total_eliminations: parseInt(formData.total_eliminations) || 0,
        total_deaths: parseInt(formData.total_deaths) || 0,
        total_assists: parseInt(formData.total_assists) || 0,
        overall_kda: parseFloat(formData.overall_kda) || parseFloat(formData.kda) || 0,
        average_damage_per_match: parseFloat(formData.average_damage_per_match) || 0,
        average_healing_per_match: parseFloat(formData.average_healing_per_match) || 0,
        average_damage_blocked_per_match: parseFloat(formData.average_damage_blocked_per_match) || 0,
        
        // Streaks and achievements
        longest_win_streak: parseInt(formData.longest_win_streak) || 0,
        current_win_streak: parseInt(formData.current_win_streak) || 0,
        most_played_hero: formData.most_played_hero || null,
        best_winrate_hero: formData.best_winrate_hero || null,
        tournaments_played: parseInt(formData.tournaments_played) || 0,
        
        // Organization
        jersey_number: formData.jersey_number || null,
        team_position: formData.team_position || null,
        position_order: parseInt(formData.position_order) || 0,
        
        // Meta
        status: formData.status || 'active',
        biography: formData.biography || null,
        liquipedia_url: formData.liquipedia_url || null,
        
        // Social media
        social_media: formData.socialLinks,
        twitter: formData.socialLinks.twitter || null,
        twitch: formData.socialLinks.twitch || null,
        youtube: formData.socialLinks.youtube || null,
        instagram: formData.socialLinks.instagram || null,
        discord: formData.socialLinks.discord || null,
        tiktok: formData.socialLinks.tiktok || null,
        facebook: formData.socialLinks.facebook || null
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

      console.log(' PlayerForm - Submit data prepared:', submitData);

      if (playerId) {
        // EDITING existing player
        console.log(' Editing existing player with ID:', playerId);
        await api.put(`/admin/players/${playerId}`, submitData);
        console.log(' Player data updated successfully');
      } else {
        // CREATING new player
        console.log(' Creating new player...');
        const playerResponse = await api.post('/admin/players', submitData);
        currentPlayerId = playerResponse.data?.id || playerResponse.id;
        console.log(' Player created with ID:', currentPlayerId);
      }

      // CRITICAL FIX: Upload avatar if a new file was selected
      console.log(' Checking avatar upload conditions:', {
        avatarFile: !!avatarFile,
        avatarFileName: avatarFile?.name,
        currentPlayerId: currentPlayerId,
        shouldUpload: !!(avatarFile && currentPlayerId)
      });
      
      if (avatarFile && currentPlayerId) {
        console.log(' Uploading new avatar for player:', currentPlayerId);
        try {
          const avatarUrl = await uploadAvatar(avatarFile, currentPlayerId);
          console.log(' Avatar uploaded successfully:', avatarUrl);
          
          // Update player with new avatar URL
          const updatedFormData = { ...submitData, avatar: avatarUrl };
          console.log(' Updating player with avatar URL:', updatedFormData.avatar);
          await api.put(`/admin/players/${currentPlayerId}`, updatedFormData);
          console.log(' Player updated with avatar URL');
        } catch (avatarError) {
          console.error(' Avatar upload failed:', avatarError);
          // Don't fail the whole operation for avatar upload failure
          alert(' Player saved but avatar upload failed. Please try uploading the avatar again.');
        }
      } else {
        console.log(' Skipping avatar upload:', {
          reason: !avatarFile ? 'No avatar file selected' : 'No player ID available'
        });
      }

      alert(' Player saved successfully!');

      // Navigate back to admin dashboard
      if (navigateTo) {
        navigateTo('admin-dashboard');
      }
    } catch (error) {
      console.error(' PlayerForm - Error saving player:', error);
      
      // Enhanced error handling for different scenarios
      if (error.message.includes('500')) {
        setError(' BACKEND ISSUE: Server error. Please check backend player validation and database constraints.');
      } else if (error.message.includes('422')) {
        if (error.message.includes('role') && error.message.includes('invalid')) {
          setError(' BACKEND ISSUE: Invalid role validation. Backend expects specific role values.');
        } else if (error.message.includes('team_id')) {
          setError(' BACKEND ISSUE: Team assignment failed. Check team_id foreign key constraints.');
        } else {
          setError(' BACKEND ISSUE: Validation error. Check backend validation rules for player fields.');
        }
      } else if (error.message.includes('404')) {
        setError(' BACKEND ISSUE: Player API endpoint not found. Implement /api/admin/players routes.');
      } else {
        setError(`Failed to save player: ${error.message}`);
      }
      
      // Keep form data so user doesn't lose their input
      console.log(' Form data preserved for retry');
      
      // Update form data with any server-returned values to prevent field resets
      if (error.response?.data?.data) {
        const serverData = error.response.data.data;
        setFormData(prev => ({
          ...prev,
          ...serverData,
          socialLinks: {
            ...prev.socialLinks,
            ...(serverData.social_media || serverData.socialLinks || {})
          }
        }));
      }
    } finally {
      setSaving(false);
    }
  };

  //  FIXED: Use only backend-supported roles (database constraint issue with Flex)
  const roles = [
    { value: 'Duelist', label: 'Duelist (DPS)', description: 'Damage dealers' },
    { value: 'Vanguard', label: 'Vanguard (Tank)', description: 'Front-line defenders' },
    { value: 'Strategist', label: 'Strategist (Support)', description: 'Team support and healing' }
  ];

  const countries = [
    { value: 'US', label: '🇺🇸 United States' },
    { value: 'CA', label: '🇨🇦 Canada' },
    { value: 'MX', label: '🇲🇽 Mexico' },
    { value: 'BR', label: '🇧🇷 Brazil' },
    { value: 'AR', label: '🇦🇷 Argentina' },
    { value: 'CL', label: '🇨🇱 Chile' },
    { value: 'CO', label: '🇨🇴 Colombia' },
    { value: 'PE', label: '🇵🇪 Peru' },
    { value: 'UY', label: '🇺🇾 Uruguay' },
    { value: 'UK', label: '🇬🇧 United Kingdom' },
    { value: 'DE', label: '🇩🇪 Germany' },
    { value: 'FR', label: '🇫🇷 France' },
    { value: 'ES', label: '🇪🇸 Spain' },
    { value: 'IT', label: '🇮🇹 Italy' },
    { value: 'NL', label: '🇳🇱 Netherlands' },
    { value: 'BE', label: '🇧🇪 Belgium' },
    { value: 'CH', label: '🇨🇭 Switzerland' },
    { value: 'AT', label: '🇦🇹 Austria' },
    { value: 'PL', label: '🇵🇱 Poland' },
    { value: 'CZ', label: '🇨🇿 Czech Republic' },
    { value: 'HU', label: '🇭🇺 Hungary' },
    { value: 'RO', label: '🇷🇴 Romania' },
    { value: 'SE', label: '🇸🇪 Sweden' },
    { value: 'NO', label: '🇳🇴 Norway' },
    { value: 'DK', label: '🇩🇰 Denmark' },
    { value: 'FI', label: '🇫🇮 Finland' },
    { value: 'IS', label: '🇮🇸 Iceland' },
    { value: 'IE', label: '🇮🇪 Ireland' },
    { value: 'PT', label: '🇵🇹 Portugal' },
    { value: 'GR', label: '🇬🇷 Greece' },
    { value: 'TR', label: '🇹🇷 Turkey' },
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
    { value: 'PK', label: '🇵🇰 Pakistan' },
    { value: 'BD', label: '🇧🇩 Bangladesh' },
    { value: 'LK', label: '🇱🇰 Sri Lanka' },
    { value: 'AU', label: '🇦🇺 Australia' },
    { value: 'NZ', label: '🇳🇿 New Zealand' },
    { value: 'ZA', label: '🇿🇦 South Africa' },
    { value: 'EG', label: '🇪🇬 Egypt' },
    { value: 'NG', label: '🇳🇬 Nigeria' },
    { value: 'KE', label: '🇰🇪 Kenya' },
    { value: 'MA', label: '🇲🇦 Morocco' },
    { value: 'TN', label: '🇹🇳 Tunisia' },
    { value: 'DZ', label: '🇩🇿 Algeria' },
    { value: 'IL', label: '🇮🇱 Israel' },
    { value: 'SA', label: '🇸🇦 Saudi Arabia' },
    { value: 'AE', label: '🇦🇪 UAE' },
    { value: 'QA', label: '🇶🇦 Qatar' },
    { value: 'KW', label: '🇰🇼 Kuwait' },
    { value: 'BH', label: '🇧🇭 Bahrain' },
    { value: 'OM', label: '🇴🇲 Oman' },
    { value: 'JO', label: '🇯🇴 Jordan' },
    { value: 'LB', label: '🇱🇧 Lebanon' },
    { value: 'IQ', label: '🇮🇶 Iraq' },
    { value: 'IR', label: '🇮🇷 Iran' },
    { value: 'INTL', label: ' International' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading player data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            {isEdit ? 'Edit Player' : 'Create New Player'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {isEdit ? 'Update player information and team assignment' : 'Add a new player to the database'}
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
                <strong>For Backend Developer:</strong> Please check Laravel player model validation and API routes.
              </div>
            )}
          </div>
        )}
        
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Player Avatar */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Player Avatar
              </label>
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={formData.avatar}
                placeholder="Upload Player Avatar"
                className="w-full max-w-md"
              />
              {formData.avatar && (
                <div className="mt-2">
                  <img 
                    src={formData.avatar} 
                    alt="Current avatar" 
                    className="w-16 h-16 object-cover rounded"
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Player Name */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Player Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., Tony Stark"
                required
              />
            </div>

            {/* Username/Gamertag */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Username/Gamertag *
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., IronMan_Tony"
                required
              />
            </div>


            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Age
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., 25"
                min="16"
                max="50"
              />
            </div>


            {/* Player Earnings */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Earnings (USD)
              </label>
              <input
                type="number"
                name="earnings"
                value={formData.earnings}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., 25000.00"
                min="0"
                step="0.01"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Total prize earnings in USD
              </p>
            </div>


            {/* ELO Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                ELO Rating
              </label>
              <input
                type="number"
                name="elo_rating"
                value={formData.elo_rating}
                onChange={handleInputChange}
                className="form-input"
                placeholder="e.g., 2500"
                min="0"
                max="5000"
                step="1"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Current ELO rating (0-5000)
              </p>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="retired">Retired</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Team - CRITICAL FIX for Free Agent issue */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Team Assignment
              </label>
              <select
                name="team"
                value={formData.team}
                onChange={handleInputChange}
                className="form-input"
              >
                <option value=""> Free Agent (No Team)</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.short_name || team.shortName})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.team ? 'Player will be assigned to selected team' : 'Player will be listed as Free Agent'}
              </p>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="">Select Role</option>
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
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
                <option value="OCE">Oceania</option>
              </select>
            </div>

            {/* Country */}
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Country *
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className="form-input"
                required
              >
                <option value="">Select Country</option>
                {countries.map(country => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>


        {/* Social Links */}
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
                placeholder="https://twitter.com/username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Twitch
              </label>
              <input
                type="url"
                name="social_twitch"
                value={formData.socialLinks.twitch}
                onChange={handleInputChange}
                className="form-input"
                placeholder="https://twitch.tv/username"
              />
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
                placeholder="https://youtube.com/c/username"
              />
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
                placeholder="https://instagram.com/username"
              />
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
                placeholder="Discord username or invite"
              />
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
                placeholder="https://tiktok.com/username"
              />
            </div>
          </div>
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
              isEdit ? 'Update Player' : 'Create Player'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PlayerForm;