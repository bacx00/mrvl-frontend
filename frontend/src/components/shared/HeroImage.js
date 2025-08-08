import React, { useState, useEffect } from 'react';
import { heroService } from '../../services/heroService';

/**
 * Hero Image Component with Backend Sync and Fallback
 * Uses backend API to fetch hero images and displays text fallback when not available
 */
const HeroImage = ({ 
  heroName, 
  className = '', 
  size = 'md',
  showRole = false,
  fallbackOnly = false 
}) => {
  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!heroName) {
      setLoading(false);
      return;
    }

    // Don't fetch if we want fallback only
    if (fallbackOnly) {
      setHeroData({
        hero_name: heroName,
        fallback_text: heroName,
        role: heroService.getHeroRole(heroName),
        role_color: heroService.getRoleColor(heroService.getHeroRole(heroName))
      });
      setLoading(false);
      return;
    }

    // Fetch hero data from backend
    const fetchHeroData = async () => {
      try {
        const data = await heroService.getHeroDisplay(heroName);
        setHeroData(data);
      } catch (error) {
        console.error('Error fetching hero data:', error);
        // Set fallback data on error
        setHeroData({
          hero_name: heroName,
          fallback_text: heroName,
          role: heroService.getHeroRole(heroName),
          role_color: heroService.getRoleColor(heroService.getHeroRole(heroName))
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHeroData();
  }, [heroName, fallbackOnly]);

  // Size classes
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl'
  };

  const currentSizeClass = sizeClasses[size] || sizeClasses.md;

  // Show loading state
  if (loading) {
    return (
      <div className={`${currentSizeClass} ${className} bg-gray-200 rounded-full animate-pulse`} />
    );
  }

  // Show placeholder if no hero name
  if (!heroName || !heroData) {
    return (
      <div className={`${currentSizeClass} ${className} bg-gray-200 rounded-full flex items-center justify-center`}>
        <span className="text-gray-400">?</span>
      </div>
    );
  }

  // Get image URL
  const imageUrl = heroData.image_exists && !imageError 
    ? heroService.getHeroImageUrl(heroData)
    : null;

  // Get initials for fallback
  const getInitials = (name) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return parts[0][0] + parts[1][0];
    }
    return name.substring(0, 2);
  };

  return (
    <div className={`relative ${className.includes('w-full') ? '' : currentSizeClass} ${className} flex items-center justify-center`}>
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={heroData.hero_name}
          className={`${className.includes('w-full') ? 'w-full h-full' : currentSizeClass} rounded-full object-cover`}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className={`${className.includes('w-full') ? 'w-full h-full' : ''} flex items-center justify-center text-gray-700 dark:text-gray-300 text-sm font-medium px-2 text-center`}>
          {heroData.fallback_text || heroData.hero_name}
        </div>
      )}
      
      {showRole && (
        <div 
          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
          style={{ backgroundColor: heroData.role_color }}
          title={heroData.role}
        />
      )}
    </div>
  );
};

// Hero Portrait Component for larger displays
export const HeroPortrait = ({ 
  heroName, 
  className = '', 
  showName = false,
  showRole = false 
}) => {
  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!heroName) {
      setLoading(false);
      return;
    }

    const fetchHeroData = async () => {
      try {
        const data = await heroService.getHeroDisplay(heroName);
        setHeroData(data);
      } catch (error) {
        console.error('Error fetching hero data:', error);
        setHeroData({
          hero_name: heroName,
          fallback_text: heroName,
          role: heroService.getHeroRole(heroName),
          role_color: heroService.getRoleColor(heroService.getHeroRole(heroName))
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHeroData();
  }, [heroName]);

  if (loading) {
    return (
      <div className={`w-24 h-24 bg-gray-200 rounded-lg animate-pulse ${className}`} />
    );
  }

  if (!heroName || !heroData) {
    return null;
  }

  const imageUrl = heroData.image_exists && !imageError 
    ? heroService.getHeroImageUrl(heroData)
    : null;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {imageUrl && !imageError ? (
        <img
          src={imageUrl}
          alt={heroData.hero_name}
          className="w-24 h-24 rounded-lg object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-24 h-24 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
          <span className="text-gray-700 dark:text-gray-300 text-sm font-medium text-center px-2">
            {heroData.fallback_text || heroData.hero_name}
          </span>
        </div>
      )}
      
      {showName && (
        <p className="mt-2 text-sm font-medium text-gray-900">{heroData.hero_name}</p>
      )}
      
      {showRole && (
        <p 
          className="text-xs font-medium mt-1"
          style={{ color: heroData.role_color }}
        >
          {heroData.role}
        </p>
      )}
    </div>
  );
};

export default HeroImage;