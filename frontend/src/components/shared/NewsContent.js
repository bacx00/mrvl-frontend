import React from 'react';
import MentionLink from './MentionLink';
import { processContentWithMentions } from '../../utils/mentionUtils';

function NewsContent({ content, mentions = [] }) {
  // Process content to render video embeds and mentions
  const renderContent = () => {
    if (!content) return null;

    // First, process mentions
    const processedForMentions = processContentWithMentions(content, mentions);
    
    // Then split by video embed markers
    const parts = processedForMentions.split(/(\[(?:youtube|twitch-clip|twitch-video|tweet):[^\]]+\])/g);
    
    return parts.map((part, index) => {
      // YouTube embed
      if (part.match(/\[youtube:([^\]]+)\]/)) {
        const videoId = part.match(/\[youtube:([^\]]+)\]/)[1];
        return (
          <div key={index} className="video-embed youtube-embed my-6">
            <div className="relative pb-[56.25%] h-0">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
              />
            </div>
          </div>
        );
      }
      
      // Twitch Clip embed
      if (part.match(/\[twitch-clip:([^\]]+)\]/)) {
        const clipId = part.match(/\[twitch-clip:([^\]]+)\]/)[1];
        return (
          <div key={index} className="video-embed twitch-embed my-6">
            <div className="relative pb-[56.25%] h-0">
              <iframe
                src={`https://clips.twitch.tv/embed?clip=${clipId}&parent=${window.location.hostname}&autoplay=false`}
                frameBorder="0"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
              />
            </div>
          </div>
        );
      }
      
      // Twitch Video embed
      if (part.match(/\[twitch-video:([^\]]+)\]/)) {
        const videoId = part.match(/\[twitch-video:([^\]]+)\]/)[1];
        return (
          <div key={index} className="video-embed twitch-embed my-6">
            <div className="relative pb-[56.25%] h-0">
              <iframe
                src={`https://player.twitch.tv/?video=${videoId}&parent=${window.location.hostname}&autoplay=false`}
                frameBorder="0"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
              />
            </div>
          </div>
        );
      }
      
      // Tweet embed - render as a blockquote for now (Twitter embed requires script loading)
      if (part.match(/\[tweet:([^\]]+)\]/)) {
        const tweetId = part.match(/\[tweet:([^\]]+)\]/)[1];
        return (
          <div key={index} className="tweet-embed my-6">
            <blockquote className="twitter-tweet mx-auto" data-theme="dark">
              <a href={`https://twitter.com/x/status/${tweetId}`}>Loading Tweet...</a>
            </blockquote>
          </div>
        );
      }
      
      // Process regular text content
      if (typeof part === 'string') {
        // Split by double newlines to create paragraphs
        const paragraphs = part.split(/\n\n+/);
        return paragraphs.map((paragraph, pIndex) => {
          if (!paragraph.trim()) return null;
          
          // Split by single newlines within paragraphs
          const lines = paragraph.split('\n');
          return (
            <p key={`${index}-${pIndex}`} className="mb-4 text-gray-700 dark:text-gray-300 leading-relaxed">
              {lines.map((line, lineIndex) => (
                <React.Fragment key={lineIndex}>
                  {line}
                  {lineIndex < lines.length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
          );
        }).filter(Boolean);
      }
      
      // For processed mention components
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  // Load Twitter widgets script if there are tweets
  React.useEffect(() => {
    if (content && content.includes('[tweet:')) {
      // Check if Twitter widgets script is already loaded
      if (!window.twttr) {
        const script = document.createElement('script');
        script.src = 'https://platform.twitter.com/widgets.js';
        script.async = true;
        script.charset = 'utf-8';
        document.body.appendChild(script);
      } else {
        // If already loaded, reload widgets
        window.twttr.widgets.load();
      }
    }
  }, [content]);

  return (
    <div className="news-content prose prose-lg dark:prose-invert max-w-none">
      {renderContent()}
    </div>
  );
}

export default NewsContent;