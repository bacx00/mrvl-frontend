import { API_CONFIG } from '../config';

/**
 * Hero image service that syncs with backend
 */
class HeroService {
  constructor() {
    this.heroImagesCache = null;
    this.cacheTimestamp = null;
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Fetch all hero images from backend API
   */
  async fetchHeroImages() {
    try {
      // Check cache first
      if (this.heroImagesCache && this.cacheTimestamp && 
          Date.now() - this.cacheTimestamp < this.cacheExpiry) {
        return this.heroImagesCache;
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}/api/public/heroes/images/all`);
      if (!response.ok) throw new Error('Failed to fetch hero images');
      
      const data = await response.json();
      
      // Cache the results
      this.heroImagesCache = data.data;
      this.cacheTimestamp = Date.now();
      
      return data.data;
    } catch (error) {
      console.error('Error fetching hero images:', error);
      return [];
    }
  }

  /**
   * Get hero image by slug
   */
  async getHeroImageBySlug(slug) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/public/heroes/images/${slug}`);
      if (!response.ok) throw new Error('Hero not found');
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching hero image:', error);
      return null;
    }
  }

  /**
   * Get hero image URL with fallback
   */
  getHeroImageUrl(heroData) {
    // If heroData has image_url and it exists, return full URL
    if (heroData?.image_url && heroData?.image_exists) {
      return `${API_CONFIG.BASE_URL}${heroData.image_url}`;
    }
    
    // Return null to trigger fallback rendering
    return null;
  }

  /**
   * Convert hero name to slug
   */
  heroNameToSlug(heroName) {
    if (!heroName) return '';
    
    // Special cases matching backend
    const specialCases = {
      'Cloak & Dagger': 'cloak-and-dagger',
      'C&D': 'cloak-and-dagger',
      'Mr. Fantastic': 'mr-fantastic',
      'The Punisher': 'punisher',
      'The Thing': 'the-thing',
      'Jeff the Land Shark': 'jeff-the-land-shark',
      'Jeff': 'jeff-the-land-shark'
    };
    
    if (specialCases[heroName]) {
      return specialCases[heroName];
    }
    
    return heroName.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Get hero display data with image and fallback
   */
  async getHeroDisplay(heroName) {
    if (!heroName) return null;
    
    const slug = this.heroNameToSlug(heroName);
    const heroData = await this.getHeroImageBySlug(slug);
    
    if (!heroData) {
      // Return fallback data
      return {
        hero_name: heroName,
        slug: slug,
        image_url: null,
        image_exists: false,
        fallback_text: heroName,
        role: this.getHeroRole(heroName),
        role_color: this.getRoleColor(this.getHeroRole(heroName))
      };
    }
    
    return heroData;
  }

  /**
   * Get hero role (kept for compatibility)
   */
  getHeroRole(heroName) {
    const roleMap = {
      // Vanguards
      'Captain America': 'Vanguard', 'Doctor Strange': 'Vanguard', 'Groot': 'Vanguard', 
      'Hulk': 'Vanguard', 'Bruce Banner': 'Vanguard', 'Magneto': 'Vanguard', 
      'Thor': 'Vanguard', 'Venom': 'Vanguard', 'Peni Parker': 'Vanguard',
      'Emma Frost': 'Vanguard', 'Mister Fantastic': 'Vanguard', 'Mr. Fantastic': 'Vanguard',
      
      // Duelists
      'Black Widow': 'Duelist', 'Hawkeye': 'Duelist', 'Iron Man': 'Duelist',
      'Punisher': 'Duelist', 'The Punisher': 'Duelist', 'Spider-Man': 'Duelist', 
      'Squirrel Girl': 'Duelist', 'Star-Lord': 'Duelist', 'Winter Soldier': 'Duelist', 
      'Storm': 'Duelist', 'Scarlet Witch': 'Duelist', 'Moon Knight': 'Duelist', 
      'Psylocke': 'Duelist', 'Black Panther': 'Duelist', 'Iron Fist': 'Duelist', 
      'Magik': 'Duelist', 'Namor': 'Duelist', 'Wolverine': 'Duelist', 'Hela': 'Duelist',
      'Human Torch': 'Duelist', 'The Thing': 'Duelist', 'Ultron': 'Duelist',
      
      // Strategists
      'Adam Warlock': 'Strategist', 'Cloak & Dagger': 'Strategist', 'C&D': 'Strategist',
      'Jeff the Land Shark': 'Strategist', 'Jeff': 'Strategist', 'Luna Snow': 'Strategist',
      'Mantis': 'Strategist', 'Rocket Raccoon': 'Strategist', 'Loki': 'Strategist',
      'Invisible Woman': 'Strategist'
    };
    
    return roleMap[heroName] || 'Duelist';
  }

  /**
   * Get role color
   */
  getRoleColor(role) {
    const colors = {
      'Vanguard': '#3b82f6',    // Blue
      'Duelist': '#dc2626',     // Red
      'Strategist': '#16a34a'   // Green
    };
    
    return colors[role] || '#6b7280';
  }
}

// Export singleton instance
export const heroService = new HeroService();

// Export utility function for backward compatibility
export const getHeroImageSync = (heroName) => {
  if (!heroName) return null;
  
  const slug = heroService.heroNameToSlug(heroName);
  // Return the backend URL pattern - this should be replaced with async calls
  return `${API_CONFIG.BASE_URL}/images/heroes/${slug}-headbig.webp`;
};