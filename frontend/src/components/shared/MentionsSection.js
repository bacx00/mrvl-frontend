import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks';
import { formatMentionForDisplay } from '../../utils/mentionUtils';
import { getImageUrl } from '../../utils/imageUtils';

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
  const { api } = useAuth();

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
      
      if (response.data.success) {
        setMentions(response.data.data || []);
        if (response.data.pagination) {
          setTotalPages(response.data.pagination.last_page);
        }
      } else {
        // Only set error for actual API failures, not empty results
        if (response.status >= 400) {
          setError(response.data.message || 'Failed to load mentions');
        } else {
          setMentions([]);
        }
      }
    } catch (error) {
      console.error('Error fetching mentions:', error);
      // Only show error for actual network/API errors
      if (error.response?.status >= 500 || !error.response) {
        setError('Unable to load mentions at this time');
      } else if (error.response?.status === 404) {
        // 404 means no mentions exist, not an error
        setMentions([]);
      } else {
        setError('Failed to load mentions');
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
        <div className="text-center py-8">
          <div className="flex flex-col items-center">
            {/* Error Icon */}
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            {/* Error message */}
            <p className="text-gray-600 dark:text-gray-400 text-sm text-center">
              {error}
            </p>
            
            {/* Retry button */}
            <button
              onClick={() => fetchMentions()}
              className="mt-3 px-3 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Try again
            </button>
          </div>
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
        <div className="text-center py-12">
          <div className="flex flex-col items-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            
            {/* Main message */}
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No mentions yet
            </h4>
            
            {/* Sub message */}
            <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-sm leading-relaxed">
              {entityType === 'player' 
                ? 'Be the first to mention this player in news, forums, or match discussions!' 
                : 'Be the first to mention this team in news, forums, or match discussions!'
              }
            </p>
            
            {/* Optional CTA hint */}
            <div className="mt-4 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Mentions appear when {entityType === 'player' ? 'this player' : 'this team'} is discussed in the community
              </p>
            </div>
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
                          onError={(e) => { e.target.src = getImageUrl(null, 'player-avatar'); }}
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
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(mention.mentioned_at).toLocaleDateString()}
                </span>
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