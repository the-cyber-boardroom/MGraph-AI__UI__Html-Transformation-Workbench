# HTML Transformation Workbench — Shared Briefing for Agents

**Document Type:** Shared Context (provided to ALL agents)  
**Version:** 0.1.1   
**Purpose:** Provide the bigger picture, platform contracts, and delivery expectations

---

## 1. What We're Building

The **HTML Transformation Workbench** is a modular web application for:
- Storing and retrieving HTML content by URL
- Applying transformations (sentiment filtering, content extraction, style simplification)
- Analyzing page and site structure
- Visualizing relationships and content

**Key Design Principles:**
1. **Micro-Frontend Architecture** — Independent mini apps that slot into a common shell
2. **Event-Driven Communication** — Mini apps NEVER talk directly; all communication via events
3. **Real Backend** — No mocks; all development against live APIs
4. **Web Components Only** — No React/Vue/Angular; native HTMLElement classes
5. **IFD Methodology** — Iterative Flow Development with surgical versioning

---

## 2. Platform Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           WORKBENCH SHELL                                        │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                         Navigation Bar                                    │  │
│   │   [App 1] [App 2] [App 3] [App 4] ...           (dynamically populated)  │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                                                                          │  │
│   │                        Mini App Container                                │  │
│   │                                                                          │  │
│   │                  ┌────────────────────────────┐                          │  │
│   │                  │   YOUR MINI APP GOES HERE  │                          │  │
│   │                  │                            │                          │  │
│   │                  │   (only one active at a    │                          │  │
│   │                  │    time, others hidden)    │                          │  │
│   │                  │                            │                          │  │
│   │                  └────────────────────────────┘                          │  │
│   │                                                                          │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                          Status Bar                                       │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                           SHARED SERVICES                                        │
│                                                                                  │
│   window.workbench = {                                                          │
│       events  : EventBus,        // Cross-app communication                     │
│       api     : ApiClient,       // Backend calls                               │
│       config  : ConfigManager,   // Settings & persistence                      │
│       router  : Router           // Navigation                                  │
│   }                                                                             │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Mini App Contract

Every mini app MUST implement this contract to integrate with the shell:

```javascript
class MyMiniApp extends HTMLElement {
    
    // ═══════════════════════════════════════════════════════════════════
    // REQUIRED: Static properties for registration
    // ═══════════════════════════════════════════════════════════════════
    
    static get appId()    { return 'my-mini-app'; }   // Unique identifier
    static get navLabel() { return 'My App'; }        // Nav bar display name
    static get navIcon()  { return '📱'; }            // Nav bar icon (emoji or SVG)
    
    // ═══════════════════════════════════════════════════════════════════
    // REQUIRED: Lifecycle methods
    // ═══════════════════════════════════════════════════════════════════
    
    constructor() {
        super();
        this.state = {};  // Component state
    }
    
    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }
    
    disconnectedCallback() {
        this.cleanup();  // REQUIRED: Remove event listeners
    }
    
    // Called by shell when this app becomes visible
    onActivate() {
        // Refresh data, start animations, etc.
    }
    
    // Called by shell when switching away from this app
    onDeactivate() {
        // Pause animations, save state, etc.
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // REQUIRED: Core methods
    // ═══════════════════════════════════════════════════════════════════
    
    render() {
        this.innerHTML = `<!-- Your HTML here -->`;
    }
    
    setupEventListeners() {
        // Subscribe to events, attach DOM listeners
    }
    
    cleanup() {
        // Unsubscribe from events, remove DOM listeners
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // AVAILABLE: Shared services (via window.workbench)
    // ═══════════════════════════════════════════════════════════════════
    
    get events() { return window.workbench.events; }
    get api()    { return window.workbench.api; }
    get config() { return window.workbench.config; }
    get router() { return window.workbench.router; }
}

// REQUIRED: Register the custom element
customElements.define('my-mini-app', MyMiniApp);
```

---

## 4. Shared Services API

### 4.1 Event Bus (`window.workbench.events`)

**Purpose:** All cross-component communication happens through events.

```javascript
// Emit an event
this.events.emit('html-loaded', { 
    cacheKey: 'example.com/about', 
    html: '<html>...',
    cacheId: 'aa27fb2a-...'
});

// Subscribe to an event
const handler = (detail) => {
    console.log('HTML loaded:', detail.cacheKey);
};
this.events.on('html-loaded', handler);

// Unsubscribe (REQUIRED in cleanup!)
this.events.off('html-loaded', handler);

// Access event history (for debugging)
const history = this.events.history;  // Array of past events

// Replay an event (for debugging)
this.events.replay(eventId);
```

**Event Structure:**
```javascript
{
    id: 42,                        // Auto-incrementing ID
    name: 'html-loaded',           // Event name
    detail: { cacheKey: '...' },   // Payload
    timestamp: 1768970000000,      // When emitted
    source: 'html-workbench'       // Which app emitted (optional)
}
```

---

### 4.2 API Client (`window.workbench.api`)

**Purpose:** Make authenticated calls to backend services.

```javascript
// Generic call
const response = await this.api.call(
    'html-graph',                                    // Service name
    '/flet-html-domain/html/load/my-ns/key/example.com/about',  // Endpoint
    'POST',                                          // Method
    { }                                              // Body (optional)
);

// Convenience methods (pre-built for common operations)
const html = await this.api.htmlGraph.loadHtml('my-ns', 'example.com/about');
const result = await this.api.htmlGraph.saveHtml('my-ns', 'example.com/about', '<html>...');
const entities = await this.api.htmlGraph.listEntities('my-ns');
const pages = await this.api.htmlGraph.listSitePages('my-ns', 'example.com');
```

**Available Services:**

| Service | Base URL | Purpose |
|---------|----------|---------|
| `html-graph` | `https://html-graph.dev.mgraph.ai` | HTML storage, transforms, analysis |
| `text-transform` | `https://text-transform.dev.mgraph.ai` | Text transformations |
| `llms` | `https://llms.dev.mgraph.ai` | AI/LLM operations |

**API Events (auto-emitted):**
```javascript
// Before every API call
{ name: 'api-request', detail: { id, service, endpoint, method, body } }

// After successful call
{ name: 'api-response', detail: { id, status, data, duration } }

// After failed call
{ name: 'api-error', detail: { id, error, status } }
```

---

### 4.3 Config Manager (`window.workbench.config`)

**Purpose:** Persist settings to localStorage.

```javascript
// Get a value
const namespace = this.config.get('defaults.namespace');  // 'html-cache'

// Set a value (auto-saves to localStorage, emits config-changed event)
this.config.set('defaults.namespace', 'my-namespace');

// Get service config
const htmlGraphConfig = this.config.getService('html-graph');
// Returns: { baseUrl, headerName, headerValue }

// Listen for config changes
this.events.on('config-changed', ({ key, value }) => {
    console.log(`Config ${key} changed to ${value}`);
});
```

**Config Schema:**
```javascript
{
    version: 1,
    services: {
        'html-graph': {
            baseUrl: 'https://html-graph.dev.mgraph.ai',
            headerName: 'X-API-Key',
            headerValue: '...'
        },
        'text-transform': { ... },
        'llms': { ... }
    },
    defaults: {
        namespace: 'html-cache'
    },
    recent: {
        cacheKeys: [],
        domains: []
    }
}
```

---

### 4.4 Router (`window.workbench.router`)

**Purpose:** Navigate between mini apps.

```javascript
// Navigate to another app
this.router.navigate('settings');

// Get current app
const currentApp = this.router.current;  // 'html-workbench'

// Get registered apps
const apps = this.router.apps;  
// [{ appId: 'settings', navLabel: 'Settings', navIcon: '⚙️' }, ...]
```

**Navigation Events:**
```javascript
// Request navigation (you emit this)
this.events.emit('navigate', { appId: 'settings' });

// Navigation completed (shell emits this)
{ name: 'navigated', detail: { appId: 'settings', previousAppId: 'workbench' } }
```

---

## 5. Event Catalog

All events in the system. Your mini app should emit/listen to relevant events.

### Navigation Events
| Event | Emitted By | Payload | Description |
|-------|------------|---------|-------------|
| `navigate` | Any app | `{ appId }` | Request navigation |
| `navigated` | Shell | `{ appId, previousAppId }` | Navigation completed |

### HTML Events
| Event | Emitted By | Payload | Description |
|-------|------------|---------|-------------|
| `html-load-request` | Workbench | `{ cacheKey }` | Request to load HTML |
| `html-loaded` | Workbench | `{ cacheKey, cacheId, html, charCount }` | HTML loaded |
| `html-save-request` | Workbench | `{ cacheKey, html }` | Request to save HTML |
| `html-saved` | Workbench | `{ cacheKey, cacheId }` | HTML saved |
| `html-transform-request` | Workbench | `{ cacheId, profileId }` | Apply transform |
| `html-transformed` | Workbench | `{ originalCacheId, transformedCacheId }` | Transform complete |

### Profile Events
| Event | Emitted By | Payload | Description |
|-------|------------|---------|-------------|
| `profile-list-request` | Profile Mgr | `{ namespace }` | Request profile list |
| `profile-list-loaded` | Profile Mgr | `{ profiles }` | Profiles loaded |
| `profile-load-request` | Any | `{ profileId }` | Load specific profile |
| `profile-loaded` | Profile Mgr | `{ profileId, profile }` | Profile loaded |
| `profile-save-request` | Profile Mgr | `{ profileId, profile }` | Save profile |
| `profile-saved` | Profile Mgr | `{ profileId }` | Profile saved |
| `profile-deleted` | Profile Mgr | `{ profileId }` | Profile deleted |

### Site Events
| Event | Emitted By | Payload | Description |
|-------|------------|---------|-------------|
| `site-browse-request` | Site Browser | `{ domain }` | Request pages for domain |
| `site-loaded` | Site Browser | `{ domain, pages, count }` | Pages loaded |
| `pages-selected` | Site Browser | `{ domain, cacheKeys }` | Pages selected |
| `batch-apply-request` | Site Browser | `{ profileId, cacheKeys }` | Batch transform |
| `batch-apply-complete` | Site Browser | `{ profileId, results }` | Batch complete |

### Analysis Events
| Event | Emitted By | Payload | Description |
|-------|------------|---------|-------------|
| `analysis-request` | Analysis | `{ type, cacheId }` | Request analysis |
| `analysis-complete` | Analysis | `{ type, cacheId, analysis }` | Analysis done |
| `graph-request` | Analysis | `{ type, cacheId, domain }` | Request graph |
| `graph-complete` | Analysis | `{ type, graph }` | Graph generated |

### Config Events
| Event | Emitted By | Payload | Description |
|-------|------------|---------|-------------|
| `config-changed` | Config Mgr | `{ key, value }` | Config updated |
| `config-loaded` | Config Mgr | `{ config }` | Config loaded |

### API Events
| Event | Emitted By | Payload | Description |
|-------|------------|---------|-------------|
| `api-request` | API Client | `{ id, service, endpoint, method, body }` | Call started |
| `api-response` | API Client | `{ id, status, data, duration }` | Call succeeded |
| `api-error` | API Client | `{ id, error, status }` | Call failed |

---

## 6. Backend API Reference

### HTML Graph API (`https://html-graph.dev.mgraph.ai`)

**Store/Load HTML:**
```
POST /flet-html-domain/html/store/{namespace}/key/{cache_key}
Body: { "html": "<html>...</html>" }
Response: { "success": true, "cache_id": "...", "cache_key": "...", "char_count": 1234 }

POST /flet-html-domain/html/load/{namespace}/key/{cache_key}
Response: { "success": true, "found": true, "html": "...", "cache_id": "...", "char_count": 1234 }
```

**List Entities:**
```
GET /cache-entity/{namespace}/entities
Response: { "success": true, "count": 5, "entities": [...] }

GET /cache-entity/{namespace}/entities?include_data_files=true
Response: { "success": true, "entities": [{ ..., "data_files": [...] }] }
```

**Profiles (to be implemented):**
```
GET  /flet-html-domain/profiles/{namespace}
GET  /flet-html-domain/profiles/{namespace}/{profile_id}
POST /flet-html-domain/profiles/{namespace}/{profile_id}
DELETE /flet-html-domain/profiles/{namespace}/{profile_id}
POST /flet-html-domain/profiles/{namespace}/{profile_id}/apply
```

**Site Browsing (to be implemented):**
```
GET /cache-entity/{namespace}/entities/site/{domain}
```

**Analysis (to be implemented):**
```
POST /flet-html-domain/html/analyze/{namespace}/structure
POST /flet-html-domain/html/analyze/{namespace}/content
POST /flet-html-domain/html/analyze/{namespace}/links
POST /flet-html-domain/html/graph/{namespace}/dom-tree
POST /flet-html-domain/site/analyze/{namespace}/sitemap/{domain}
POST /flet-html-domain/site/graph/{namespace}/links/{domain}
```

---

## 7. What You Must Deliver

For your story, you must deliver:

### 7.1 Web Component File(s)

```
v0.1.0/
└── components/
    └── {your-component}/
        └── {your-component}.js    # Main component
```

### 7.2 Component Structure

```javascript
/**
 * {Component Name}
 * 
 * Purpose: {what it does}
 * Story: {story ID}
 * Version: v0.1.0
 */
class YourComponent extends HTMLElement {
    
    static get appId()    { return 'your-component'; }
    static get navLabel() { return 'Your Label'; }
    static get navIcon()  { return '📱'; }
    
    constructor() {
        super();
        this.state = {};
        this._boundHandlers = {};  // Store bound handlers for cleanup
    }
    
    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }
    
    disconnectedCallback() {
        this.cleanup();
    }
    
    onActivate() {
        // Called when app becomes active
    }
    
    onDeactivate() {
        // Called when app becomes inactive
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // Rendering
    // ═══════════════════════════════════════════════════════════════════
    
    render() {
        this.innerHTML = `
            <style>
                /* Scoped styles */
            </style>
            <div class="your-component">
                <!-- Your HTML -->
            </div>
        `;
        this.bindElements();
    }
    
    bindElements() {
        // Cache DOM references
        this.$container = this.querySelector('.your-component');
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // Event Handling
    // ═══════════════════════════════════════════════════════════════════
    
    setupEventListeners() {
        // Store bound handlers for cleanup
        this._boundHandlers.onHtmlLoaded = this.onHtmlLoaded.bind(this);
        
        // Subscribe to events
        this.events.on('html-loaded', this._boundHandlers.onHtmlLoaded);
        
        // DOM listeners
        this.$container.addEventListener('click', this.handleClick.bind(this));
    }
    
    cleanup() {
        // Unsubscribe from events
        this.events.off('html-loaded', this._boundHandlers.onHtmlLoaded);
    }
    
    onHtmlLoaded(detail) {
        // Handle event
    }
    
    handleClick(e) {
        // Handle DOM event
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // Service Access
    // ═══════════════════════════════════════════════════════════════════
    
    get events() { return window.workbench.events; }
    get api()    { return window.workbench.api; }
    get config() { return window.workbench.config; }
    get router() { return window.workbench.router; }
}

customElements.define('your-component', YourComponent);
```

### 7.3 Test File

```
v0.1.0/
└── components/
    └── {your-component}/
        ├── {your-component}.js
        └── {your-component}.test.js
```

### 7.4 CSS (optional, or inline in component)

```
v0.1.0/
└── css/
    └── {your-component}.css
```

---

## 8. Coding Standards

### 8.1 Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Component class | PascalCase | `HtmlWorkbench` |
| Custom element | kebab-case | `html-workbench` |
| Event names | kebab-case | `html-loaded` |
| Methods | camelCase | `loadHtml()` |
| Private methods | _camelCase | `_fetchData()` |
| Constants | UPPER_SNAKE | `MAX_RETRIES` |
| CSS classes | kebab-case | `.html-editor` |

### 8.2 Event Emission Pattern

```javascript
// Always include relevant data in events
this.events.emit('html-loaded', {
    cacheKey: this.state.cacheKey,
    cacheId: response.cache_id,
    html: response.html,
    charCount: response.char_count
});

// Set source for debugging (optional but helpful)
this.events.emit('html-loaded', {
    ...detail,
    _source: this.constructor.appId
});
```

### 8.3 Error Handling

```javascript
async loadHtml(cacheKey) {
    try {
        const response = await this.api.htmlGraph.loadHtml(
            this.config.get('defaults.namespace'),
            cacheKey
        );
        
        if (response.success && response.found) {
            this.events.emit('html-loaded', { ... });
        } else {
            this.showError('HTML not found');
        }
    } catch (error) {
        console.error('Failed to load HTML:', error);
        this.showError('Failed to load HTML');
    }
}
```

### 8.4 State Management

```javascript
// Keep state in this.state object
this.state = {
    loading: false,
    cacheKey: '',
    html: '',
    error: null
};

// Update state and re-render relevant parts
setState(updates) {
    this.state = { ...this.state, ...updates };
    this.renderContent();  // Partial re-render
}
```

---

## 9. Do's and Don'ts

### ✅ DO

- Use `window.workbench.events` for ALL cross-component communication
- Store bound handlers for cleanup in `disconnectedCallback`
- Use the shared API client for ALL backend calls
- Keep components self-contained with scoped styles
- Follow the mini app contract exactly
- Test with real API data
- Use semantic HTML elements
- Handle loading and error states in UI

### ❌ DON'T

- Import external frameworks (React, Vue, Angular)
- Call methods on other components directly
- Store API keys in code (use config manager)
- Skip cleanup in `disconnectedCallback`
- Use global CSS that could affect other components
- Mock API responses
- Create circular event dependencies

---

## 10. Integration Testing

Your component will be integrated by loading it after the shell:

```html
<!DOCTYPE html>
<html>
<head>
    <title>HTML Transformation Workbench</title>
    <link rel="stylesheet" href="v0.1.0/css/shell.css">
</head>
<body>
    <!-- Shell loads first -->
    <script src="v0.1.0/components/shell/workbench-shell.js"></script>
    
    <!-- Services load next -->
    <script src="v0.1.0/js/event-bus.js"></script>
    <script src="v0.1.0/js/api-client.js"></script>
    <script src="v0.1.0/js/config-manager.js"></script>
    <script src="v0.1.0/js/router.js"></script>
    
    <!-- Mini apps load last -->
    <script src="v0.1.0/components/settings-panel/settings-panel.js"></script>
    <script src="v0.1.0/components/html-workbench/html-workbench.js"></script>
    <!-- YOUR COMPONENT LOADS HERE -->
    
    <!-- Initialize -->
    <workbench-shell></workbench-shell>
</body>
</html>
```

---

## 11. Questions?

If your story brief is unclear about:
- Which events to emit or listen to
- Which API endpoints to call
- How to handle a specific UX scenario

Check the Event Catalog (Section 5) and Backend API Reference (Section 6) first. The story brief should specify exactly what your component needs to do.

---

*This document is provided to ALL agents. Your specific story brief contains the detailed requirements for your component.*
