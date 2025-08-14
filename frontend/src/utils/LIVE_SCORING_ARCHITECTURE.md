# Live Scoring Architecture

## Overview
Live scoring is implemented EXCLUSIVELY between:
1. **Admin Live Scoring Panel** (`UnifiedLiveScoring.js`)
2. **Match Detail Page** (`MatchDetailPage.js`)

## How It Works

### Admin Panel → Match Detail Page
1. Admin opens `UnifiedLiveScoring` panel from match detail page
2. Admin makes changes (scores, heroes, stats)
3. Changes broadcast via `LiveScoreSync.broadcastUpdate()`
4. Updates stored in localStorage with key `mrvl_live_match_{matchId}`
5. Match detail page receives instant update via storage event
6. UI updates immediately without refresh

### Technology Stack
- **localStorage events** - For instant cross-tab communication (0ms)
- **Ultra-fast polling (200ms)** - Sub-second server synchronization
- **No WebSockets** - No Pusher, no Echo, no external dependencies
- **Rate limiting** - Prevents request overwhelming

## Files Involved

### Core Files (DO NOT DELETE)
- `/utils/LiveScoreSync.js` - The sync utility
- `/components/admin/UnifiedLiveScoring.js` - Admin panel
- `/components/pages/MatchDetailPage.js` - Display page

### Isolated System
- **NO OTHER COMPONENTS** should import or use `LiveScoreSync`
- Live scoring is **NOT** used in:
  - HomePage
  - MatchesPage  
  - TeamDetailPage
  - PlayerDetailPage
  - Any mobile/tablet views
  - Any other admin pages

## API Endpoint
- `POST /api/admin/matches/{matchId}/live-update`
- Requires admin authentication
- Supports all match data updates

## Testing
1. Open match detail page in multiple tabs
2. Open admin panel in one tab
3. Make changes in admin panel
4. Verify immediate updates in all tabs
5. No refresh required

## Important Notes
- Live scoring is ONLY for active match management
- It does NOT affect match lists or other pages
- Player profile updates use a separate system
- Tournament brackets have their own update mechanism