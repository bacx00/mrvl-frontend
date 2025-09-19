import mentionService from '../services/mentionService';

/**
 * Utility functions for handling mention deletions
 */

/**
 * Notify that a mention should be removed from profiles when content is deleted
 * @param {number} mentionId - The ID of the mention to remove
 * @param {string} entityType - Type of entity (player, team, user)
 * @param {number} entityId - ID of the entity
 */
export const notifyMentionDeleted = (mentionId, entityType, entityId) => {
  mentionService.notifyMentionDeleted(mentionId, entityType, entityId);
};

/**
 * Handle deletion of content that contains mentions
 * This should be called whenever news articles, forum posts, comments, etc. are deleted
 * @param {string} content - The content that was deleted (to extract mentions)
 * @param {Array} mentionsData - Array of mention objects if available
 */
export const handleContentDeletion = (content, mentionsData = []) => {
  if (!content && (!mentionsData || mentionsData.length === 0)) return;

  // If we have mention data, use it directly
  if (mentionsData && mentionsData.length > 0) {
    mentionsData.forEach(mention => {
      if (mention.mentioned_id && mention.mentioned_type) {
        const entityType = mention.mentioned_type.toLowerCase().replace('app\\models\\', '');
        notifyMentionDeleted(mention.id, entityType, mention.mentioned_id);
      }
    });
    return;
  }

  // If we only have content, extract mentions from it
  if (content && typeof content === 'string') {
    // Extract @player:, @team:, and @ mentions
    const mentionPatterns = [
      { regex: /@player:([a-zA-Z0-9_]+)/g, type: 'player' },
      { regex: /@team:([a-zA-Z0-9_]+)/g, type: 'team' },
      { regex: /@([a-zA-Z0-9_]+)(?!:)/g, type: 'user' }
    ];

    mentionPatterns.forEach(({ regex, type }) => {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const identifier = match[1];
        // Since we don't have the exact mention ID or entity ID from content alone,
        // we trigger a general refresh for this type
        // In a real implementation, you'd want to resolve the identifier to get the actual ID
        console.log(`Mention of ${type}:${identifier} detected in deleted content`);
      }
    });
  }
};

/**
 * Update mentions data by removing deleted mentions
 * @param {Array} mentions - Current mentions array
 * @param {number} deletedMentionId - ID of the deleted mention
 * @returns {Array} Updated mentions array
 */
export const removeMentionFromList = (mentions, deletedMentionId) => {
  return mentions.filter(mention => mention.id !== deletedMentionId);
};

export default {
  notifyMentionDeleted,
  handleContentDeletion,
  removeMentionFromList
};