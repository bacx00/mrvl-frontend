import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../hooks';

function ForumMentionAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Write your message...",
  className = "",
  rows = 4,
  maxLength = 10000,
  disabled = false
}) {
  const { api } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [mentionResults, setMentionResults] = useState([]);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionType, setMentionType] = useState('user'); // 'user', 'team', 'player'
  const [mentionStart, setMentionStart] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef(null);
  const dropdownRef = useRef(null);

  // Search for mentions when query changes
  useEffect(() => {
    if (mentionQuery.length >= 1) {
      searchMentions(mentionQuery, mentionType);
    } else {
      setMentionResults([]);
      setShowDropdown(false);
    }
  }, [mentionQuery, mentionType]);

  const searchMentions = async (query, type) => {
    const safeQuery = typeof query === 'string' ? query : '';
    if (!safeQuery.trim()) return;
    
    setLoading(true);
    try {
      let endpoint = '';
      if (type === 'user') {
        endpoint = `/public/search/users?q=${encodeURIComponent(query)}&limit=10`;
      } else if (type === 'team') {
        endpoint = `/public/search/teams?q=${encodeURIComponent(query)}&limit=10`;
      } else if (type === 'player') {
        endpoint = `/public/search/players?q=${encodeURIComponent(query)}&limit=10`;
      }

      const response = await api.get(endpoint);
      const results = response.data?.data || [];
      
      setMentionResults(results);
      setShowDropdown(results.length > 0);
      setSelectedIndex(0);
    } catch (error) {
      console.error('Error searching mentions:', error);
      setMentionResults([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTextChange = (e) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Call onChange with the actual string value to prevent [object Object] issues
    if (typeof onChange === 'function') {
      // Create a synthetic event that matches the expected format
      const syntheticEvent = {
        target: {
          value: newValue
        }
      };
      onChange(syntheticEvent);
    }
    
    // Check for mention triggers
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(team:|player:)?(\w*)$/);
    
    if (mentionMatch) {
      const [fullMatch, prefix, query] = mentionMatch;
      const type = prefix === 'team:' ? 'team' : prefix === 'player:' ? 'player' : 'user';
      
      setMentionStart(cursorPosition - fullMatch.length);
      setMentionQuery(query);
      setMentionType(type);
      
      if (query.length >= 1) {
        setShowDropdown(true);
      }
    } else {
      setShowDropdown(false);
      setMentionQuery('');
    }
  };

  const handleKeyDown = (e) => {
    if (showDropdown && mentionResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % mentionResults.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + mentionResults.length) % mentionResults.length);
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectMention(mentionResults[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowDropdown(false);
      }
    }
  };

  const selectMention = (mention) => {
    if (!mention) return;

    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeMention = value.substring(0, mentionStart);
    const textAfterCursor = value.substring(cursorPosition);
    
    // Use mention_text from backend response, or generate fallback
    let mentionText = '';
    if (typeof mention.mention_text === 'string' && mention.mention_text) {
      mentionText = mention.mention_text;
    } else {
      // Fallback mention text generation
      const displayName = getMentionDisplayName(mention);
      if (mention.type === 'user') {
        mentionText = `@${displayName}`;
      } else if (mention.type === 'team') {
        mentionText = `@team:${displayName}`;
      } else if (mention.type === 'player') {
        mentionText = `@player:${displayName}`;
      } else {
        mentionText = `@${displayName}`;
      }
    }
    
    const newValue = textBeforeMention + mentionText + ' ' + textAfterCursor;
    
    // Call onChange with the new string value to prevent [object Object] issues
    if (typeof onChange === 'function') {
      // Create a synthetic event that matches the expected format
      const syntheticEvent = {
        target: {
          value: newValue
        }
      };
      onChange(syntheticEvent);
    }
    
    // Set cursor position after the mention
    const newCursorPosition = mentionStart + mentionText.length + 1;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition);
      }
    }, 0);
    
    setShowDropdown(false);
    setMentionQuery('');
  };

  const getMentionDisplayName = (mention) => {
    // Safe string extraction to prevent [object Object] display
    const safeString = (value) => {
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && value !== null) {
        // Handle objects that might contain the actual string
        if (value.name && typeof value.name === 'string') return value.name;
        if (value.username && typeof value.username === 'string') return value.username;
        if (value.display_name && typeof value.display_name === 'string') return value.display_name;
        return '';
      }
      return value ? String(value) : '';
    };

    // Backend returns display_name, so use that first
    const displayName = safeString(mention.display_name);
    if (displayName) return displayName;

    // Fallback to mention type-specific fields
    if (mention.type === 'user') {
      return safeString(mention.name) || safeString(mention.username) || '';
    } else if (mention.type === 'team') {
      return safeString(mention.name) || safeString(mention.short_name) || '';
    } else if (mention.type === 'player') {
      return safeString(mention.real_name) || safeString(mention.username) || safeString(mention.name) || '';
    }
    return safeString(mention.name) || safeString(mention.username) || 'Unknown';
  };

  const getMentionSubtext = (mention) => {
    // Safe string extraction for subtext
    const safeString = (value) => {
      if (typeof value === 'string') return value;
      if (typeof value === 'object' && value !== null) {
        if (value.name && typeof value.name === 'string') return value.name;
        return '';
      }
      return value ? String(value) : '';
    };

    if (mentionType === 'user') {
      const role = safeString(mention.role);
      return role ? `Role: ${role}` : '';
    } else if (mentionType === 'team') {
      const region = safeString(mention.region);
      return region ? `Region: ${region}` : '';
    } else if (mentionType === 'player') {
      const team = safeString(mention.current_team);
      return team ? `Team: ${team}` : '';
    }
    return '';
  };

  // Update dropdown position when shown
  useEffect(() => {
    if (showDropdown) {
      setDropdownPosition(getDropdownPosition());
    }
  }, [showDropdown]);

  // Close dropdown when clicking outside and handle position updates
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          textareaRef.current && !textareaRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    const updatePosition = () => {
      if (showDropdown) {
        setDropdownPosition(getDropdownPosition());
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', updatePosition);
    window.addEventListener('resize', updatePosition);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', updatePosition);
      window.removeEventListener('resize', updatePosition);
    };
  }, [showDropdown]);

  const getDropdownPosition = () => {
    if (!textareaRef.current) return { top: 0, left: 0, minWidth: 300, maxWidth: 400 };
    
    try {
      const textarea = textareaRef.current;
      const rect = textarea.getBoundingClientRect();
      
      // Ensure the dropdown appears within the viewport
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const isMobile = viewportWidth < 768;
      
      if (isMobile) {
        // Mobile positioning - show at bottom of screen for better UX
        return {
          position: 'fixed',
          bottom: '80px',
          left: '1rem',
          right: '1rem',
          maxHeight: '200px',
          width: 'auto',
          minWidth: 'auto',
          maxWidth: 'none',
        };
      }
      
      let top = rect.bottom + 4;
      let left = rect.left;
      
      // Adjust if dropdown would go below viewport
      if (top + 240 > viewportHeight) { // 240px is max-h-60
        top = rect.top - 244; // Position above instead
      }
      
      // Adjust if dropdown would go beyond right edge
      const dropdownWidth = Math.max(rect.width, 300);
      if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth - 10;
      }
      
      return {
        top: Math.max(0, top),
        left: Math.max(0, left),
        minWidth: Math.max(rect.width, 300),
        maxWidth: 400,
      };
    } catch (error) {
      console.error('Error calculating dropdown position:', error);
      return { top: 0, left: 0, minWidth: 300, maxWidth: 400 };
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        rows={rows}
        maxLength={maxLength}
        disabled={disabled}
        autoComplete="off"
        spellCheck="false"
      />

      {/* Mention dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="fixed z-[9999] bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg shadow-2xl max-h-60 overflow-y-auto backdrop-blur-sm"
          style={dropdownPosition}
        >
          {loading ? (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              Searching...
            </div>
          ) : mentionResults && mentionResults.length > 0 ? (
            <div className="py-1">
              <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700">
                Search Results
              </div>
              {mentionResults.map((mention, index) => (
                <button
                  key={`${mention.type}-${mention.id}`}
                  onClick={() => selectMention(mention)}
                  className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-3 ${
                    index === selectedIndex ? 'bg-blue-100 dark:bg-blue-900/20' : ''
                  }`}
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {mention.avatar || mention.logo ? (
                      <img
                        src={mention.avatar || mention.logo}
                        alt={getMentionDisplayName(mention)}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs font-bold">
                        {getMentionDisplayName(mention).charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  
                  {/* Name and info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {getMentionDisplayName(mention)}
                    </div>
                    {mention.subtitle && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {mention.subtitle}
                      </div>
                    )}
                  </div>
                  
                  {/* Mention preview */}
                  <div className="flex-shrink-0 text-xs text-gray-400 dark:text-gray-500">
                    {mention.mention_text || `@${getMentionDisplayName(mention)}`}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
              No results found for "{mentionQuery}"
            </div>
          )}
          
          {/* Mention help */}
          <div className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 border-t border-gray-200 dark:border-gray-600">
            <div>@ for users, @team: for teams, @player: for players</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForumMentionAutocomplete;