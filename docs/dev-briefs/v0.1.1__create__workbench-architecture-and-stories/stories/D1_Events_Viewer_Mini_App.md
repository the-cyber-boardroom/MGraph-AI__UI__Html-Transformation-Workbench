# Story D1: Events Viewer Mini App

**Story ID:** D1  
**Layer:** Debug Tools  
**Priority:** HIGH (essential for debugging)  
**Parallel With:** D2, M1-M7  
**Dependencies:** F1 (Shell), F2 (Events)

---

## 1. Purpose

Create a debugging mini app that displays all events flowing through the event bus in real-time. Essential for:
- Understanding what events are being emitted
- Debugging event payloads
- Testing event-based communication
- Replaying events to test handlers

---

## 2. UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           EVENTS VIEWER                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Filter: [___________________]  [All Events ▼]  [⏸ Pause] [🗑 Clear] [📥 Export]│
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ #47  html-loaded                                          10:45:23.456     ││
│  │      source: html-workbench                                                 ││
│  │  ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │  │ {                                                                   │   ││
│  │  │   "cacheKey": "example.com/about",                                  │   ││
│  │  │   "cacheId": "aa27fb2a-f8d2-44aa-adca-5dc1736fdddd",               │   ││
│  │  │   "html": "<html>...",                                              │   ││
│  │  │   "charCount": 1234                                                 │   ││
│  │  │ }                                                                   │   ││
│  │  └─────────────────────────────────────────────────────────────────────┘   ││
│  │  [▶ Replay]  [📋 Copy]                                                      ││
│  ├─────────────────────────────────────────────────────────────────────────────┤│
│  │ #46  navigate                                             10:45:20.123     ││
│  │      source: nav-bar                                                        ││
│  │  ▶ { "appId": "html-workbench" }                          [▶] [📋]         ││
│  ├─────────────────────────────────────────────────────────────────────────────┤│
│  │ #45  config-changed                                       10:45:15.789     ││
│  │      source: settings-panel                                                 ││
│  │  ▶ { "path": "defaults.namespace", "value": "my-ns" }     [▶] [📋]         ││
│  ├─────────────────────────────────────────────────────────────────────────────┤│
│  │ #44  api-response                                         10:45:12.456     ││
│  │      source: api-client                                                     ││
│  │  ▶ { "id": 15, "status": 200, "duration": 145 }           [▶] [📋]         ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│  Showing 47 events (3 filtered)  |  Stream: ● Live                              │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Features

### 3.1 Real-time Stream
- Events appear as they're emitted (newest first)
- Auto-scroll to new events (when not paused)
- Visual indicator for new events

### 3.2 Filtering
- Text filter: Search by event name or content
- Dropdown filter: Select specific event types
- Show/hide system events (api-request, api-response, etc.)

### 3.3 Event Display
- Collapsible detail view (click to expand/collapse)
- Syntax-highlighted JSON payload
- Timestamp with milliseconds
- Source app (if available)

### 3.4 Actions
- **Pause/Resume:** Stop auto-updating to examine events
- **Clear:** Clear the display (doesn't affect history)
- **Export:** Download event history as JSON
- **Replay:** Re-emit an event from history
- **Copy:** Copy event payload to clipboard

---

## 4. Component Structure

```javascript
class EventsViewer extends HTMLElement {
    
    static get appId()    { return 'events-viewer'; }
    static get navLabel() { return 'Events'; }
    static get navIcon()  { return '📡'; }
    
    constructor() {
        super();
        this.state = {
            events: [],           // Displayed events
            filter: '',           // Text filter
            eventTypeFilter: '',  // Event type filter
            isPaused: false,      // Stream paused?
            expandedIds: new Set() // Which events are expanded
        };
        this._boundHandlers = {};
    }
    
    // ... lifecycle methods ...
    
    // Subscribe to ALL events
    setupEventListeners() {
        // Listen to everything via a catch-all approach
        // Store original emit and wrap it
        this._originalEmit = this.events.emit.bind(this.events);
        this.events.emit = (name, detail) => {
            this.onEventEmitted(name, detail);
            return this._originalEmit(name, detail);
        };
    }
    
    cleanup() {
        // Restore original emit
        if (this._originalEmit) {
            this.events.emit = this._originalEmit;
        }
    }
    
    onEventEmitted(name, detail) {
        if (this.state.isPaused) return;
        
        const event = {
            id: this.events.history.length,
            name,
            detail,
            timestamp: Date.now()
        };
        
        this.state.events.unshift(event);
        this.renderEventList();
    }
    
    // ... render methods ...
}
```

---

## 5. Events

### Events to LISTEN
- ALL events (via emit wrapper or polling history)

### Events to EMIT
- None (this is a passive observer)
- Exception: When replaying, it calls `events.replay(id)`

---

## 6. UI Interactions

### Filter Input
```javascript
onFilterChange(e) {
    this.state.filter = e.target.value.toLowerCase();
    this.renderEventList();
}
```

### Event Type Dropdown
```javascript
// Populate from unique event names in history
getEventTypes() {
    const types = new Set(this.events.history.map(e => e.name));
    return Array.from(types).sort();
}

onEventTypeChange(e) {
    this.state.eventTypeFilter = e.target.value;
    this.renderEventList();
}
```

### Toggle Expand
```javascript
toggleExpand(eventId) {
    if (this.state.expandedIds.has(eventId)) {
        this.state.expandedIds.delete(eventId);
    } else {
        this.state.expandedIds.add(eventId);
    }
    this.renderEventList();
}
```

### Pause/Resume
```javascript
togglePause() {
    this.state.isPaused = !this.state.isPaused;
    this.updatePauseButton();
}
```

### Clear
```javascript
clearDisplay() {
    this.state.events = [];
    this.renderEventList();
}
```

### Export
```javascript
exportHistory() {
    const data = JSON.stringify(this.events.history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `events-${Date.now()}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}
```

### Replay
```javascript
replayEvent(eventId) {
    this.events.replay(eventId);
}
```

### Copy
```javascript
copyEvent(event) {
    const text = JSON.stringify(event.detail, null, 2);
    navigator.clipboard.writeText(text);
    this.showToast('Copied to clipboard');
}
```

---

## 7. Filtered Event List

```javascript
getFilteredEvents() {
    return this.state.events.filter(event => {
        // Text filter
        if (this.state.filter) {
            const searchText = JSON.stringify(event).toLowerCase();
            if (!searchText.includes(this.state.filter)) {
                return false;
            }
        }
        
        // Event type filter
        if (this.state.eventTypeFilter && event.name !== this.state.eventTypeFilter) {
            return false;
        }
        
        return true;
    });
}
```

---

## 8. File Structure

```
v0.1.0/
└── components/
    └── events-viewer/
        ├── events-viewer.js
        └── events-viewer.test.js
```

---

## 9. Acceptance Criteria

- [ ] Appears in nav bar as "Events"
- [ ] Shows events in real-time as they're emitted
- [ ] Events show name, timestamp, and source
- [ ] Click event to expand/collapse payload
- [ ] Payload displayed as formatted JSON
- [ ] Text filter filters by event content
- [ ] Dropdown filter filters by event type
- [ ] Pause button stops auto-update
- [ ] Clear button empties display
- [ ] Export downloads JSON file
- [ ] Replay button re-emits event
- [ ] Copy button copies payload to clipboard
- [ ] Shows count of displayed vs total events
- [ ] No performance issues with many events (virtualize if needed)

---

## 10. CSS Styling

```css
.events-viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: system-ui;
}

.ev-toolbar {
    display: flex;
    gap: 10px;
    padding: 10px;
    border-bottom: 1px solid #ddd;
    background: #f9f9f9;
}

.ev-filter-input {
    flex: 1;
    padding: 8px;
}

.ev-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
}

.ev-event {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin-bottom: 8px;
    background: white;
}

.ev-event-header {
    display: flex;
    justify-content: space-between;
    padding: 10px;
    cursor: pointer;
    background: #f5f5f5;
}

.ev-event-header:hover {
    background: #eee;
}

.ev-event-id {
    font-weight: bold;
    color: #666;
}

.ev-event-name {
    font-weight: bold;
    color: #2196F3;
}

.ev-event-time {
    color: #999;
    font-size: 12px;
}

.ev-event-detail {
    padding: 10px;
    border-top: 1px solid #eee;
    background: #fafafa;
}

.ev-event-json {
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 12px;
    white-space: pre-wrap;
    background: #282c34;
    color: #abb2bf;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
}

.ev-actions {
    display: flex;
    gap: 5px;
    padding: 10px;
    border-top: 1px solid #eee;
}

.ev-actions button {
    padding: 5px 10px;
    font-size: 12px;
    cursor: pointer;
}

.ev-status {
    padding: 10px;
    border-top: 1px solid #ddd;
    background: #f9f9f9;
    font-size: 12px;
    color: #666;
}

.ev-live-indicator {
    color: green;
}

.ev-paused-indicator {
    color: orange;
}
```

---

*Refer to SHARED_BRIEFING.md for platform context and coding standards.*
