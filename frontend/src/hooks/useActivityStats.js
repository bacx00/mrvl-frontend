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
      
      // Use the correct public endpoint for user stats
      const endpoint = targetUserId 
        ? `/api/users/${targetUserId}/stats`
        : '/api/profile';
        
      const response = await api.get(endpoint);
      const data = response.data?.data || response.data || {};
      
      // Handle the actual response structure from backend
      const normalizedStats = {
        total_comments: data.comments?.total || 0,
        total_forum_posts: data.forum?.posts || 0,
        total_forum_threads: data.forum?.threads || 0,
        total_votes: (data.votes?.upvotes_given || 0) + (data.votes?.downvotes_given || 0),
        days_active: data.account?.days_active || 0,
        // Additional stats
        news_comments: data.comments?.news || 0,
        match_comments: data.comments?.matches || 0,
        upvotes_given: data.votes?.upvotes_given || 0,
        downvotes_given: data.votes?.downvotes_given || 0,
        upvotes_received: data.votes?.upvotes_received || 0,
        downvotes_received: data.votes?.downvotes_received || 0,
        reputation_score: data.votes?.reputation_score || 0,
        mentions_given: data.mentions?.given || 0,
        mentions_received: data.mentions?.received || 0,
        activity_score: data.activity?.activity_score || 0,
        total_actions: data.activity?.total_actions || 0,
        last_activity: data.activity?.last_activity || null
      };
      
      setStats(normalizedStats);
      setLastUpdated(new Date().toISOString());
      
      console.log('Activity stats updated:', normalizedStats);
      
    } catch (err) {
      console.error('Error fetching activity stats:', err);
      setError(err.message || 'Failed to fetch activity statistics');
    } finally {
      setLoading(false);
    }
  }, [api, targetUserId]);
  
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