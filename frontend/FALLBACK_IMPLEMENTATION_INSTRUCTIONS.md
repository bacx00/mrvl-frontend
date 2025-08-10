# MRVL Image Fallback Implementation Plan

## Summary
- **Components Analyzed**: 86
- **Fallbacks Needed**: 26
- **Total Fixes Required**: 26

## Critical Issues
- **MOBILE**: MobileBracketVisualization.js needs 2 fallback fixes\n- **MOBILE**: MobileEnhancements.js needs 1 fallback fixes\n- **MOBILE**: MobileForumThread.js needs 1 fallback fixes\n- **MOBILE**: MobileMatchCard.js needs 2 fallback fixes\n- **MOBILE**: MobileMatchDetail.js needs 2 fallback fixes\n- **MOBILE**: MobileOnboarding.js needs 1 fallback fixes\n- **MOBILE**: MobileTeamCard.js needs 1 fallback fixes\n- **MOBILE**: MobileTextEditor.js needs 2 fallback fixes\n- **MOBILE**: MobileUserProfile.js needs 1 fallback fixes\n- **MOBILE**: PerformanceOptimizations.js needs 1 fallback fixes\n- **MOBILE**: VirtualizedForumList.js needs 1 fallback fixes\n- **ADMIN**: ComprehensiveMatchControl.js needs 4 fallback fixes\n- **ADMIN**: ForumModerationPanel.js needs 1 fallback fixes\n- **ADMIN**: NewsFormSimple.js needs 1 fallback fixes

## Implementation Priority

### HIGH PRIORITY - Mobile Components

#### MobileBracketVisualization.js
- **Path**: `/var/www/mrvl-frontend/frontend/src/components/mobile/MobileBracketVisualization.js`
- **Fixes Needed**: 2
- **Import Required**: Yes - Add: import { getImageUrl } from "../../utils/imageUtils";

**Fixes:**
- Line 692: Add `general` fallback handler\n- Line 733: Add `general` fallback handler

#### MobileEnhancements.js
- **Path**: `/var/www/mrvl-frontend/frontend/src/components/mobile/MobileEnhancements.js`
- **Fixes Needed**: 1
- **Import Required**: Yes - Add: import { getImageUrl } from "../../utils/imageUtils";

**Fixes:**
- Line 304: Add `general` fallback handler

#### MobileForumThread.js
- **Path**: `/var/www/mrvl-frontend/frontend/src/components/mobile/MobileForumThread.js`
- **Fixes Needed**: 1
- **Import Required**: Yes - Add: import { getImageUrl } from "../../utils/imageUtils";

**Fixes:**
- Line 291: Add `general` fallback handler

#### MobileMatchDetail.js
- **Path**: `/var/www/mrvl-frontend/frontend/src/components/mobile/MobileMatchDetail.js`
- **Fixes Needed**: 2
- **Import Required**: Yes - Add: import { getImageUrl } from "../../utils/imageUtils";

**Fixes:**
- Line 390: Add `general` fallback handler\n- Line 540: Add `general` fallback handler

#### MobileOnboarding.js
- **Path**: `/var/www/mrvl-frontend/frontend/src/components/mobile/MobileOnboarding.js`
- **Fixes Needed**: 1
- **Import Required**: Yes - Add: import { getImageUrl } from "../../utils/imageUtils";

**Fixes:**
- Line 443: Add `general` fallback handler

#### MobileTextEditor.js
- **Path**: `/var/www/mrvl-frontend/frontend/src/components/mobile/MobileTextEditor.js`
- **Fixes Needed**: 2
- **Import Required**: Yes - Add: import { getImageUrl } from "../../utils/imageUtils";

**Fixes:**
- Line 378: Add `general` fallback handler\n- Line 518: Add `general` fallback handler

#### MobileUserProfile.js
- **Path**: `/var/www/mrvl-frontend/frontend/src/components/mobile/MobileUserProfile.js`
- **Fixes Needed**: 1
- **Import Required**: Yes - Add: import { getImageUrl } from "../../utils/imageUtils";

**Fixes:**
- Line 298: Add `general` fallback handler

#### PerformanceOptimizations.js
- **Path**: `/var/www/mrvl-frontend/frontend/src/components/mobile/PerformanceOptimizations.js`
- **Fixes Needed**: 1
- **Import Required**: Yes - Add: import { getImageUrl } from "../../utils/imageUtils";

**Fixes:**
- Line 54: Add `general` fallback handler

#### VirtualizedForumList.js
- **Path**: `/var/www/mrvl-frontend/frontend/src/components/mobile/VirtualizedForumList.js`
- **Fixes Needed**: 1
- **Import Required**: Yes - Add: import { getImageUrl } from "../../utils/imageUtils";

**Fixes:**
- Line 109: Add `general` fallback handler


### HIGH PRIORITY - Admin Components  

#### ComprehensiveMatchControl.js
- **Path**: `/var/www/mrvl-frontend/frontend/src/components/admin/ComprehensiveMatchControl.js`
- **Fixes Needed**: 4
- **Import Required**: Yes - Add: import { getImageUrl } from "../../utils/imageUtils";

**Fixes:**
- Line 720: Add `general` fallback handler\n- Line 754: Add `general` fallback handler\n- Line 1039: Add `general` fallback handler\n- Line 1118: Add `general` fallback handler

#### ForumModerationPanel.js
- **Path**: `/var/www/mrvl-frontend/frontend/src/components/admin/ForumModerationPanel.js`
- **Fixes Needed**: 1
- **Import Required**: Yes - Add: import { getImageUrl } from "../../utils/imageUtils";

**Fixes:**
- Line 135: Add `general` fallback handler

#### NewsFormSimple.js
- **Path**: `/var/www/mrvl-frontend/frontend/src/components/admin/NewsFormSimple.js`
- **Fixes Needed**: 1
- **Import Required**: No

**Fixes:**
- Line 339: Add `general` fallback handler


### STANDARD PRIORITY - General Components

#### Header.tsx
- **Path**: `/var/www/mrvl-frontend/frontend/src/app/components/Header.tsx`  
- **Fixes Needed**: 2
- **Import Required**: Yes - Add: import { getImageUrl } from "../../utils/imageUtils";

**Fixes:**
- Line 261: Add `general` fallback handler\n- Line 472: Add `general` fallback handler

#### MobileMatchCard.js
- **Path**: `/var/www/mrvl-frontend/frontend/src/components/mobile/MobileMatchCard.js`  
- **Fixes Needed**: 4
- **Import Required**: Yes - Add: import { getImageUrl } from "../../utils/imageUtils";

**Fixes:**
- Line 133: Add `general` fallback handler\n- Line 181: Add `general` fallback handler\n- Line 133: Add `general` fallback handler\n- Line 181: Add `general` fallback handler

#### MobileTeamCard.js
- **Path**: `/var/www/mrvl-frontend/frontend/src/components/mobile/MobileTeamCard.js`  
- **Fixes Needed**: 2
- **Import Required**: Yes - Add: import { getImageUrl } from "../../utils/imageUtils";

**Fixes:**
- Line 53: Add `general` fallback handler\n- Line 53: Add `general` fallback handler


## Fallback Type Distribution
- **general**: 26 components

## Standard Fallback Handlers

### For Regular img elements:
```javascript
onError={(e) => {
  e.target.src = getImageUrl(null, 'FALLBACK_TYPE');
}}
```

### For Next.js Image components:
```typescript
onError={(e) => {
  (e.target as HTMLImageElement).src = getImageUrl(null, 'FALLBACK_TYPE');
}}
```

### Fallback Types:
- `'player-avatar'` - For player/user avatars
- `'team-logo'` - For team logos and flags
- `'event-banner'` - For event/tournament images  
- `'news-featured'` - For news article images
- `'general'` - For other images

## Testing After Implementation

Run this command to verify all fallbacks work:
```bash
node mrvl-image-fallback-comprehensive-test.js
```

Target: **100% fallback coverage** across all components.

---
*Generated by MRVL Missing Fallbacks Fix Test on 2025-08-08T20:28:18.331Z*
