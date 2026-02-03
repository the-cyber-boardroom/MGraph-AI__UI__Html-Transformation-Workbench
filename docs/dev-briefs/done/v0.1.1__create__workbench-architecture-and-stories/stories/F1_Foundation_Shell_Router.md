# Story F1: Foundation Shell & Router

**Story ID:** F1  
**Layer:** Foundation  
**Priority:** BLOCKING (must complete before all other stories)  
**Parallel With:** F2, F3, F4  
**Dependencies:** None

---

## 1. Purpose

Create the main application shell that provides the frame for all mini apps. This is the "container" that all other components slot into.

**You are building:**
- The outer shell layout (header, nav, container, footer)
- Navigation bar that dynamically shows registered mini apps
- Router that switches between active mini apps
- The slot mechanism where mini apps render

---

## 2. UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ 🔧 HTML Transformation Workbench                                          │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                           │  │
│  │  [⚙️ Settings] [🔬 Workbench] [📁 Profiles] [🌐 Sites] [📊 Analysis]      │  │
│  │       ▲                                                                   │  │
│  │       └── Active tab highlighted                                          │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                           │  │
│  │                                                                           │  │
│  │                                                                           │  │
│  │                     ┌─────────────────────────────┐                       │  │
│  │                     │                             │                       │  │
│  │                     │    ACTIVE MINI APP          │                       │  │
│  │                     │    RENDERS HERE             │                       │  │
│  │                     │                             │                       │  │
│  │                     │    (one at a time)          │                       │  │
│  │                     │                             │                       │  │
│  │                     └─────────────────────────────┘                       │  │
│  │                                                                           │  │
│  │                                                                           │  │
│  │                                                                           │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │  Ready | Active: Settings | Apps: 5                                       │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Components to Build

### 3.1 `workbench-shell.js`

The main shell component.

```javascript
class WorkbenchShell extends HTMLElement {
    // Responsibilities:
    // - Render header, nav, container, footer
    // - Maintain list of registered apps
    // - Show/hide mini apps based on active route
    // - Initialize shared services (or expect them to be initialized)
}
customElements.define('workbench-shell', WorkbenchShell);
```

### 3.2 `nav-bar.js` (sub-component)

Navigation bar within the shell.

```javascript
class NavBar extends HTMLElement {
    // Responsibilities:
    // - Render nav items from registered apps
    // - Highlight active app
    // - Handle click to emit navigate event
}
customElements.define('nav-bar', NavBar);
```

---

## 4. Router API

The shell must expose a router on `window.workbench.router`:

```javascript
window.workbench.router = {
    
    // Register a mini app
    register(MiniAppClass) {
        // MiniAppClass must have static appId, navLabel, navIcon
        // Add to internal apps list
        // Create instance and add to DOM (hidden)
        // Update nav bar
    },
    
    // Navigate to an app
    navigate(appId) {
        // Hide current app (call onDeactivate)
        // Show target app (call onActivate)
        // Update nav bar highlight
        // Emit 'navigated' event
    },
    
    // Current active app ID
    get current() {
        return this._currentAppId;
    },
    
    // List of registered apps
    get apps() {
        return this._apps; // [{ appId, navLabel, navIcon }, ...]
    }
};
```

---

## 5. Events

### Events to EMIT

| Event | When | Payload |
|-------|------|---------|
| `navigated` | After switching apps | `{ appId, previousAppId }` |
| `app-registered` | After registering app | `{ appId, navLabel }` |

### Events to LISTEN

| Event | Action |
|-------|--------|
| `navigate` | Call `router.navigate(detail.appId)` |

---

## 6. Mini App Lifecycle

When the router switches apps:

```
1. User clicks nav item OR 'navigate' event received
2. router.navigate(targetAppId) called
3. Find current active app
4. Call currentApp.onDeactivate()
5. Hide current app (display: none or remove from DOM)
6. Find target app
7. Show target app
8. Call targetApp.onActivate()
9. Update nav bar highlight
10. Emit 'navigated' event
```

---

## 7. HTML Structure

```html
<workbench-shell>
    <!-- Shadow DOM or light DOM structure -->
    
    <header class="shell-header">
        <span class="shell-logo">🔧</span>
        <span class="shell-title">HTML Transformation Workbench</span>
    </header>
    
    <nav-bar></nav-bar>
    
    <main class="shell-container">
        <!-- Mini apps render here -->
        <!-- Only one visible at a time -->
    </main>
    
    <footer class="shell-footer">
        <span class="status">Ready</span>
        <span class="active-app">Active: Settings</span>
        <span class="app-count">Apps: 5</span>
    </footer>
    
</workbench-shell>
```

---

## 8. CSS Requirements

```css
/* Shell fills viewport */
workbench-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
}

/* Header styling */
.shell-header {
    height: 48px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

/* Nav bar */
nav-bar {
    height: 40px;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
}

/* Container takes remaining space */
.shell-container {
    flex: 1;
    overflow: auto;
    position: relative;
}

/* Footer */
.shell-footer {
    height: 24px;
    display: flex;
    align-items: center;
    padding: 0 16px;
    background: #f5f5f5;
    border-top: 1px solid #ddd;
    font-size: 12px;
    color: #666;
}
```

---

## 9. File Structure

```
v0.1.0/
├── components/
│   └── shell/
│       ├── workbench-shell.js      # Main shell component
│       ├── workbench-shell.test.js # Tests
│       └── nav-bar.js              # Nav bar sub-component
├── css/
│   └── shell.css                   # Shell styles (or inline)
└── index.html                      # Entry point
```

---

## 10. Acceptance Criteria

- [ ] Shell renders with header, nav bar, container, footer
- [ ] `window.workbench.router` is available
- [ ] `router.register(MiniAppClass)` adds app to nav bar
- [ ] Clicking nav item calls `router.navigate()`
- [ ] Only one mini app visible at a time
- [ ] Previous app's `onDeactivate()` called on switch
- [ ] New app's `onActivate()` called on switch
- [ ] `navigated` event emitted after switch
- [ ] `navigate` event listened and handled
- [ ] Footer shows current active app
- [ ] Responsive layout (works on different screen sizes)

---

## 11. Integration Notes

The shell expects `window.workbench` to be partially initialized with at least:
- `window.workbench.events` (from F2)

The shell will add:
- `window.workbench.router`

Other stories (mini apps) will call:
```javascript
window.workbench.router.register(MyMiniApp);
```

---

## 12. Example Usage

```javascript
// In a mini app file:
class SettingsPanel extends HTMLElement {
    static get appId() { return 'settings'; }
    static get navLabel() { return 'Settings'; }
    static get navIcon() { return '⚙️'; }
    
    onActivate() { console.log('Settings activated'); }
    onDeactivate() { console.log('Settings deactivated'); }
    
    connectedCallback() {
        this.innerHTML = '<h1>Settings Panel</h1>';
    }
}
customElements.define('settings-panel', SettingsPanel);

// Register with shell
window.workbench.router.register(SettingsPanel);
```

---

*Refer to SHARED_BRIEFING.md for platform context and coding standards.*
