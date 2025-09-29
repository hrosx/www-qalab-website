# Google Tag Manager & Analytics Configuration Documentation

Last Updated: September 28, 2025

## Overview
This document describes the current Google Tag Manager (GTM) and Google Analytics 4 (GA4) tracking implementation for www.qalab.ai, including recent fixes for duplicate event firing and false trigger issues.

## ⚠️ CRITICAL DISCOVERY: Google Tag Auto-Forwarding Issue
**Root Cause of Duplicate Events**: The presence of a "Google Tag" (type: googtag) alongside individual GA4 Event tags causes duplicate/triple event firing. The Google Tag automatically forwards ALL dataLayer events to GA4, while individual GA4 Event tags also send the same events, resulting in 2-3x multiplication of events.

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
   - Triggered by iframe `postMessage` events from the voice assistant widget (`source: 'qalabs-voice-assistant', event: 'conversation_start'`)
   - Parent page listens for that message and pushes the GA4 event with dedupe protection
   - `conversation_end` messages reset the state so the next session can be tracked

#### Cross-Domain Communication
- Listens for PostMessage events from `https://assistant.qalab.ai`
- Detects conversation start/end messages
- Properly handles both string and object message formats

### 2. GTM Configuration (After Cleanup - Live Version 15)

#### Active Tags (Confirmed Live)
All tags now fire ONLY on their specific custom event triggers:

1. **Sign-up free trial -1** (Tag ID: 19)
   - Type: GA4 Event (gaawe)
   - Event Name: Sign-up free trial
   - Measurement ID Override: G-9EGHJ6SEEN
   - Fires on: Custom Event "Sign-up free trial" (Trigger ID: 16)
   - ✅ Verified: Only fires once per click

2. **ABBY** (Tag ID: 22)
   - Type: GA4 Event (gaawe)
   - Event Name: abby_conversation_start
   - Measurement ID Override: G-9EGHJ6SEEN
   - Fires on: Custom Event "abby_conversation_start" (Trigger ID: 31)
   - ✅ Verified: Only fires with user intent (button click or widget interaction)

3. **GA4 - Contact Us** (Tag ID: 42)
   - Type: GA4 Event (gaawe)
   - Event Name: contact_us_click
   - Measurement ID Override: G-9EGHJ6SEEN
   - Fires on: Custom Event "contact_us_click" (Trigger ID: 41)

#### Removed Tags (Critical for Fix)
- **Google Tag G-9EGHJ6SEEN** (Tag ID: 20) - **DELETED** - This was auto-forwarding ALL events causing duplicates
- **ABBY WebSocket Monitor** (Tag ID: 32) - **DELETED** - Was causing false triggers on page load
- **Google Analytics GA4 Configuration** (Tag ID: 1) - No longer needed with individual measurement overrides

#### Custom Event Triggers
- Trigger 16: "Sign-up free trial" custom event
- Trigger 31: "abby_conversation_start" custom event
- Trigger 33: "spa_page_view" custom event
- Trigger 38: "qa_lab_ai_click" custom event
- Trigger 41: "contact_us_click" custom event

## Problems That Were Fixed

### Issue 1: Sign-up Free Trial Firing Multiple Times
**Problem**: Event was firing 3–27 times per click
**Root Cause Discovered**:
- **Google Tag (type: googtag) was auto-forwarding ALL dataLayer events to GA4**
- Individual GA4 Event tags were also sending the same events
- Result: Each event was sent 2-3 times (Google Tag + Event Tag + possible enhanced measurement)

**Solution Implemented**:
- **Deleted Google Tag (ID: 20)** from GTM container
- Kept only individual GA4 Event tags with specific triggers
- Site code pushes single event with 150ms navigation delay and 1.5s dedupe window
- **Result**: ✅ Events now fire exactly once per interaction

### Issue 2: ABBY Conversation Firing Without Engagement
**Problem**: Event fired on page load without user interaction
**Root Cause**:
- ABBY WebSocket Monitor tag was firing on "All Pages" trigger
- Widget iframe broadcasts "conversation start" during initialization
- No user intent validation

**Solution Implemented**:
- **Deleted ABBY WebSocket Monitor tag (ID: 32)**
- Added `abbyUserIntent` flag in analytics.js
- Only honors iframe conversation messages after user clicks QA Lab AI button
- **Result**: ✅ ABBY events only fire with genuine user engagement

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

### Key API Endpoints & IDs
- **GTM Account ID**: 6314566179
- **GTM Container ID**: 230830811
- **GA4 Property**: properties/506457494
- **GA4 Measurement ID**: G-9EGHJ6SEEN

### Common GTM API Operations

#### 1. Get Current Workspace
```bash
curl -s -X GET 'https://www.googleapis.com/tagmanager/v2/accounts/6314566179/containers/230830811/workspaces' \
  -H 'Authorization: Bearer [TOKEN]'
```

#### 2. List All Tags in Workspace
```bash
curl -s -X GET 'https://www.googleapis.com/tagmanager/v2/accounts/6314566179/containers/230830811/workspaces/[WORKSPACE_ID]/tags' \
  -H 'Authorization: Bearer [TOKEN]'
```

#### 3. Delete a Tag (e.g., Google Tag)
```bash
curl -X DELETE 'https://www.googleapis.com/tagmanager/v2/accounts/6314566179/containers/230830811/workspaces/[WORKSPACE_ID]/tags/[TAG_ID]' \
  -H 'Authorization: Bearer [TOKEN]'
```

#### 4. Create GA4 Event Tag
```bash
curl -X POST 'https://www.googleapis.com/tagmanager/v2/accounts/6314566179/containers/230830811/workspaces/[WORKSPACE_ID]/tags' \
  -H 'Authorization: Bearer [TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '{
    "name": "Tag Name",
    "type": "gaawe",
    "parameter": [
      {"type": "boolean", "key": "sendEcommerceData", "value": "false"},
      {"type": "template", "key": "eventName", "value": "event_name_here"},
      {"type": "template", "key": "measurementIdOverride", "value": "G-9EGHJ6SEEN"}
    ],
    "firingTriggerId": ["TRIGGER_ID"],
    "tagFiringOption": "oncePerEvent"
  }'
```

#### 5. Update Existing Tag
```bash
curl -X PUT 'https://www.googleapis.com/tagmanager/v2/accounts/6314566179/containers/230830811/workspaces/[WORKSPACE_ID]/tags/[TAG_ID]' \
  -H 'Authorization: Bearer [TOKEN]' \
  -H 'Content-Type: application/json' \
  -d '[COMPLETE_TAG_JSON]'
```

#### 6. Check for Google Tag Issues
```bash
# Find all Google Tags (type: googtag) - THESE CAUSE DUPLICATES
curl -s -X GET '[workspace_tags_url]' | python3 -c "
import json, sys
tags = json.load(sys.stdin).get('tag', [])
google_tags = [t for t in tags if t.get('type') == 'googtag']
if google_tags:
    print('WARNING: Google Tag found - will cause duplicate events!')
    for t in google_tags:
        print(f\"  ID {t['tagId']}: {t.get('name')}\")
else:
    print('✓ No Google Tags found')
"
```

### Known Trigger IDs
- **Trigger 16**: Sign-up free trial (custom event)
- **Trigger 31**: abby_conversation_start (custom event)
- **Trigger 38**: qa_lab_ai_click (custom event)
- **Trigger 41**: contact_us_click (custom event)
- **Trigger 2147479553**: All Pages (built-in)

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

## CRITICAL: Google Tag Auto-Detection Issue

### The Problem
GTM automatically suggests adding a "Google Tag" when it detects GA4 measurement IDs in your tags. This suggestion appears as a blue banner in GTM interface. **DO NOT ADD THIS TAG.**

### Why This Happens
- GTM sees you're using measurement ID `G-9EGHJ6SEEN`
- It assumes you need a Google Tag for configuration
- It doesn't know you're using `measurementIdOverride` on individual tags

### The Solution
**Always check for and remove Google Tags:**

```bash
# Quick check for Google Tag in workspace
curl -s -X GET 'https://www.googleapis.com/tagmanager/v2/accounts/6314566179/containers/230830811/workspaces/[WORKSPACE_ID]/tags' \
  -H 'Authorization: Bearer [TOKEN]' | grep -c '"type":"googtag"'
# If result > 0, Google Tag exists and should be deleted
```

### Correct Configuration
✅ **Use ONLY individual GA4 Event tags with measurementIdOverride**
```json
{
  "type": "gaawe",
  "parameter": [
    {"key": "measurementIdOverride", "value": "G-9EGHJ6SEEN"},
    {"key": "eventName", "value": "your_event_name"}
  ]
}
```

❌ **Never use Google Tag (type: googtag) with individual GA4 Event tags**

### If GTM Keeps Suggesting Google Tag
1. Ignore the suggestion
2. Close the banner
3. Never click "Add to workspace"
4. The suggestion will reappear but won't affect functionality

## Key Lessons Learned

### Google Tag vs GA4 Event Tags
**CRITICAL**: Never use both a Google Tag (googtag) and individual GA4 Event tags in the same container. The Google Tag auto-forwards ALL dataLayer events, causing duplication when combined with specific event tags.

**Best Practice**: Use EITHER:
- Google Tag alone (with built-in event configuration)
- OR individual GA4 Event tags (recommended for precise control)

## Change History

### September 28, 2025 - Complete Fix
**Morning Session**:
- Complete rewrite of analytics.js with event deduplication system by external model
- Added `abbyUserIntent` flag for proper conversation tracking
- Implemented deduplication windows (1500ms for Sign-up, 800ms for others)

**Afternoon Session - Root Cause Discovery**:
- Discovered Google Tag (ID: 20) was auto-forwarding all events
- Deleted Google Tag from GTM container
- Deleted ABBY WebSocket Monitor tag (ID: 32)
- Published as Live Version 15
- **Result**: Fixed Sign-up free trial (was 3-27x, now 1x)
- **Result**: Fixed ABBY conversation false triggers
- Verified with dataLayer inspection and GA4 real-time