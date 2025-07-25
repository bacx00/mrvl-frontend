'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { MARVEL_RIVALS_HEROES } from '@/data/marvelRivalsComplete';
import { getHeroImageSync } from '@/utils/imageUtils';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [form, setForm] = useState({
    username: user?.username || user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    twitter: user?.twitter || '',
    discord: user?.discord || ''
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'activity'>('overview');
  const [showHeroModal, setShowHeroModal] = useState(false);
  const [selectedHero, setSelectedHero] = useState(user?.hero_flair || '');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(user?.team_flair_id || null);
  const [teams, setTeams] = useState<any[]>([]);

  if (!user) {
    router.push('/user/login');
    return null;
  }

  useEffect(() => {
    // Fetch teams for team flair selection
    const fetchTeams = async () => {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/api/teams');
        const data = await response.json();
        setTeams(data.data || data || []);
      } catch (error) {
        console.error('Error fetching teams:', error);
      }
    };
    
    // Fetch user profile data
    const fetchUserProfile = async () => {
      try {
        const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/api/user/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          const profileData = data.data || data;
          
          // Update form with fetched data
          setForm({
            username: profileData.name || profileData.username || '',
            email: profileData.email || '',
            bio: profileData.bio || '',
            location: profileData.location || '',
            website: profileData.website || '',
            twitter: profileData.twitter || '',
            discord: profileData.discord || ''
          });
          
          // Update selected flairs
          setSelectedHero(profileData.hero_flair || '');
          setSelectedTeam(profileData.team_flair_id || null);
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    fetchTeams();
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user) {
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        
        const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/api/user/profile/upload-avatar', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          if (updateUser && data.data?.avatar) {
            updateUser({ ...user, avatar: data.data.avatar });
          }
        }
      } catch (error) {
        console.error('Avatar upload failed:', error);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          name: form.username,
          email: form.email,
          bio: form.bio,
          location: form.location,
          website: form.website,
          twitter: form.twitter,
          discord: form.discord,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (updateUser && data.data) {
          updateUser(data.data);
        }
        setIsEditing(false);
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[#0f1419] min-h-screen">
      <div className="container mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6 mb-6">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div 
                  className="w-24 h-24 bg-[#2b3d4d] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#3a4a5c] transition-colors"
                  onClick={handleAvatarClick}
                >
                  {user.avatar ? (
                    <img src={user.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover" />
                  ) : selectedHero && getHeroImageSync(selectedHero) ? (
                    <img src={getHeroImageSync(selectedHero)} alt={selectedHero} className="w-24 h-24 rounded-full object-cover" />
                  ) : (
                    <span className="text-2xl font-bold text-[#768894]">
                      {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-[#fa4454] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </div>
              </div>
              
              {/* Hero Selection Button */}
              <div className="flex flex-col space-y-2">
                <button
                  onClick={() => setShowHeroModal(true)}
                  className="px-4 py-2 bg-[#2b3d4d] hover:bg-[#3a4a5c] text-white rounded transition-colors text-sm"
                >
                  🦸 Select Hero Avatar
                </button>
                <button
                  onClick={() => setShowTeamModal(true)}
                  className="px-4 py-2 bg-[#2b3d4d] hover:bg-[#3a4a5c] text-white rounded transition-colors text-sm"
                >
                  🏆 Select Team Flair
                </button>
              </div>
            </div>

            {/* User Info */}
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{user.name || user.username}</h1>
                <span className="px-2 py-1 bg-[#fa4454] text-white text-xs font-medium rounded">
                  {(user.role || 'user').toUpperCase()}
                </span>
              </div>
              <p className="text-[#768894] mb-2">{user.email}</p>
              <div className="flex items-center space-x-4 text-sm text-[#768894]">
                <span>Joined {new Date(user.created_at || user.joinDate || Date.now()).toLocaleDateString()}</span>
                <span>•</span>
                <span>{user.posts || 0} posts</span>
              </div>
            </div>

            {/* Edit Button */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-[#fa4454] hover:bg-[#e03a49] text-white rounded font-medium transition-colors"
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-[#2b3d4d] mb-6">
          <nav className="flex space-x-8">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'settings', label: 'Settings' },
              { key: 'activity', label: 'Activity' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-[#fa4454] text-[#fa4454]'
                    : 'border-transparent text-[#768894] hover:text-white hover:border-[#768894]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Details */}
            <div className="lg:col-span-2">
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6">
                <h2 className="text-xl font-semibold text-white mb-4">Profile Information</h2>
                
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Username</label>
                      <input
                        type="text"
                        name="username"
                        value={form.username}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:outline-none focus:border-[#fa4454]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:outline-none focus:border-[#fa4454]"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">Bio</label>
                      <textarea
                        name="bio"
                        value={form.bio}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:outline-none focus:border-[#fa4454]"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Location</label>
                        <input
                          type="text"
                          name="location"
                          value={form.location}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:outline-none focus:border-[#fa4454]"
                          placeholder="City, Country"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">Website</label>
                        <input
                          type="url"
                          name="website"
                          value={form.website}
                          onChange={handleChange}
                          className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white focus:outline-none focus:border-[#fa4454]"
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-[#2b3d4d] text-[#768894] rounded hover:text-white hover:border-[#768894] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-4 py-2 bg-[#fa4454] hover:bg-[#e03a49] text-white rounded font-medium transition-colors disabled:opacity-50"
                      >
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-[#768894] mb-1">Bio</h3>
                      <p className="text-white">{form.bio || 'No bio provided yet.'}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-[#768894] mb-1">Location</h3>
                        <p className="text-white">{form.location || 'Not specified'}</p>
                      </div>
                      
                      <div>
                        <h3 className="text-sm font-medium text-[#768894] mb-1">Website</h3>
                        {form.website ? (
                          <a href={form.website} target="_blank" rel="noopener noreferrer" className="text-[#fa4454] hover:underline">
                            {form.website}
                          </a>
                        ) : (
                          <p className="text-white">Not specified</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Stats Sidebar */}
            <div className="space-y-6">
              {/* User Stats */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-[#768894]">Posts</span>
                    <span className="text-white font-medium">{user.posts}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#768894]">Reputation</span>
                    <span className="text-white font-medium">+42</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#768894]">Member Since</span>
                    <span className="text-white font-medium">{new Date(user.joinDate).getFullYear()}</span>
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Achievements</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-[#fa4454] rounded flex items-center justify-center">
                      <span className="text-white text-xs">🏆</span>
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">First Post</p>
                      <p className="text-[#768894] text-xs">Welcome to the community!</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Account Settings</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Privacy</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="w-4 h-4 bg-[#0f1419] border border-[#2b3d4d] rounded" />
                    <span className="ml-2 text-[#768894]">Show my profile to other users</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="w-4 h-4 bg-[#0f1419] border border-[#2b3d4d] rounded" />
                    <span className="ml-2 text-[#768894]">Allow direct messages</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-white mb-3">Notifications</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="w-4 h-4 bg-[#0f1419] border border-[#2b3d4d] rounded" />
                    <span className="ml-2 text-[#768894]">Email notifications</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="w-4 h-4 bg-[#0f1419] border border-[#2b3d4d] rounded" />
                    <span className="ml-2 text-[#768894]">Push notifications</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-3 bg-[#0f1419] rounded">
                <div className="w-8 h-8 bg-[#2b3d4d] rounded-full flex items-center justify-center">
                  <span className="text-xs">💬</span>
                </div>
                <div>
                  <p className="text-white text-sm">Posted in <span className="text-[#fa4454]">General Discussion</span></p>
                  <p className="text-[#768894] text-xs">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-[#0f1419] rounded">
                <div className="w-8 h-8 bg-[#2b3d4d] rounded-full flex items-center justify-center">
                  <span className="text-xs">👍</span>
                </div>
                <div>
                  <p className="text-white text-sm">Liked a post in <span className="text-[#fa4454]">Match Discussion</span></p>
                  <p className="text-[#768894] text-xs">1 day ago</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Hero Selection Modal */}
      {showHeroModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-[#2b3d4d]">
              <h3 className="text-xl font-semibold text-white">Select Hero Avatar</h3>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">
                {Object.values(MARVEL_RIVALS_HEROES).map((hero) => {
                  const heroImage = getHeroImageSync(hero.name);
                  return (
                    <button
                      key={hero.id}
                      onClick={() => setSelectedHero(hero.name)}
                      className={`relative p-2 rounded-lg border-2 transition-all ${
                        selectedHero === hero.name
                          ? 'border-[#fa4454] bg-[#fa4454]/10'
                          : 'border-[#2b3d4d] hover:border-[#3a4a5c]'
                      }`}
                    >
                      <div className="w-full aspect-square mb-2">
                        {heroImage ? (
                          <img
                            src={heroImage}
                            alt={hero.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#2b3d4d] rounded flex items-center justify-center">
                            <span className="text-2xl">{hero.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-center text-white truncate">{hero.name}</p>
                      <p className="text-xs text-center text-[#768894]">{hero.role}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="p-6 border-t border-[#2b3d4d] flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedHero('');
                  setShowHeroModal(false);
                }}
                className="px-4 py-2 border border-[#2b3d4d] text-[#768894] rounded hover:text-white hover:border-[#768894] transition-colors"
              >
                Clear Hero Avatar
              </button>
              <button
                onClick={() => setShowHeroModal(false)}
                className="px-4 py-2 border border-[#2b3d4d] text-[#768894] rounded hover:text-white hover:border-[#768894] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Save hero selection
                  try {
                    const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/api/user/profile/flairs', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                      },
                      body: JSON.stringify({
                        hero_flair: selectedHero,
                        show_hero_flair: true,
                      }),
                    });
                    
                    if (response.ok && updateUser) {
                      const data = await response.json();
                      updateUser(data.data);
                    }
                  } catch (error) {
                    console.error('Failed to update hero flair:', error);
                  }
                  setShowHeroModal(false);
                }}
                className="px-4 py-2 bg-[#fa4454] hover:bg-[#e03a49] text-white rounded font-medium transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Team Flair Selection Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-[#2b3d4d]">
              <h3 className="text-xl font-semibold text-white">Select Team Flair</h3>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team.id)}
                    className={`relative p-4 rounded-lg border-2 transition-all ${
                      selectedTeam === team.id
                        ? 'border-[#fa4454] bg-[#fa4454]/10'
                        : 'border-[#2b3d4d] hover:border-[#3a4a5c]'
                    }`}
                  >
                    <div className="flex flex-col items-center">
                      <div className="w-16 h-16 mb-2">
                        {team.logo ? (
                          <img
                            src={team.logo}
                            alt={team.name}
                            className="w-full h-full object-contain rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-[#2b3d4d] rounded flex items-center justify-center">
                            <span className="text-2xl font-bold">{team.short_name || team.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-center text-white font-medium">{team.name}</p>
                      <p className="text-xs text-center text-[#768894]">{team.region}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t border-[#2b3d4d] flex justify-end space-x-3">
              <button
                onClick={() => {
                  setSelectedTeam(null);
                  setShowTeamModal(false);
                }}
                className="px-4 py-2 border border-[#2b3d4d] text-[#768894] rounded hover:text-white hover:border-[#768894] transition-colors"
              >
                Clear Team Flair
              </button>
              <button
                onClick={() => setShowTeamModal(false)}
                className="px-4 py-2 border border-[#2b3d4d] text-[#768894] rounded hover:text-white hover:border-[#768894] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  // Save team selection
                  try {
                    const response = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL + '/api/user/profile/flairs', {
                      method: 'PUT',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                      },
                      body: JSON.stringify({
                        team_flair_id: selectedTeam,
                        show_team_flair: true,
                      }),
                    });
                    
                    if (response.ok && updateUser) {
                      const data = await response.json();
                      updateUser(data.data);
                    }
                  } catch (error) {
                    console.error('Failed to update team flair:', error);
                  }
                  setShowTeamModal(false);
                }}
                className="px-4 py-2 bg-[#fa4454] hover:bg-[#e03a49] text-white rounded font-medium transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
