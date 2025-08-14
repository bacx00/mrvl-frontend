import React, { createContext, useContext, useRef } from 'react';

/**
 * Activity Stats Context
 * Provides a way to trigger activity stats updates from anywhere in the app
 * when user performs actions that affect their stats (posting, commenting, etc.)
 */
const ActivityStatsContext = createContext(null);

export const ActivityStatsProvider = ({ children }) => {
  const updateTriggers = useRef(new Set());
  
  // Register an update trigger function
  const registerUpdateTrigger = (triggerFunction) => {
    updateTriggers.current.add(triggerFunction);
    
    // Return cleanup function
    return () => {
      updateTriggers.current.delete(triggerFunction);
    };
  };
  
  // Trigger all registered update functions
  const triggerStatsUpdate = (actionType = 'generic') => {
    console.log(`🎯 Triggering activity stats update for action: ${actionType}`);
    
    updateTriggers.current.forEach(trigger => {
      try {
        trigger(actionType);
      } catch (error) {
        console.error('Error triggering stats update:', error);
      }
    });
  };
  
  // Specific action triggers
  const triggerForumPost = () => triggerStatsUpdate('forum_post');
  const triggerForumThread = () => triggerStatsUpdate('forum_thread');
  const triggerComment = () => triggerStatsUpdate('comment');
  const triggerVote = () => triggerStatsUpdate('vote');
  const triggerActivity = () => triggerStatsUpdate('activity');
  
  const value = {
    registerUpdateTrigger,
    triggerStatsUpdate,
    triggerForumPost,
    triggerForumThread,
    triggerComment,
    triggerVote,
    triggerActivity
  };
  
  return (
    <ActivityStatsContext.Provider value={value}>
      {children}
    </ActivityStatsContext.Provider>
  );
};

export const useActivityStatsContext = () => {
  const context = useContext(ActivityStatsContext);
  if (!context) {
    // Return no-op functions if context is not available
    return {
      registerUpdateTrigger: () => () => {},
      triggerStatsUpdate: () => {},
      triggerForumPost: () => {},
      triggerForumThread: () => {},
      triggerComment: () => {},
      triggerVote: () => {},
      triggerActivity: () => {}
    };
  }
  return context;
};

export default ActivityStatsContext;