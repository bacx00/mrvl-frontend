import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './index';

export const useMentionAutocomplete = (onMentionSelect) => {
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
        const response = await api.get(`/public/mentions/search?q=${encodeURIComponent(query)}&type=${type}&limit=8`);
        
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

  // Get popular mentions
  const getPopularMentions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/public/mentions/popular?limit=6');
      
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

  // Calculate dropdown position
  const calculateDropdownPosition = () => {
    if (!textareaRef.current) return { top: 0, left: 0 };

    const textarea = textareaRef.current;
    const rect = textarea.getBoundingClientRect();
    
    // Position below the input/textarea with proper offset
    // Account for fixed positioning
    return {
      top: rect.bottom + 5, // Use direct positioning since dropdown is fixed
      left: rect.left
    };
  };

  // Handle input changes
  const handleInputChange = (e, originalOnChange) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Call original onChange
    if (originalOnChange) {
      originalOnChange(e);
    }

    // Find mention patterns
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    
    // Check for @mention
    const mentionMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/);
    if (mentionMatch) {
      const query = mentionMatch[1];
      const start = cursorPosition - mentionMatch[0].length;
      
      console.log('Mention detected:', { query, start }); // Debug log
      
      setMentionStart(start);
      setMentionQuery(query);
      setShowDropdown(true);
      
      setTimeout(() => {
        const pos = calculateDropdownPosition();
        console.log('Dropdown position:', pos); // Debug log
        setDropdownPosition(pos);
      }, 0);
      
      if (query.length === 0) {
        getPopularMentions();
      } else {
        searchMentions(query);
      }
      return;
    }

    // Check for @team:mention
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
      
      searchMentions(query, 'team');
      return;
    }

    // Check for @player:mention
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
      
      searchMentions(query, 'player');
      return;
    }

    // No mention found, hide dropdown
    setShowDropdown(false);
    setMentionResults([]);
    setMentionStart(-1);
  };

  // Select mention
  const selectMention = (mention, setValue, value) => {
    if (mentionStart === -1 || !textareaRef.current) return;

    const beforeMention = value.substring(0, mentionStart);
    const afterCursor = value.substring(textareaRef.current.selectionStart);
    
    const newValue = beforeMention + mention.mention_text + ' ' + afterCursor;
    const newCursorPosition = beforeMention.length + mention.mention_text.length + 1;
    
    setValue(newValue);
    
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
  const handleKeyDown = (e, originalOnKeyDown) => {
    // Call original keydown handler first
    if (originalOnKeyDown) {
      originalOnKeyDown(e);
    }

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
        if (showDropdown && mentionResults[selectedIndex]) {
          e.preventDefault();
          // This needs to be handled by the component using the hook
          return { selectMention: mentionResults[selectedIndex] };
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setMentionResults([]);
        break;
    }

    return null;
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

  return {
    // Refs
    textareaRef,
    dropdownRef,
    
    // State
    showDropdown,
    mentionResults,
    selectedIndex,
    loading,
    dropdownPosition,
    
    // Functions
    handleInputChange,
    handleKeyDown,
    selectMention,
    
    // Setters (for manual control)
    setShowDropdown,
    setSelectedIndex
  };
};

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