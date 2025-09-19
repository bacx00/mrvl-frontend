import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import useActivityStats from '../../hooks/useActivityStats';
import HeroImage, { HeroPortrait } from '../shared/HeroImage';
import { getImageUrl } from '../../utils/imageUtils';
import { createErrorHandler, retryOperation, ERROR_CODES } from '../../utils/errorHandler';
import ErrorBoundary from '../shared/ErrorBoundary';
import TeamSelector from '../shared/TeamSelector';
import TwoFactorSettings from '../admin/TwoFactorSettings';

function SimpleUserProfile({ navigateTo, params }) {
  const { user, api, updateUser } = useAuth();
  const targetUserId = params?.id;
  const isOwnProfile = !targetUserId || targetUserId == user?.id;
  const isAdminViewingOtherProfile = !isOwnProfile && user?.role === 'admin';
  const canEditProfile = isOwnProfile || isAdminViewingOtherProfile;
  
  // Debug logging
  console.log('🔍 SimpleUserProfile Debug:');
  console.log('- user:', user);
  console.log('- targetUserId:', targetUserId);
  console.log('- user?.id:', user?.id);
  console.log('- isOwnProfile:', isOwnProfile);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    avatar: '',
    hero_flair: '',
    team_flair_id: null,
    show_hero_flair: true,
    show_team_flair: true,
    use_hero_as_avatar: false
  });
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [originalProfileData, setOriginalProfileData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showHeroAvatarModal, setShowHeroAvatarModal] = useState(false);
  const [availableFlairs, setAvailableFlairs] = useState({ heroes: {}, teams: [] });
  const [errors, setErrors] = useState({});
  const [networkStatus, setNetworkStatus] = useState('online');
  
  // Use the activity stats hook for real-time updates
  const { 
    stats: userStats, 
    loading: statsLoading, 
    error: statsError, 
    lastUpdated: statsLastUpdated,
    triggerUpdate: triggerStatsUpdate 
  } = useActivityStats(targetUserId, {
    updateInterval: 30000, // Update every 30 seconds
    enableRealTimeUpdates: true,
    enableActivityTriggers: true,
    debounceDelay: 2000
  });
  
  // Error handler for API calls
  const handleError = createErrorHandler({
    context: { 
      component: 'SimpleUserProfile', 
      userId: user?.id,
      targetUserId,
      isOwnProfile 
    },
    onError: (errorInfo) => {
      setErrors(prev => ({
        ...prev,
        [errorInfo.context?.operation || 'general']: {
          message: errorInfo.message,
          code: errorInfo.code,
          retryable: errorInfo.retryable,
          timestamp: Date.now()
        }
      }));
    }
  });

  const fetchAvailableFlairs = useCallback(async () => {
    try {
      console.log('🔄 Fetching available flairs...');
      
      // Fetch available heroes - try multiple endpoints for reliability
      let heroesByRole = {};
      try {
        const heroesResponse = await api.get('/public/heroes/images/all');
        const heroesApiData = heroesResponse.data?.data || heroesResponse.data || {};
        
        if (typeof heroesApiData === 'object' && !Array.isArray(heroesApiData)) {
          // Data is already grouped by role
          heroesByRole = heroesApiData;
          console.log('✅ Heroes loaded from /public/heroes/images/all (grouped):', Object.keys(heroesByRole).length, 'roles');
        } else if (Array.isArray(heroesApiData)) {
          // Data is array, need to group by role
          heroesApiData.forEach(hero => {
            const role = hero.role || 'Other';
            if (!heroesByRole[role]) {
              heroesByRole[role] = [];
            }
            heroesByRole[role].push(hero);
          });
          console.log('✅ Heroes loaded and grouped:', Object.keys(heroesByRole).length, 'roles');
        }
      } catch (heroError) {
        console.log('⚠️ Primary hero endpoint failed, trying fallback...');
        try {
          const fallbackResponse = await api.get('/heroes/images/all');
          const heroesApiData = fallbackResponse.data?.data || fallbackResponse.data || {};
          
          if (typeof heroesApiData === 'object' && !Array.isArray(heroesApiData)) {
            heroesByRole = heroesApiData;
          } else if (Array.isArray(heroesApiData)) {
            heroesApiData.forEach(hero => {
              const role = hero.role || 'Other';
              if (!heroesByRole[role]) {
                heroesByRole[role] = [];
              }
              heroesByRole[role].push(hero);
            });
          }
          console.log('✅ Heroes loaded from fallback endpoint:', Object.keys(heroesByRole).length, 'roles');
        } catch (fallbackError) {
          console.error('❌ Both hero endpoints failed:', fallbackError);
          handleError(fallbackError);
          // Use static hero data as last resort
          heroesByRole = {
            'Vanguard': [
              { name: 'Captain America', slug: 'captain-america', image_exists: true },
              { name: 'Doctor Strange', slug: 'doctor-strange', image_exists: true },
              { name: 'Groot', slug: 'groot', image_exists: true },
              { name: 'Hulk', slug: 'bruce-banner', image_exists: true },
              { name: 'Magneto', slug: 'magneto', image_exists: true },
              { name: 'Peni Parker', slug: 'peni-parker', image_exists: true },
              { name: 'Thor', slug: 'thor', image_exists: true },
              { name: 'Venom', slug: 'venom', image_exists: true },
              { name: 'Emma Frost', slug: 'emma-frost', image_exists: true },
              { name: 'Mr. Fantastic', slug: 'mister-fantastic', image_exists: true }
            ],
            'Duelist': [
              { name: 'Black Panther', slug: 'black-panther', image_exists: true },
              { name: 'Black Widow', slug: 'black-widow', image_exists: true },
              { name: 'Hawkeye', slug: 'hawkeye', image_exists: true },
              { name: 'Hela', slug: 'hela', image_exists: true },
              { name: 'Iron Man', slug: 'iron-man', image_exists: true },
              { name: 'Magik', slug: 'magik', image_exists: true },
              { name: 'Moon Knight', slug: 'moon-knight', image_exists: true },
              { name: 'Namor', slug: 'namor', image_exists: true },
              { name: 'Psylocke', slug: 'psylocke', image_exists: true },
              { name: 'Punisher', slug: 'the-punisher', image_exists: true },
              { name: 'Scarlet Witch', slug: 'scarlet-witch', image_exists: true },
              { name: 'Spider-Man', slug: 'spider-man', image_exists: true },
              { name: 'Star-Lord', slug: 'star-lord', image_exists: true },
              { name: 'Storm', slug: 'storm', image_exists: true },
              { name: 'Winter Soldier', slug: 'winter-soldier', image_exists: true },
              { name: 'Wolverine', slug: 'wolverine', image_exists: true },
              { name: 'Iron Fist', slug: 'iron-fist', image_exists: true },
              { name: 'Squirrel Girl', slug: 'squirrel-girl', image_exists: true }
            ],
            'Strategist': [
              { name: 'Adam Warlock', slug: 'adam-warlock', image_exists: true },
              { name: 'Cloak & Dagger', slug: 'cloak-and-dagger', image_exists: true },
              { name: 'Jeff the Land Shark', slug: 'jeff-the-land-shark', image_exists: true },
              { name: 'Loki', slug: 'loki', image_exists: true },
              { name: 'Luna Snow', slug: 'luna-snow', image_exists: true },
              { name: 'Mantis', slug: 'mantis', image_exists: true },
              { name: 'Rocket Raccoon', slug: 'rocket-raccoon', image_exists: true }
            ]
          };
          console.log('✅ Using static hero data as fallback');
        }
      }
      
      // Fetch available teams grouped by region
      let teamsByRegion = {};
      try {
        const teamsResponse = await api.get('/teams');
        const teamsData = teamsResponse.data?.data || teamsResponse.data || teamsResponse;
        
        if (Array.isArray(teamsData)) {
          teamsData.forEach(team => {
            const region = team.region || 'Other';
            if (!teamsByRegion[region]) {
              teamsByRegion[region] = [];
            }
            teamsByRegion[region].push({
              id: team.id,
              name: team.name,
              short_name: team.short_name,
              logo: team.logo,
              region: team.region
            });
          });
        }
        console.log('✅ Teams loaded:', Object.keys(teamsByRegion).length, 'regions,', 
          Object.values(teamsByRegion).flat().length, 'total teams');
      } catch (teamError) {
        console.error('❌ Error fetching teams:', teamError);
        teamsByRegion = {};
      }
      
      setAvailableFlairs({
        heroes: heroesByRole,
        teams: teamsByRegion
      });
      
      console.log('✅ Available flairs loaded successfully');
    } catch (error) {
      console.error('❌ Error fetching available flairs:', error);
      // Set fallback state to prevent crashes
      setAvailableFlairs({
        heroes: {
          'Vanguard': [{ name: 'Captain America' }],
          'Duelist': [{ name: 'Iron Man' }],
          'Strategist': [{ name: 'Mantis' }]
        },
        teams: {}
      });
    }
  }, [api]);

  const fetchUserProfile = useCallback(async () => {
    try {
      if (isOwnProfile && user) {
        const userData = {
          name: user.name || '',
          email: user.email || '',
          avatar: user.avatar || '',
          hero_flair: user.hero_flair || '',
          team_flair_id: user.team_flair_id || null,
          show_hero_flair: user.show_hero_flair !== false,
          show_team_flair: user.show_team_flair !== false,
          use_hero_as_avatar: user.use_hero_as_avatar || false
        };
        setProfileData(userData);
        setOriginalProfileData(userData);
      } else if (targetUserId) {
        const response = await api.get(`/user/profile/display/${targetUserId}`);
        const userData = response.data?.data || response.data;
        setProfileData({
          name: userData.name || '',
          email: isAdminViewingOtherProfile ? userData.email || '' : '', // Show email to admins
          avatar: userData.avatar || '',
          hero_flair: userData.hero_flair || '',
          team_flair_id: userData.team_flair?.id || null,
          show_hero_flair: userData.show_hero_flair !== false,
          show_team_flair: userData.show_team_flair !== false,
          use_hero_as_avatar: userData.use_hero_as_avatar || false
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, [api, user, targetUserId, isOwnProfile]);

  useEffect(() => {
    fetchUserProfile();
    fetchAvailableFlairs();
  }, [fetchUserProfile, fetchAvailableFlairs]);

  // Also update profile data when user context changes
  useEffect(() => {
    if (isOwnProfile && user) {
      console.log('📊 User context changed, updating profile data:', user);
      const userData = {
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        hero_flair: user.hero_flair || '',
        team_flair_id: user.team_flair_id || null,
        show_hero_flair: user.show_hero_flair !== false,
        show_team_flair: user.show_team_flair !== false,
        use_hero_as_avatar: user.use_hero_as_avatar || false
      };
      setProfileData(userData);
    }
  }, [user, isOwnProfile]);

  const saveProfile = async () => {
    if (!isOwnProfile) {
      alert('You can only edit your own profile');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.put('/user/profile', {
        name: profileData.name
      });

      if (response.data?.success || response.success) {
        // Update user context to get fresh data
        const updatedUser = await updateUser();
        console.log('🔄 Updated user after profile save:', updatedUser);
        
        // Update local state to match the context
        if (updatedUser) {
          const newProfileData = {
            ...profileData,
            name: updatedUser.name || profileData.name
          };
          setProfileData(newProfileData);
          setOriginalProfileData(newProfileData);
        }
        
        alert('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const changePassword = async () => {
    if (!isOwnProfile) {
      alert('You can only change your own password');
      return;
    }

    if (!passwordData.current_password || !passwordData.new_password || !passwordData.new_password_confirmation) {
      alert('Please fill in all password fields');
      return;
    }

    if (passwordData.new_password !== passwordData.new_password_confirmation) {
      alert('New passwords do not match');
      return;
    }

    if (passwordData.new_password.length < 8) {
      alert('New password must be at least 8 characters long');
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.post('/user/profile/change-password', {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        new_password_confirmation: passwordData.new_password_confirmation
      });

      if (response.data?.success) {
        setPasswordData({
          current_password: '',
          new_password: '',
          new_password_confirmation: ''
        });

        // Check if re-authentication is required
        if (response.data?.requires_reauth) {
          alert('Password changed successfully! You will be logged out and need to sign in again with your new password.');
          // Logout and redirect to home page
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          window.location.href = '/';
        } else {
          alert('Password changed successfully!');
        }
      }
    } catch (error) {
      console.error('Failed to change password:', error);
      if (error.response?.status === 401) {
        alert('Current password is incorrect');
      } else {
        alert('Failed to change password. Please try again.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const setHeroAsAvatar = async (heroName) => {
    if (!isOwnProfile) {
      alert('You can only change your own avatar');
      return;
    }

    // Set immediate loading state
    setIsSaving(true);

    try {
      console.log('🎯 Setting hero as avatar:', heroName);
      
      // Update local state immediately for instant feedback
      setProfileData(prev => ({
        ...prev,
        hero_flair: heroName,
        use_hero_as_avatar: true,
        show_hero_flair: true
      }));
      
      // Save to backend
      const response = await api.put('/user/profile', {
        hero_flair: heroName,
        use_hero_as_avatar: true,
        show_hero_flair: true
      });
      
      if (response.data?.success || response.success) {
        // Update the user context to get fresh data
        const updatedUser = await updateUser();
        console.log('🔄 Updated user after hero selection:', updatedUser);
        
        // Ensure local state matches the backend
        if (updatedUser) {
          setProfileData(prev => ({
            ...prev,
            hero_flair: updatedUser.hero_flair || heroName,
            use_hero_as_avatar: updatedUser.use_hero_as_avatar !== false,
            show_hero_flair: updatedUser.show_hero_flair !== false,
            avatar: updatedUser.avatar || prev.avatar
          }));
        }
        
        console.log('✅ Hero avatar set successfully:', heroName);
        alert(`✅ ${heroName} is now your profile avatar!`);
      } else {
        throw new Error('Backend returned unsuccessful response');
      }
    } catch (error) {
      console.error('❌ Failed to set hero avatar:', error);
      
      // Revert local state changes on error
      const userData = user ? {
        hero_flair: user.hero_flair || '',
        use_hero_as_avatar: user.use_hero_as_avatar || false,
        show_hero_flair: user.show_hero_flair !== false,
        avatar: user.avatar || ''
      } : {};
      
      setProfileData(prev => ({
        ...prev,
        ...userData
      }));
      
      // Show user-friendly error message
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Failed to set hero as avatar. Please try again.';
      alert(`❌ ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };


  useEffect(() => {
    fetchAvailableFlairs();
  }, [fetchAvailableFlairs]);






  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isOwnProfile ? 'User Profile' : `${profileData.name}'s Profile`}
          {isAdminViewingOtherProfile && (
            <span className="ml-2 text-lg bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400 px-2 py-1 rounded-full text-sm font-medium">
              Admin Edit Mode
            </span>
          )}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isOwnProfile ? 'Manage your profile settings and preferences' :
           isAdminViewingOtherProfile ? 'Editing user profile as administrator' :
           'View user profile and activity'}
        </p>
      </div>

      {/* Profile Avatar Section */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Picture</h2>
        <div className="flex items-center space-x-6">
          {profileData.use_hero_as_avatar && profileData.hero_flair ? (
            <HeroImage 
              heroName={profileData.hero_flair}
              size="2xl"
              className="rounded-full"
              showRole={false}
            />
          ) : profileData.avatar ? (
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
              <img 
                src={profileData.avatar} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
              {profileData.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
          
          {/* Avatar Actions */}
          {canEditProfile && (
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setShowHeroAvatarModal(true)}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center justify-center ${
                  isSaving
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Choose Hero Avatar'
                )}
              </button>
              {profileData.use_hero_as_avatar && profileData.hero_flair && (
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Current: {profileData.hero_flair}
                </p>
              )}
            </div>
          )}
        </div>
      </div>


      {/* Team Flair Section */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Team Flair</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="show_team_flair"
              checked={profileData.show_team_flair}
              onChange={async (e) => {
                if (isOwnProfile) {
                  const newValue = e.target.checked;
                  
                  // Update immediately for instant feedback
                  setProfileData(prev => ({...prev, show_team_flair: newValue}));
                  
                  // Save to backend
                  try {
                    const response = await api.put('/user/profile', {
                      show_team_flair: newValue,
                      team_flair_id: profileData.team_flair_id
                    });
                    
                    if (response.data?.success || response.success) {
                      // Update user context
                      const updatedUser = await updateUser();
                      console.log('🔄 Updated user after team flair visibility change:', updatedUser);
                      
                      // Ensure local state matches context
                      if (updatedUser) {
                        setProfileData(prev => ({
                          ...prev,
                          show_team_flair: updatedUser.show_team_flair !== false
                        }));
                      }
                      
                      console.log('✅ Team flair visibility updated');
                    }
                  } catch (error) {
                    console.error('❌ Failed to update team flair visibility:', error);
                    // Revert on error
                    setProfileData(prev => ({...prev, show_team_flair: !newValue}));
                  }
                }
              }}
              className="form-checkbox"
              disabled={!isOwnProfile}
            />
            <label htmlFor="show_team_flair" className="text-gray-900 dark:text-white">
              Show team flair
            </label>
          </div>
          
          <div className="space-y-3">
            <TeamSelector
              teams={availableFlairs.teams && typeof availableFlairs.teams === 'object' 
                ? Object.values(availableFlairs.teams).flat() 
                : []
              }
              selectedTeamId={profileData.team_flair_id}
              onTeamSelect={async (team) => {
                if (isOwnProfile) {
                  const newTeamId = team ? team.id : null;
                  
                  // Update immediately for instant feedback
                  setProfileData(prev => ({...prev, team_flair_id: newTeamId}));
                  
                  // Save to backend
                  try {
                    const response = await api.put('/user/profile', {
                      team_flair_id: newTeamId,
                      show_team_flair: profileData.show_team_flair
                    });
                    
                    if (response.data?.success || response.success) {
                      // Update user context and refresh local state
                      const updatedUser = await updateUser();
                      console.log('🔄 Updated user after team flair change:', updatedUser);
                      
                      // Update local state to match the context
                      if (updatedUser) {
                        setProfileData(prev => ({
                          ...prev,
                          team_flair_id: updatedUser.team_flair_id || newTeamId
                        }));
                      }
                      
                      console.log('✅ Team flair updated successfully');
                    }
                  } catch (error) {
                    console.error('❌ Failed to update team flair:', error);
                    // Revert on error
                    setProfileData(prev => ({...prev, team_flair_id: profileData.team_flair_id}));
                  }
                }
              }}
              disabled={!isOwnProfile || isSaving}
              placeholder="Choose your team flair..."
              showSearch={true}
              showRegions={true}
              showPopular={true}
              showRecent={true}
              loading={isSaving}
              className="w-full"
            />
            
            {/* Team Flair Preview */}
            {profileData.team_flair_id && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {(() => {
                  const selectedTeam = availableFlairs.teams && typeof availableFlairs.teams === 'object' 
                    ? Object.values(availableFlairs.teams).flat().find(t => t.id == profileData.team_flair_id)
                    : null;
                  
                  if (!selectedTeam) {
                    return (
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-500">?</span>
                        </div>
                        <div className="text-sm text-gray-500">Team not found (ID: {profileData.team_flair_id})</div>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative">
                        {selectedTeam.logo ? (
                          <>
                            <img 
                              src={getImageUrl(selectedTeam.logo, 'team-logo')} 
                              alt={selectedTeam.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.log('❌ Team logo failed to load:', selectedTeam.logo, 'for team:', selectedTeam.name);
                                e.target.style.display = 'none';
                                const fallback = e.target.nextElementSibling;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                              onLoad={() => {
                                console.log('✅ Team logo loaded:', selectedTeam.logo, 'for team:', selectedTeam.name);
                              }}
                            />
                            <div 
                              className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-200 dark:bg-gray-700"
                              style={{ display: 'none' }}
                            >
                              {selectedTeam.short_name || selectedTeam.name.substring(0, 3).toUpperCase()}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs font-bold text-gray-600 dark:text-gray-400">
                            {selectedTeam.short_name || selectedTeam.name.substring(0, 3).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{selectedTeam.name}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {selectedTeam.region || Object.entries(availableFlairs.teams).find(([region, teams]) => 
                            teams.some(t => t.id === selectedTeam.id)
                          )?.[0] || 'Unknown Region'}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Activity Stats</h2>
          <div className="flex items-center space-x-2">
            {statsLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
            )}
            {statsLastUpdated && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Updated: {new Date(statsLastUpdated).toLocaleTimeString()}
              </span>
            )}
            {statsError && (
              <span className="text-xs text-red-500 dark:text-red-400">
                Update failed
              </span>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className={`text-2xl font-bold text-blue-600 dark:text-blue-400 transition-all duration-300 ${statsLoading ? 'opacity-50' : ''}`}>
              {userStats.total_forum_threads || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Forum Threads</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold text-green-600 dark:text-green-400 transition-all duration-300 ${statsLoading ? 'opacity-50' : ''}`}>
              {userStats.total_forum_posts || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Forum Posts</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold text-purple-600 dark:text-purple-400 transition-all duration-300 ${statsLoading ? 'opacity-50' : ''}`}>
              {userStats.total_comments || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Comments</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold text-orange-600 dark:text-orange-400 transition-all duration-300 ${statsLoading ? 'opacity-50' : ''}`}>
              {userStats.days_active || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Days Active</div>
          </div>
        </div>
        
        {/* Live Update Indicator */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live updates every 30 seconds</span>
          </div>
        </div>
      </div>

      {/* Basic Profile Info */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Username
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => canEditProfile && setProfileData(prev => ({...prev, name: e.target.value}))}
              className="form-input"
              placeholder={isOwnProfile ? "Your username" : "Username"}
              readOnly={!canEditProfile}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
              Email
            </label>
            <input
              type="email"
              value={profileData.email}
              readOnly
              className="form-input bg-gray-50 dark:bg-gray-800"
              placeholder="Your email"
            />
          </div>
          
          {/* Save Button for Profile Info */}
          {canEditProfile && (
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveProfile}
                disabled={isSaving || profileData.name === originalProfileData.name}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isSaving || profileData.name === originalProfileData.name
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Section - Only for own profile for security */}
      {isOwnProfile && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData(prev => ({...prev, current_password: e.target.value}))}
                  className="form-input pr-12"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  tabIndex={-1}
                >
                  {showCurrentPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({...prev, new_password: e.target.value}))}
                  className="form-input pr-12"
                  placeholder="Min 8 chars, uppercase, lowercase, number, special char"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  tabIndex={-1}
                >
                  {showNewPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={passwordData.new_password_confirmation}
                  onChange={(e) => setPasswordData(prev => ({...prev, new_password_confirmation: e.target.value}))}
                  className="form-input pr-12"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={changePassword}
                disabled={isSaving || !passwordData.current_password || !passwordData.new_password || !passwordData.new_password_confirmation}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  isSaving || !passwordData.current_password || !passwordData.new_password || !passwordData.new_password_confirmation
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isSaving ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Settings - Admin Users Only */}
      {isOwnProfile && user?.role === 'admin' && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Two-Factor Authentication</h2>
          <TwoFactorSettings user={user} api={api} />
        </div>
      )}

      {/* Hero Avatar Selection Modal */}
      {showHeroAvatarModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Your Hero Avatar</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select a Marvel Rivals hero to use as your profile picture</p>
            {isSaving && (
              <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2"></div>
                Setting hero avatar...
              </div>
            )}
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {Object.keys(availableFlairs.heroes || {}).length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🦸</div>
                <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Loading Heroes...</h4>
                <p className="text-gray-500 dark:text-gray-400">Please wait while we fetch the available heroes</p>
              </div>
            ) : (
              Object.entries(availableFlairs.heroes || {}).map(([role, heroes]) => (
                <div key={role} className="mb-8">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                    <span className={`w-3 h-3 rounded-full mr-2 ${
                      role === 'Vanguard' ? 'bg-blue-500' : 
                      role === 'Duelist' ? 'bg-red-500' : 
                      'bg-green-500'
                    }`}></span>
                    {role} ({heroes.length} heroes)
                  </h4>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {heroes.map(hero => (
                      <button
                        key={hero.name}
                        onClick={async () => {
                          if (!isSaving) {
                            await setHeroAsAvatar(hero.name);
                            setShowHeroAvatarModal(false);
                          }
                        }}
                        disabled={isSaving}
                        className={`group relative flex flex-col items-center p-3 rounded-lg transition-all duration-200 ${
                          isSaving 
                            ? 'opacity-50 cursor-not-allowed' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer'
                        }`}
                      >
                        <div className={`w-20 h-20 mb-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 transition-all duration-200 ${
                          !isSaving ? 'group-hover:ring-4 group-hover:ring-blue-500' : ''
                        }`}>
                          <HeroImage 
                            heroName={hero.name}
                            size="xl"
                            className="w-full h-full"
                            showRole={false}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 text-center">
                          {hero.name}
                        </span>
                        {profileData.hero_flair === hero.name && profileData.use_hero_as_avatar && (
                          <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            ✓ Current
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {Object.values(availableFlairs.heroes || {}).flat().length} heroes available
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowHeroAvatarModal(false)}
                disabled={isSaving}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  isSaving
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              >
                {isSaving ? 'Please Wait...' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

export default SimpleUserProfile;