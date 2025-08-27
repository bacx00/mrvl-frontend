import React from 'react';
import MentionLink from '../components/shared/MentionLink';

// Process text content to convert mentions to clickable components
export const processContentWithMentions = (content, mentions = [], navigateTo = null) => {
  if (!content || mentions.length === 0) {
    return content;
  }

  // Create a map of mention texts to mention objects for quick lookup
  const mentionMap = {};
  mentions.forEach(mention => {
    // Add multiple possible keys for each mention to ensure matching
    const mentionText = mention.mention_text;
    const name = mention.name;
    const displayName = mention.display_name;
    
    if (mentionText) {
      mentionMap[mentionText] = mention;
    }
    
    // Also add alternative formats to ensure matching
    if (mention.type === 'team') {
      mentionMap[`@team:${name}`] = mention;
      mentionMap[`@team:${mention.id}`] = mention;
      if (displayName) {
        mentionMap[`@team:${displayName}`] = mention;
      }
    } else if (mention.type === 'player') {
      mentionMap[`@player:${name}`] = mention;
      mentionMap[`@player:${mention.id}`] = mention;
      if (displayName) {
        mentionMap[`@player:${displayName}`] = mention;
      }
    }
    
    // Fallback simple format
    mentionMap[`@${name}`] = mention;
    if (displayName && displayName !== name) {
      mentionMap[`@${displayName}`] = mention;
    }
  });

  // Find all mention patterns in the content
  const mentionPatterns = [
    // Process @ mentions but only if they're teams or players (not users)
    /@team:([a-zA-Z0-9_\-\s]+)/g,      // @team:teamname or @team:id
    /@player:([a-zA-Z0-9_\-\s]+)/g,    // @player:playername or @player:id
    /@([a-zA-Z0-9_]+)/g                  // @teamname or @playername (will filter by type)
  ];

  let processedContent = content;
  let segments = [{ type: 'text', content: processedContent }];

  mentionPatterns.forEach(pattern => {
    const newSegments = [];
    
    segments.forEach(segment => {
      if (segment.type !== 'text') {
        newSegments.push(segment);
        return;
      }

      const text = segment.content;
      let lastIndex = 0;
      let match;

      pattern.lastIndex = 0; // Reset regex state
      
      while ((match = pattern.exec(text)) !== null) {
        const fullMatch = match[0];
        const mentionStart = match.index;
        const mentionEnd = mentionStart + fullMatch.length;

        // Add text before mention
        if (mentionStart > lastIndex) {
          newSegments.push({
            type: 'text',
            content: text.slice(lastIndex, mentionStart)
          });
        }

        // Check if this mention exists in our mentions array
        let mentionData = mentionMap[fullMatch];
        
        // If not found directly, try alternative lookups
        if (!mentionData) {
          // Try to find by the captured group (without prefix)
          const capturedName = match[1];
          
          // Look for mentions that match this name or ID
          Object.keys(mentionMap).forEach(key => {
            const mention = mentionMap[key];
            if (mention && (mention.name === capturedName || 
                mention.display_name === capturedName ||
                mention.id === capturedName ||
                mention.id === parseInt(capturedName))) {
              mentionData = mention;
            }
          });
        }
        
        // Only process teams and players, skip user mentions
        if (mentionData && mentionData.type !== 'user') {
          // Add mention component
          newSegments.push({
            type: 'mention',
            content: fullMatch,
            mention: mentionData,
            key: `mention-${mentionStart}-${mentionEnd}`
          });
        } else {
          // Add as plain text if mention not found
          newSegments.push({
            type: 'text',
            content: fullMatch
          });
        }

        lastIndex = mentionEnd;
      }

      // Add remaining text
      if (lastIndex < text.length) {
        newSegments.push({
          type: 'text',
          content: text.slice(lastIndex)
        });
      }
    });

    segments = newSegments;
  });

  // Convert segments to React elements
  return segments.map((segment, index) => {
    if (segment.type === 'mention') {
      return (
        <MentionLink
          key={segment.key || `mention-${index}`}
          mention={segment.mention}
          navigateTo={navigateTo}
        />
      );
    }
    return segment.content;
  });
};

// Extract mentions from content (for client-side processing)
export const extractMentionsFromContent = (content) => {
  const mentions = [];
  
  if (!content) return mentions;

  // Pattern for @username (users)
  const userPattern = /@([a-zA-Z0-9_]+)/g;
  let match;
  
  while ((match = userPattern.exec(content)) !== null) {
    mentions.push({
      type: 'user',
      name: match[1],
      mention_text: match[0],
      position_start: match.index,
      position_end: match.index + match[0].length
    });
  }

  // Pattern for @team:teamname
  const teamPattern = /@team:([a-zA-Z0-9_]+)/g;
  while ((match = teamPattern.exec(content)) !== null) {
    mentions.push({
      type: 'team',
      name: match[1],
      mention_text: match[0],
      position_start: match.index,
      position_end: match.index + match[0].length
    });
  }

  // Pattern for @player:playername
  const playerPattern = /@player:([a-zA-Z0-9_]+)/g;
  while ((match = playerPattern.exec(content)) !== null) {
    mentions.push({
      type: 'player',
      name: match[1],
      mention_text: match[0],
      position_start: match.index,
      position_end: match.index + match[0].length
    });
  }

  return mentions;
};

// Format mentions for display
export const formatMentionForDisplay = (mention) => {
  const { type, name, display_name } = mention;
  
  switch (type) {
    case 'player':
      return {
        ...mention,
        display_text: `@${display_name || name}`,
        display_name: display_name || name,
        route: `/players/${mention.id}`,
        icon: 'player',
        color: 'blue'
      };
    
    case 'team':
      return {
        ...mention,
        display_text: `@${display_name || name}`,
        display_name: display_name || name,
        route: `/teams/${mention.id}`,
        icon: 'team',
        color: 'red'
      };
    
    case 'user':
      return {
        ...mention,
        display_text: `@${display_name || name}`,
        display_name: display_name || name,
        route: `/users/${mention.id}`,
        icon: 'user',
        color: 'green'
      };
    
    default:
      return {
        ...mention,
        display_text: `@${name}`,
        display_name: name,
        route: '#',
        icon: 'unknown',
        color: 'gray'
      };
  }
};

// Validate mention format
export const isValidMentionFormat = (text) => {
  const patterns = [
    /^@[a-zA-Z0-9_]+$/,           // @username
    /^@team:[a-zA-Z0-9_]+$/,      // @team:teamname
    /^@player:[a-zA-Z0-9_]+$/     // @player:playername
  ];
  
  return patterns.some(pattern => pattern.test(text));
};

// Get mention type from mention text
export const getMentionType = (mentionText) => {
  if (mentionText.startsWith('@team:')) return 'team';
  if (mentionText.startsWith('@player:')) return 'player';
  if (mentionText.startsWith('@')) return 'user';
  return 'unknown';
};

// Create mention text from type and name
export const createMentionText = (type, name) => {
  switch (type) {
    case 'team':
      return `@team:${name}`;
    case 'player':
      return `@player:${name}`;
    case 'user':
    default:
      return `@${name}`;
  }
};