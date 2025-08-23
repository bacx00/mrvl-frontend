import React, { useRef, useEffect } from 'react';
import { useMentionAutocomplete } from '../../hooks/useMentionAutocomplete';
import MentionDropdown from './MentionDropdown';

const MentionTextarea = ({
  value,
  onChange,
  placeholder = "Type @ to mention users, teams, or players...",
  className = "",
  rows = 4,
  name,
  id,
  disabled = false,
  autoFocus = false,
  onKeyDown,
  maxLength,
  style = {}
}) => {
  const textareaRef = useRef(null);
  
  const {
    showDropdown,
    mentionResults,
    selectedIndex,
    mentionQuery,
    loading,
    dropdownPosition,
    dropdownRef,
    handleInputChange,
    handleKeyDown,
    selectMention,
    setTextareaRef
  } = useMentionAutocomplete();

  useEffect(() => {
    if (textareaRef.current) {
      setTextareaRef(textareaRef);
    }
  }, [setTextareaRef]);

  const handleChange = (e) => {
    // Process mention detection
    handleInputChange(e, onChange);
  };

  const handleKeyPress = (e) => {
    // Handle dropdown navigation
    if (showDropdown) {
      const handled = handleKeyDown(e);
      if (handled) {
        e.preventDefault();
        return;
      }
    }
    
    // Call original onKeyDown if provided
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  const handleMentionSelect = (mention) => {
    if (!textareaRef.current) return;
    
    const textarea = textareaRef.current;
    const currentValue = textarea.value;
    const selectionStart = textarea.selectionStart;
    
    // Find the @ symbol position
    const beforeCursor = currentValue.substring(0, selectionStart);
    const atIndex = beforeCursor.lastIndexOf('@');
    
    if (atIndex !== -1) {
      // Build the mention text based on type
      let mentionText = '';
      if (mention.type === 'user') {
        mentionText = `@${mention.username}`;
      } else if (mention.type === 'team') {
        mentionText = `@team:${mention.slug || mention.username}`;
      } else if (mention.type === 'player') {
        mentionText = `@player:${mention.username}`;
      }
      
      // Replace the partial mention with the complete one
      const newValue = 
        currentValue.substring(0, atIndex) + 
        mentionText + ' ' +
        currentValue.substring(selectionStart);
      
      // Update the value
      const event = {
        target: {
          name: name,
          value: newValue
        }
      };
      onChange(event);
      
      // Set cursor position after the mention
      setTimeout(() => {
        const newPosition = atIndex + mentionText.length + 1;
        textarea.setSelectionRange(newPosition, newPosition);
        textarea.focus();
      }, 0);
    }
    
    selectMention(mention);
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        id={id}
        name={name}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        className={`w-full px-3 py-2 bg-[#1a2332] border border-[#2a3441] rounded-lg text-white placeholder-[#768894] focus:outline-none focus:border-[#fa4454] transition-colors resize-none ${className}`}
        rows={rows}
        disabled={disabled}
        autoFocus={autoFocus}
        maxLength={maxLength}
        style={style}
      />
      
      <MentionDropdown
        show={showDropdown}
        results={mentionResults}
        selectedIndex={selectedIndex}
        loading={loading}
        position={dropdownPosition}
        onSelect={handleMentionSelect}
        query={mentionQuery}
        dropdownRef={dropdownRef}
      />
    </div>
  );
};

export default MentionTextarea;