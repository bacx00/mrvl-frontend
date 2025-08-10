import React, { useState, useRef } from 'react';
import { useMentionAutocomplete } from '../../hooks/useMentionAutocomplete';
import MentionDropdown from '../shared/MentionDropdown';

function EnhancedTextEditor({
  value,
  onChange,
  placeholder = "Type  to mention users, teams, or players...",
  rows = 15,
  className = ''
}) {
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  
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

  const handleChange = (e) => {
    onChange(e.target.value);
    handleInputChange(e, null);
  };

  const handleKeyPress = (e) => {
    const result = handleKeyDown(e, null);
    if (result?.selectMention) {
      selectMention(result.selectMention, onChange, value);
    }
  };

  const insertVideo = () => {
    if (!videoUrl.trim()) return;
    
    let embedCode = '';
    
    // YouTube URL patterns
    const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      embedCode = `[youtube:${youtubeMatch[1]}]`;
    }
    
    // Twitch Clip URL pattern
    const twitchClipMatch = videoUrl.match(/clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/);
    if (twitchClipMatch) {
      embedCode = `[twitch-clip:${twitchClipMatch[1]}]`;
    }
    
    // Twitch Video URL pattern
    const twitchVideoMatch = videoUrl.match(/twitch\.tv\/videos\/([0-9]+)/);
    if (twitchVideoMatch) {
      embedCode = `[twitch-video:${twitchVideoMatch[1]}]`;
    }
    
    // Twitter/X URL pattern
    const tweetMatch = videoUrl.match(/(?:twitter\.com|x\.com)\/\w+\/status\/([0-9]+)/);
    if (tweetMatch) {
      embedCode = `[tweet:${tweetMatch[1]}]`;
    }
    
    if (embedCode) {
      // Insert at cursor position
      const newValue = value.slice(0, cursorPosition) + '\n\n' + embedCode + '\n\n' + value.slice(cursorPosition);
      onChange(newValue);
      setShowVideoModal(false);
      setVideoUrl('');
    } else {
      alert('Invalid video URL. Please use a YouTube, Twitch, or Twitter/X URL.');
    }
  };

  const handleTextareaClick = () => {
    if (textareaRef.current) {
      setCursorPosition(textareaRef.current.selectionStart);
    }
  };

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2 p-2 bg-[#1a2332] border border-[#2b3d4d] rounded-t-lg">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => {
              if (textareaRef.current) {
                setCursorPosition(textareaRef.current.selectionStart);
              }
              setShowVideoModal(true);
            }}
            className="px-3 py-1 text-sm bg-[#2b3d4d] text-white rounded hover:bg-[#374555] transition-colors flex items-center space-x-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>Embed Video</span>
          </button>
          
          <div className="text-xs text-[#768894]">
            Supports: YouTube, Twitch Clips/Videos, Twitter/X
          </div>
        </div>
        
        <div className="text-xs text-[#768894]">
          Type  to mention • Embed format: [platform:id]
        </div>
      </div>
      
      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyPress}
        onClick={handleTextareaClick}
        onKeyUp={handleTextareaClick}
        placeholder={placeholder}
        rows={rows}
        className={`w-full p-3 bg-[#0f1419] border border-[#2b3d4d] border-t-0 rounded-b-lg text-white placeholder-[#768894] focus:border-[#fa4454] focus:outline-none resize-none font-mono text-sm ${className}`}
      />
      
      {/* Video Embed Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1a2332] border border-[#2b3d4d] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-4">Embed Video</h3>
            
            <div className="mb-4">
              <label className="block text-sm text-[#768894] mb-2">
                Video URL
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full px-3 py-2 bg-[#0f1419] border border-[#2b3d4d] rounded text-white placeholder-[#768894] focus:border-[#fa4454] focus:outline-none"
                autoFocus
              />
              <div className="mt-2 text-xs text-[#768894]">
                <p className="mb-1">Supported formats:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>YouTube: youtube.com/watch?v=VIDEO_ID</li>
                  <li>Twitch Clips: clips.twitch.tv/CLIP_ID</li>
                  <li>Twitch Videos: twitch.tv/videos/VIDEO_ID</li>
                  <li>Twitter/X: twitter.com/user/status/TWEET_ID</li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowVideoModal(false);
                  setVideoUrl('');
                }}
                className="px-4 py-2 text-[#768894] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={insertVideo}
                className="px-4 py-2 bg-[#fa4454] text-white rounded hover:bg-[#e03e4e] transition-colors"
              >
                Insert Video
              </button>
            </div>
          </div>
        </div>
      )}
      
      <MentionDropdown
        show={showDropdown}
        results={mentionResults}
        selectedIndex={selectedIndex}
        loading={mentionLoading}
        position={dropdownPosition}
        onSelect={(mention) => selectMention(mention, onChange, value)}
        dropdownRef={dropdownRef}
      />
      
      {/* Help text */}
      <div className="mt-2 text-xs text-[#768894] space-y-1">
        <p>• Videos will be embedded automatically when the article is published</p>
        <p>• You can preview the article before publishing to see how videos appear</p>
      </div>
    </div>
  );
}

export default EnhancedTextEditor;