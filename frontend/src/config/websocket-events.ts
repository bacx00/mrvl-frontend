// WebSocket Event Configuration
// This file maps backend broadcast events to their exact names for proper synchronization

export const WEBSOCKET_EVENTS = {
  // Match Events (from backend broadcastAs() methods)
  MATCH_STARTED: 'match.started',              // MatchStarted event
  MATCH_UPDATED: 'match.updated',              // MatchUpdated event
  MATCH_PAUSED: 'match.paused',                // MatchPaused event
  MATCH_RESUMED: 'match.resumed',              // MatchResumed event
  
  // Map Events
  MAP_STARTED: 'map.started',                  // MatchMapStarted event
  MAP_ENDED: 'map.ended',                      // MatchMapEnded event
  MAP_TRANSITION: 'match.map.transition',      // MatchMapTransition event
  
  // Game Events
  HERO_UPDATED: 'hero.updated',                // MatchHeroUpdated event
  KILL_EVENT: 'kill.event',                    // MatchKillEvent event
  OBJECTIVE_UPDATE: 'objective.update',        // MatchObjectiveUpdate event
  
  // Chat Events
  CHAT_MESSAGE: 'chat.message.created',        // ChatMessageCreated event
  
  // Legacy Events (for backward compatibility)
  SCORE_UPDATED: 'score-updated',
  MAP_STARTED_LEGACY: 'map-started',
  MAP_ENDED_LEGACY: 'map-ended',
  PLAYER_STATS_UPDATED: 'player-stats-updated',
  HERO_SWAP: 'hero-swap',
  ROUND_ENDED: 'round-ended',
  OVERTIME_STARTED: 'overtime-started',
  MATCH_PAUSED_LEGACY: 'match-paused',
  MATCH_RESUMED_LEGACY: 'match-resumed',
  TECH_PAUSE: 'tech-pause'
} as const;

// Channel naming conventions
export const CHANNEL_PATTERNS = {
  MATCH: (matchId: string | number) => `match.${matchId}`,
  MATCH_MAP: (matchId: string | number, mapId: string | number) => `match.${matchId}.map.${mapId}`,
  MATCH_LIVE_SCORING: (matchId: string | number) => `match.${matchId}.live-scoring`,
  LIVE_MATCHES: 'live-matches',
  THREAD: (threadId: string | number) => `thread.${threadId}`,
  USER: (userId: string | number) => `user.${userId}`,
  GLOBAL: 'global',
  EVENT: (eventId: string | number) => `event.${eventId}`
} as const;

// Event payload types
export interface MatchEventPayload {
  match_id: string | number;
  timestamp: string;
  [key: string]: any;
}

export interface MapEventPayload extends MatchEventPayload {
  map_number: number;
  map_data?: any;
}

export interface HeroUpdatePayload extends MatchEventPayload {
  map_number: number;
  team_id: string | number;
  player_id: string | number;
  hero_name: string;
  action: string;
  hero_data: any;
}

export interface KillEventPayload extends MatchEventPayload {
  kill_data: {
    killer_id: string | number;
    victim_id: string | number;
    hero_killer: string;
    hero_victim: string;
    ability?: string;
    headshot?: boolean;
    [key: string]: any;
  };
}

export interface ObjectiveUpdatePayload extends MatchEventPayload {
  map_number: number;
  objective_data: {
    type: string;
    progress?: number;
    captured?: boolean;
    [key: string]: any;
  };
}

// Helper function to bind all match events
export function bindMatchEvents(
  channel: any,
  callbacks: {
    onMatchStarted?: (data: MatchEventPayload) => void;
    onMatchUpdated?: (data: MatchEventPayload) => void;
    onMatchPaused?: (data: MatchEventPayload) => void;
    onMatchResumed?: (data: MatchEventPayload) => void;
    onMapStarted?: (data: MapEventPayload) => void;
    onMapEnded?: (data: MapEventPayload) => void;
    onMapTransition?: (data: MapEventPayload) => void;
    onHeroUpdated?: (data: HeroUpdatePayload) => void;
    onKillEvent?: (data: KillEventPayload) => void;
    onObjectiveUpdate?: (data: ObjectiveUpdatePayload) => void;
    onAnyEvent?: (eventName: string, data: any) => void;
  }
) {
  if (!channel) return;

  // Bind specific events
  if (callbacks.onMatchStarted) {
    channel.bind(WEBSOCKET_EVENTS.MATCH_STARTED, callbacks.onMatchStarted);
  }
  if (callbacks.onMatchUpdated) {
    channel.bind(WEBSOCKET_EVENTS.MATCH_UPDATED, callbacks.onMatchUpdated);
  }
  if (callbacks.onMatchPaused) {
    channel.bind(WEBSOCKET_EVENTS.MATCH_PAUSED, callbacks.onMatchPaused);
  }
  if (callbacks.onMatchResumed) {
    channel.bind(WEBSOCKET_EVENTS.MATCH_RESUMED, callbacks.onMatchResumed);
  }
  if (callbacks.onMapStarted) {
    channel.bind(WEBSOCKET_EVENTS.MAP_STARTED, callbacks.onMapStarted);
  }
  if (callbacks.onMapEnded) {
    channel.bind(WEBSOCKET_EVENTS.MAP_ENDED, callbacks.onMapEnded);
  }
  if (callbacks.onMapTransition) {
    channel.bind(WEBSOCKET_EVENTS.MAP_TRANSITION, callbacks.onMapTransition);
  }
  if (callbacks.onHeroUpdated) {
    channel.bind(WEBSOCKET_EVENTS.HERO_UPDATED, callbacks.onHeroUpdated);
  }
  if (callbacks.onKillEvent) {
    channel.bind(WEBSOCKET_EVENTS.KILL_EVENT, callbacks.onKillEvent);
  }
  if (callbacks.onObjectiveUpdate) {
    channel.bind(WEBSOCKET_EVENTS.OBJECTIVE_UPDATE, callbacks.onObjectiveUpdate);
  }

  // Bind to all events for debugging
  if (callbacks.onAnyEvent) {
    channel.bind_global((eventName: string, data: any) => {
      callbacks.onAnyEvent!(eventName, data);
    });
  }
}

// Helper to unbind all events
export function unbindMatchEvents(channel: any) {
  if (!channel) return;

  Object.values(WEBSOCKET_EVENTS).forEach(eventName => {
    channel.unbind(eventName);
  });
  
  channel.unbind_global();
}