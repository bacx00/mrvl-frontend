import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { getImageUrl } from '../../utils/imageUtils';
import LazyImage from './LazyImage';

// Enhanced debounce utility function with immediate execution option
function debounce(func, wait, immediate = false) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };
    const callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// Cache for API responses to prevent duplicate calls
const mentionCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const MentionAutocomplete = ({ 
  value, 
  onChange, 
  onMentionSelect,
  placeholder = "Type @ to mention someone...",
  className = "",
  rows = 3,
  disabled = false,
  maxLength,
  ...props 
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionResults, setMentionResults] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStart, setMentionStart] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);
  const lastQueryRef = useRef('');
  const activeRequestRef = useRef(null);
  const { api } = useAuth();

  // Enhanced debounced search function with caching and deduplication
  const searchMentions = useCallback(
    debounce(async (query, type = 'all') => {
      if (query.length < 1) {
        setMentionResults([]);
        setLoading(false);
        return;
      }

      // Prevent duplicate queries
      if (query === lastQueryRef.current) {
        return;
      }
      lastQueryRef.current = query;

      // Check cache first
      const cacheKey = `${type}:${query.toLowerCase()}`;
      const cached = mentionCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
        setMentionResults(cached.data);
        setSelectedIndex(0);
        setShowDropdown(cached.data.length > 0);
        setLoading(false);
        return;
      }

      // Cancel previous request if still pending
      if (activeRequestRef.current) {
        activeRequestRef.current.cancel?.();
      }

      try {
        setLoading(true);
        
        // Create cancellable request
        const cancelToken = {
          cancelled: false,
          cancel: () => { cancelToken.cancelled = true; }
        };
        activeRequestRef.current = cancelToken;
        
        // Try the mentions endpoint first, fallback to individual type endpoints
        let response;
        try {
          response = await api.get(`/public/mentions/search?q=${encodeURIComponent(query)}&type=${type}&limit=10`);
        } catch (mentionError) {
          // Fallback to individual search endpoints if mentions endpoint fails
          if (type === 'user' || type === 'all') {
            response = await api.get(`/public/search/users?q=${encodeURIComponent(query)}&limit=5`);
          } else if (type === 'team') {
            response = await api.get(`/public/search/teams?q=${encodeURIComponent(query)}&limit=5`);
          } else if (type === 'player') {
            response = await api.get(`/public/search/players?q=${encodeURIComponent(query)}&limit=5`);
          } else {
            throw mentionError;
          }
        }
        
        // Check if request was cancelled
        if (cancelToken.cancelled) {
          return;
        }
        
        if (response.data.success || response.data.data) {
          const results = response.data.data || [];
          
          // Cache the results
          mentionCache.set(cacheKey, {
            data: results,
            timestamp: Date.now()
          });
          
          setMentionResults(results);
          setSelectedIndex(0);
          setShowDropdown(results.length > 0);
        } else {
          setMentionResults([]);
          setShowDropdown(false);
        }
      } catch (error) {
        if (!error.name || error.name !== 'AbortError') {
          console.error('Error searching mentions:', error);
        }
        setMentionResults([]);
        setShowDropdown(false);
      } finally {
        activeRequestRef.current = null;
        setLoading(false);
      }
    }, 250), // Reduced debounce time for better responsiveness
    [api]
  );

  // Get popular mentions when dropdown opens without query (with caching)
  const getPopularMentions = useCallback(async () => {
    const cacheKey = 'popular:mentions';
    const cached = mentionCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
      setMentionResults(cached.data);
      setSelectedIndex(0);
      setShowDropdown(cached.data.length > 0);
      return;
    }

    try {
      setLoading(true);
      let response;
      try {
        response = await api.get('/public/mentions/popular?limit=8');
      } catch (popularError) {
        // Fallback to getting recent users if popular mentions fails
        response = await api.get('/public/search/users?limit=8&recent=true');
      }
      
      if (response.data.success || response.data.data) {
        const results = response.data.data || [];
        
        // Cache popular mentions for longer duration
        mentionCache.set(cacheKey, {
          data: results,
          timestamp: Date.now()
        });
        
        setMentionResults(results);
        setSelectedIndex(0);
        setShowDropdown(results.length > 0);
      } else {
        setMentionResults([]);
        setShowDropdown(false);
      }
    } catch (error) {
      console.error('Error fetching popular mentions:', error);
      setMentionResults([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, [api]);

  // Calculate dropdown position based on cursor
  const calculateDropdownPosition = () => {
    if (!textareaRef.current) return { top: 0, left: 0 };

    const textarea = textareaRef.current;
    const { selectionStart } = textarea;
    
    // Create a hidden div to measure text position
    const measureDiv = document.createElement('div');
    measureDiv.style.position = 'absolute';
    measureDiv.style.visibility = 'hidden';
    measureDiv.style.whiteSpace = 'pre-wrap';
    measureDiv.style.wordWrap = 'break-word';
    measureDiv.style.font = window.getComputedStyle(textarea).font;
    measureDiv.style.fontSize = window.getComputedStyle(textarea).fontSize;
    measureDiv.style.lineHeight = window.getComputedStyle(textarea).lineHeight;
    measureDiv.style.padding = window.getComputedStyle(textarea).padding;
    measureDiv.style.border = window.getComputedStyle(textarea).border;
    measureDiv.style.width = textarea.offsetWidth + 'px';
    
    // Insert text up to cursor position
    const textUpToCursor = textarea.value.substring(0, selectionStart);
    measureDiv.textContent = textUpToCursor;
    
    document.body.appendChild(measureDiv);
    
    const textareaRect = textarea.getBoundingClientRect();
    const measureRect = measureDiv.getBoundingClientRect();
    
    document.body.removeChild(measureDiv);
    
    return {
      top: textareaRect.top + measureRect.height - textarea.scrollTop + 25,
      left: textareaRect.left + 10
    };
  };

  // Handle input changes and detect mentions
  const handleInputChange = (e) => {
    // Extract value safely from event or direct string  
    let newValue = '';
    let cursorPosition = 0;
    
    if (typeof e === 'string') {
      // Direct string value passed
      newValue = e;
      cursorPosition = e.length;
      // Create synthetic event for onChange callback
      const syntheticEvent = {
        target: {
          value: newValue,
          selectionStart: cursorPosition,
          selectionEnd: cursorPosition
        }
      };
      onChange(syntheticEvent);
    } else if (e && e.target) {
      // Event object passed
      newValue = e.target.value;
      cursorPosition = e.target.selectionStart || newValue.length;
      onChange(e);
    } else {
      console.warn('MentionAutocomplete: Unexpected input type:', typeof e, e);
      return;
    }

    // Find if cursor is after an @ symbol
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    
    if (mentionMatch) {
      const query = mentionMatch[1];
      const start = cursorPosition - mentionMatch[0].length;
      
      setMentionStart(start);
      setMentionQuery(query);
      setShowDropdown(true);
      
      // Update dropdown position
      setTimeout(() => {
        setDropdownPosition(calculateDropdownPosition());
      }, 0);
      
      // Always show dropdown immediately when @ is typed - improved UX
      if (query.length === 0) {
        setShowDropdown(true);
        getPopularMentions();
      } else {
        setShowDropdown(true); // Show dropdown while searching
        searchMentions(query);
      }
    } else {
      // Check for team mentions @team:
      const teamMentionMatch = textBeforeCursor.match(/@team:([a-zA-Z0-9_]*)$/);
      if (teamMentionMatch) {
        const query = teamMentionMatch[1];
        const start = cursorPosition - teamMentionMatch[0].length;
        
        setMentionStart(start);
        setMentionQuery(query);
        setShowDropdown(true);
        
        setTimeout(() => {
          setDropdownPosition(calculateDropdownPosition());
        }, 0);
        
        if (query.length === 0) {
          setShowDropdown(true);
          getPopularMentions();
        } else {
          setShowDropdown(true);
          searchMentions(query, 'team');
        }
      } else {
        // Check for player mentions @player:
        const playerMentionMatch = textBeforeCursor.match(/@player:([a-zA-Z0-9_]*)$/);
        if (playerMentionMatch) {
          const query = playerMentionMatch[1];
          const start = cursorPosition - playerMentionMatch[0].length;
          
          setMentionStart(start);
          setMentionQuery(query);
          setShowDropdown(true);
          
          setTimeout(() => {
            setDropdownPosition(calculateDropdownPosition());
          }, 0);
          
          if (query.length === 0) {
            setShowDropdown(true);
            getPopularMentions();
          } else {
            setShowDropdown(true);
            searchMentions(query, 'player');
          }
        } else {
          // Only hide dropdown if we're not in a mention context
          setShowDropdown(false);
          setMentionResults([]);
          setMentionStart(-1);
          setMentionQuery('');
        }
      }
    }
  };

  // Handle mention selection
  const selectMention = (mention) => {
    if (mentionStart === -1) return;

    const currentValue = textareaRef.current.value;
    const beforeMention = currentValue.substring(0, mentionStart);
    const afterCursor = currentValue.substring(textareaRef.current.selectionStart);
    
    // Safely extract mention text to prevent [object Object] display
    const safeMentionText = (() => {
      if (typeof mention.mention_text === 'string') return mention.mention_text;
      
      // Fallback mention text generation
      const type = mention.type || 'user';
      const name = mention.display_name || mention.name || mention.username || 'unknown';
      
      if (type === 'team') {
        return `@team:${name}`;
      } else if (type === 'player') {
        return `@player:${name}`;
      } else {
        return `@${name}`;
      }
    })();
    
    const newValue = beforeMention + safeMentionText + ' ' + afterCursor;
    const newCursorPosition = beforeMention.length + safeMentionText.length + 1;
    
    // Create a synthetic event
    const syntheticEvent = {
      target: {
        value: newValue,
        selectionStart: newCursorPosition,
        selectionEnd: newCursorPosition
      }
    };
    
    onChange(syntheticEvent);
    
    // Set cursor position
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
        textareaRef.current.focus();
      }
    }, 0);
    
    setShowDropdown(false);
    setMentionResults([]);
    setMentionStart(-1);
    
    if (onMentionSelect) {
      onMentionSelect(mention);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showDropdown || mentionResults.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % mentionResults.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev === 0 ? mentionResults.length - 1 : prev - 1);
        break;
      case 'Enter':
      case 'Tab':
        e.preventDefault();
        if (mentionResults[selectedIndex]) {
          selectMention(mentionResults[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setMentionResults([]);
        break;
    }
  };

  // Close dropdown when clicking outside and cleanup
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          textareaRef.current && !textareaRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      // Cancel any pending requests on unmount
      if (activeRequestRef.current) {
        activeRequestRef.current.cancel?.();
      }
    };
  }, []);
  
  // Cleanup cache periodically
  useEffect(() => {
    const cleanupCache = () => {
      const now = Date.now();
      for (const [key, value] of mentionCache.entries()) {
        if (now - value.timestamp > CACHE_DURATION) {
          mentionCache.delete(key);
        }
      }
    };
    
    const interval = setInterval(cleanupCache, CACHE_DURATION);
    return () => clearInterval(interval);
  }, []);

  // Get icon for mention type
  const getMentionIcon = (type) => {
    switch (type) {
      case 'user':
        return (
          <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-medium">
            U
          </div>
        );
      case 'team':
        return (
          <div className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xs font-medium">
            T
          </div>
        );
      case 'player':
        return (
          <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
            P
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value || ''}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${className}`}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        style={{ fontSize: '16px' }} // Prevents iOS zoom on focus
        autoComplete="off"
        spellCheck="true"
        {...props}
      />

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl max-h-64 overflow-y-auto min-w-64 backdrop-blur-sm"
          style={{
            top: dropdownPosition.top,
            left: dropdownPosition.left
          }}
        >
          {loading ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400">
              <div className="animate-spin w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full mx-auto"></div>
              <span className="text-sm mt-1 block">Searching...</span>
            </div>
          ) : mentionResults.length > 0 ? (
            <>
              <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                {mentionQuery.length === 0 ? 'Popular mentions' : `Results for "@${mentionQuery}"`}
              </div>
              {mentionResults.map((mention, index) => (
                <div
                  key={`${mention.type}-${mention.id}`}
                  className={`px-3 py-2 cursor-pointer flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    index === selectedIndex ? 'bg-red-50 dark:bg-red-900/20' : ''
                  }`}
                  onClick={() => selectMention(mention)}
                >
                  {mention.avatar ? (
                    <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <LazyImage 
                        src={mention.avatar}
                        alt={mention.display_name}
                        fallbackType="player-avatar"
                        className="w-full h-full object-cover"
                        eager={true}
                      />
                    </div>
                  ) : (
                    getMentionIcon(mention.type)
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {typeof mention.display_name === 'string' ? mention.display_name : 
                       (mention.display_name?.name || mention.name || mention.username || 'Unknown')}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {typeof mention.subtitle === 'string' ? mention.subtitle :
                       (mention.subtitle?.name || '')}
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                    {typeof mention.mention_text === 'string' ? mention.mention_text :
                     `@${mention.display_name || mention.name || mention.username || 'unknown'}`}
                  </div>
                </div>
              ))}
            </>
          ) : mentionQuery.length > 0 ? (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
              No results found for "@{mentionQuery}"
              <div className="text-xs mt-1 text-gray-400">
                Try typing @ again or use @team: or @player:
              </div>
            </div>
          ) : (
            <div className="p-3 text-center text-gray-500 dark:text-gray-400 text-sm">
              <div className="text-xs text-gray-400">
                Type @ to mention users, @team: for teams, @player: for players
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MentionAutocomplete;