import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { getHeroImageSync } from '../../utils/imageUtils';

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
    show_team_flair: true
  });
  const [loading, setLoading] = useState(false);
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
        setProfileData({
          name: user.name || '',
          email: user.email || '',
          avatar: user.avatar || '',
          hero_flair: user.hero_flair || '',
          team_flair_id: user.team_flair_id || null,
          show_hero_flair: user.show_hero_flair !== false,
          show_team_flair: user.show_team_flair !== false
        });
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
      console.log('🎮 Setting flairs data:', flairsData);
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
      // Also add fallback teams data
      const fallbackTeams = [
        {id: 114, name: "TEST1", short_name: "TEST1", logo: "/teams/logos/687821f615647.png", region: "EU"},
        {id: 115, name: "TEST2", short_name: "TEST2", logo: "/teams/logos/687822048fc25.png", region: "NA"}
      ];
      setAvailableFlairs({ heroes: fallbackHeroes, teams: fallbackTeams });
    }
  }, [api]);

  const fetchUserStats = useCallback(async () => {
    try {
      const endpoint = targetUserId && !isOwnProfile 
        ? `/admin/users/${targetUserId}/activity`
        : '/user/profile/activity';
      const response = await api.get(endpoint);
      const data = response.data?.data || {};
      setUserStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  }, [api, targetUserId, isOwnProfile]);

  useEffect(() => {
    fetchAvailableFlairs();
    fetchUserStats();
  }, [fetchAvailableFlairs, fetchUserStats]);

  const getHeroImage = (hero) => {
    // If hero object has images from API, use portrait image
    if (hero && hero.images && hero.images.portrait) {
      return `https://staging.mrvl.net${hero.images.portrait}`;
    }
    
    // Fallback: check if it's a string (hero name) and if we have the image
    if (typeof hero === 'string') {
      const heroesWithImages = ['Captain America', 'Hulk', 'Iron Man', 'Spider-Man', 'Thor', 'Venom'];
      if (heroesWithImages.includes(hero)) {
        const slug = hero.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return `https://staging.mrvl.net/images/heroes/portraits/${slug}.png`;
      }
    }
    
    return null; // No image available
  };

  const [imageErrors, setImageErrors] = useState(new Set());

  const handleImageError = (heroName) => {
    setImageErrors(prev => new Set(prev).add(heroName));
  };

  const isImageBroken = (heroName) => {
    return imageErrors.has(heroName);
  };





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
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            {profileData.hero_flair && !isImageBroken(profileData.hero_flair) && getHeroImage(profileData.hero_flair) ? (
              <img 
                src={getHeroImage(profileData.hero_flair)} 
                alt={profileData.hero_flair}
                className="w-full h-full object-cover"
                onError={() => handleImageError(profileData.hero_flair)}
              />
            ) : profileData.hero_flair ? (
              <div className="w-full h-full bg-gradient-to-br from-red-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm text-center px-2">
                {profileData.hero_flair}
              </div>
            ) : profileData.avatar ? (
              <img 
                src={profileData.avatar} 
                alt="Profile" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                {user?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hero Flair Section */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Hero Flair</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="show_hero_flair"
              checked={profileData.show_hero_flair}
              onChange={async (e) => {
                if (isOwnProfile) {
                  const newValue = e.target.checked;
                  
                  // Update immediately for instant feedback
                  setProfileData(prev => ({...prev, show_hero_flair: newValue}));
                  
                  // Save to backend
                  try {
                    const response = await api.put('/user/profile', {
                      show_hero_flair: newValue,
                      hero_flair: profileData.hero_flair
                    });
                    
                    if (response.data?.success) {
                      await updateUser();
                      console.log('✅ Hero flair visibility updated');
                    }
                  } catch (error) {
                    console.error('❌ Failed to update hero flair visibility:', error);
                    // Revert on error
                    setProfileData(prev => ({...prev, show_hero_flair: !newValue}));
                  }
                }
              }}
              className="form-checkbox"
              disabled={!isOwnProfile}
            />
            <label htmlFor="show_hero_flair" className="text-gray-900 dark:text-white">
              Show hero flair
            </label>
          </div>
          
          {/* Debug Info */}
          <div className="mb-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded text-xs">
            <div>Heroes data available: {Object.keys(availableFlairs.heroes || {}).length} roles</div>
            <div>Roles: {Object.keys(availableFlairs.heroes || {}).join(', ')}</div>
            <div>Total heroes: {Object.values(availableFlairs.heroes || {}).flat().length}</div>
          </div>
          
          {/* Hero Selection */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {(() => {
              console.log('🎯 Available flairs for rendering:', availableFlairs);
              console.log('🎯 Heroes data:', availableFlairs.heroes);
              console.log('🎯 Heroes entries:', Object.entries(availableFlairs.heroes || {}));
              return Object.entries(availableFlairs.heroes || {}).map(([role, heroes]) => 
                heroes.map(hero => (
                  <button
                  key={hero.name}
                  onClick={async () => {
                    console.log('🎯 Hero button clicked:', hero.name);
                    console.log('🎯 isOwnProfile:', isOwnProfile);
                    console.log('🎯 user:', user);
                    
                    if (isOwnProfile) {
                      // Update immediately for instant feedback
                      setProfileData(prev => ({...prev, hero_flair: hero.name}));
                      console.log('🎯 Updated profileData hero_flair to:', hero.name);
                      
                      // Save to backend
                      try {
                        console.log('🎯 Sending API request to update hero flair...');
                        const requestData = {
                          hero_flair: hero.name,
                          show_hero_flair: profileData.show_hero_flair
                        };
                        console.log('🎯 Request data:', requestData);
                        
                        const response = await api.put('/user/profile', requestData);
                        console.log('🎯 API response:', response.data);
                        
                        if (response.data?.success) {
                          // Update user context
                          await updateUser();
                          console.log('✅ Hero flair updated successfully');
                          alert('Hero flair updated successfully!');
                        } else {
                          console.warn('⚠️ API response success was false:', response.data);
                          alert('Failed to update hero flair - API returned success: false');
                        }
                      } catch (error) {
                        console.error('❌ Failed to update hero flair:', error);
                        console.error('❌ Error details:', error.response?.data);
                        alert('Failed to update hero flair: ' + (error.response?.data?.message || error.message));
                        // Revert on error
                        setProfileData(prev => ({...prev, hero_flair: prev.hero_flair}));
                      }
                    } else {
                      console.log('❌ Not own profile, cannot update hero flair');
                      alert('You can only change your own hero flair');
                    }
                  }}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    profileData.hero_flair === hero.name
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="w-12 h-12 mx-auto mb-2 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    {!isImageBroken(hero.name) && getHeroImage(hero) ? (
                      <img 
                        src={getHeroImage(hero)} 
                        alt={hero.name}
                        className="w-full h-full object-cover"
                        onError={() => handleImageError(hero.name)}
                      />
                    ) : (
                      <div className="text-xs font-bold text-gray-600 dark:text-gray-400 text-center px-1">
                        {hero.name}
                      </div>
                    )}
                  </div>
                  <div className="text-xs font-medium text-center">{hero.name}</div>
                  <div className="text-xs text-gray-500 text-center">{role}</div>
                  </button>
                ))
              );
            })()}
          </div>
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
                    
                    if (response.data?.success) {
                      await updateUser();
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
                    
                    if (response.data?.success) {
                      // Update user context
                      await updateUser();
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
              {availableFlairs.teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name} ({team.region})
                </option>
              ))}
            </select>
            
            {/* Team Flair Preview */}
            {profileData.team_flair_id && (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {(() => {
                  const selectedTeam = availableFlairs.teams.find(t => t.id === profileData.team_flair_id);
                  return selectedTeam ? (
                    <>
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {!isImageBroken(`team-${selectedTeam.id}`) && selectedTeam.logo ? (
                          <img 
                            src={selectedTeam.logo} 
                            alt={selectedTeam.name}
                            className="w-full h-full object-cover"
                            onError={() => handleImageError(`team-${selectedTeam.id}`)}
                          />
                        ) : (
                          <div className="text-xs font-bold text-gray-600 dark:text-gray-400">
                            {selectedTeam.short_name || selectedTeam.name.substring(0, 3).toUpperCase()}
                          </div>
                        )}
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        </div>
      </div>

    </div>
  );
}

export default SimpleUserProfile;