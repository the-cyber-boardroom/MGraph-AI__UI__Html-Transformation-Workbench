# Story F5: Hello World Validation Apps

**Story ID:** F5  
**Layer:** Foundation  
**Priority:** HIGH (validates the slot mechanism)  
**Parallel With:** None (needs F1-F4 complete)  
**Dependencies:** F1 (Shell), F2 (Events), F3 (API), F4 (Config)

---

## 1. Purpose

Create TWO minimal "Hello World" mini apps to validate:
1. The shell slot mechanism works correctly
2. Mini apps can register and appear in nav
3. Navigation between apps works
4. Events can flow between apps
5. API client is accessible
6. Config is accessible

**These serve as:**
- Validation that foundation works
- Templates for other mini app developers
- Debugging tools during development

---

## 2. Apps to Build

### 2.1 Hello World 1: Event Emitter

Demonstrates:
- Mini app registration
- Lifecycle callbacks (onActivate/onDeactivate)
- Emitting events
- Navigating to other apps

### 2.2 Hello World 2: Event Receiver

Demonstrates:
- Receiving events from other apps
- Using the API client
- Using the config manager
- Proper cleanup

---

## 3. UI Mockup: Hello World 1

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│    ┌─────────────────────────────────────────────────────────────────────────┐  │
│    │                         HELLO WORLD 1                                   │  │
│    │                        Event Emitter                                    │  │
│    └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│    This mini app demonstrates:                                                  │
│    ✓ Mini app registration                                                      │
│    ✓ Lifecycle callbacks                                                        │
│    ✓ Event emission                                                             │
│    ✓ Navigation                                                                 │
│                                                                                  │
│    ┌─────────────────────────────────────────────────────────────────────────┐  │
│    │  Status                                                                 │  │
│    │  ─────────────────────────────────────────────────────────────────────  │  │
│    │  Current State: ● Active                                                │  │
│    │  Times Activated: 3                                                     │  │
│    │  Times Deactivated: 2                                                   │  │
│    └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│    ┌─────────────────────────────────────────────────────────────────────────┐  │
│    │  Actions                                                                │  │
│    │  ─────────────────────────────────────────────────────────────────────  │  │
│    │                                                                         │  │
│    │  Event Name: [test-event_______________]                                │  │
│    │  Event Data: [{"message": "hello"}______]                               │  │
│    │                                                                         │  │
│    │  [🚀 Emit Event]                                                        │  │
│    │                                                                         │  │
│    │  [➡️ Navigate to Hello World 2]                                         │  │
│    │                                                                         │  │
│    └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│    ┌─────────────────────────────────────────────────────────────────────────┐  │
│    │  Event Log (emitted from this app)                                      │  │
│    │  ─────────────────────────────────────────────────────────────────────  │  │
│    │  10:45:23 - Emitted 'test-event' with {"message": "hello"}             │  │
│    │  10:45:20 - Emitted 'hello-ping' with {}                               │  │
│    │  10:45:15 - Emitted 'test-event' with {"count": 1}                     │  │
│    └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. UI Mockup: Hello World 2

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│    ┌─────────────────────────────────────────────────────────────────────────┐  │
│    │                         HELLO WORLD 2                                   │  │
│    │                        Event Receiver                                   │  │
│    └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│    This mini app demonstrates:                                                  │
│    ✓ Receiving events                                                          │
│    ✓ Using API client                                                          │
│    ✓ Using config manager                                                      │
│    ✓ Proper cleanup                                                            │
│                                                                                  │
│    ┌─────────────────────────────────────────────────────────────────────────┐  │
│    │  Received Events                                                        │  │
│    │  ─────────────────────────────────────────────────────────────────────  │  │
│    │  Listening for: test-event, hello-ping                                  │  │
│    │  Total Received: 5                                                      │  │
│    │                                                                         │  │
│    │  Last Event:                                                            │  │
│    │  ┌───────────────────────────────────────────────────────────────────┐ │  │
│    │  │ Name: test-event                                                  │ │  │
│    │  │ Data: {"message": "hello"}                                        │ │  │
│    │  │ Time: 10:45:23                                                    │ │  │
│    │  └───────────────────────────────────────────────────────────────────┘ │  │
│    └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│    ┌─────────────────────────────────────────────────────────────────────────┐  │
│    │  API Test                                                               │  │
│    │  ─────────────────────────────────────────────────────────────────────  │  │
│    │  [🔌 Test API Connection]                                               │  │
│    │                                                                         │  │
│    │  Result: ✓ Connected to html-graph (145ms)                             │  │
│    └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│    ┌─────────────────────────────────────────────────────────────────────────┐  │
│    │  Config Test                                                            │  │
│    │  ─────────────────────────────────────────────────────────────────────  │  │
│    │  Default Namespace: html-cache                                          │  │
│    │  HTML Graph URL: https://html-graph.dev.mgraph.ai                      │  │
│    │  API Key Configured: ✓ Yes                                             │  │
│    └─────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│    [➡️ Navigate to Hello World 1]                                               │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Hello World 1 Implementation

```javascript
/**
 * Hello World 1 - Event Emitter
 * Validates: registration, lifecycle, event emission, navigation
 */
class HelloWorld1 extends HTMLElement {
    
    static get appId()    { return 'hello-world-1'; }
    static get navLabel() { return 'Hello 1'; }
    static get navIcon()  { return '👋'; }
    
    constructor() {
        super();
        this.state = {
            isActive: false,
            activateCount: 0,
            deactivateCount: 0,
            emittedEvents: []
        };
    }
    
    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }
    
    disconnectedCallback() {
        this.cleanup();
    }
    
    onActivate() {
        this.state.isActive = true;
        this.state.activateCount++;
        this.updateStatus();
    }
    
    onDeactivate() {
        this.state.isActive = false;
        this.state.deactivateCount++;
    }
    
    render() {
        this.innerHTML = `
            <style>
                .hello-world-1 { padding: 20px; font-family: system-ui; }
                .hw-header { text-align: center; margin-bottom: 20px; }
                .hw-section { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
                .hw-section h3 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px; }
                .hw-input { width: 100%; padding: 8px; margin: 5px 0; box-sizing: border-box; }
                .hw-button { padding: 10px 20px; margin: 5px; cursor: pointer; }
                .hw-log { font-family: monospace; font-size: 12px; max-height: 150px; overflow-y: auto; }
                .status-active { color: green; }
                .status-inactive { color: gray; }
            </style>
            <div class="hello-world-1">
                <div class="hw-header">
                    <h1>HELLO WORLD 1</h1>
                    <p>Event Emitter</p>
                </div>
                
                <div class="hw-section">
                    <h3>Status</h3>
                    <div id="status-display">Loading...</div>
                </div>
                
                <div class="hw-section">
                    <h3>Actions</h3>
                    <label>Event Name:</label>
                    <input type="text" id="event-name" class="hw-input" value="test-event">
                    <label>Event Data (JSON):</label>
                    <input type="text" id="event-data" class="hw-input" value='{"message": "hello"}'>
                    <button id="emit-btn" class="hw-button">🚀 Emit Event</button>
                    <button id="nav-btn" class="hw-button">➡️ Navigate to Hello World 2</button>
                </div>
                
                <div class="hw-section">
                    <h3>Event Log (emitted from this app)</h3>
                    <div id="event-log" class="hw-log">No events emitted yet.</div>
                </div>
            </div>
        `;
        this.bindElements();
        this.updateStatus();
    }
    
    bindElements() {
        this.$status = this.querySelector('#status-display');
        this.$eventName = this.querySelector('#event-name');
        this.$eventData = this.querySelector('#event-data');
        this.$emitBtn = this.querySelector('#emit-btn');
        this.$navBtn = this.querySelector('#nav-btn');
        this.$eventLog = this.querySelector('#event-log');
    }
    
    setupEventListeners() {
        this.$emitBtn.addEventListener('click', () => this.emitTestEvent());
        this.$navBtn.addEventListener('click', () => this.navigateToHello2());
    }
    
    cleanup() {
        // No event subscriptions to clean up in this app
    }
    
    updateStatus() {
        if (!this.$status) return;
        const statusClass = this.state.isActive ? 'status-active' : 'status-inactive';
        const statusText = this.state.isActive ? '● Active' : '○ Inactive';
        this.$status.innerHTML = `
            Current State: <span class="${statusClass}">${statusText}</span><br>
            Times Activated: ${this.state.activateCount}<br>
            Times Deactivated: ${this.state.deactivateCount}
        `;
    }
    
    emitTestEvent() {
        const eventName = this.$eventName.value;
        let eventData = {};
        try {
            eventData = JSON.parse(this.$eventData.value);
        } catch (e) {
            eventData = { raw: this.$eventData.value };
        }
        
        this.events.emit(eventName, eventData);
        
        const timestamp = new Date().toLocaleTimeString();
        this.state.emittedEvents.unshift({ eventName, eventData, timestamp });
        this.updateEventLog();
    }
    
    updateEventLog() {
        if (this.state.emittedEvents.length === 0) {
            this.$eventLog.textContent = 'No events emitted yet.';
            return;
        }
        this.$eventLog.innerHTML = this.state.emittedEvents
            .slice(0, 10)
            .map(e => `${e.timestamp} - Emitted '${e.eventName}' with ${JSON.stringify(e.eventData)}`)
            .join('<br>');
    }
    
    navigateToHello2() {
        this.router.navigate('hello-world-2');
    }
    
    get events() { return window.workbench.events; }
    get router() { return window.workbench.router; }
}

customElements.define('hello-world-1', HelloWorld1);
```

---

## 6. Hello World 2 Implementation

```javascript
/**
 * Hello World 2 - Event Receiver
 * Validates: event listening, API client, config manager, cleanup
 */
class HelloWorld2 extends HTMLElement {
    
    static get appId()    { return 'hello-world-2'; }
    static get navLabel() { return 'Hello 2'; }
    static get navIcon()  { return '🎯'; }
    
    constructor() {
        super();
        this.state = {
            receivedCount: 0,
            lastEvent: null,
            apiTestResult: null
        };
        this._boundHandlers = {};
    }
    
    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }
    
    disconnectedCallback() {
        this.cleanup();
    }
    
    onActivate() {
        this.updateConfigDisplay();
    }
    
    onDeactivate() {
        // Nothing special needed
    }
    
    render() {
        this.innerHTML = `
            <style>
                .hello-world-2 { padding: 20px; font-family: system-ui; }
                .hw-header { text-align: center; margin-bottom: 20px; }
                .hw-section { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
                .hw-section h3 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 8px; }
                .hw-button { padding: 10px 20px; margin: 5px; cursor: pointer; }
                .hw-event-box { background: #f5f5f5; padding: 10px; border-radius: 4px; font-family: monospace; }
                .success { color: green; }
                .error { color: red; }
            </style>
            <div class="hello-world-2">
                <div class="hw-header">
                    <h1>HELLO WORLD 2</h1>
                    <p>Event Receiver</p>
                </div>
                
                <div class="hw-section">
                    <h3>Received Events</h3>
                    <p>Listening for: <code>test-event</code>, <code>hello-ping</code></p>
                    <p>Total Received: <span id="received-count">0</span></p>
                    <div id="last-event" class="hw-event-box">No events received yet.</div>
                </div>
                
                <div class="hw-section">
                    <h3>API Test</h3>
                    <button id="api-test-btn" class="hw-button">🔌 Test API Connection</button>
                    <div id="api-result"></div>
                </div>
                
                <div class="hw-section">
                    <h3>Config Test</h3>
                    <div id="config-display">Loading...</div>
                </div>
                
                <button id="nav-btn" class="hw-button">➡️ Navigate to Hello World 1</button>
            </div>
        `;
        this.bindElements();
    }
    
    bindElements() {
        this.$receivedCount = this.querySelector('#received-count');
        this.$lastEvent = this.querySelector('#last-event');
        this.$apiTestBtn = this.querySelector('#api-test-btn');
        this.$apiResult = this.querySelector('#api-result');
        this.$configDisplay = this.querySelector('#config-display');
        this.$navBtn = this.querySelector('#nav-btn');
    }
    
    setupEventListeners() {
        // Store bound handlers for cleanup
        this._boundHandlers.onTestEvent = this.onTestEvent.bind(this);
        this._boundHandlers.onHelloPing = this.onHelloPing.bind(this);
        
        // Subscribe to events
        this.events.on('test-event', this._boundHandlers.onTestEvent);
        this.events.on('hello-ping', this._boundHandlers.onHelloPing);
        
        // DOM listeners
        this.$apiTestBtn.addEventListener('click', () => this.testApiConnection());
        this.$navBtn.addEventListener('click', () => this.router.navigate('hello-world-1'));
    }
    
    cleanup() {
        // IMPORTANT: Unsubscribe from events
        this.events.off('test-event', this._boundHandlers.onTestEvent);
        this.events.off('hello-ping', this._boundHandlers.onHelloPing);
    }
    
    onTestEvent(detail) {
        this.handleReceivedEvent('test-event', detail);
    }
    
    onHelloPing(detail) {
        this.handleReceivedEvent('hello-ping', detail);
    }
    
    handleReceivedEvent(name, detail) {
        this.state.receivedCount++;
        this.state.lastEvent = { name, detail, time: new Date().toLocaleTimeString() };
        this.updateReceivedDisplay();
    }
    
    updateReceivedDisplay() {
        this.$receivedCount.textContent = this.state.receivedCount;
        if (this.state.lastEvent) {
            this.$lastEvent.innerHTML = `
                <strong>Name:</strong> ${this.state.lastEvent.name}<br>
                <strong>Data:</strong> ${JSON.stringify(this.state.lastEvent.detail)}<br>
                <strong>Time:</strong> ${this.state.lastEvent.time}
            `;
        }
    }
    
    async testApiConnection() {
        this.$apiResult.innerHTML = 'Testing...';
        const startTime = Date.now();
        
        try {
            const result = await this.api.htmlGraph.listEntities(
                this.config.get('defaults.namespace')
            );
            const duration = Date.now() - startTime;
            
            if (result.success) {
                this.$apiResult.innerHTML = `<span class="success">✓ Connected to html-graph (${duration}ms) - Found ${result.count} entities</span>`;
            } else {
                this.$apiResult.innerHTML = `<span class="error">✗ API returned error</span>`;
            }
        } catch (error) {
            this.$apiResult.innerHTML = `<span class="error">✗ Connection failed: ${error.message}</span>`;
        }
    }
    
    updateConfigDisplay() {
        const ns = this.config.get('defaults.namespace');
        const htmlGraphUrl = this.config.get('services.html-graph.baseUrl');
        const hasApiKey = !!this.config.get('services.html-graph.headerValue');
        
        this.$configDisplay.innerHTML = `
            <strong>Default Namespace:</strong> ${ns || '(not set)'}<br>
            <strong>HTML Graph URL:</strong> ${htmlGraphUrl || '(not set)'}<br>
            <strong>API Key Configured:</strong> ${hasApiKey ? '✓ Yes' : '✗ No'}
        `;
    }
    
    get events() { return window.workbench.events; }
    get api()    { return window.workbench.api; }
    get config() { return window.workbench.config; }
    get router() { return window.workbench.router; }
}

customElements.define('hello-world-2', HelloWorld2);
```

---

## 7. File Structure

```
v0.1.0/
└── components/
    ├── hello-world-1/
    │   ├── hello-world-1.js
    │   └── hello-world-1.test.js
    └── hello-world-2/
        ├── hello-world-2.js
        └── hello-world-2.test.js
```

---

## 8. Acceptance Criteria

### Hello World 1
- [ ] Appears in nav bar with icon
- [ ] Shows activation count that increments on each visit
- [ ] Can emit custom events with custom data
- [ ] Event log shows emitted events
- [ ] Navigate button switches to Hello World 2

### Hello World 2
- [ ] Appears in nav bar with icon
- [ ] Receives and displays events from Hello World 1
- [ ] Shows total count of received events
- [ ] API test button connects to real backend
- [ ] Config display shows current settings
- [ ] Properly cleans up event listeners on disconnect

### Integration
- [ ] Both apps register successfully with shell
- [ ] Can navigate freely between them
- [ ] Events flow from Hello 1 to Hello 2
- [ ] No console errors during navigation
- [ ] Lifecycle callbacks fire correctly

---

## 9. Testing Checklist

```
[ ] Load page - both apps appear in nav
[ ] Click Hello 1 - app renders, status shows Active
[ ] Click Hello 2 - Hello 1 shows deactivate count incremented
[ ] In Hello 1: Emit event - log shows event
[ ] In Hello 2: Check received count increased
[ ] In Hello 2: Click API test - shows connection result
[ ] In Hello 2: Check config display is populated
[ ] Navigate back and forth multiple times - no errors
[ ] Open browser console - no errors or warnings
[ ] Check memory (dev tools) - no leaks after navigation
```

---

*Refer to SHARED_BRIEFING.md for platform context and coding standards.*
