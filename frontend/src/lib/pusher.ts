// src/lib/pusher.ts
// Real-time updates for live matches, forum activity, and notifications

import Pusher from 'pusher-js';

// Configuration
const PUSHER_KEY = process.env.NEXT_PUBLIC_PUSHER_KEY || '';
const PUSHER_CLUSTER = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'us2';
const PUSHER_HOST = process.env.NEXT_PUBLIC_PUSHER_HOST;
const PUSHER_PORT = process.env.NEXT_PUBLIC_PUSHER_PORT ? parseInt(process.env.NEXT_PUBLIC_PUSHER_PORT) : undefined;

// Mobile battery optimization - connection management
class PusherManager {
  private static instance: PusherManager;
  private pusher: Pusher | null = null;
  private connectionState: 'connecting' | 'connected' | 'disconnected' | 'failed' = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private subscriptions = new Map<string, any>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private backgroundTimeout: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializePusher();
    this.setupEventListeners();
    this.setupMobileOptimizations();
  }

  public static getInstance(): PusherManager {
    if (!PusherManager.instance) {
      PusherManager.instance = new PusherManager();
    }
    return PusherManager.instance;
  }

  private initializePusher(): void {
    if (typeof window === 'undefined' || !PUSHER_KEY) return;

    const config: any = {
      cluster: PUSHER_CLUSTER,
      encrypted: true,
      authEndpoint: '/api/pusher/auth',
      enabledTransports: ['ws', 'wss'],
      disabledTransports: [],
      // Mobile optimization
      activityTimeout: 30000, // 30 seconds
      pongTimeout: 6000, // 6 seconds
      unavailableTimeout: 6000, // 6 seconds
      // Connection management
      enableStats: false, // Disable for production
      disableStats: true,
      // Custom host if provided (for self-hosted)
      ...(PUSHER_HOST && { 
        wsHost: PUSHER_HOST,
        httpHost: PUSHER_HOST,
        ...(PUSHER_PORT && { 
          wsPort: PUSHER_PORT,
          wssPort: PUSHER_PORT,
          httpPort: PUSHER_PORT,
          httpsPort: PUSHER_PORT,
        }),
        forceTLS: false,
        enabledTransports: ['ws'],
      }),
    };

    try {
      this.pusher = new Pusher(PUSHER_KEY, config);
      this.connectionState = 'connecting';
    } catch (error) {
      console.error('Failed to initialize Pusher:', error);
      this.connectionState = 'failed';
    }
  }

  private setupEventListeners(): void {
    if (!this.pusher) return;

    // Connection state management
    this.pusher.connection.bind('connected', () => {
      this.connectionState = 'connected';
      this.reconnectAttempts = 0;
      console.log('✅ Pusher connected');
      this.startHeartbeat();
    });

    this.pusher.connection.bind('disconnected', () => {
      this.connectionState = 'disconnected';
      console.log('📡 Pusher disconnected');
      this.stopHeartbeat();
    });

    this.pusher.connection.bind('failed', () => {
      this.connectionState = 'failed';
      console.error('❌ Pusher connection failed');
      this.handleReconnection();
    });

    this.pusher.connection.bind('error', (error: any) => {
      console.error('Pusher connection error:', error);
    });

    // State change logging
    this.pusher.connection.bind('state_change', (states: any) => {
      console.log(`Pusher state: ${states.previous} → ${states.current}`);
    });
  }

  private setupMobileOptimizations(): void {
    if (typeof window === 'undefined') return;

    // Handle page visibility changes for mobile battery optimization
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handleBackgroundMode();
      } else {
        this.handleForegroundMode();
      }
    });

    // Handle network status changes
    window.addEventListener('online', () => {
      if (this.connectionState === 'disconnected') {
        this.reconnect();
      }
    });

    window.addEventListener('offline', () => {
      this.disconnect();
    });

    // Handle mobile app lifecycle events
    window.addEventListener('pagehide', () => {
      this.handleBackgroundMode();
    });

    window.addEventListener('pageshow', () => {
      this.handleForegroundMode();
    });
  }

  private handleBackgroundMode(): void {
    // Reduce connection activity when app is in background
    this.backgroundTimeout = setTimeout(() => {
      if (document.hidden) {
        this.disconnect();
      }
    }, 30000); // 30 seconds
  }

  private handleForegroundMode(): void {
    if (this.backgroundTimeout) {
      clearTimeout(this.backgroundTimeout);
      this.backgroundTimeout = null;
    }

    if (this.connectionState === 'disconnected') {
      this.reconnect();
    }
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.pusher && this.connectionState === 'connected') {
        // Send ping to keep connection alive
        this.pusher.connection.send_event('pusher:ping', {});
      }
    }, 30000); // 30 seconds
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private handleReconnection(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    const delay = Math.pow(2, this.reconnectAttempts) * 1000; // Exponential backoff
    this.reconnectAttempts++;

    setTimeout(() => {
      this.reconnect();
    }, delay);
  }

  public reconnect(): void {
    if (this.pusher) {
      this.pusher.connect();
    }
  }

  public disconnect(): void {
    if (this.pusher) {
      this.pusher.disconnect();
    }
    this.stopHeartbeat();
  }

  // Channel subscription with error handling
  public subscribe(channelName: string): any {
    if (!this.pusher) {
      console.warn('Pusher not initialized');
      return null;
    }

    try {
      const channel = this.pusher.subscribe(channelName);
      this.subscriptions.set(channelName, channel);

      // Handle subscription errors
      channel.bind('pusher:subscription_error', (error: any) => {
        console.error(`Failed to subscribe to ${channelName}:`, error);
      });

      channel.bind('pusher:subscription_succeeded', () => {
        console.log(`✅ Subscribed to ${channelName}`);
      });

      return channel;
    } catch (error) {
      console.error(`Error subscribing to ${channelName}:`, error);
      return null;
    }
  }

  public unsubscribe(channelName: string): void {
    if (this.pusher && this.subscriptions.has(channelName)) {
      this.pusher.unsubscribe(channelName);
      this.subscriptions.delete(channelName);
      console.log(`Unsubscribed from ${channelName}`);
    }
  }

  // Get connection state
  public getConnectionState(): string {
    return this.connectionState;
  }

  // Get Pusher instance for direct access if needed
  public getPusher(): Pusher | null {
    return this.pusher;
  }

  // Clean up resources
  public cleanup(): void {
    this.stopHeartbeat();
    
    if (this.backgroundTimeout) {
      clearTimeout(this.backgroundTimeout);
    }

    // Unsubscribe from all channels
    this.subscriptions.forEach((_, channelName) => {
      this.unsubscribe(channelName);
    });

    if (this.pusher) {
      this.pusher.disconnect();
    }
  }
}

// Create singleton instance
const pusherManager = PusherManager.getInstance();

// Export the manager and a simple client for backward compatibility
export const pusherClient = pusherManager.getPusher();
export default pusherManager;

// ═══════════════════════════════════════════════════════════════
//                        CHANNEL HELPERS
// ═══════════════════════════════════════════════════════════════

// Live match updates
export const subscribeLiveMatches = (callback: (data: any) => void) => {
  const channel = pusherManager.subscribe('live-matches');
  if (channel) {
    channel.bind('match-updated', callback);
    channel.bind('match-started', callback);
    channel.bind('match-ended', callback);
  }
  return channel;
};

// Specific match updates
export const subscribeMatchUpdates = (matchId: string, callback: (data: any) => void) => {
  const channel = pusherManager.subscribe(`match.${matchId}`);
  if (channel) {
    // Backend event names
    channel.bind('hero.updated', callback);
    channel.bind('MatchMapStarted', callback);
    channel.bind('MatchMapEnded', callback);
    channel.bind('MatchKillEvent', callback);
    channel.bind('MatchObjectiveUpdate', callback);
    channel.bind('MatchPaused', callback);
    channel.bind('MatchResumed', callback);
    channel.bind('match.map.transition', callback);
    channel.bind('match.started', callback);
    
    // Keep old events for compatibility
    channel.bind('score-updated', callback);
    channel.bind('map-started', callback);
    channel.bind('map-ended', callback);
    channel.bind('player-stats-updated', callback);
    channel.bind('hero-swap', callback);
    channel.bind('round-ended', callback);
    channel.bind('overtime-started', callback);
    channel.bind('match-paused', callback);
    channel.bind('match-resumed', callback);
    channel.bind('tech-pause', callback);
  }
  return channel;
};

// Map-specific updates
export const subscribeMapUpdates = (matchId: string, mapId: string, callback: (data: any) => void) => {
  const channel = pusherManager.subscribe(`match.${matchId}.map.${mapId}`);
  if (channel) {
    channel.bind('round-update', callback);
    channel.bind('objective-progress', callback);
    channel.bind('player-eliminated', callback);
    channel.bind('ultimate-used', callback);
    channel.bind('payload-checkpoint', callback);
    channel.bind('capture-progress', callback);
    channel.bind('team-composition-changed', callback);
  }
  return channel;
};

// Live scoring updates for ComprehensiveLiveScoring component
export const subscribeLiveScoring = (matchId: string, callbacks: {
  onScoreUpdate?: (data: any) => void;
  onPlayerStatUpdate?: (data: any) => void;
  onMapUpdate?: (data: any) => void;
  onEventLog?: (data: any) => void;
}) => {
  const channel = pusherManager.subscribe(`match.${matchId}.live-scoring`);
  if (channel) {
    if (callbacks.onScoreUpdate) channel.bind('score-update', callbacks.onScoreUpdate);
    if (callbacks.onPlayerStatUpdate) channel.bind('player-stat-update', callbacks.onPlayerStatUpdate);
    if (callbacks.onMapUpdate) channel.bind('map-update', callbacks.onMapUpdate);
    if (callbacks.onEventLog) channel.bind('event-log', callbacks.onEventLog);
  }
  return channel;
};

// Forum real-time updates
export const subscribeForumUpdates = (threadId: string, callback: (data: any) => void) => {
  const channel = pusherManager.subscribe(`thread.${threadId}`);
  if (channel) {
    channel.bind('new-post', callback);
    channel.bind('post-updated', callback);
    channel.bind('post-deleted', callback);
  }
  return channel;
};

// User notifications
export const subscribeUserNotifications = (userId: string, callback: (data: any) => void) => {
  const channel = pusherManager.subscribe(`user.${userId}`);
  if (channel) {
    channel.bind('notification', callback);
    channel.bind('mention', callback);
    channel.bind('message', callback);
  }
  return channel;
};

// Global chat or events
export const subscribeGlobalEvents = (callback: (data: any) => void) => {
  const channel = pusherManager.subscribe('global');
  if (channel) {
    channel.bind('announcement', callback);
    channel.bind('system-message', callback);
  }
  return channel;
};

// Event updates (tournaments, competitions)
export const subscribeEventUpdates = (eventId: string, callback: (data: any) => void) => {
  const channel = pusherManager.subscribe(`event.${eventId}`);
  if (channel) {
    channel.bind('bracket-updated', callback);
    channel.bind('match-scheduled', callback);
    channel.bind('event-updated', callback);
  }
  return channel;
};

// Utility for cleanup on component unmount
export const unsubscribeAll = () => {
  pusherManager.cleanup();
};

// Export types for TypeScript users
export interface PusherChannel {
  bind(eventName: string, callback: (data: any) => void): void;
  unbind(eventName: string, callback?: (data: any) => void): void;
  trigger(eventName: string, data: any): boolean;
}

export interface MatchUpdateData {
  matchId: string;
  team1Score: number;
  team2Score: number;
  status: 'live' | 'completed';
  currentMap?: string;
  timestamp: string;
}

export interface ForumUpdateData {
  threadId: string;
  postId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: string;
  action: 'created' | 'updated' | 'deleted';
}

export interface NotificationData {
  id: string;
  type: 'mention' | 'reply' | 'like' | 'follow' | 'system';
  title: string;
  message: string;
  userId: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
}
