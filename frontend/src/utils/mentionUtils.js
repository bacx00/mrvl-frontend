import React from 'react';
import MentionLink from '../components/shared/MentionLink';

// Process text content to convert mentions to clickable components
export const processContentWithMentions = (content, mentions = [], navigateTo = null) => {
  if (!content || mentions.length === 0) {
    return content;
  }

  // Start with the content as a single text segment
  let segments = [{ type: 'text', content }];

  // Process each mention in the mentions array
  mentions.forEach((mention, index) => {
    const newSegments = [];
    
    // Get all possible mention texts for this mention
    const possibleTexts = [
      mention.mention_text,                           // @player:Cloud
      `@${mention.display_name}`,                     // @Dmitry Solovyev  
      `@${mention.name}`                              // @Cloud
    ].filter(Boolean); // Remove undefined/null values

    segments.forEach(segment => {
      if (segment.type !== 'text') {
        newSegments.push(segment);
        return;
      }

      let text = segment.content;
      let foundMatch = false;

      // Try each possible mention text
      for (const mentionText of possibleTexts) {
        if (text.includes(mentionText)) {
          // Split the text around the mention
          const parts = text.split(mentionText);
          
          for (let i = 0; i < parts.length; i++) {
            // Add text part
            if (parts[i]) {
              newSegments.push({
                type: 'text',
                content: parts[i]
              });
            }
            
            // Add mention component (except after the last part)
            if (i < parts.length - 1) {
              newSegments.push({
                type: 'mention',
                content: mentionText,
                mention: mention,
                key: `mention-${index}-${i}`
              });
            }
          }
          
          foundMatch = true;
          break; // Found a match, no need to try other texts
        }
      }

      // If no match found, keep as text
      if (!foundMatch) {
        newSegments.push(segment);
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
          onClick={navigateTo ? (mention) => {
            const nav = {
              player: () => navigateTo('player-detail', { id: mention.id }),
              team: () => navigateTo('team-detail', { id: mention.id }),
              user: () => navigateTo('user-profile', { id: mention.id })
            };
            
            if (nav[mention.type]) {
              nav[mention.type]();
            }
          } : undefined}
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