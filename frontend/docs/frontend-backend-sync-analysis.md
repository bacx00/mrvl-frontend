# Frontend-Backend Synchronization Analysis

## Current State

### Backend Broadcasting Events
The backend has the following broadcast events in `/var/www/mrvl-backend/app/Events/`:

1. **MatchStarted** - Broadcasts on `match.{matchId}` as `match.started`
2. **MatchMapStarted** - Broadcasts on `match.{matchId}` as `map.started`
3. **MatchMapEnded** - Broadcasts on `match.{matchId}` as `map.ended`
4. **MatchKillEvent** - Broadcasts on `match.{matchId}` as `kill.event`
5. **MatchHeroUpdated** - Broadcasts on `match.{matchId}` as `hero.updated`
6. **MatchObjectiveUpdate** - Broadcasts on `match.{matchId}` as `objective.update`
7. **MatchPaused** - Broadcasts on `match.{matchId}` as `match.paused`
8. **MatchResumed** - Broadcasts on `match.{matchId}` as `match.resumed`
9. **MatchMapTransition** - Broadcasts on `match.{matchId}` as `map.transition`
10. **ChatMessageCreated** - For chat functionality
11. **MatchUpdated** - (Created) Broadcasts on `match.{matchId}` as `match.updated`

### Frontend Event Listeners
In `/var/www/mrvl-frontend/frontend/src/lib/pusher.ts`, the frontend listens for:

```javascript
// Backend event names (correct naming)
channel.bind('hero.updated', callback);
channel.bind('MatchMapStarted', callback);  // ISSUE: Should be 'map.started'
channel.bind('MatchMapEnded', callback);    // ISSUE: Should be 'map.ended'
channel.bind('MatchKillEvent', callback);   // ISSUE: Should be 'kill.event'
channel.bind('MatchObjectiveUpdate', callback); // ISSUE: Should be 'objective.update'
channel.bind('MatchPaused', callback);      // ISSUE: Should be 'match.paused'
channel.bind('MatchResumed', callback);     // ISSUE: Should be 'match.resumed'
channel.bind('match.map.transition', callback); // ISSUE: Should be 'map.transition'
channel.bind('match.started', callback);

// Legacy events (for compatibility)
channel.bind('score-updated', callback);
channel.bind('map-started', callback);
channel.bind('map-ended', callback);
// ... etc
```

## Issues Found

### 1. Event Name Mismatch
The frontend is listening for class names instead of the broadcast names defined in `broadcastAs()`:
- Frontend listens for: `MatchMapStarted`
- Backend broadcasts as: `map.started`

### 2. Missing MatchUpdated Event
The backend controllers reference `\App\Events\MatchUpdated` but the event class was missing. This has been created.

### 3. Broadcasting Configuration
The backend is currently configured with `BROADCAST_CONNECTION=log` which means events are only logged, not actually broadcast. This needs to be changed to `pusher` for real broadcasting.

### 4. WebSocket vs Pusher Confusion
The `ComprehensiveMatchControl.js` component uses raw WebSocket connections while other components use Pusher. This creates inconsistency.

## Fixes Required

### 1. Fix Frontend Event Listeners
Update `/var/www/mrvl-frontend/frontend/src/lib/pusher.ts`:

```javascript
// Correct event names matching backend broadcastAs()
channel.bind('hero.updated', callback);
channel.bind('map.started', callback);      // Fixed from 'MatchMapStarted'
channel.bind('map.ended', callback);        // Fixed from 'MatchMapEnded'
channel.bind('kill.event', callback);       // Fixed from 'MatchKillEvent'
channel.bind('objective.update', callback); // Fixed from 'MatchObjectiveUpdate'
channel.bind('match.paused', callback);     // Fixed from 'MatchPaused'
channel.bind('match.resumed', callback);    // Fixed from 'MatchResumed'
channel.bind('map.transition', callback);   // Fixed from 'match.map.transition'
channel.bind('match.started', callback);
channel.bind('match.updated', callback);    // Added for MatchUpdated event
```

### 2. Update Backend .env
Change broadcasting configuration:
```
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=your_app_id
PUSHER_APP_KEY=your_app_key
PUSHER_APP_SECRET=your_app_secret
PUSHER_APP_CLUSTER=us2
```

### 3. Standardize Real-time Communication
Choose either Pusher or WebSocket for all components, not both.

### 4. Add Missing Event Listeners
The frontend should also listen for:
- `objective.update` (from MatchObjectiveUpdate)
- `map.transition` (from MatchMapTransition)

## Channel Structure

All match-related events broadcast on: `match.{matchId}`

Additional channels used:
- `match.{matchId}.map.{mapId}` - Map-specific updates
- `match.{matchId}.live-scoring` - Live scoring updates
- `live-matches` - Global match updates
- `thread.{threadId}` - Forum thread updates
- `user.{userId}` - User notifications
- `global` - Global announcements
- `event.{eventId}` - Tournament event updates

## Testing Synchronization

1. Enable Pusher broadcasting in backend .env
2. Run queue workers: `php artisan queue:work`
3. Monitor Pusher Debug Console
4. Test each event type:
   - Start a match
   - Update scores
   - Change maps
   - Update player stats
   - Pause/resume matches