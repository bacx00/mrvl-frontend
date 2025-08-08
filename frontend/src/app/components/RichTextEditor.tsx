// src/components/RichTextEditor.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (content: string) => void;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
  minHeight?: number;
  maxHeight?: number;
  showToolbar?: boolean;
  showPreview?: boolean;
  enableMarkdown?: boolean;
  enableMentions?: boolean;
  enableEmojis?: boolean;
  enableImages?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  className?: string;
  onImageUpload?: (file: File) => Promise<string>;
  onMention?: (query: string) => Promise<Array<{ id: string; username: string; avatar?: string }>>;
  onAutoSave?: (content: string) => void;
}

interface MentionUser {
  id: string;
  username: string;
  avatar?: string;
  role?: string;
}

interface EmojiPickerState {
  show: boolean;
  x: number;
  y: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Write your message...",
  loading = false,
  disabled = false,
  minHeight = 120,
  maxHeight = 400,
  showToolbar = true,
  showPreview = true,
  enableMarkdown = true,
  enableMentions = true,
  enableEmojis = true,
  enableImages = true,
  autoSave = true,
  autoSaveInterval = 30000,
  className = '',
  onImageUpload,
  onMention,
  onAutoSave
}) => {
  const { user } = useAuth();
  
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ x: 0, y: 0 });
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [emojiPicker, setEmojiPicker] = useState<EmojiPickerState>({ show: false, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave || !onAutoSave || !value.trim()) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      onAutoSave(value);
      setLastSaved(new Date());
    }, autoSaveInterval);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [value, autoSave, onAutoSave, autoSaveInterval]);

  // Handle mentions
  const handleMentionSearch = useCallback(async (query: string) => {
    if (!enableMentions || !onMention) return;

    try {
      const users = await onMention(query);
      setMentionUsers(users);
      setSelectedMentionIndex(0);
    } catch (error) {
      console.error('Error searching mentions:', error);
      setMentionUsers([]);
    }
  }, [enableMentions, onMention]);

  // Handle text change with mention detection
  const handleTextChange = (newValue: string) => {
    onChange(newValue);

    if (!enableMentions) return;

    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const query = mentionMatch[1];
      setMentionQuery(query);
      setShowMentions(true);
      
      // Calculate mention dropdown position
      const rect = textarea.getBoundingClientRect();
      const lines = textBeforeCursor.split('\n');
      const currentLine = lines.length - 1;
      const lineHeight = 20; // Approximate line height
      
      setMentionPosition({
        x: rect.left + (mentionMatch[0].length * 8), // Approximate character width
        y: rect.top + (currentLine * lineHeight) + 40
      });

      if (query.length >= 1) {
        handleMentionSearch(query);
      }
    } else {
      setShowMentions(false);
      setMentionUsers([]);
    }
  };

  // Insert mention
  const insertMention = (user: MentionUser) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    
    const mentionStart = textBeforeCursor.lastIndexOf('@');
    const newText = textBeforeCursor.substring(0, mentionStart) + `@${user.username} ` + textAfterCursor;
    
    onChange(newText);
    setShowMentions(false);
    
    // Focus back to textarea
    setTimeout(() => {
      textarea.focus();
      const newCursorPosition = mentionStart + user.username.length + 2;
      textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    }, 0);
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle mention navigation
    if (showMentions && mentionUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => (prev + 1) % mentionUsers.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => (prev - 1 + mentionUsers.length) % mentionUsers.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        insertMention(mentionUsers[selectedMentionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }

    // Other keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (value.trim() && !loading) {
            onSubmit(value);
          }
          break;
        case 'b':
          e.preventDefault();
          insertFormatting('**', '**');
          break;
        case 'i':
          e.preventDefault();
          insertFormatting('*', '*');
          break;
        case 'k':
          e.preventDefault();
          insertFormatting('[', '](url)');
          break;
        case 's':
          e.preventDefault();
          if (onAutoSave) {
            onAutoSave(value);
            setLastSaved(new Date());
          }
          break;
      }
    }

    // Tab for indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      insertFormatting('  ', '');
    }
  };

  // Insert formatting
  const insertFormatting = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);
    onChange(newText);
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      const newStart = start + before.length;
      const newEnd = newStart + selectedText.length;
      textarea.setSelectionRange(newStart, newEnd);
    }, 0);
  };

  // Handle image upload
  const handleImageUpload = async (file: File) => {
    if (!onImageUpload) return;

    try {
      const imageUrl = await onImageUpload(file);
      const imageMarkdown = `![${file.name}](${imageUrl})`;
      insertFormatting(imageMarkdown, '');
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    imageFiles.forEach(handleImageUpload);
  };

  // Format preview content
  const formatPreview = (text: string): string => {
    if (!enableMarkdown) return text.replace(/\n/g, '<br />');

    return text
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code inline
      .replace(/`(.*?)`/g, '<code class="bg-[#2b3d4d] text-[#fa4454] px-1 py-0.5 rounded text-sm">$1</code>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-[#0f1419] border border-[#2b3d4d] p-3 rounded-lg overflow-x-auto"><code>$1</code></pre>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-[#fa4454] hover:text-[#e03e4e] underline" target="_blank" rel="noopener noreferrer">$1</a>')
      // Images
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-2" />')
      // Quotes
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-[#fa4454] pl-4 py-2 bg-[#2b3d4d]/30 italic">$1</blockquote>')
      // Mentions
      .replace(/@(\w+)/g, '<span class="text-[#fa4454] font-medium">@$1</span>')
      // Line breaks
      .replace(/\n/g, '<br />');
  };

  // Common emojis
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
    '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖', '👏',
    '🙌', '🤝', '🙏', '✊', '👊', '🤛', '🤜', '💪', '🦵', '🦶',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '💕', '💖', '💗', '💘', '💝', '💟', '❣️', '💌', '💤', '💢'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !loading) {
      onSubmit(value);
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div 
        ref={editorRef}
        className={`bg-[#1a2332] border border-[#2b3d4d] rounded-lg overflow-hidden transition-all duration-200 ${
          isFullscreen ? 'fixed inset-4 z-50' : ''
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${
          isDragging ? 'border-[#fa4454] bg-[#fa4454]/10' : ''
        }`}
        onDragOver={enableImages ? handleDragOver : undefined}
        onDragLeave={enableImages ? handleDragLeave : undefined}
        onDrop={enableImages ? handleDrop : undefined}
      >
        
        {/* Toolbar */}
        {showToolbar && (
          <div className="bg-[#0f1419] border-b border-[#2b3d4d] p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 flex-wrap">
              
              {/* Formatting Buttons */}
              {enableMarkdown && (
                <>
                  <button
                    type="button"
                    onClick={() => insertFormatting('**', '**')}
                    className="p-2 text-[#768894] hover:text-white hover:bg-[#2b3d4d] rounded transition-colors"
                    title="Bold (Ctrl+B)"
                    disabled={disabled}
                  >
                    <svg className="w-4 h-4 font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                    </svg>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertFormatting('*', '*')}
                    className="p-2 text-[#768894] hover:text-white hover:bg-[#2b3d4d] rounded transition-colors italic"
                    title="Italic (Ctrl+I)"
                    disabled={disabled}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4l4 16M6 8h12M4 16h12" />
                    </svg>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertFormatting('`', '`')}
                    className="p-2 text-[#768894] hover:text-white hover:bg-[#2b3d4d] rounded transition-colors font-mono text-sm"
                    title="Code"
                    disabled={disabled}
                  >
                    {'</>'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertFormatting('> ', '')}
                    className="p-2 text-[#768894] hover:text-white hover:bg-[#2b3d4d] rounded transition-colors"
                    title="Quote"
                    disabled={disabled}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => insertFormatting('[', '](url)')}
                    className="p-2 text-[#768894] hover:text-white hover:bg-[#2b3d4d] rounded transition-colors"
                    title="Link (Ctrl+K)"
                    disabled={disabled}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </button>
                  
                  <div className="w-px h-6 bg-[#2b3d4d]"></div>
                </>
              )}
              
              {/* Image Upload */}
              {enableImages && onImageUpload && (
                <>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-[#768894] hover:text-white hover:bg-[#2b3d4d] rounded transition-colors"
                    title="Upload Image"
                    disabled={disabled}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      files.forEach(handleImageUpload);
                      e.target.value = '';
                    }}
                  />
                </>
              )}
              
              {/* Emoji Picker */}
              {enableEmojis && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setEmojiPicker({
                        show: !emojiPicker.show,
                        x: rect.left,
                        y: rect.bottom + 5
                      });
                    }}
                    className="p-2 text-[#768894] hover:text-white hover:bg-[#2b3d4d] rounded transition-colors"
                    title="Insert Emoji"
                    disabled={disabled}
                  >
                    😊
                  </button>
                </div>
              )}
            </div>
            
            {/* Right Side Controls */}
            <div className="flex items-center space-x-2">
              
              {/* Auto-save Status */}
              {autoSave && lastSaved && (
                <span className="text-xs text-[#768894]">
                  Saved {formatTimeAgo(lastSaved)}
                </span>
              )}
              
              {/* Preview Toggle */}
              {showPreview && (
                <button
                  type="button"
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    isPreviewMode 
                      ? 'bg-[#fa4454] text-white' 
                      : 'bg-[#2b3d4d] hover:bg-[#374555] text-white'
                  }`}
                  disabled={disabled}
                >
                  {isPreviewMode ? 'Edit' : 'Preview'}
                </button>
              )}
              
              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 text-[#768894] hover:text-white hover:bg-[#2b3d4d] rounded transition-colors"
                title="Toggle Fullscreen"
                disabled={disabled}
              >
                {isFullscreen ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}
        
        {/* Content Area */}
        <div 
          className="relative"
          style={{ 
            minHeight: `${minHeight}px`,
            maxHeight: isFullscreen ? 'calc(100vh - 200px)' : `${maxHeight}px`
          }}
        >
          {isPreviewMode ? (
            <div 
              className="p-4 text-white leading-relaxed overflow-y-auto prose prose-invert max-w-none"
              style={{ 
                minHeight: `${minHeight}px`,
                maxHeight: isFullscreen ? 'calc(100vh - 200px)' : `${maxHeight}px`
              }}
              dangerouslySetInnerHTML={{ __html: formatPreview(value || '<em class="text-[#768894]">Nothing to preview</em>') }}
            />
          ) : (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => handleTextChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full h-full p-4 bg-transparent text-white placeholder-[#768894] border-none outline-none resize-none"
              style={{ 
                minHeight: `${minHeight}px`,
                maxHeight: isFullscreen ? 'calc(100vh - 200px)' : `${maxHeight}px`
              }}
              disabled={disabled || loading}
            />
          )}
          
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-[#fa4454]/20 border-2 border-dashed border-[#fa4454] flex items-center justify-center">
              <div className="text-center text-white">
                <svg className="w-12 h-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p>Drop images here to upload</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="bg-[#0f1419] border-t border-[#2b3d4d] p-3 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-xs text-[#768894]">
            {enableMarkdown && (
              <span>
                <kbd className="px-1 py-0.5 bg-[#2b3d4d] rounded text-xs">**bold**</kbd>{' '}
                <kbd className="px-1 py-0.5 bg-[#2b3d4d] rounded text-xs">*italic*</kbd>{' '}
                <kbd className="px-1 py-0.5 bg-[#2b3d4d] rounded text-xs">`code`</kbd>
              </span>
            )}
            {enableMentions && (
              <span>
                <kbd className="px-1 py-0.5 bg-[#2b3d4d] rounded text-xs">@username</kbd> to mention
              </span>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-xs text-[#768894]">
              {value.length} characters
            </span>
            
            <button
              onClick={handleSubmit}
              disabled={!value.trim() || loading || disabled}
              className="px-4 py-2 bg-[#fa4454] hover:bg-[#e03e4e] disabled:bg-[#2b3d4d] disabled:cursor-not-allowed text-white text-sm font-medium rounded transition-colors flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <span>Post</span>
                  <kbd className="px-1 py-0.5 bg-white/20 rounded text-xs">Ctrl+↵</kbd>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mention Dropdown */}
      {showMentions && mentionUsers.length > 0 && (
        <div 
          className="fixed bg-[#1a2332] border border-[#2b3d4d] rounded-lg shadow-xl max-h-48 overflow-y-auto z-50"
          style={{ 
            left: `${mentionPosition.x}px`,
            top: `${mentionPosition.y}px`,
            minWidth: '200px'
          }}
        >
          {mentionUsers.map((user, index) => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className={`w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-[#2b3d4d] transition-colors ${
                index === selectedMentionIndex ? 'bg-[#2b3d4d]' : ''
              }`}
            >
              {user.avatar ? (
                <div className="w-6 h-6 relative rounded overflow-hidden">
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-6 h-6 bg-[#fa4454] rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {user.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white">{user.username}</div>
                {user.role && (
                  <div className="text-xs text-[#768894]">{user.role}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
      
      {/* Emoji Picker */}
      {emojiPicker.show && (
        <div 
          className="fixed bg-[#1a2332] border border-[#2b3d4d] rounded-lg shadow-xl p-3 z-50"
          style={{ 
            left: `${emojiPicker.x}px`,
            top: `${emojiPicker.y}px`,
            width: '300px',
            maxHeight: '200px'
          }}
        >
          <div className="grid grid-cols-10 gap-1 overflow-y-auto max-h-40">
            {commonEmojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => {
                  insertFormatting(emoji, '');
                  setEmojiPicker({ show: false, x: 0, y: 0 });
                }}
                className="w-6 h-6 flex items-center justify-center hover:bg-[#2b3d4d] rounded text-sm transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
      
      {/* Click outside to close dropdowns */}
      {(showMentions || emojiPicker.show) && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowMentions(false);
            setEmojiPicker({ show: false, x: 0, y: 0 });
          }}
        />
      )}
    </div>
  );
};

// Helper function to format time ago (you can move this to utils)
const formatTimeAgo = (date: Date): string => {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default RichTextEditor;
