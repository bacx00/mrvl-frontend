import { useState, useEffect, useCallback } from 'react';
import mentionService from '../services/mentionService';

/**
 * Hook to handle real-time mention updates via WebSocket
 * @param {string} entityType - The type of entity (user, team, player)
 * @param {number|string} entityId - The entity ID to watch for mention updates
 * @param {object} options - Options for the hook
 */
export const useMentionUpdates = (entityType, entityId, options = {}) => {
  const [mentionCount, setMentionCount] = useState(0);
  const [recentMentions, setRecentMentions] = useState([]);
  const [newMentionNotification, setNewMentionNotification] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    enableNotifications = true,
    maxRecentMentions = 10,
    notificationDuration = 5000
  } = options;

  // Handle mention created events
  const handleMentionCreated = useCallback((data) => {
    if (data.mentioned_user?.id == entityId && entityType === 'user') {
      // Update count
      setMentionCount(prev => prev + 1);
      
      // Add to recent mentions
      setRecentMentions(prev => {
        const newMentions = [data.mention, ...prev];
        return newMentions.slice(0, maxRecentMentions);
      });

      // Show notification
      if (enableNotifications) {
        setNewMentionNotification({
          id: Date.now(),
          type: 'mention_created',
          message: `${data.mentioned_by?.name} mentioned you in ${data.content?.title}`,
          data: data
        });

        // Clear notification after duration
        setTimeout(() => {
          setNewMentionNotification(null);
        }, notificationDuration);
      }
    }
  }, [entityType, entityId, enableNotifications, maxRecentMentions, notificationDuration]);

  // Handle mention deleted events
  const handleMentionDeleted = useCallback((data) => {
    if (data.mentioned_user?.id == entityId && entityType === 'user') {
      // Update count
      setMentionCount(prev => Math.max(0, prev - 1));
      
      // Remove from recent mentions
      setRecentMentions(prev => 
        prev.filter(mention => mention.id !== data.mention_id)
      );
    }
  }, [entityType, entityId]);

  // Handle general mention updates for teams/players
  const handleEntityMentionUpdate = useCallback((data) => {
    const isRelevantUpdate = (
      (entityType === 'team' && data.content?.type === 'team' && data.content?.id == entityId) ||
      (entityType === 'player' && data.content?.type === 'player' && data.content?.id == entityId)
    );

    if (isRelevantUpdate) {
      if (data.type === 'mention_created') {
        setMentionCount(prev => prev + 1);
        setRecentMentions(prev => {
          const newMentions = [data.mention, ...prev];
          return newMentions.slice(0, maxRecentMentions);
        });
      } else if (data.type === 'mention_deleted') {
        setMentionCount(prev => Math.max(0, prev - 1));
        setRecentMentions(prev => 
          prev.filter(mention => mention.id !== data.mention_id)
        );
      }
    }
  }, [entityType, entityId, maxRecentMentions]);

  // Load initial data
  useEffect(() => {
    if (!entityType || !entityId) return;

    const loadInitialData = async () => {
      try {
        setIsLoading(true);
        
        // Load mention count and recent mentions
        const [countData, mentionsData] = await Promise.all([
          mentionService.getMentionCounts(entityType, entityId),
          mentionService.getRecentMentions(entityType, entityId, maxRecentMentions)
        ]);

        setMentionCount(countData.data?.mention_count || 0);
        setRecentMentions(mentionsData.data || []);
      } catch (error) {
        console.error('Error loading initial mention data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [entityType, entityId, maxRecentMentions]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!entityType || !entityId) return;

    const handleUpdate = (update) => {
      if (update.type === 'mention.created') {
        handleMentionCreated(update.data);
      } else if (update.type === 'mention.deleted') {
        handleMentionDeleted(update.data);
      }
    };

    // Subscribe to mention updates
    const unsubscribe = mentionService.subscribe(entityType, entityId, handleUpdate);

    // Return cleanup function
    return unsubscribe;
  }, [entityType, entityId, handleMentionCreated, handleMentionDeleted]);

  // Dismiss notification
  const dismissNotification = useCallback(() => {
    setNewMentionNotification(null);
  }, []);

  return {
    mentionCount,
    recentMentions,
    newMentionNotification,
    dismissNotification,
    isLoading,
    refreshData: () => {
      // Force refresh of mention data
      setIsLoading(true);
      mentionService.getMentionCounts(entityType, entityId)
        .then(data => setMentionCount(data.data?.mention_count || 0))
        .catch(console.error);
      
      mentionService.getRecentMentions(entityType, entityId, maxRecentMentions)
        .then(data => setRecentMentions(data.data || []))
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  };
};

export default useMentionUpdates;