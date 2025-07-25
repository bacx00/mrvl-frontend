import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import HeroImage from '../shared/HeroImage';
import { getImageUrl } from '../../utils/imageUtils';

function SimpleUserProfile({ navigateTo, params }) {
  const { user, api, updateUser } = useAuth();
  const targetUserId = params?.id;
  const isOwnProfile = !targetUserId || targetUserId == user?.id;
  
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
  const [isSaving, setIsSaving] = useState(false);
  const [originalProfileData, setOriginalProfileData] = useState({});
  const [loading, setLoading] = useState(false);
  const [showHeroAvatarModal, setShowHeroAvatarModal] = useState(false);
  const [availableFlairs, setAvailableFlairs] = useState({ heroes: {}, teams: [] });
  const [userStats, setUserStats] = useState({
    total_comments: 0,
    total_forum_posts: 0,
    total_forum_threads: 0,
    total_votes: 0,
    days_active: 0
  });

  const fetchUserProfile = useCallback(async () => {
    try {
      if (isOwnProfile && user) {
        const userData = {
          name: user.name || '',
          email: user.email || '',
          avatar: user.avatar || '',
          hero_flair: user.hero_flair || '',
          team_flair_id: user.team_flair_id || user.team_flair?.id || null,
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
          email: '', // Don't show other users' emails
          avatar: userData.avatar || '',
          hero_flair: userData.hero_flair || '',
          team_flair_id: userData.team_flair?.id || null,
          show_hero_flair: userData.show_hero_flair !== false,
          show_team_flair: userData.show_team_flair !== false
        });
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, [api, user, targetUserId, isOwnProfile]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  // Also update profile data when user context changes
  useEffect(() => {
    if (isOwnProfile && user) {
      console.log('📊 User context changed, updating profile data:', user);
      const userData = {
        name: user.name || '',
        email: user.email || '',
        avatar: user.avatar || '',
        hero_flair: user.hero_flair || '',
        team_flair_id: user.team_flair_id || user.team_flair?.id || null,
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
        alert('Password changed successfully!');
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

    try {
      console.log('🎯 Setting hero as avatar:', heroName);
      
      // Simply update the profile to use hero as avatar
      const response = await api.put('/user/profile', {
        hero_flair: heroName,
        use_hero_as_avatar: true,
        show_hero_flair: true
      });
      
      if (response.data?.success || response.success) {
        // Update the user context first to get fresh data
        const updatedUser = await updateUser();
        console.log('🔄 Updated user after hero selection:', updatedUser);
        
        // Update local state with data from the updated context
        if (updatedUser) {
          setProfileData(prev => ({
            ...prev,
            hero_flair: updatedUser.hero_flair || heroName,
            use_hero_as_avatar: updatedUser.use_hero_as_avatar !== false,
            show_hero_flair: updatedUser.show_hero_flair !== false,
            avatar: updatedUser.avatar || prev.avatar
          }));
        }
        
        console.log('✅ Hero avatar set successfully');
        alert(`${heroName} is now your avatar!`);
      }
    } catch (error) {
      console.error('❌ Failed to set hero avatar:', error);
      alert('Failed to set hero as avatar. Please try again.');
    }
  };

  const fetchAvailableFlairs = useCallback(async () => {
    try {
      console.log('🔍 Fetching available flairs...');
      const response = await api.get('/user/profile/available-flairs');
      console.log('✅ Flairs API response:', response.data);
      console.log('🔍 Full response structure:', response);
      
      // The API response shows the data structure differently than expected
      let flairsData;
      if (response.data?.data) {
        // Backend structure: { data: { heroes: {...}, teams: [...] }, success: true }
        flairsData = response.data.data;
      } else if (response.data?.heroes) {
        // Direct structure: { heroes: {...}, teams: [...] }
        flairsData = response.data;
      } else {
        // Fallback
        flairsData = { heroes: {}, teams: [] };
      }
      
      console.log('🎮 Final flairs data being set:', flairsData);
      console.log('🎮 Teams structure:', flairsData.teams);
      console.log('🎮 Teams type:', typeof flairsData.teams);
      if (flairsData.teams && typeof flairsData.teams === 'object') {
        console.log('🎮 Teams keys:', Object.keys(flairsData.teams));
        console.log('🎮 Teams values:', Object.values(flairsData.teams));
      }
      setAvailableFlairs(flairsData);
    } catch (error) {
      console.error('❌ Error fetching flairs:', error);
      // Fallback data for ALL Marvel Rivals heroes when API fails - matching database exactly
      const fallbackHeroes = {
        "Vanguard": [
          {name: "Bruce Banner", role: "Vanguard"},
          {name: "Captain America", role: "Vanguard"},
          {name: "Doctor Strange", role: "Vanguard"},
          {name: "Emma Frost", role: "Vanguard"},
          {name: "Groot", role: "Vanguard"},
          {name: "Hulk", role: "Vanguard"},
          {name: "Magneto", role: "Vanguard"},
          {name: "Mr. Fantastic", role: "Vanguard"},
          {name: "Peni Parker", role: "Vanguard"},
          {name: "Thor", role: "Vanguard"},
          {name: "Venom", role: "Vanguard"}
        ],
        "Duelist": [
          {name: "Black Panther", role: "Duelist"},
          {name: "Black Widow", role: "Duelist"},
          {name: "Hawkeye", role: "Duelist"},
          {name: "Hela", role: "Duelist"},
          {name: "Iron Fist", role: "Duelist"},
          {name: "Iron Man", role: "Duelist"},
          {name: "Magik", role: "Duelist"},
          {name: "Moon Knight", role: "Duelist"},
          {name: "Namor", role: "Duelist"},
          {name: "Psylocke", role: "Duelist"},
          {name: "Punisher", role: "Duelist"},
          {name: "Scarlet Witch", role: "Duelist"},
          {name: "Spider-Man", role: "Duelist"},
          {name: "Squirrel Girl", role: "Duelist"},
          {name: "Star-Lord", role: "Duelist"},
          {name: "Storm", role: "Duelist"},
          {name: "Winter Soldier", role: "Duelist"},
          {name: "Wolverine", role: "Duelist"}
        ],
        "Strategist": [
          {name: "Adam Warlock", role: "Strategist"},
          {name: "Cloak & Dagger", role: "Strategist"},
          {name: "Jeff the Land Shark", role: "Strategist"},
          {name: "Loki", role: "Strategist"},
          {name: "Luna Snow", role: "Strategist"},
          {name: "Mantis", role: "Strategist"},
          {name: "Rocket Raccoon", role: "Strategist"}
        ]
      };
      // Also add fallback teams data grouped by region to match API structure
      const fallbackTeams = {
        "EU": [
          {id: 114, name: "TEST1", short_name: "TEST1", logo: "/teams/logos/687821f615647.png", region: "EU"}
        ],
        "NA": [
          {id: 115, name: "TEST2", short_name: "TEST2", logo: "/teams/logos/687822048fc25.png", region: "NA"}
        ]
      };
      setAvailableFlairs({ heroes: fallbackHeroes, teams: fallbackTeams });
    }
  }, [api]);

  const fetchUserStats = useCallback(async () => {
    try {
      const endpoint = targetUserId && !isOwnProfile 
        ? `/admin/users/${targetUserId}/activity`
        : '/user/profile/activity';
      const response = await api.get(endpoint);
      const data = response.data?.data || response.data || {};
      
      // Handle different response structures
      if (data.stats) {
        // If stats are nested under 'stats' property
        setUserStats(data.stats);
      } else if (data.total_comments !== undefined || data.total_forum_threads !== undefined) {
        // If stats are directly in data
        setUserStats(data);
      } else {
        // Fallback to empty stats
        setUserStats({
          total_comments: 0,
          total_forum_posts: 0,
          total_forum_threads: 0,
          days_active: 0,
          total_votes: 0
        });
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, [api, targetUserId, isOwnProfile]);

  useEffect(() => {
    fetchAvailableFlairs();
    fetchUserStats();
  }, [fetchAvailableFlairs, fetchUserStats]);






  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isOwnProfile ? 'User Profile' : `${profileData.name}'s Profile`}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isOwnProfile ? 'Manage your profile settings and preferences' : 'View user profile and activity'}
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
          {isOwnProfile && (
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => setShowHeroAvatarModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Choose Hero Avatar
              </button>
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
            <select
              value={profileData.team_flair_id || ''}
              onChange={async (e) => {
                if (isOwnProfile) {
                  const newTeamId = e.target.value ? parseInt(e.target.value) : null;
                  
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
                          team_flair_id: updatedUser.team_flair_id || updatedUser.team_flair?.id || newTeamId
                        }));
                      }
                      
                      console.log('✅ Team flair updated successfully');
                    }
                  } catch (error) {
                    console.error('❌ Failed to update team flair:', error);
                    // Revert on error
                    setProfileData(prev => ({...prev, team_flair_id: prev.team_flair_id}));
                  }
                }
              }}
              className="form-input"
              disabled={!isOwnProfile}
            >
              <option value="">No team flair</option>
              {availableFlairs.teams && typeof availableFlairs.teams === 'object' && 
                Object.entries(availableFlairs.teams).map(([region, teams]) => (
                  <optgroup key={region} label={region}>
                    {Array.isArray(teams) && teams.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name} {team.short_name ? `(${team.short_name})` : ''}
                      </option>
                    ))}
                  </optgroup>
                ))
              }
            </select>
            
            {/* Team Flair Preview */}
            {profileData.team_flair_id && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {(() => {
                  const selectedTeam = availableFlairs.teams && typeof availableFlairs.teams === 'object' 
                    ? Object.values(availableFlairs.teams).flat().find(t => t.id == profileData.team_flair_id)
                    : null;
                  return selectedTeam ? (
                    <>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {selectedTeam.logo ? (
                          <img 
                            src={getImageUrl(selectedTeam.logo, 'team-logo')} 
                            alt={selectedTeam.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling && (e.target.nextSibling.style.display = 'flex');
                            }}
                          />
                        ) : null}
                        <div 
                          className="text-xs font-bold text-gray-600 dark:text-gray-400 w-full h-full items-center justify-center"
                          style={{ display: selectedTeam.logo ? 'none' : 'flex' }}
                        >
                          {selectedTeam.short_name || selectedTeam.name.substring(0, 3).toUpperCase()}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm font-medium">{selectedTeam.name}</div>
                        <div className="text-xs text-gray-500">{selectedTeam.region}</div>
                      </div>
                    </>
                  ) : null;
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Activity Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {userStats.total_forum_threads || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Forum Threads</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {userStats.total_forum_posts || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Forum Posts</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {userStats.total_comments || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Comments</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {userStats.days_active || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Days Active</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">
              {userStats.total_mentions || 0}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Mentions</div>
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
              onChange={(e) => isOwnProfile && setProfileData(prev => ({...prev, name: e.target.value}))}
              className="form-input"
              placeholder={isOwnProfile ? "Your username" : "Username"}
              readOnly={!isOwnProfile}
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
          {isOwnProfile && (
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

      {/* Password Change Section */}
      {isOwnProfile && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Change Password</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                Current Password
              </label>
              <input
                type="password"
                value={passwordData.current_password}
                onChange={(e) => setPasswordData(prev => ({...prev, current_password: e.target.value}))}
                className="form-input"
                placeholder="Enter current password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                New Password
              </label>
              <input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData(prev => ({...prev, new_password: e.target.value}))}
                className="form-input"
                placeholder="Enter new password (min 8 characters)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
                Confirm New Password
              </label>
              <input
                type="password"
                value={passwordData.new_password_confirmation}
                onChange={(e) => setPasswordData(prev => ({...prev, new_password_confirmation: e.target.value}))}
                className="form-input"
                placeholder="Confirm new password"
              />
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

      {/* Hero Avatar Selection Modal */}
      {showHeroAvatarModal && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Choose Your Hero Avatar</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Select a Marvel Rivals hero to use as your profile picture</p>
          </div>
          
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {Object.entries(availableFlairs.heroes || {}).map(([role, heroes]) => (
              <div key={role} className="mb-8">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                  <span className={`w-3 h-3 rounded-full mr-2 ${
                    role === 'Vanguard' ? 'bg-blue-500' : 
                    role === 'Duelist' ? 'bg-red-500' : 
                    'bg-green-500'
                  }`}></span>
                  {role}
                </h4>
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {heroes.map(hero => (
                    <button
                      key={hero.name}
                      onClick={async () => {
                        await setHeroAsAvatar(hero.name);
                        setShowHeroAvatarModal(false);
                      }}
                      className="group relative flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                    >
                      <div className="w-20 h-20 mb-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 group-hover:ring-4 group-hover:ring-blue-500 transition-all duration-200">
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
                          Current
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button
              onClick={() => setShowHeroAvatarModal(false)}
              className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}

export default SimpleUserProfile;