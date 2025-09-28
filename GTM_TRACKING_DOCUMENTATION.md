# Google Tag Manager & Analytics Configuration Documentation

Last Updated: September 28, 2025

## Overview
This document describes the current Google Tag Manager (GTM) and Google Analytics 4 (GA4) tracking implementation for www.qalab.ai, including recent fixes for duplicate event firing and false trigger issues.

## Container & Property Information
- **GTM Container ID**: GTM-NWMMW3WL
- **GA4 Measurement ID**: G-9EGHJ6SEEN
- **GA4 Property ID**: properties/506457494
- **GTM Account ID**: 6314566179
- **GTM Container ID (numeric)**: 230830811
- **GTM Workspace ID**: 13
- **Production Domains**: qalab.ai, www.qalab.ai

## File Structure
```
/www-qalab-website/
├── www/
│   ├── index.html           # Contains GTM container snippet
│   ├── js/
│   │   └── analytics.js     # Core analytics implementation (completely rewritten)
│   └── [other site files]
```

## Current Implementation (After Fixes)

### 1. Analytics.js - Complete Rewrite
The analytics.js file was completely rewritten to solve duplicate firing issues. Key features:

#### Core Architecture
- **Single source of truth** for all tracking events
- **Event deduplication system** using time windows
- **Proper event binding** with flags to prevent duplicate listeners
- **SPA navigation tracking** with history API interception

#### Key Functions

**Event Deduplication (`pushEvent`)**:
```javascript
function pushEvent(name, payload, dedupeWindowMs) {
  // Default 400ms deduplication window
  // Customizable per event type
  // Prevents duplicate events within time window
}
```

**Event Time Windows**:
- Sign-up free trial: 1500ms deduplication window
- QA Lab AI clicks: 800ms deduplication window
- Contact Us clicks: 800ms deduplication window
- ABBY conversation: 0ms (immediate, controlled by flag)
- Page views: -1 (never deduplicate)

#### Tracked Events

1. **SPA Page Views** (`spa_page_view`)
   - Fires on route changes
   - Tracks pathname, search, and hash
   - Never deduplicated

2. **Sign-up Free Trial** (`Sign-up free trial`)
   - Selector: `a.nav-signup-link[href*="signup"]`
   - 1500ms deduplication window
   - Prevents navigation, pushes event, then navigates after 150ms
   - Solves cross-domain navigation tracking

3. **QA Lab AI Button** (`qa_lab_ai_click`)
   - Selector: `[data-ga-event="qa_lab_ai"]`
   - 800ms deduplication window
   - Also triggers ABBY conversation start on first click

4. **Contact Us** (`contact_us_click`)
   - Selector: `#contactUsLink`
   - 800ms deduplication window

5. **ABBY Conversation Start** (`abby_conversation_start`)
   - Triggered by:
     - QA Lab AI button click (first time)
     - PostMessage from iframe with conversation start action
   - Uses flag to prevent multiple starts
   - Resets on conversation end message

#### Cross-Domain Communication
- Listens for PostMessage events from `https://assistant.qalab.ai`
- Detects conversation start/end messages
- Properly handles both string and object message formats

### 2. GTM Configuration (After Cleanup)

#### Active Tags
All tags now fire ONLY on their specific custom event triggers:

1. **Google Analytics GA4 Configuration** (Tag ID: 1)
   - Type: GA4 Configuration (gaawc)
   - Measurement ID: G-9EGHJ6SEEN
   - Fires on: All Pages (configuration tag only)

2. **Sign-up free trial** (Tag ID: 19)
   - Type: GA4 Event (gaawe)
   - Event Name: Sign-up free trial
   - Fires on: Custom Event "Sign-up free trial" (Trigger ID: 16)
   - ✅ No duplicate triggers

3. **ABBY** (Tag ID: 22)
   - Type: GA4 Event (gaawe)
   - Event Name: abby_conversation_start
   - Fires on: Custom Event "abby_conversation_start" (Trigger ID: 31)
   - ✅ Only fires on actual user interaction

4. **GA4 - Contact Us** (Tag ID: 42)
   - Type: GA4 Event (gaawe)
   - Event Name: contact_us_click
   - Fires on: Custom Event "contact_us_click" (Trigger ID: 41)

#### Removed Tags
- **ABBY WebSocket Monitor** (Tag ID: 32) - Deleted as it was causing false triggers on page load

#### Custom Event Triggers
- Trigger 16: "Sign-up free trial" custom event
- Trigger 31: "abby_conversation_start" custom event
- Trigger 33: "spa_page_view" custom event
- Trigger 38: "qa_lab_ai_click" custom event
- Trigger 41: "contact_us_click" custom event

## Problems That Were Fixed

### Issue 1: Sign-up Free Trial Firing Multiple Times
**Problem**: Event was firing 3-27 times per click
**Root Cause**:
- Multiple event listeners being attached
- Event bubbling causing re-triggers
- GTM tags potentially firing on page load + custom event

**Solution**:
- Implemented 1500ms deduplication window
- Added `__gtmBound` flag to prevent duplicate listeners
- Simplified to single event push with controlled navigation
- Removed all "All Pages" triggers from GTM tags

### Issue 2: ABBY Conversation Firing Without Engagement
**Problem**: Event fired on page load without user interaction
**Root Cause**:
- WebSocket Monitor tag firing on "All Pages" trigger
- No user interaction validation

**Solution**:
- Deleted the WebSocket Monitor tag entirely
- Moved logic to analytics.js with proper user interaction detection
- Only fires when:
  - User clicks QA Lab AI button
  - Widget sends explicit conversation start message
- Added conversation state management with reset capability

## Testing & Verification

### GTM Preview Mode
1. Visit: `https://www.qalab.ai/?gtm_debug=1`
2. Verify each interaction fires exactly one event
3. Check that ABBY only fires on actual engagement

### GA4 DebugView
1. Open GA4 > Configure > DebugView
2. Test each interaction
3. Confirm single event per action

### Browser Console
The new analytics.js logs key events:
- Event pushes with timestamps
- Deduplication blocks
- Navigation delays

## Best Practices Implemented

1. **Single Event Source**: All tracking logic centralized in analytics.js
2. **Deduplication**: Time-based windows prevent rapid duplicate fires
3. **Proper Event Binding**: Flags prevent multiple listener attachment
4. **Cross-Domain Handling**: 150ms delay ensures events send before navigation
5. **SPA Support**: History API interception for route change tracking
6. **Clean Separation**: GTM tags only fire on custom events, not page loads

## API Access for Management

### OAuth Scopes Required
- `https://www.googleapis.com/auth/tagmanager.edit.containers`
- `https://www.googleapis.com/auth/tagmanager.readonly`

### Key API Endpoints
```bash
# List tags
GET https://www.googleapis.com/tagmanager/v2/accounts/6314566179/containers/230830811/workspaces/13/tags

# List triggers
GET https://www.googleapis.com/tagmanager/v2/accounts/6314566179/containers/230830811/workspaces/13/triggers

# GA4 Reporting
POST https://analyticsdata.googleapis.com/v1beta/properties/506457494:runReport
```

## Maintenance Notes

### Adding New Events
1. Add event handler in analytics.js `bindInteractionHandlers()`
2. Use `pushEvent()` with appropriate deduplication window
3. Create corresponding GTM tag that fires ONLY on the custom event

### Debugging Duplicate Events
1. Check browser console for multiple event pushes
2. Verify GTM tag triggers (should only be custom events)
3. Look for multiple listener attachments
4. Check deduplication window timing

### Common Pitfalls to Avoid
- Don't add "All Pages" triggers to event tags
- Don't use GTM's built-in click triggers for cross-domain links
- Always use deduplication for user interactions
- Test in GTM Preview mode before publishing

## Change History

### September 28, 2025
- Complete rewrite of analytics.js with event deduplication system
- Removed ABBY WebSocket Monitor tag from GTM
- Fixed Sign-up free trial multiple firing (was 3-27x, now 1x)
- Fixed ABBY conversation false triggers on page load
- Centralized all tracking logic in analytics.js
- Verified all GTM tags use only custom event triggers