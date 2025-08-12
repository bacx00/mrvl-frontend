import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Bold, Italic, Link, Image, Smile, AtSign, Hash, 
  Send, Camera, Mic, Paperclip, X, ChevronUp, 
  ChevronDown, Quote, List, Type, Eye, EyeOff
} from 'lucide-react';

const MobileTextEditor = ({
  value = '',
  onChange,
  onSubmit,
  placeholder = 'What\'s on your mind?',
  maxLength = 10000,
  autoFocus = false,
  mentions = [],
  onMentionSearch,
  hashtags = [],
  onHashtagSearch,
  attachments = [],
  onAttachmentAdd,
  onAttachmentRemove,
  showAttachments = true,
  showMentions = true,
  showHashtags = true,
  isSubmitting = false,
  submitButtonText = 'Post',
  minHeight = 120,
  maxHeight = 400,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 0, visible: false });
  const [selectionRange, setSelectionRange] = useState({ start: 0, end: 0 });
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [showHashtagDropdown, setShowHashtagDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [hashtagQuery, setHashtagQuery] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef(null);
  const toolbarRef = useRef(null);
  const mentionDropdownRef = useRef(null);
  const hashtagDropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  }, [minHeight, maxHeight]);

  useEffect(() => {
    adjustHeight();
  }, [value, adjustHeight]);

  // Handle text selection for floating toolbar
  const handleSelectionChange = useCallback(() => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    
    setSelectionRange({ start, end });

    if (start !== end && isExpanded) {
      // Calculate position for floating toolbar
      const rect = textareaRef.current.getBoundingClientRect();
      setToolbarPosition({
        top: rect.top - 50,
        visible: true
      });
      setShowToolbar(true);
    } else {
      setShowToolbar(false);
    }
  }, [isExpanded]);

  // Handle input change with mention/hashtag detection
  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    onChange(newValue);

    // Check for mentions (@)
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    
    if (mentionMatch && showMentions) {
      setMentionQuery(mentionMatch[1]);
      setShowMentionDropdown(true);
      setShowHashtagDropdown(false);
      if (onMentionSearch) {
        onMentionSearch(mentionMatch[1]);
      }
    } else {
      setShowMentionDropdown(false);
    }

    // Check for hashtags (#)
    const hashtagMatch = textBeforeCursor.match(/#(\w*)$/);
    
    if (hashtagMatch && showHashtags) {
      setHashtagQuery(hashtagMatch[1]);
      setShowHashtagDropdown(true);
      setShowMentionDropdown(false);
      if (onHashtagSearch) {
        onHashtagSearch(hashtagMatch[1]);
      }
    } else {
      setShowHashtagDropdown(false);
    }

    if (!mentionMatch && !hashtagMatch) {
      setShowMentionDropdown(false);
      setShowHashtagDropdown(false);
    }
  }, [onChange, showMentions, showHashtags, onMentionSearch, onHashtagSearch]);

  // Insert text at cursor position
  const insertText = useCallback((text, selectInserted = false) => {
    if (!textareaRef.current) return;

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newValue = value.slice(0, start) + text + value.slice(end);
    
    onChange(newValue);
    
    // Set cursor position after insertion
    setTimeout(() => {
      if (textareaRef.current) {
        const newPosition = selectInserted ? start : start + text.length;
        textareaRef.current.setSelectionRange(newPosition, selectInserted ? start + text.length : newPosition);
        textareaRef.current.focus();
      }
    }, 0);
  }, [value, onChange]);

  // Format text (bold, italic, etc.)
  const formatText = useCallback((format) => {
    if (!textareaRef.current) return;

    const start = selectionRange.start;
    const end = selectionRange.end;
    const selectedText = value.slice(start, end);
    
    let formattedText = '';
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText || 'bold text'}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText || 'italic text'}*`;
        break;
      case 'quote':
        formattedText = `> ${selectedText || 'quoted text'}`;
        break;
      case 'list':
        formattedText = `- ${selectedText || 'list item'}`;
        break;
      case 'link':
        formattedText = `[${selectedText || 'link text'}](url)`;
        break;
      default:
        formattedText = selectedText;
    }

    const newValue = value.slice(0, start) + formattedText + value.slice(end);
    onChange(newValue);

    // Focus and select the formatted text
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(start, start + formattedText.length);
      }
    }, 0);

    setShowToolbar(false);
  }, [value, selectionRange, onChange]);

  // Handle mention/hashtag selection
  const handleMentionSelect = useCallback((mention) => {
    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);
    if (mentionMatch) {
      const newTextBefore = textBeforeCursor.replace(/@(\w*)$/, `@${mention.username} `);
      const newValue = newTextBefore + textAfterCursor;
      onChange(newValue);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newTextBefore.length, newTextBefore.length);
          textareaRef.current.focus();
        }
      }, 0);
    }
    
    setShowMentionDropdown(false);
  }, [value, onChange]);

  const handleHashtagSelect = useCallback((hashtag) => {
    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    
    const hashtagMatch = textBeforeCursor.match(/#(\w*)$/);
    if (hashtagMatch) {
      const newTextBefore = textBeforeCursor.replace(/#(\w*)$/, `#${hashtag.name} `);
      const newValue = newTextBefore + textAfterCursor;
      onChange(newValue);
      
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(newTextBefore.length, newTextBefore.length);
          textareaRef.current.focus();
        }
      }, 0);
    }
    
    setShowHashtagDropdown(false);
  }, [value, onChange]);

  // File handling
  const handleFileSelect = useCallback((files) => {
    if (onAttachmentAdd) {
      Array.from(files).forEach(file => {
        onAttachmentAdd(file);
      });
    }
  }, [onAttachmentAdd]);

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  }, [handleFileSelect]);

  // Emoji data (simplified for demo)
  const emojiGroups = {
    smileys: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊'],
    gestures: ['👍', '👎', '👏', '🙌', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉'],
    hearts: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕']
  };

  const handleEmojiSelect = useCallback((emoji) => {
    insertText(emoji);
    setShowEmojiPicker(false);
  }, [insertText]);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onSubmit();
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
      setShowToolbar(false);
      setShowMentionDropdown(false);
      setShowHashtagDropdown(false);
      setShowEmojiPicker(false);
    } else if (e.key === 'Tab' && isExpanded) {
      e.preventDefault();
      insertText('  '); // Insert 2 spaces for indentation
    }
  }, [onSubmit, insertText, isExpanded]);

  // Focus handling
  const handleFocus = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const handleBlur = useCallback((e) => {
    // Don't collapse if clicking on toolbar or dropdowns
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && (
      toolbarRef.current?.contains(relatedTarget) ||
      mentionDropdownRef.current?.contains(relatedTarget) ||
      hashtagDropdownRef.current?.contains(relatedTarget)
    )) {
      return;
    }
    
    setTimeout(() => {
      if (!value.trim()) {
        setIsExpanded(false);
      }
    }, 200);
  }, [value]);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  return (
    <div className={`mobile-text-editor relative ${className}`}>
      {/* Drag and Drop Overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500/20 border-2 border-dashed border-blue-500 rounded-lg flex items-center justify-center z-10">
          <div className="text-blue-600 font-medium">Drop files here</div>
        </div>
      )}

      {/* Main Editor Container */}
      <div 
        className={`bg-white dark:bg-gray-800 rounded-xl border-2 transition-all duration-300 ${
          isExpanded 
            ? 'border-red-500 shadow-lg' 
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Textarea */}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            onSelect={handleSelectionChange}
            placeholder={placeholder}
            className={`w-full p-4 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none border-none outline-none mobile-input-no-zoom ${
              isExpanded ? 'min-h-[120px]' : 'min-h-[60px]'
            }`}
            style={{ minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }}
            maxLength={maxLength}
          />
          
          {/* Character Counter */}
          {isExpanded && (
            <div className="absolute bottom-2 right-2 text-xs text-gray-400">
              {value.length}/{maxLength}
            </div>
          )}
        </div>

        {/* Attachments Preview */}
        {attachments && attachments.length > 0 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <div key={index} className="relative">
                  {attachment.type?.startsWith('image/') ? (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                      <img 
                        src={URL.createObjectURL(attachment)} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Paperclip className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                  <button
                    onClick={() => onAttachmentRemove(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Toolbar */}
        {isExpanded && (
          <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              {/* File Upload */}
              {showAttachments && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 touch-optimized"
                    title="Attach file"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 touch-optimized"
                    title="Take photo"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Emoji Picker */}
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 touch-optimized"
                title="Add emoji"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Preview Toggle */}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 touch-optimized"
                title={showPreview ? 'Hide preview' : 'Show preview'}
              >
                {showPreview ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* Submit Button */}
            <button
              onClick={onSubmit}
              disabled={!value.trim() || isSubmitting}
              className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 touch-optimized ${
                value.trim() && !isSubmitting
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                submitButtonText
              )}
            </button>
          </div>
        )}
      </div>

      {/* Floating Selection Toolbar */}
      {showToolbar && toolbarPosition.visible && (
        <div 
          ref={toolbarRef}
          className="fixed z-50 bg-gray-900 text-white px-3 py-2 rounded-lg shadow-xl flex items-center space-x-2"
          style={{ top: `${toolbarPosition.top}px`, left: '50%', transform: 'translateX(-50%)' }}
        >
          <button
            onClick={() => formatText('bold')}
            className="px-2 py-1 rounded hover:bg-gray-700 touch-optimized"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => formatText('italic')}
            className="px-2 py-1 rounded hover:bg-gray-700 touch-optimized"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => formatText('quote')}
            className="px-2 py-1 rounded hover:bg-gray-700 touch-optimized"
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            onClick={() => formatText('link')}
            className="px-2 py-1 rounded hover:bg-gray-700 touch-optimized"
            title="Link"
          >
            <Link className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Mention Dropdown */}
      {showMentionDropdown && mentions.length > 0 && (
        <div 
          ref={mentionDropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
        >
          {mentions.filter(mention => 
            mention.username.toLowerCase().includes(mentionQuery.toLowerCase())
          ).slice(0, 5).map(mention => (
            <button
              key={mention.id}
              onClick={() => handleMentionSelect(mention)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-3 touch-optimized"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-medium">
                {mention.avatar ? (
                  <img src={mention.avatar} alt={mention.username} className="w-full h-full rounded-full object-cover" />
                ) : (
                  mention.username[0].toUpperCase()
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900 dark:text-white">{mention.username}</div>
                {mention.displayName && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">{mention.displayName}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Hashtag Dropdown */}
      {showHashtagDropdown && hashtags.length > 0 && (
        <div 
          ref={hashtagDropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto"
        >
          {hashtags.filter(hashtag => 
            hashtag.name.toLowerCase().includes(hashtagQuery.toLowerCase())
          ).slice(0, 5).map(hashtag => (
            <button
              key={hashtag.id}
              onClick={() => handleHashtagSelect(hashtag)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between touch-optimized"
            >
              <div className="flex items-center space-x-2">
                <Hash className="w-4 h-4 text-blue-500" />
                <span className="font-medium text-gray-900 dark:text-white">{hashtag.name}</span>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">{hashtag.count} posts</span>
            </button>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-80 overflow-y-auto">
          <div className="p-3">
            {Object.entries(emojiGroups).map(([category, emojis]) => (
              <div key={category} className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 capitalize">
                  {category}
                </h3>
                <div className="grid grid-cols-6 gap-2">
                  {emojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="p-2 text-lg hover:bg-gray-100 dark:hover:bg-gray-700 rounded touch-optimized"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preview Panel */}
      {showPreview && value && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Preview:</div>
          <div className="prose dark:prose-invert max-w-none text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
            {value}
          </div>
        </div>
      )}

      {/* File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="*/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />

      <style jsx>{`
        .mobile-input-no-zoom {
          font-size: 16px !important;
          transform: translateZ(0);
        }

        .touch-optimized {
          min-height: 44px;
          min-width: 44px;
          -webkit-tap-highlight-color: rgba(239, 68, 68, 0.1);
          tap-highlight-color: rgba(239, 68, 68, 0.1);
        }

        .mobile-text-editor {
          width: 100%;
        }

        .prose pre {
          overflow-x: auto;
          background: #1f2937;
          border-radius: 8px;
          padding: 1rem;
        }

        .prose code {
          background: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 4px;
          font-size: 0.875em;
        }

        .dark .prose code {
          background: #374151;
        }
      `}</style>
    </div>
  );
};

export default MobileTextEditor;