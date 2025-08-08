// src/components/SimpleTextEditor.tsx
'use client';

import React from 'react';
import { useMentionAutocomplete } from '../../hooks/useMentionAutocomplete';
import MentionDropdown from '../../components/shared/MentionDropdown';

interface SimpleTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  loading?: boolean;
  rows?: number;
  className?: string;
}

const SimpleTextEditor: React.FC<SimpleTextEditorProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Type @ to mention users, teams, or players...",
  loading = false,
  rows = 3,
  className = ''
}) => {
  const {
    textareaRef,
    dropdownRef,
    showDropdown,
    mentionResults,
    selectedIndex,
    loading: mentionLoading,
    dropdownPosition,
    handleInputChange,
    handleKeyDown,
    selectMention
  } = useMentionAutocomplete();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    handleInputChange(e, null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const result = handleKeyDown(e, null);
    if (result?.selectMention) {
      selectMention(result.selectMention, onChange, value);
    }
    
    // Submit on Ctrl+Enter
    if (e.key === 'Enter' && e.ctrlKey && onSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        placeholder={placeholder}
        rows={rows}
        disabled={loading}
        className={`w-full p-3 bg-[#0f1419] border border-[#2b3d4d] rounded-lg text-white placeholder-[#768894] focus:border-[#fa4454] focus:outline-none resize-none ${
          loading ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
      />
      
      <MentionDropdown
        show={showDropdown}
        results={mentionResults}
        selectedIndex={selectedIndex}
        loading={mentionLoading}
        position={dropdownPosition}
        onSelect={(mention) => selectMention(mention, onChange, value)}
        dropdownRef={dropdownRef}
      />
      
      {onSubmit && (
        <div className="text-xs text-[#768894] mt-1">
          Press Ctrl+Enter to submit
        </div>
      )}
    </div>
  );
};

export default SimpleTextEditor;