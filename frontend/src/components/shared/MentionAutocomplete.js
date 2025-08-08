import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../hooks';
import { getImageUrl } from '../../utils/imageUtils';

// Debounce utility function
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

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
  const { api } = useAuth();

  // Debounced search function
  const searchMentions = useCallback(
    debounce(async (query, type = 'all') => {
      if (query.length < 1) {
        setMentionResults([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/public/mentions/search?q=${encodeURIComponent(query)}&type=${type}&limit=10`);
        
        if (response.data.success) {
          setMentionResults(response.data.data || []);
          setSelectedIndex(0);
        }
      } catch (error) {
        console.error('Error searching mentions:', error);
        setMentionResults([]);
      } finally {
        setLoading(false);
      }
    }, 300),
    [api]
  );

  // Get popular mentions when dropdown opens without query
  const getPopularMentions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/mentions/popular?limit=8');
      
      if (response.data.success) {
        setMentionResults(response.data.data || []);
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error('Error fetching popular mentions:', error);
      setMentionResults([]);
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
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    onChange(e);

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
      
      // Always show dropdown immediately when @ is typed
      if (query.length === 0) {
        getPopularMentions();
      } else {
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
          getPopularMentions();
        } else {
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
            getPopularMentions();
          } else {
            searchMentions(query, 'player');
          }
        } else {
          setShowDropdown(false);
          setMentionResults([]);
          setMentionStart(-1);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          textareaRef.current && !textareaRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent dark:bg-gray-700 dark:text-white ${className}`}
        rows={rows}
        disabled={disabled}
        maxLength={maxLength}
        {...props}
      />

      {/* Autocomplete Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="fixed z-50 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto min-w-64"
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
              {mentionQuery.length === 0 && (
                <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                  Popular mentions
                </div>
              )}
              {mentionResults.map((mention, index) => (
                <div
                  key={`${mention.type}-${mention.id}`}
                  className={`px-3 py-2 cursor-pointer flex items-center space-x-3 hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    index === selectedIndex ? 'bg-red-50 dark:bg-red-900/20' : ''
                  }`}
                  onClick={() => selectMention(mention)}
                >
                  {mention.avatar ? (
                    <img 
                      src={mention.avatar} 
                      alt={mention.display_name}
                      className="w-6 h-6 rounded-full object-cover"
                      onError={(e) => { e.target.src = getImageUrl(null, 'player-avatar'); }}
                    />
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
              No results found for "{mentionQuery}"
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default MentionAutocomplete;