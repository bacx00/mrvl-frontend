import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { formatMentionForDisplay } from '../../utils/mentionUtils';
import { formatTimeAgo } from '../../utils/dateUtils';

const MentionsSection = ({ 
  entityType, // 'player' or 'team'
  entityId,
  title,
  className = ''
}) => {
  const [mentions, setMentions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [error, setError] = useState(null);
  const [deletingMentions, setDeletingMentions] = useState(new Set());
  const { api, user, isAdmin, isModerator } = useAuth();

  useEffect(() => {
    fetchMentions();
  }, [entityType, entityId, currentPage, contentTypeFilter]);

  const fetchMentions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage,
        per_page: 10
      });
      
      if (contentTypeFilter !== 'all') {
        params.append('content_type', contentTypeFilter);
      }

      const endpoint = `/${entityType}s/${entityId}/mentions?${params.toString()}`;
      const response = await api.get(endpoint);
      
      if (response.success) {
        setMentions(response.data || []);
        if (response.pagination) {
          setTotalPages(response.pagination.last_page);
        }
      } else {
        setError(response.message || 'Failed to fetch mentions');
      }
    } catch (error) {
      console.error('Error fetching mentions:', error);
      // If the mentions backend isn't fully configured yet, show empty state instead of error
      if (error.message.includes('Column not found') || error.message.includes('Table') || error.message.includes('doesn\'t exist')) {
        console.warn('Mentions system not fully configured in backend, showing empty state');
        setMentions([]);
        setError(null);
      } else {
        setError('Error fetching mentions');
        setMentions([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleFilterChange = (filter) => {
    setContentTypeFilter(filter);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const deleteMention = async (mentionId) => {
    try {
      // Add to deleting state
      setDeletingMentions(prev => new Set([...prev, mentionId]));

      const endpoint = `/${entityType}s/${entityId}/mentions/${mentionId}`;
      const response = await api.delete(endpoint);

      if (response.success) {
        // Immediately remove from UI
        setMentions(prevMentions => prevMentions.filter(mention => mention.id !== mentionId));
        
        console.log('✅ Mention deleted successfully:', mentionId);
      } else {
        throw new Error(response.message || 'Failed to delete mention');
      }
    } catch (error) {
      console.error('❌ Error deleting mention:', error);
      // Show error to user (could add toast notification here)
      alert('Failed to delete mention: ' + error.message);
    } finally {
      // Remove from deleting state
      setDeletingMentions(prev => {
        const newSet = new Set(prev);
        newSet.delete(mentionId);
        return newSet;
      });
    }
  };

  const canDeleteMention = (mention) => {
    if (!user) return false;
    
    // Admin/moderator can delete any mention
    if (isAdmin() || isModerator()) return true;
    
    // User can delete their own mentions
    return mention.mentioned_by && mention.mentioned_by.id === user.id;
  };

  const getContentTypeDisplayName = (type) => {
    switch (type) {
      case 'news': return 'News';
      case 'news_comment': return 'News Comments';
      case 'forum_thread': return 'Forum Threads';
      case 'forum_post': return 'Forum Posts';
      case 'match': return 'Matches';
      case 'match_comment': return 'Match Comments';
      default: return type;
    }
  };

  const getContentTypeColor = (type) => {
    switch (type) {
      case 'news': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'news_comment': return 'bg-blue-50 text-blue-700 dark:bg-blue-900/10 dark:text-blue-400';
      case 'forum_thread': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'forum_post': return 'bg-purple-50 text-purple-700 dark:bg-purple-900/10 dark:text-purple-400';
      case 'match': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'match_comment': return 'bg-green-50 text-green-700 dark:bg-green-900/10 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  if (loading && mentions.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title || 'Mentions'}
        </h3>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title || 'Mentions'}
        </h3>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title || 'Mentions'}
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {mentions.length > 0 && `${mentions.length} mention${mentions.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {['all', 'news', 'news_comment', 'forum_thread', 'forum_post', 'match', 'match_comment'].map(filter => (
          <button
            key={filter}
            onClick={() => handleFilterChange(filter)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              contentTypeFilter === filter
                ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {filter === 'all' ? 'All' : getContentTypeDisplayName(filter)}
          </button>
        ))}
      </div>

      {/* Mentions List */}
      {mentions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <div className="space-y-2">
            <div className="text-4xl">💬</div>
            <p className="font-medium">No mentions yet</p>
            <p className="text-sm">
              This {entityType} hasn't been mentioned in forum discussions, news, or comments yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {mentions.map((mention) => (
            <div
              key={mention.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              {/* Mention Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {mention.mentioned_by && (
                    <div className="flex items-center space-x-2">
                      {mention.mentioned_by.avatar ? (
                        <img 
                          src={mention.mentioned_by.avatar} 
                          alt={mention.mentioned_by.name}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {mention.mentioned_by.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {mention.mentioned_by.name}
                      </span>
                    </div>
                  )}
                  {mention.content && (
                    <span className={`px-2 py-1 text-xs rounded-full ${getContentTypeColor(mention.content.type)}`}>
                      {getContentTypeDisplayName(mention.content.type)}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTimeAgo(mention.mentioned_at)}
                  </span>
                  {canDeleteMention(mention) && (
                    <button
                      onClick={() => deleteMention(mention.id)}
                      disabled={deletingMentions.has(mention.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete mention"
                    >
                      {deletingMentions.has(mention.id) ? (
                        <div className="animate-spin w-4 h-4 border border-red-500 border-t-transparent rounded-full"></div>
                      ) : (
                        '🗑️'
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Context */}
              {mention.context && (
                <div className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {mention.mention_text}
                  </span>
                  <span className="ml-1">
                    {mention.context.replace(mention.mention_text, '')}
                  </span>
                </div>
              )}

              {/* Content Link */}
              {mention.content && mention.content.url && (
                <div className="text-sm">
                  <a
                    href={mention.content.url}
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {mention.content.title}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default MentionsSection;