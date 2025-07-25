import React, { useState, useEffect, useRef } from 'react';
import { useMentionAutocomplete } from '../../hooks/useMentionAutocomplete';
import MentionDropdown from '../shared/MentionDropdown';

function EnhancedContentEditor({ value, onChange, placeholder }) {
  const [showPreview, setShowPreview] = useState(false);
  const [processedContent, setProcessedContent] = useState('');
  
  // Mention autocomplete setup
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

  // Process content to detect and convert video URLs to embeds
  const processVideoEmbeds = (content) => {
    let processed = content;

    // YouTube URLs
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})(?:\S*)?/gi;
    processed = processed.replace(youtubeRegex, (match, videoId) => {
      return `[youtube:${videoId}]`;
    });

    // Twitch Clips
    const twitchClipRegex = /(?:https?:\/\/)?(?:www\.)?clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/gi;
    processed = processed.replace(twitchClipRegex, (match, clipId) => {
      return `[twitch-clip:${clipId}]`;
    });

    // Twitch Videos
    const twitchVideoRegex = /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/videos\/(\d+)/gi;
    processed = processed.replace(twitchVideoRegex, (match, videoId) => {
      return `[twitch-video:${videoId}]`;
    });

    // Twitter/X Posts
    const twitterRegex = /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(?:#!\/)?(\w+)\/status(?:es)?\/(\d+)/gi;
    processed = processed.replace(twitterRegex, (match, username, tweetId) => {
      return `[tweet:${tweetId}]`;
    });

    return processed;
  };

  // Render content with embedded videos for preview
  const renderContentWithEmbeds = (content) => {
    const parts = content.split(/(\[(?:youtube|twitch-clip|twitch-video|tweet):[^\]]+\])/g);
    
    return parts.map((part, index) => {
      // YouTube embed
      if (part.match(/\[youtube:([^\]]+)\]/)) {
        const videoId = part.match(/\[youtube:([^\]]+)\]/)[1];
        return (
          <div key={index} className="video-embed youtube-embed my-4">
            <iframe
              width="100%"
              height="400"
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="rounded-lg"
            />
          </div>
        );
      }
      
      // Twitch Clip embed
      if (part.match(/\[twitch-clip:([^\]]+)\]/)) {
        const clipId = part.match(/\[twitch-clip:([^\]]+)\]/)[1];
        return (
          <div key={index} className="video-embed twitch-embed my-4">
            <iframe
              src={`https://clips.twitch.tv/embed?clip=${clipId}&parent=${window.location.hostname}`}
              height="400"
              width="100%"
              allowFullScreen
              className="rounded-lg"
            />
          </div>
        );
      }
      
      // Twitch Video embed
      if (part.match(/\[twitch-video:([^\]]+)\]/)) {
        const videoId = part.match(/\[twitch-video:([^\]]+)\]/)[1];
        return (
          <div key={index} className="video-embed twitch-embed my-4">
            <iframe
              src={`https://player.twitch.tv/?video=${videoId}&parent=${window.location.hostname}`}
              height="400"
              width="100%"
              allowFullScreen
              className="rounded-lg"
            />
          </div>
        );
      }
      
      // Tweet embed (simplified representation)
      if (part.match(/\[tweet:([^\]]+)\]/)) {
        const tweetId = part.match(/\[tweet:([^\]]+)\]/)[1];
        return (
          <div key={index} className="tweet-embed my-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tweet ID: {tweetId} (Will be rendered as embedded tweet)
            </p>
          </div>
        );
      }
      
      // Regular text - split by newlines and render as paragraphs
      return part.split('\n').map((paragraph, pIndex) => {
        if (paragraph.trim()) {
          return <p key={`${index}-${pIndex}`} className="mb-4">{paragraph}</p>;
        }
        return null;
      }).filter(Boolean);
    });
  };

  const handleContentChange = (e) => {
    const newValue = e.target.value;
    onChange(newValue);
    handleInputChange(e);
  };

  const handleContentKeyDown = (e) => {
    const result = handleKeyDown(e, null);
    if (result?.selectMention) {
      selectMention(result.selectMention, (newValue) => {
        onChange(newValue);
      }, value);
    }
  };

  useEffect(() => {
    if (showPreview) {
      setProcessedContent(processVideoEmbeds(value));
    }
  }, [value, showPreview]);

  return (
    <div className="enhanced-content-editor">
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100">
          Content *
        </label>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
        >
          {showPreview ? 'Edit' : 'Preview'}
        </button>
      </div>

      {!showPreview ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleContentChange}
            onKeyDown={handleContentKeyDown}
            rows={12}
            className="form-input font-mono"
            placeholder={placeholder || "Write your article content here...\n\nSupported embeds:\n- YouTube: Paste any YouTube URL\n- Twitch: Paste Twitch clip or video URLs\n- Twitter/X: Paste tweet URLs\n\nType @ to mention teams, players, or users"}
            required
          />
          <MentionDropdown
            show={showDropdown}
            results={mentionResults}
            selectedIndex={selectedIndex}
            loading={mentionLoading}
            position={dropdownPosition}
            onSelect={(mention) => selectMention(mention, (newValue) => {
              onChange(newValue);
            }, value)}
            dropdownRef={dropdownRef}
          />
          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            <p>💡 Tip: URLs from YouTube, Twitch, and Twitter/X will automatically be converted to embedded players</p>
          </div>
        </div>
      ) : (
        <div className="preview-container bg-gray-50 dark:bg-gray-900 p-6 rounded-lg border border-gray-200 dark:border-gray-700 min-h-[300px]">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            {renderContentWithEmbeds(processedContent)}
          </div>
        </div>
      )}
    </div>
  );
}

export default EnhancedContentEditor;