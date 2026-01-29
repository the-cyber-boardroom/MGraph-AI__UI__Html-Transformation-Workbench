# Story F3: API Client Service

**Story ID:** F3  
**Layer:** Foundation  
**Priority:** BLOCKING  
**Parallel With:** F1, F2, F4  
**Dependencies:** F2 (Event Bus) for emitting api-request/response events

---

## 1. Purpose

Create a unified API client that handles calls to all backend services. Automatically injects authentication headers and emits events for all API calls (enabling debugging/logging).

**You are building:**
- Generic `call()` method for any service/endpoint
- Convenience methods for common operations
- Automatic auth header injection from config
- Event emission for all API calls
- The `window.workbench.api` service

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API CLIENT                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   Mini App                                                                       │
│      │                                                                           │
│      │  api.htmlGraph.loadHtml('ns', 'example.com/about')                       │
│      │                                                                           │
│      ▼                                                                           │
│   ┌──────────────────────────────────────────────────────────────────────────┐  │
│   │                         API Client                                        │  │
│   │                                                                           │  │
│   │  1. Get service config (baseUrl, headerName, headerValue)                │  │
│   │  2. Emit 'api-request' event                                             │  │
│   │  3. Make fetch() call with auth header                                   │  │
│   │  4. Emit 'api-response' or 'api-error' event                             │  │
│   │  5. Return response data                                                 │  │
│   │                                                                           │  │
│   └──────────────────────────────────────────────────────────────────────────┘  │
│      │                                                                           │
│      ▼                                                                           │
│   Backend Services                                                               │
│   - html-graph.dev.mgraph.ai                                                    │
│   - text-transform.dev.mgraph.ai                                                │
│   - llms.dev.mgraph.ai                                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. API Client Interface

```javascript
window.workbench.api = {
    
    // ═══════════════════════════════════════════════════════════════════
    // Generic Call Method
    // ═══════════════════════════════════════════════════════════════════
    
    /**
     * Make an API call to any service
     * @param {string} service - Service name ('html-graph', 'text-transform', 'llms')
     * @param {string} endpoint - API endpoint (e.g., '/flet-html-domain/html/load/...')
     * @param {string} method - HTTP method ('GET', 'POST', 'PUT', 'DELETE')
     * @param {object} body - Request body (optional)
     * @returns {Promise<object>} Response data
     */
    async call(service, endpoint, method = 'GET', body = null) {
        // Implementation
    },
    
    // ═══════════════════════════════════════════════════════════════════
    // Convenience Methods: HTML Graph
    // ═══════════════════════════════════════════════════════════════════
    
    htmlGraph: {
        
        async loadHtml(namespace, cacheKey) {
            return api.call('html-graph', 
                `/flet-html-domain/html/load/${namespace}/key/${cacheKey}`,
                'POST'
            );
        },
        
        async saveHtml(namespace, cacheKey, html) {
            return api.call('html-graph',
                `/flet-html-domain/html/store/${namespace}/key/${cacheKey}`,
                'POST',
                { html }
            );
        },
        
        async listEntities(namespace, includeDataFiles = false) {
            const query = includeDataFiles ? '?include_data_files=true' : '';
            return api.call('html-graph',
                `/cache-entity/${namespace}/entities${query}`,
                'GET'
            );
        },
        
        async listSitePages(namespace, domain) {
            return api.call('html-graph',
                `/cache-entity/${namespace}/entities/site/${domain}`,
                'GET'
            );
        },
        
        async getProfile(namespace, profileId) {
            return api.call('html-graph',
                `/flet-html-domain/profiles/${namespace}/${profileId}`,
                'GET'
            );
        },
        
        async saveProfile(namespace, profileId, profile) {
            return api.call('html-graph',
                `/flet-html-domain/profiles/${namespace}/${profileId}`,
                'POST',
                profile
            );
        },
        
        async applyProfile(namespace, profileId, cacheId) {
            return api.call('html-graph',
                `/flet-html-domain/profiles/${namespace}/${profileId}/apply`,
                'POST',
                { cache_id: cacheId }
            );
        },
        
        async analyzeStructure(namespace, cacheId) {
            return api.call('html-graph',
                `/flet-html-domain/html/analyze/${namespace}/structure`,
                'POST',
                { cache_id: cacheId }
            );
        },
        
        async analyzeContent(namespace, cacheId) {
            return api.call('html-graph',
                `/flet-html-domain/html/analyze/${namespace}/content`,
                'POST',
                { cache_id: cacheId }
            );
        }
    },
    
    // ═══════════════════════════════════════════════════════════════════
    // Convenience Methods: Text Transform (placeholder)
    // ═══════════════════════════════════════════════════════════════════
    
    textTransform: {
        // Add methods as needed
    },
    
    // ═══════════════════════════════════════════════════════════════════
    // Convenience Methods: LLMs (placeholder)
    // ═══════════════════════════════════════════════════════════════════
    
    llms: {
        // Add methods as needed
    }
};
```

---

## 4. Call Method Implementation

```javascript
async call(service, endpoint, method = 'GET', body = null) {
    const requestId = this._nextRequestId++;
    const startTime = Date.now();
    
    // 1. Get service config
    const config = window.workbench.config.getService(service);
    if (!config) {
        throw new Error(`Service '${service}' not configured`);
    }
    
    const url = `${config.baseUrl}${endpoint}`;
    
    // 2. Build headers
    const headers = {
        'Content-Type': 'application/json'
    };
    if (config.headerName && config.headerValue) {
        headers[config.headerName] = config.headerValue;
    }
    
    // 3. Emit api-request event
    window.workbench.events.emit('api-request', {
        id: requestId,
        service,
        endpoint,
        method,
        body,
        url
    });
    
    try {
        // 4. Make the fetch call
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        
        const data = await response.json();
        const duration = Date.now() - startTime;
        
        // 5. Emit api-response event
        window.workbench.events.emit('api-response', {
            id: requestId,
            service,
            endpoint,
            status: response.status,
            data,
            duration
        });
        
        return data;
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        // 6. Emit api-error event
        window.workbench.events.emit('api-error', {
            id: requestId,
            service,
            endpoint,
            error: error.message,
            duration
        });
        
        throw error;
    }
}
```

---

## 5. Events Emitted

| Event | When | Payload |
|-------|------|---------|
| `api-request` | Before fetch call | `{ id, service, endpoint, method, body, url }` |
| `api-response` | After successful call | `{ id, service, endpoint, status, data, duration }` |
| `api-error` | After failed call | `{ id, service, endpoint, error, duration }` |

---

## 6. File Structure

```
v0.1.0/
└── js/
    ├── api-client.js         # Main implementation
    └── api-client.test.js    # Tests
```

---

## 7. Dependencies

- **F2 (Event Bus):** For emitting api-request/response/error events
- **F4 (Config Manager):** For getting service configuration (baseUrl, auth headers)

If config is not available, the API client should:
1. Log a warning
2. Use default base URLs without auth (for testing)

---

## 8. Usage Examples

### Using convenience methods:

```javascript
// Load HTML
const response = await window.workbench.api.htmlGraph.loadHtml('my-ns', 'example.com/about');
if (response.success && response.found) {
    console.log('HTML:', response.html);
}

// Save HTML
const result = await window.workbench.api.htmlGraph.saveHtml('my-ns', 'example.com/about', '<html>...</html>');
console.log('Saved with cache_id:', result.cache_id);

// List entities
const entities = await window.workbench.api.htmlGraph.listEntities('my-ns');
console.log('Found', entities.count, 'entities');
```

### Using generic call:

```javascript
// For endpoints not covered by convenience methods
const response = await window.workbench.api.call(
    'html-graph',
    '/some/custom/endpoint',
    'POST',
    { customData: 'value' }
);
```

---

## 9. Acceptance Criteria

- [ ] `window.workbench.api` is available
- [ ] `call(service, endpoint, method, body)` makes fetch request
- [ ] Auth headers injected from config
- [ ] `api-request` event emitted before call
- [ ] `api-response` event emitted on success with duration
- [ ] `api-error` event emitted on failure
- [ ] Convenience methods work for common operations
- [ ] Handles missing config gracefully
- [ ] Request ID links request/response events

---

## 10. Test Cases

```javascript
// Test: API call emits events
QUnit.test('call emits request and response events', async function(assert) {
    const events = window.workbench.events;
    let requestEvent = null;
    let responseEvent = null;
    
    events.on('api-request', (d) => { requestEvent = d; });
    events.on('api-response', (d) => { responseEvent = d; });
    
    // Mock config
    window.workbench.config = {
        getService: () => ({ baseUrl: 'https://html-graph.dev.mgraph.ai' })
    };
    
    await window.workbench.api.call('html-graph', '/test', 'GET');
    
    assert.ok(requestEvent, 'Request event emitted');
    assert.ok(responseEvent, 'Response event emitted');
    assert.equal(requestEvent.id, responseEvent.id, 'IDs match');
});

// Test: Duration is calculated
QUnit.test('response includes duration', async function(assert) {
    let responseEvent = null;
    window.workbench.events.on('api-response', (d) => { responseEvent = d; });
    
    await window.workbench.api.call('html-graph', '/test', 'GET');
    
    assert.ok(responseEvent.duration > 0, 'Duration is positive');
});
```

---

## 11. Integration Notes

Loading order in index.html:
```html
<script src="v0.1.0/js/event-bus.js"></script>
<script src="v0.1.0/js/config-manager.js"></script>
<script src="v0.1.0/js/api-client.js"></script>  <!-- After event-bus and config -->
```

---

*Refer to SHARED_BRIEFING.md for platform context and coding standards.*
