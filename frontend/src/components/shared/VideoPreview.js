import React, { useState, useEffect } from 'react';
import { detectAllVideoUrls, getVideoThumbnail, validateVideoUrl } from '../../utils/videoUtils';
import { fetchVLRUrlData, generateVLREmbedData } from '../../services/vlrggService';

function VideoPreview({ content, onVideoDetected, className = '' }) {
  const [detectedVideos, setDetectedVideos] = useState([]);
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (!content) {
      setDetectedVideos([]);
      return;
    }

    const videos = detectAllVideoUrls(content);
    setDetectedVideos(videos);
    
    if (onVideoDetected) {
      onVideoDetected(videos);
    }
  }, [content, onVideoDetected]);

  if (!detectedVideos.length || !showPreview) {
    return null;
  }

  const handleRemovePreview = () => {
    setShowPreview(false);
  };

  return (
    <div className={`video-preview-container mt-4 ${className}`}>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 flex items-center">
            🎯 Content Embeds Detected ({detectedVideos.length})
          </h4>
          <button
            onClick={handleRemovePreview}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-sm"
            title="Hide preview"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-3">
          {detectedVideos.map((video, index) => (
            <VideoPreviewItem key={index} video={video} />
          ))}
        </div>
        
        <div className="mt-3 text-xs text-blue-700 dark:text-blue-300">
          <strong>This content will be automatically embedded in your article.</strong>
          <br />
          Supported platforms: YouTube, Twitch (clips & videos), Twitter/X, VLR.gg (esports content)
        </div>
      </div>
    </div>
  );
}

function VideoPreviewItem({ video }) {
  const [thumbnail, setThumbnail] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [vlrData, setVlrData] = useState(null);
  const [loadingVlrData, setLoadingVlrData] = useState(false);

  useEffect(() => {
    if (video.thumbnail && !imageError) {
      setThumbnail(video.thumbnail);
    }
  }, [video.thumbnail, imageError]);

  // Fetch VLR.gg data for enhanced preview
  useEffect(() => {
    if (video.type === 'vlrgg' && !vlrData && !loadingVlrData) {
      setLoadingVlrData(true);
      fetchVLRUrlData(video.originalUrl)
        .then(data => {
          if (data) {
            setVlrData(data);
            const embedData = generateVLREmbedData(data);
            if (embedData?.thumbnail) {
              setThumbnail(embedData.thumbnail);
            }
          }
        })
        .catch(error => {
          console.error('Error fetching VLR data:', error);
        })
        .finally(() => {
          setLoadingVlrData(false);
        });
    }
  }, [video.type, video.originalUrl, vlrData, loadingVlrData]);

  const handleImageError = () => {
    setImageError(true);
    setThumbnail(null);
  };

  const getPlatformIcon = (type, contentType = null) => {
    switch (type) {
      case 'youtube': return '▶️';
      case 'twitch-clip':
      case 'twitch-video': return '🎮';
      case 'twitter': return '🐦';
      case 'vlrgg': 
        switch (contentType) {
          case 'match': return '⚔️';
          case 'team': return '👥';
          case 'event': return '🏆';
          case 'player': return '👤';
          default: return '🎯';
        }
      default: return '📺';
    }
  };

  const getPlatformColor = (type) => {
    switch (type) {
      case 'youtube': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      case 'twitch-clip':
      case 'twitch-video': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200';
      case 'twitter': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200';
      case 'vlrgg': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200';
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800/50 rounded-md border border-gray-200 dark:border-gray-700">
      {/* Thumbnail or icon */}
      <div className="flex-shrink-0">
        {thumbnail && !imageError ? (
          <img
            src={thumbnail}
            alt="Video thumbnail"
            className="w-16 h-12 object-cover rounded"
            onError={handleImageError}
          />
        ) : (
          <div className="w-16 h-12 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center text-2xl relative">
            {getPlatformIcon(video.type, video.contentType)}
            {loadingVlrData && video.type === 'vlrgg' && (
              <div className="absolute inset-0 bg-gray-200/80 dark:bg-gray-700/80 rounded flex items-center justify-center">
                <div className="w-3 h-3 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Video info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(video.type)}`}>
            {getPlatformIcon(video.type, video.contentType)} {video.platformName}
            {video.contentType && video.type === 'vlrgg' && (
              <span className="ml-1 opacity-75">({video.contentType})</span>
            )}
          </span>
          {video.isValid ? (
            <span className="text-green-600 dark:text-green-400 text-xs">✓ Valid</span>
          ) : (
            <span className="text-red-600 dark:text-red-400 text-xs">✗ Error</span>
          )}
        </div>
        
        {/* VLR.gg enhanced metadata */}
        {video.type === 'vlrgg' && vlrData ? (
          <div className="space-y-1">
            <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">
              {vlrData.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
            {vlrData.matchData && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {vlrData.matchData.event?.name && (
                  <div>📅 {vlrData.matchData.event.name}</div>
                )}
                {vlrData.matchData.status && (
                  <div>🎯 Status: {vlrData.matchData.status}</div>
                )}
                {vlrData.matchData.teams && vlrData.matchData.teams.length >= 2 && (
                  <div>⚔️ {vlrData.matchData.teams.map(t => t.name).join(' vs ')}</div>
                )}
              </div>
            )}
            {vlrData.teamData && (
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {vlrData.teamData.region && (
                  <div>🌍 {vlrData.teamData.region}</div>
                )}
                {vlrData.teamData.rank && (
                  <div>🏆 Rank: #{vlrData.teamData.rank}</div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-900 dark:text-gray-100 truncate" title={video.originalUrl}>
            {video.type === 'vlrgg' ? `${video.contentType}: ${video.slug}` : `ID: ${video.id}`}
          </div>
        )}
        
        {video.error && (
          <div className="text-xs text-red-600 dark:text-red-400 mt-1">
            {video.error}
          </div>
        )}
        
        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate" title={video.originalUrl}>
          {video.displayUrl || video.originalUrl}
        </div>
      </div>

      {/* Actions */}
      <div className="flex-shrink-0 flex items-center space-x-2">
        <a
          href={video.originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 text-xs"
          title="Open in new tab"
        >
          🔗
        </a>
      </div>
    </div>
  );
}

export default VideoPreview;