import { useAuth } from './index';
import { getHeroImageSync, getHeroRole } from '../utils/imageUtils';

// Hook to provide enhanced user display data with flairs
export const useUserDisplay = () => {
  const { user } = useAuth();

  const getFullUserData = (userData) => {
    if (!userData) return null;

    return {
      ...userData,
      display: {
        avatar: getDisplayAvatar(userData),
        heroFlair: getHeroFlairDisplay(userData),
        teamFlair: getTeamFlairDisplay(userData),
        fallbackAvatar: getFallbackAvatar(userData)
      }
    };
  };

  const getDisplayAvatar = (user) => {
    // Priority: Custom avatar -> Hero avatar -> Fallback
    if (user.avatar && user.profile_picture_type !== 'hero') {
      return user.avatar;
    }
    
    if (user.hero_flair && user.use_hero_as_avatar) {
      const heroImage = getHeroImageSync(user.hero_flair, 'portrait');
      if (heroImage) return heroImage;
    }
    
    return null; // Will use fallback
  };

  const getHeroFlairDisplay = (user) => {
    if (!user.hero_flair || !user.show_hero_flair) {
      return null;
    }

    const heroRole = getHeroRole(user.hero_flair);
    const heroImage = getHeroImageSync(user.hero_flair, 'icon');

    return {
      name: user.hero_flair,
      role: heroRole,
      icon: heroImage,
      color: getHeroColor(user.hero_flair),
      roleColor: getRoleColor(heroRole),
      fallback: {
        text: user.hero_flair.charAt(0).toUpperCase(),
        color: getHeroColor(user.hero_flair)
      }
    };
  };

  const getTeamFlairDisplay = (user) => {
    if (!user.team_flair || !user.show_team_flair) {
      return null;
    }

    return {
      id: user.team_flair.id,
      name: user.team_flair.name,
      shortName: user.team_flair.short_name,
      logo: user.team_flair.logo,
      region: user.team_flair.region,
      fallback: {
        text: user.team_flair.short_name || user.team_flair.name?.charAt(0) || 'T',
        color: '#6b7280'
      }
    };
  };

  const getFallbackAvatar = (user) => {
    return {
      text: (user.name || user.username || 'U').charAt(0).toUpperCase(),
      color: generateColorFromName(user.name || user.username || 'User'),
      background: generateBackgroundFromName(user.name || user.username || 'User')
    };
  };

  const getHeroColor = (heroName) => {
    const colors = {
      'Spider-Man': '#dc2626',
      'Iron Man': '#f59e0b',
      'Captain America': '#2563eb',
      'Thor': '#7c3aed',
      'Hulk': '#16a34a',
      'Black Widow': '#000000',
      'Hawkeye': '#7c2d12',
      'Doctor Strange': '#db2777',
      'Scarlet Witch': '#dc2626',
      'Loki': '#16a34a',
      'Venom': '#000000',
      'Magneto': '#7c3aed',
      'Storm': '#6b7280',
      'Wolverine': '#f59e0b',
      'Groot': '#16a34a',
      'Rocket Raccoon': '#f59e0b',
      'Star-Lord': '#dc2626',
      'Mantis': '#16a34a',
      'Adam Warlock': '#f59e0b',
      'Luna Snow': '#3b82f6',
      'Jeff the Land Shark': '#3b82f6',
      'Cloak & Dagger': '#6b7280',
      'Emma Frost': '#f8fafc',
      'Bruce Banner': '#16a34a',
      'Mr. Fantastic': '#3b82f6',
      'Black Panther': '#7c3aed',
      'Hela': '#16a34a',
      'Magik': '#db2777',
      'Moon Knight': '#f8fafc',
      'Namor': '#3b82f6',
      'Psylocke': '#7c3aed',
      'Punisher': '#000000',
      'Winter Soldier': '#6b7280',
      'Iron Fist': '#f59e0b',
      'Squirrel Girl': '#7c2d12',
      'Peni Parker': '#db2777'
    };
    
    return colors[heroName] || '#6b7280';
  };

  const getRoleColor = (role) => {
    const colors = {
      'Vanguard': '#3b82f6',
      'Duelist': '#dc2626',
      'Strategist': '#16a34a'
    };
    
    return colors[role] || '#6b7280';
  };

  const generateColorFromName = (name) => {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
      '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
      '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  };

  const generateBackgroundFromName = (name) => {
    const backgrounds = [
      '#fef2f2', '#fff7ed', '#fffbeb', '#fefce8', '#f7fee7',
      '#f0fdf4', '#ecfdf5', '#f0fdfa', '#ecfeff', '#f0f9ff',
      '#eff6ff', '#eef2ff', '#f5f3ff', '#faf5ff', '#fdf4ff',
      '#fdf2f8', '#fff1f2'
    ];
    
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return backgrounds[Math.abs(hash) % backgrounds.length];
  };

  return {
    currentUser: user ? getFullUserData(user) : null,
    getFullUserData,
    getDisplayAvatar,
    getHeroFlairDisplay,
    getTeamFlairDisplay,
    getFallbackAvatar
  };
};

export default useUserDisplay;