import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../../hooks';
import { X, Plus, Tag, TrendingUp, Hash, Filter, Search } from 'lucide-react';

function ThreadTagsManager({
  threadId = null,
  initialTags = [],
  onTagsChange = null,
  mode = 'display', // 'display', 'edit', 'create', 'filter'
  showTrending = true,
  showSuggestions = true,
  maxTags = 8,
  className = '',
  size = 'sm'
}) {
  const { api, isAuthenticated } = useAuth();
  
  const [tags, setTags] = useState(initialTags);
  const [availableTags, setAvailableTags] = useState([]);
  const [trendingTags, setTrendingTags] = useState([]);
  const [tagSuggestions, setSuggestions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [loading, setLoading] = useState(false);

  // Size configurations
  const sizeConfig = useMemo(() => ({
    xs: {
      tag: 'px-1.5 py-0.5 text-xs',
      button: 'p-1 text-xs',
      input: 'text-xs px-2 py-1'
    },
    sm: {
      tag: 'px-2 py-1 text-sm',
      button: 'p-1.5 text-sm', 
      input: 'text-sm px-2 py-1'
    },
    md: {
      tag: 'px-3 py-1.5 text-sm',
      button: 'p-2 text-sm',
      input: 'text-sm px-3 py-2'
    }
  }), []);

  // Load available tags and trending tags
  useEffect(() => {
    const loadTagData = async () => {
      try {
        setLoading(true);
        
        // Load available tags
        const tagsResponse = await api.get('/forums/tags');
        setAvailableTags(tagsResponse.data?.data || []);
        
        // Load trending tags if enabled
        if (showTrending) {
          const trendingResponse = await api.get('/forums/tags/trending?limit=10');
          setTrendingTags(trendingResponse.data?.data || []);
        }
        
      } catch (error) {
        console.error('Failed to load tag data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTagData();
  }, [api, showTrending]);

  // Load tag suggestions based on content (for create/edit modes)
  const loadTagSuggestions = useCallback(async (title, content) => {
    if (!showSuggestions || (!title && !content)) return;
    
    try {
      const response = await api.post('/forums/tags/suggestions', {
        title: title || '',
        content: content || ''
      });
      setSuggestions(response.data?.suggestions || []);
    } catch (error) {
      console.error('Failed to load tag suggestions:', error);
    }
  }, [api, showSuggestions]);

  // Filter available tags based on search
  const filteredTags = useMemo(() => {
    if (!searchQuery) return availableTags;
    
    return availableTags.filter(tag =>
      tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tag.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableTags, searchQuery]);

  // Add tag
  const addTag = useCallback(async (tag) => {
    if (tags.length >= maxTags) {
      alert(`Maximum ${maxTags} tags allowed`);
      return;
    }

    const tagExists = tags.some(t => t.id === tag.id || t.name === tag.name);
    if (tagExists) return;

    const newTags = [...tags, tag];
    setTags(newTags);
    
    if (onTagsChange) {
      onTagsChange(newTags);
    }

    // Update thread tags if threadId provided
    if (threadId && isAuthenticated) {
      try {
        await api.post(`/forums/threads/${threadId}/tags`, {
          tag_id: tag.id
        });
      } catch (error) {
        console.error('Failed to add tag to thread:', error);
      }
    }
  }, [tags, maxTags, onTagsChange, threadId, isAuthenticated, api]);

  // Remove tag
  const removeTag = useCallback(async (tagToRemove) => {
    const newTags = tags.filter(tag => tag.id !== tagToRemove.id && tag.name !== tagToRemove.name);
    setTags(newTags);
    
    if (onTagsChange) {
      onTagsChange(newTags);
    }

    // Update thread tags if threadId provided
    if (threadId && isAuthenticated && tagToRemove.id) {
      try {
        await api.delete(`/forums/threads/${threadId}/tags/${tagToRemove.id}`);
      } catch (error) {
        console.error('Failed to remove tag from thread:', error);
      }
    }
  }, [tags, onTagsChange, threadId, isAuthenticated, api]);

  // Create new tag
  const createNewTag = useCallback(async () => {
    if (!newTagName.trim()) return;
    
    try {
      const response = await api.post('/forums/tags', {
        name: newTagName.trim()
      });
      
      const newTag = response.data?.tag || {
        id: Date.now(), // Temporary ID
        name: newTagName.trim(),
        color: '#6B7280',
        new: true
      };
      
      await addTag(newTag);
      setNewTagName('');
      setShowTagInput(false);
      
    } catch (error) {
      console.error('Failed to create tag:', error);
      alert('Failed to create tag. Please try again.');
    }
  }, [newTagName, addTag, api]);

  // Handle key press for new tag input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      createNewTag();
    } else if (e.key === 'Escape') {
      setShowTagInput(false);
      setNewTagName('');
    }
  };

  // Render individual tag
  const renderTag = (tag, canRemove = false) => {
    const tagStyle = {
      backgroundColor: tag.color || '#6B7280',
      color: getContrastColor(tag.color || '#6B7280')
    };

    return (
      <span
        key={tag.id || tag.name}
        className={`inline-flex items-center rounded-full font-medium transition-all duration-200 hover:shadow-sm ${sizeConfig[size].tag}`}
        style={tagStyle}
      >
        <Hash className="w-3 h-3 mr-1" />
        {tag.name}
        {tag.new && (
          <span className="ml-1 text-xs opacity-75">(new)</span>
        )}
        {canRemove && (
          <button
            onClick={() => removeTag(tag)}
            className="ml-1 hover:bg-white/20 rounded-full p-0.5 transition-colors"
            aria-label={`Remove ${tag.name} tag`}
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </span>
    );
  };

  // Get contrast color for tag text
  const getContrastColor = (backgroundColor) => {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return brightness > 155 ? '#000000' : '#FFFFFF';
  };

  // Display mode - just show tags
  if (mode === 'display') {
    return (
      <div className={`flex flex-wrap gap-1.5 ${className}`}>
        {tags.map(tag => renderTag(tag, false))}
        {tags.length === 0 && (
          <span className="text-gray-500 dark:text-gray-400 text-sm italic">
            No tags
          </span>
        )}
      </div>
    );
  }

  // Filter mode - tags act as filters
  if (mode === 'filter') {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags..."
            className={`w-full pl-10 pr-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${sizeConfig[size].input}`}
          />
        </div>

        {/* Selected tags */}
        {tags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <Filter className="w-4 h-4 mr-1" />
              Active Filters
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => renderTag(tag, true))}
            </div>
          </div>
        )}

        {/* Available tags */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
            <Tag className="w-4 h-4 mr-1" />
            Available Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {filteredTags.slice(0, 20).map(tag => (
              <button
                key={tag.id}
                onClick={() => addTag(tag)}
                className={`inline-flex items-center rounded-full font-medium transition-all duration-200 hover:shadow-sm border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 ${sizeConfig[size].tag}`}
                style={{
                  backgroundColor: tag.color + '20',
                  color: tag.color
                }}
              >
                <Hash className="w-3 h-3 mr-1" />
                {tag.name}
                <Plus className="w-3 h-3 ml-1" />
              </button>
            ))}
          </div>
        </div>

        {/* Trending tags */}
        {showTrending && trendingTags.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              Trending Tags
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {trendingTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => addTag(tag)}
                  className={`inline-flex items-center rounded-full font-medium transition-all duration-200 hover:shadow-sm border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 ${sizeConfig[size].tag}`}
                  style={{
                    backgroundColor: tag.color + '20',
                    color: tag.color
                  }}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {tag.name}
                  <span className="ml-1 text-xs opacity-75">({tag.usage_count})</span>
                  <Plus className="w-3 h-3 ml-1" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Edit/Create mode - full tag management
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current tags */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tags ({tags.length}/{maxTags})
          </h4>
          {tags.length < maxTags && (
            <button
              onClick={() => setShowTagInput(!showTagInput)}
              className={`flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors ${sizeConfig[size].button}`}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Tag
            </button>
          )}
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => renderTag(tag, true))}
          {tags.length === 0 && (
            <span className="text-gray-500 dark:text-gray-400 text-sm italic">
              No tags added yet
            </span>
          )}
        </div>
      </div>

      {/* Add new tag input */}
      {showTagInput && (
        <div className="space-y-2">
          <div className="flex space-x-2">
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter tag name..."
              className={`flex-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${sizeConfig[size].input}`}
              autoFocus
            />
            <button
              onClick={createNewTag}
              disabled={!newTagName.trim()}
              className={`bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${sizeConfig[size].button}`}
            >
              Add
            </button>
            <button
              onClick={() => {
                setShowTagInput(false);
                setNewTagName('');
              }}
              className={`bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors ${sizeConfig[size].button}`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Tag suggestions */}
      {showSuggestions && tagSuggestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Suggested Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {tagSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => addTag(suggestion)}
                className={`inline-flex items-center rounded-full font-medium transition-all duration-200 hover:shadow-sm border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-solid ${sizeConfig[size].tag}`}
                style={{
                  backgroundColor: (suggestion.color || '#6B7280') + '15',
                  color: suggestion.color || '#6B7280'
                }}
              >
                <Hash className="w-3 h-3 mr-1" />
                {suggestion.name}
                {suggestion.confidence && (
                  <span className={`ml-1 text-xs px-1 rounded ${
                    suggestion.confidence === 'high' ? 'bg-green-100 text-green-700' :
                    suggestion.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {suggestion.confidence}
                  </span>
                )}
                <Plus className="w-3 h-3 ml-1" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular tags */}
      {availableTags.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Popular Tags
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {availableTags
              .filter(tag => !tags.some(t => t.id === tag.id))
              .slice(0, 10)
              .map(tag => (
                <button
                  key={tag.id}
                  onClick={() => addTag(tag)}
                  className={`inline-flex items-center rounded-full font-medium transition-all duration-200 hover:shadow-sm border-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600 ${sizeConfig[size].tag}`}
                  style={{
                    backgroundColor: tag.color + '20',
                    color: tag.color
                  }}
                >
                  <Hash className="w-3 h-3 mr-1" />
                  {tag.name}
                  <Plus className="w-3 h-3 ml-1" />
                </button>
              ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading tags...</span>
        </div>
      )}
    </div>
  );
}

export default ThreadTagsManager;