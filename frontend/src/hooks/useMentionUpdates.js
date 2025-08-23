import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './index';
import mentionService from '../services/mentionService';

/**
 * Hook to handle mention updates via polling
 * @param {string} entityType - The type of entity (user, team, player)
 * @param {number|string} entityId - The entity ID to watch for mention updates
 * @param {object} options - Options for the hook
 */
export const useMentionUpdates = (entityType, entityId, options = {}) => {
  const [mentionCount, setMentionCount] = useState(0);
  const [recentMentions, setRecentMentions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { api } = useAuth();

  const {
    maxRecentMentions = 10,
    pollingInterval = 30000 // 30 seconds
  } = options;

  // Fetch mention data from API
  const fetchMentionData = useCallback(async () => {
    if (!entityType || !entityId || !api) return;

    try {
      // Determine the correct endpoint based on entity type
      let endpoint;
      switch (entityType) {
        case 'player':
          endpoint = `/players/${entityId}/mentions`;
          break;
        case 'team':
          endpoint = `/teams/${entityId}/mentions`;
          break;
        case 'user':
          endpoint = `/users/${entityId}/mentions`;
          break;
        default:
          endpoint = `/${entityType}s/${entityId}/mentions`;
      }

      const response = await api.get(endpoint, {
        params: { limit: maxRecentMentions }
      });

      if (response.data) {
        const mentionsData = response.data.data || response.data || [];
        setRecentMentions(mentionsData);
        
        // Calculate count from the response
        if (response.data.meta?.total) {
          setMentionCount(response.data.meta.total);
        } else if (response.data.total) {
          setMentionCount(response.data.total);
        } else {
          setMentionCount(mentionsData.length);
        }
      }
    } catch (error) {
      console.error('Error fetching mention data:', error);
      // Don't reset data on error to maintain user experience
    } finally {
      setIsLoading(false);
    }
  }, [entityType, entityId, api, maxRecentMentions]);

  // Load initial data
  useEffect(() => {
    fetchMentionData();
  }, [fetchMentionData]);

  // Subscribe to polling updates
  useEffect(() => {
    if (!entityType || !entityId) return;

    const handleUpdate = (update) => {
      if (update.type === 'refresh') {
        fetchMentionData();
      }
    };

    // Subscribe to mention updates with polling
    const unsubscribe = mentionService.subscribe(entityType, entityId, handleUpdate, pollingInterval);

    // Return cleanup function
    return unsubscribe;
  }, [entityType, entityId, fetchMentionData, pollingInterval]);

  return {
    mentionCount,
    recentMentions,
    isLoading,
    refreshData: fetchMentionData
  };
};

export default useMentionUpdates;