# Story F4: Config Manager Service

**Story ID:** F4  
**Layer:** Foundation  
**Priority:** BLOCKING  
**Parallel With:** F1, F2, F3  
**Dependencies:** F2 (Event Bus) for emitting config-changed events

---

## 1. Purpose

Create a configuration manager that persists settings to localStorage. Stores API credentials, default namespace, and user preferences.

**You are building:**
- Get/set configuration values
- Automatic persistence to localStorage
- Event emission on config changes
- Service-specific config retrieval
- The `window.workbench.config` service

---

## 2. Config Schema

```javascript
{
    version: 1,
    
    services: {
        'html-graph': {
            baseUrl: 'https://html-graph.dev.mgraph.ai',
            headerName: 'X-API-Key',
            headerValue: ''  // User fills in
        },
        'text-transform': {
            baseUrl: 'https://text-transform.dev.mgraph.ai',
            headerName: 'X-API-Key',
            headerValue: ''
        },
        'llms': {
            baseUrl: 'https://llms.dev.mgraph.ai',
            headerName: 'X-API-Key',
            headerValue: ''
        }
    },
    
    defaults: {
        namespace: 'html-cache'
    },
    
    recent: {
        cacheKeys: [],      // Last N accessed cache keys
        domains: [],        // Last N browsed domains
        profiles: []        // Last N used profiles
    },
    
    ui: {
        theme: 'light',
        sidebarCollapsed: false
    }
}
```

---

## 3. Config Manager Interface

```javascript
window.workbench.config = {
    
    // ═══════════════════════════════════════════════════════════════════
    // Core Methods
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Get a config value by path
     * @param {string} path - Dot-notation path (e.g., 'defaults.namespace')
     * @returns {any} The value or undefined
     */
    get(path) {
        // Navigate to path and return value
    },
    
    /**
     * Set a config value by path
     * @param {string} path - Dot-notation path
     * @param {any} value - Value to set
     */
    set(path, value) {
        // Set value at path
        // Save to localStorage
        // Emit config-changed event
    },
    
    /**
     * Get service configuration
     * @param {string} serviceName - Service name ('html-graph', etc.)
     * @returns {object} { baseUrl, headerName, headerValue }
     */
    getService(serviceName) {
        return this.get(`services.${serviceName}`);
    },
    
    /**
     * Set service configuration
     * @param {string} serviceName - Service name
     * @param {object} config - { baseUrl, headerName, headerValue }
     */
    setService(serviceName, config) {
        this.set(`services.${serviceName}`, config);
    },
    
    // ═══════════════════════════════════════════════════════════════════
    // Persistence
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Load config from localStorage
     */
    load() {
        // Load from localStorage
        // Merge with defaults
        // Emit config-loaded event
    },
    
    /**
     * Save config to localStorage
     */
    save() {
        // Serialize and save to localStorage
    },
    
    /**
     * Reset to defaults
     */
    reset() {
        // Reset to default config
        // Save to localStorage
        // Emit config-changed event
    },
    
    // ═══════════════════════════════════════════════════════════════════
    // Recent Items
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Add to recent list (maintains max size)
     * @param {string} listName - 'cacheKeys', 'domains', or 'profiles'
     * @param {string} item - Item to add
     */
    addRecent(listName, item) {
        // Add to front of list
        // Remove duplicates
        // Trim to max size (e.g., 20)
        // Save
    },
    
    /**
     * Get recent list
     * @param {string} listName - 'cacheKeys', 'domains', or 'profiles'
     * @returns {Array} Recent items
     */
    getRecent(listName) {
        return this.get(`recent.${listName}`) || [];
    }
};
```

---

## 4. Implementation Details

### 4.1 localStorage Key

```javascript
const STORAGE_KEY = 'workbench-config';
```

### 4.2 Default Config

```javascript
const DEFAULT_CONFIG = {
    version: 1,
    services: {
        'html-graph': {
            baseUrl: 'https://html-graph.dev.mgraph.ai',
            headerName: 'X-API-Key',
            headerValue: ''
        },
        'text-transform': {
            baseUrl: 'https://text-transform.dev.mgraph.ai',
            headerName: 'X-API-Key',
            headerValue: ''
        },
        'llms': {
            baseUrl: 'https://llms.dev.mgraph.ai',
            headerName: 'X-API-Key',
            headerValue: ''
        }
    },
    defaults: {
        namespace: 'html-cache'
    },
    recent: {
        cacheKeys: [],
        domains: [],
        profiles: []
    },
    ui: {
        theme: 'light',
        sidebarCollapsed: false
    }
};
```

### 4.3 Path Navigation

```javascript
// get('services.html-graph.baseUrl')
// Should navigate: config -> services -> html-graph -> baseUrl

get(path) {
    const parts = path.split('.');
    let current = this._config;
    
    for (const part of parts) {
        if (current === undefined || current === null) {
            return undefined;
        }
        current = current[part];
    }
    
    return current;
}

set(path, value) {
    const parts = path.split('.');
    const lastPart = parts.pop();
    let current = this._config;
    
    for (const part of parts) {
        if (!(part in current)) {
            current[part] = {};
        }
        current = current[part];
    }
    
    const oldValue = current[lastPart];
    current[lastPart] = value;
    
    this.save();
    
    window.workbench.events.emit('config-changed', {
        path,
        value,
        oldValue
    });
}
```

---

## 5. Events

### Events to EMIT

| Event | When | Payload |
|-------|------|---------|
| `config-changed` | After any set() | `{ path, value, oldValue }` |
| `config-loaded` | After load() | `{ config }` |
| `config-reset` | After reset() | `{}` |

---

## 6. File Structure

```
v0.1.0/
└── js/
    ├── config-manager.js         # Main implementation
    └── config-manager.test.js    # Tests
```

---

## 7. Usage Examples

```javascript
const config = window.workbench.config;

// Get default namespace
const ns = config.get('defaults.namespace');  // 'html-cache'

// Set default namespace
config.set('defaults.namespace', 'my-namespace');

// Get service config
const htmlGraphConfig = config.getService('html-graph');
// { baseUrl: '...', headerName: 'X-API-Key', headerValue: '...' }

// Set API key for a service
config.set('services.html-graph.headerValue', 'my-secret-key');

// Add to recent
config.addRecent('cacheKeys', 'example.com/about');
config.addRecent('domains', 'example.com');

// Get recent
const recentDomains = config.getRecent('domains');
// ['example.com', 'other.com', ...]

// Listen for changes
window.workbench.events.on('config-changed', ({ path, value }) => {
    console.log(`Config ${path} changed to`, value);
});
```

---

## 8. Acceptance Criteria

- [ ] `window.workbench.config` is available
- [ ] `get(path)` returns value at dot-notation path
- [ ] `set(path, value)` sets value and persists
- [ ] `getService(name)` returns service config
- [ ] `setService(name, config)` updates service config
- [ ] Config persists to localStorage
- [ ] Config loads from localStorage on init
- [ ] `config-changed` event emitted on set
- [ ] `config-loaded` event emitted on load
- [ ] `reset()` restores defaults
- [ ] `addRecent()` maintains bounded list
- [ ] Missing config paths return undefined (not error)
- [ ] Handles corrupted localStorage gracefully

---

## 9. Test Cases

```javascript
// Test: Get and set work
QUnit.test('get and set work', function(assert) {
    const config = window.workbench.config;
    config.set('test.value', 42);
    assert.equal(config.get('test.value'), 42);
});

// Test: Nested paths work
QUnit.test('nested paths work', function(assert) {
    const config = window.workbench.config;
    config.set('a.b.c.d', 'deep');
    assert.equal(config.get('a.b.c.d'), 'deep');
});

// Test: Event emitted on set
QUnit.test('config-changed event emitted', function(assert) {
    const config = window.workbench.config;
    let eventDetail = null;
    
    window.workbench.events.on('config-changed', (d) => { eventDetail = d; });
    config.set('test.event', 'value');
    
    assert.equal(eventDetail.path, 'test.event');
    assert.equal(eventDetail.value, 'value');
});

// Test: Persists to localStorage
QUnit.test('persists to localStorage', function(assert) {
    const config = window.workbench.config;
    config.set('persist.test', 'stored');
    
    // Simulate reload
    config.load();
    
    assert.equal(config.get('persist.test'), 'stored');
});

// Test: addRecent maintains max size
QUnit.test('addRecent trims to max size', function(assert) {
    const config = window.workbench.config;
    
    // Add 25 items (max is 20)
    for (let i = 0; i < 25; i++) {
        config.addRecent('cacheKeys', `item-${i}`);
    }
    
    const recent = config.getRecent('cacheKeys');
    assert.ok(recent.length <= 20, 'List trimmed to max');
    assert.equal(recent[0], 'item-24', 'Most recent first');
});

// Test: Handles missing paths
QUnit.test('missing paths return undefined', function(assert) {
    const config = window.workbench.config;
    assert.equal(config.get('nonexistent.path'), undefined);
});
```

---

## 10. Error Handling

```javascript
load() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with defaults to handle schema changes
            this._config = this._deepMerge(DEFAULT_CONFIG, parsed);
        } else {
            this._config = { ...DEFAULT_CONFIG };
        }
    } catch (error) {
        console.warn('Failed to load config, using defaults:', error);
        this._config = { ...DEFAULT_CONFIG };
    }
    
    window.workbench.events.emit('config-loaded', { config: this._config });
}

save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this._config));
    } catch (error) {
        console.error('Failed to save config:', error);
    }
}
```

---

## 11. Integration Notes

Loading order in index.html:
```html
<script src="v0.1.0/js/event-bus.js"></script>
<script src="v0.1.0/js/config-manager.js"></script>  <!-- After event-bus -->
<script src="v0.1.0/js/api-client.js"></script>
```

On startup, config-manager should call `load()` automatically to initialize from localStorage.

---

*Refer to SHARED_BRIEFING.md for platform context and coding standards.*
