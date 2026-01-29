# Story F2: Event Bus Service

**Story ID:** F2  
**Layer:** Foundation  
**Priority:** BLOCKING (must complete before all other stories)  
**Parallel With:** F1, F3, F4  
**Dependencies:** None

---

## 1. Purpose

Create a centralized event bus for cross-component communication. All mini apps communicate EXCLUSIVELY through this bus - no direct method calls between components.

**You are building:**
- Event emission and subscription mechanism
- Event history storage for debugging
- Replay functionality to re-emit past events
- The `window.workbench.events` service

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EVENT BUS                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────┐         ┌──────────────┐         ┌─────────────┐             │
│   │  Mini App A │         │              │         │  Mini App B │             │
│   │             │  emit   │   Event Bus  │  notify │             │             │
│   │  'click'    │ ──────► │              │ ──────► │  handler()  │             │
│   │             │         │  - history   │         │             │             │
│   └─────────────┘         │  - listeners │         └─────────────┘             │
│                           │              │                                      │
│                           └──────────────┘                                      │
│                                  │                                              │
│                                  ▼                                              │
│                           ┌──────────────┐                                      │
│                           │   History    │                                      │
│                           │  [event 1]   │                                      │
│                           │  [event 2]   │                                      │
│                           │  [event 3]   │                                      │
│                           └──────────────┘                                      │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Event Bus API

```javascript
window.workbench.events = {
    
    // ═══════════════════════════════════════════════════════════════════
    // Core Methods
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Emit an event to all subscribers
     * @param {string} eventName - Name of the event
     * @param {object} detail - Event payload
     */
    emit(eventName, detail = {}) {
        // 1. Create event record with ID and timestamp
        // 2. Add to history
        // 3. Notify all subscribers for this eventName
    },
    
    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event to listen for
     * @param {function} callback - Function to call with event detail
     */
    on(eventName, callback) {
        // Add callback to listeners for eventName
    },
    
    /**
     * Unsubscribe from an event
     * @param {string} eventName - Name of the event
     * @param {function} callback - The same function passed to on()
     */
    off(eventName, callback) {
        // Remove callback from listeners for eventName
    },
    
    // ═══════════════════════════════════════════════════════════════════
    // History & Debugging
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Get event history
     * @returns {Array} Array of past events
     */
    get history() {
        return this._history;
    },
    
    /**
     * Replay an event from history
     * @param {number} eventId - ID of the event to replay
     */
    replay(eventId) {
        // Find event in history by ID
        // Re-emit with same name and detail
    },
    
    /**
     * Clear event history
     */
    clearHistory() {
        this._history = [];
    },
    
    /**
     * Get listeners count for debugging
     * @param {string} eventName - Optional: specific event name
     * @returns {object|number} Listener counts
     */
    listenerCount(eventName) {
        // Return count of listeners
    }
};
```

---

## 4. Event Record Structure

Every event in the history has this structure:

```javascript
{
    id: 42,                          // Auto-incrementing unique ID
    name: 'html-loaded',             // Event name
    detail: {                        // Payload (whatever was passed)
        cacheKey: 'example.com/about',
        html: '<html>...',
        cacheId: 'aa27fb2a-...'
    },
    timestamp: 1768970000000,        // Date.now() when emitted
    _source: 'html-workbench'        // Optional: which component emitted
}
```

---

## 5. Implementation Requirements

### 5.1 Listener Storage

```javascript
// Internal structure
this._listeners = {
    'html-loaded': [callback1, callback2],
    'navigate': [callback3],
    // ...
};
```

### 5.2 History Storage

```javascript
// Keep last N events (suggest 1000)
this._history = [];
this._maxHistory = 1000;
this._nextId = 1;
```

### 5.3 Emit Implementation

```javascript
emit(eventName, detail = {}) {
    // Create event record
    const event = {
        id: this._nextId++,
        name: eventName,
        detail: { ...detail },  // Clone to prevent mutation
        timestamp: Date.now()
    };
    
    // Add to history (trim if needed)
    this._history.push(event);
    if (this._history.length > this._maxHistory) {
        this._history.shift();
    }
    
    // Notify listeners
    const listeners = this._listeners[eventName] || [];
    listeners.forEach(callback => {
        try {
            callback(event.detail);
        } catch (error) {
            console.error(`Event handler error for ${eventName}:`, error);
        }
    });
    
    return event.id;  // Return ID for potential replay reference
}
```

### 5.4 Error Handling

- Listeners should be wrapped in try/catch
- One failing listener should NOT prevent others from receiving the event
- Errors should be logged to console

---

## 6. File Structure

```
v0.1.0/
└── js/
    ├── event-bus.js         # Main implementation
    └── event-bus.test.js    # Tests
```

---

## 7. Usage Examples

### Basic emit and subscribe:

```javascript
// In Mini App A: emit an event
window.workbench.events.emit('html-loaded', {
    cacheKey: 'example.com/about',
    html: '<html>Hello</html>',
    cacheId: 'abc123'
});

// In Mini App B: subscribe to event
const handler = (detail) => {
    console.log('HTML loaded:', detail.cacheKey);
    this.displayHtml(detail.html);
};
window.workbench.events.on('html-loaded', handler);

// Later: unsubscribe (important for cleanup!)
window.workbench.events.off('html-loaded', handler);
```

### Accessing history:

```javascript
// Get all events
const allEvents = window.workbench.events.history;

// Filter by event name
const htmlEvents = allEvents.filter(e => e.name === 'html-loaded');

// Get last 10 events
const recent = allEvents.slice(-10);
```

### Replaying an event:

```javascript
// Find an event
const event = window.workbench.events.history.find(e => e.id === 42);

// Replay it (re-emits to all current listeners)
window.workbench.events.replay(42);
```

---

## 8. Acceptance Criteria

- [ ] `window.workbench.events` is available
- [ ] `emit(name, detail)` notifies all subscribers
- [ ] `on(name, callback)` registers a listener
- [ ] `off(name, callback)` removes a listener
- [ ] Events are stored in history with ID and timestamp
- [ ] `history` property returns array of past events
- [ ] `replay(eventId)` re-emits an event from history
- [ ] `clearHistory()` empties the history
- [ ] One failing listener doesn't break other listeners
- [ ] History is capped at reasonable size (e.g., 1000)
- [ ] Detail objects are cloned to prevent mutation

---

## 9. Test Cases

```javascript
// Test: Basic emit and receive
QUnit.test('emit notifies subscribers', function(assert) {
    const events = window.workbench.events;
    let received = null;
    
    events.on('test-event', (detail) => { received = detail; });
    events.emit('test-event', { value: 42 });
    
    assert.deepEqual(received, { value: 42 });
});

// Test: Multiple subscribers
QUnit.test('emit notifies all subscribers', function(assert) {
    const events = window.workbench.events;
    let count = 0;
    
    events.on('multi-test', () => { count++; });
    events.on('multi-test', () => { count++; });
    events.on('multi-test', () => { count++; });
    events.emit('multi-test', {});
    
    assert.equal(count, 3);
});

// Test: Unsubscribe works
QUnit.test('off removes listener', function(assert) {
    const events = window.workbench.events;
    let count = 0;
    const handler = () => { count++; };
    
    events.on('off-test', handler);
    events.emit('off-test', {});  // count = 1
    events.off('off-test', handler);
    events.emit('off-test', {});  // count still 1
    
    assert.equal(count, 1);
});

// Test: History is maintained
QUnit.test('events stored in history', function(assert) {
    const events = window.workbench.events;
    events.clearHistory();
    
    events.emit('history-test', { a: 1 });
    events.emit('history-test', { a: 2 });
    
    assert.equal(events.history.length, 2);
    assert.equal(events.history[0].detail.a, 1);
    assert.equal(events.history[1].detail.a, 2);
});

// Test: Replay works
QUnit.test('replay re-emits event', function(assert) {
    const events = window.workbench.events;
    let received = null;
    
    const id = events.emit('replay-test', { value: 'original' });
    events.on('replay-test', (detail) => { received = detail; });
    events.replay(id);
    
    assert.equal(received.value, 'original');
});

// Test: Error isolation
QUnit.test('one failing listener does not block others', function(assert) {
    const events = window.workbench.events;
    let successCalled = false;
    
    events.on('error-test', () => { throw new Error('Intentional'); });
    events.on('error-test', () => { successCalled = true; });
    events.emit('error-test', {});
    
    assert.true(successCalled);
});
```

---

## 10. Integration Notes

This service should be loaded BEFORE:
- The shell (F1)
- All mini apps

Loading order in index.html:
```html
<script src="v0.1.0/js/event-bus.js"></script>  <!-- FIRST -->
<script src="v0.1.0/js/api-client.js"></script>
<script src="v0.1.0/js/config-manager.js"></script>
<script src="v0.1.0/components/shell/workbench-shell.js"></script>
<!-- ... mini apps ... -->
```

---

*Refer to SHARED_BRIEFING.md for platform context and coding standards.*
