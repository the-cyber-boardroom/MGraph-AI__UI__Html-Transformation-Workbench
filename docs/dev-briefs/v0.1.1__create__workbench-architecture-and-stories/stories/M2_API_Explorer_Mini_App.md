# Story M2: API Explorer Mini App

**Story ID:** M2  
**Layer:** Mini Apps  
**Priority:** MEDIUM  
**Parallel With:** M1, M3-M7, D1, D2  
**Dependencies:** F1-F4 (Foundation)

---

## 1. Purpose

Postman-style interface for testing and debugging API calls. Build requests, send them, view responses. Essential for developers learning the API.

---

## 2. UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API EXPLORER                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ Service: [HTML Graph ▼]                                                 │    │
│  │                                                                         │    │
│  │ Endpoint: [/flet-html-domain/html/load/{namespace}/key/{cache_key} ▼]  │    │
│  │                                                                         │    │
│  │ Method: [POST ▼]                                                        │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  ┌─────────────────────────────┐  ┌─────────────────────────────────────────┐   │
│  │ PATH PARAMETERS             │  │ HEADERS                                 │   │
│  │ ─────────────────────────── │  │ ─────────────────────────────────────── │   │
│  │ namespace: [html-cache    ] │  │ X-API-Key: [from config - ••••••]      │   │
│  │ cache_key: [example.com/ab] │  │ Content-Type: application/json         │   │
│  │                             │  │ + [Add Header]                          │   │
│  └─────────────────────────────┘  └─────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ REQUEST BODY                                                            │    │
│  │ ─────────────────────────────────────────────────────────────────────── │    │
│  │ {                                                                       │    │
│  │   "html": "<html><body>Hello</body></html>"                            │    │
│  │ }                                                                       │    │
│  │                                                                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  [▶ Send Request]                                                               │
│                                                                                  │
│  ══════════════════════════════════════════════════════════════════════════════ │
│                                                                                  │
│  RESPONSE                                              200 OK | 145ms           │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ {                                                                       │    │
│  │   "success": true,                                                      │    │
│  │   "cache_id": "aa27fb2a-f8d2-44aa-adca-5dc1736fdddd",                  │    │
│  │   "cache_key": "example.com/about",                                    │    │
│  │   "char_count": 35                                                      │    │
│  │ }                                                                       │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  [📋 Copy Response]  [📋 Copy as cURL]                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Features

### 3.1 Service/Endpoint Selection
- Dropdown for service (HTML Graph, Text Transform, LLMs)
- Dropdown or autocomplete for predefined endpoints
- HTTP method selector (GET, POST, PUT, DELETE)

### 3.2 Path Parameters
- Auto-detected from endpoint pattern (e.g., `{namespace}`)
- Input fields generated dynamically
- Validation for required params

### 3.3 Headers
- Auto-populated from config (API key)
- Add custom headers
- Remove headers

### 3.4 Request Body
- JSON editor with syntax highlighting
- Validation before sending
- Template insertion for common patterns

### 3.5 Response Display
- Status code with color (2xx green, 4xx/5xx red)
- Response time
- Formatted JSON
- Copy response / Copy as cURL

---

## 4. Endpoint Registry

Predefined endpoints for the dropdown:

```javascript
const ENDPOINTS = {
    'html-graph': [
        { 
            path: '/flet-html-domain/html/load/{namespace}/key/{cache_key}',
            method: 'POST',
            description: 'Load HTML by cache key'
        },
        {
            path: '/flet-html-domain/html/store/{namespace}/key/{cache_key}',
            method: 'POST',
            description: 'Store HTML',
            bodyTemplate: { html: '<html>...</html>' }
        },
        {
            path: '/cache-entity/{namespace}/entities',
            method: 'GET',
            description: 'List all entities'
        },
        {
            path: '/cache-entity/{namespace}/entities/site/{domain}',
            method: 'GET',
            description: 'List pages for domain'
        },
        {
            path: '/flet-html-domain/profiles/{namespace}',
            method: 'GET',
            description: 'List profiles'
        },
        {
            path: '/flet-html-domain/profiles/{namespace}/{profile_id}',
            method: 'POST',
            description: 'Save profile',
            bodyTemplate: { name: '', transforms: [] }
        }
    ]
};
```

---

## 5. Events

### Events to EMIT
| Event | When | Payload |
|-------|------|---------|
| (none) | API calls emit via API client | See api-request/api-response |

### Events to LISTEN
| Event | Action |
|-------|--------|
| `api-response` | Optional: Could show notification |

---

## 6. Key Methods

```javascript
// Parse path parameters from endpoint
parsePathParams(endpoint) {
    const matches = endpoint.match(/\{([^}]+)\}/g) || [];
    return matches.map(m => m.slice(1, -1));
}

// Build full URL with params
buildUrl(endpoint, params) {
    let url = endpoint;
    for (const [key, value] of Object.entries(params)) {
        url = url.replace(`{${key}}`, encodeURIComponent(value));
    }
    return url;
}

// Generate cURL command
generateCurl() {
    const config = this.config.getService(this.state.service);
    const url = `${config.baseUrl}${this.buildUrl(this.state.endpoint, this.state.params)}`;
    
    let curl = `curl -X ${this.state.method}`;
    curl += ` "${url}"`;
    curl += ` -H "Content-Type: application/json"`;
    if (config.headerName) {
        curl += ` -H "${config.headerName}: ${config.headerValue}"`;
    }
    if (this.state.body && this.state.method !== 'GET') {
        curl += ` -d '${this.state.body}'`;
    }
    return curl;
}

// Send request
async sendRequest() {
    this.setState({ loading: true, response: null, error: null });
    
    try {
        const endpoint = this.buildUrl(this.state.endpoint, this.state.params);
        const body = this.state.method !== 'GET' ? JSON.parse(this.state.body) : null;
        
        const startTime = Date.now();
        const response = await this.api.call(
            this.state.service,
            endpoint,
            this.state.method,
            body
        );
        const duration = Date.now() - startTime;
        
        this.setState({ 
            loading: false, 
            response, 
            duration,
            status: 200 
        });
    } catch (error) {
        this.setState({ 
            loading: false, 
            error: error.message,
            status: error.status || 500
        });
    }
}
```

---

## 7. File Structure

```
v0.1.0/
└── components/
    └── api-explorer/
        ├── api-explorer.js
        └── api-explorer.test.js
```

---

## 8. Acceptance Criteria

- [ ] Service dropdown with all 3 services
- [ ] Endpoint dropdown with predefined options
- [ ] Can type custom endpoint
- [ ] Path params auto-detected and shown as inputs
- [ ] Method selector (GET, POST, PUT, DELETE)
- [ ] Request body editor (hidden for GET)
- [ ] Send button makes real API call
- [ ] Response shows status code, timing, formatted JSON
- [ ] Copy response to clipboard
- [ ] Generate and copy cURL command
- [ ] Loading indicator during request
- [ ] Error display for failures

---

*Refer to SHARED_BRIEFING.md for platform context and coding standards.*
