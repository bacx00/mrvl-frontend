import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './index';
import { useActivityStatsContext } from '../contexts/ActivityStatsContext';

/**
 * Custom hook for real-time user activity statistics
 * Provides live updates for forum threads, posts, comments, and days active
 */
export const useActivityStats = (targetUserId = null, options = {}) => {
  const { api, user } = useAuth();
  const { registerUpdateTrigger } = useActivityStatsContext();
  const [stats, setStats] = useState({
    total_comments: 0,
    total_forum_posts: 0,
    total_forum_threads: 0,
    total_votes: 0,
    days_active: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  // Configuration
  const {
    updateInterval = 30000, // 30 seconds
    enableRealTimeUpdates = true,
    enableActivityTriggers = true,
    debounceDelay = 2000
  } = options;
  
  // Refs for cleanup
  const intervalRef = useRef(null);
  const timeoutRef = useRef(null);
  const isOwnProfile = !targetUserId || targetUserId == user?.id;
  
  const fetchStats = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError(null);
      
      const endpoint = targetUserId && !isOwnProfile 
        ? `/admin/users/${targetUserId}/activity`
        : '/user/profile/activity';
        
      const response = await api.get(endpoint);
      const data = response.data?.data || response.data || {};
      
      // Handle different possible response structures from backend
      const statsData = data.stats || data.user_stats || data.activity_stats || data || {};
      
      const normalizedStats = {
        total_comments: parseInt(statsData.total_comments || statsData.comments_count || statsData.comment_count || 0),
        total_forum_posts: parseInt(statsData.total_forum_posts || statsData.forum_posts_count || statsData.posts_count || 0),
        total_forum_threads: parseInt(statsData.total_forum_threads || statsData.forum_threads_count || statsData.threads_count || 0),
        total_votes: parseInt(statsData.total_votes || statsData.votes_count || statsData.vote_count || 0),
        days_active: parseInt(statsData.days_active || statsData.activity_days || statsData.active_days || 0)
      };
      
      setStats(normalizedStats);
      setLastUpdated(new Date().toISOString());
      
      console.log('📊 Activity stats updated:', normalizedStats);
      
    } catch (err) {
      console.error('❌ Error fetching activity stats:', err);
      setError(err.message || 'Failed to fetch activity statistics');
    } finally {
      setLoading(false);
    }
  }, [api, targetUserId, isOwnProfile]);
  
  // Debounced fetch for activity triggers
  const debouncedFetch = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      fetchStats(false);
    }, debounceDelay);
  }, [fetchStats, debounceDelay]);
  
  // Activity trigger handler
  const handleActivityTrigger = useCallback(() => {
    if (!enableActivityTriggers) return;
    
    // Only trigger updates for user's own profile
    if (isOwnProfile) {
      console.log('🎯 User activity detected, updating stats...');
      debouncedFetch();
    }
  }, [enableActivityTriggers, isOwnProfile, debouncedFetch]);
  
  // Set up live updates
  useEffect(() => {
    // Initial fetch
    fetchStats(true);
    
    // Register with activity stats context for immediate updates
    const unregister = registerUpdateTrigger((actionType) => {
      if (isOwnProfile) {
        console.log(`📊 Context triggered stats update for: ${actionType}`);
        debouncedFetch();
      }
    });
    
    if (!enableRealTimeUpdates) {
      return unregister;
    }
    
    // Set up periodic updates
    intervalRef.current = setInterval(() => {
      fetchStats(false);
    }, updateInterval);
    
    // Set up activity triggers
    if (enableActivityTriggers && isOwnProfile) {
      const activityEvents = [
        'focus',           // When user focuses on window
        'visibilitychange' // When tab becomes visible
      ];
      
      const handleVisibilityChange = () => {
        if (!document.hidden) {
          handleActivityTrigger();
        }
      };
      
      const handleFocus = () => {
        handleActivityTrigger();
      };
      
      // Add event listeners
      window.addEventListener('focus', handleFocus);
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // Cleanup function
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        unregister();
      };
    }
    
    // Cleanup function for interval only
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      unregister();
    };
  }, [fetchStats, enableRealTimeUpdates, updateInterval, enableActivityTriggers, isOwnProfile, handleActivityTrigger, registerUpdateTrigger, debouncedFetch]);
  
  // Manual refresh function
  const refresh = useCallback(() => {
    fetchStats(true);
  }, [fetchStats]);
  
  // Function to trigger immediate update (useful after user actions)
  const triggerUpdate = useCallback(() => {
    if (isOwnProfile) {
      debouncedFetch();
    }
  }, [isOwnProfile, debouncedFetch]);
  
  return {
    stats,
    loading,
    error,
    lastUpdated,
    refresh,
    triggerUpdate
  };
};

export default useActivityStats;