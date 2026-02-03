# Story D2: API Logger Mini App

**Story ID:** D2  
**Layer:** Debug Tools  
**Priority:** HIGH (essential for debugging)  
**Parallel With:** D1, M1-M7  
**Dependencies:** F1 (Shell), F2 (Events), F3 (API Client)

---

## 1. Purpose

Create a Postman-style debugging mini app that displays all API calls made through the API client. Essential for:
- Understanding what API calls are being made
- Debugging request/response payloads
- Monitoring API performance (timing)
- Resending requests for testing
- Generating cURL commands

---

## 2. UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              API LOGGER                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Filter: [___________________]  [All Services ▼]  [🗑 Clear]  [📥 Export]       │
│                                                                                  │
│  Stats: 15 requests | Avg: 112ms | Errors: 1                                    │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────────┐│
│  │ ● #15  POST  /flet-html-domain/html/load/.../key/example.com/about         ││
│  │        html-graph | 200 OK | 145ms                                          ││
│  │                                                                              ││
│  │   ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │   │ REQUEST                                                             │   ││
│  │   │ ───────────────────────────────────────────────────────────────────│   ││
│  │   │ Headers:                                                            │   ││
│  │   │   X-API-Key: ••••••••••••                                          │   ││
│  │   │   Content-Type: application/json                                    │   ││
│  │   │                                                                     │   ││
│  │   │ Body:                                                               │   ││
│  │   │   {}                                                                │   ││
│  │   └─────────────────────────────────────────────────────────────────────┘   ││
│  │                                                                              ││
│  │   ┌─────────────────────────────────────────────────────────────────────┐   ││
│  │   │ RESPONSE                                                            │   ││
│  │   │ ───────────────────────────────────────────────────────────────────│   ││
│  │   │ {                                                                   │   ││
│  │   │   "success": true,                                                  │   ││
│  │   │   "found": true,                                                    │   ││
│  │   │   "html": "<html>...",                                              │   ││
│  │   │   "cache_id": "aa27fb2a-..."                                       │   ││
│  │   │ }                                                                   │   ││
│  │   └─────────────────────────────────────────────────────────────────────┘   ││
│  │                                                                              ││
│  │   [🔄 Resend]  [📋 Copy cURL]  [📋 Copy Response]                           ││
│  ├─────────────────────────────────────────────────────────────────────────────┤│
│  │ ● #14  GET  /cache-entity/html-cache/entities                               ││
│  │        html-graph | 200 OK | 89ms                             [▶ Expand]    ││
│  ├─────────────────────────────────────────────────────────────────────────────┤│
│  │ ○ #13  POST  /flet-html-domain/profiles/.../apply             (pending)     ││
│  │        html-graph | ...                                       [▶ Expand]    ││
│  ├─────────────────────────────────────────────────────────────────────────────┤│
│  │ ✗ #12  POST  /invalid-endpoint                                              ││
│  │        html-graph | 404 Not Found | 45ms                      [▶ Expand]    ││
│  └─────────────────────────────────────────────────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Features

### 3.1 Request Display
- Status indicator: ● success (green), ✗ error (red), ○ pending (yellow)
- HTTP method and endpoint
- Service name
- Status code and timing
- Collapsible detail view

### 3.2 Request Details
- Headers (with API key masked)
- Request body (formatted JSON)
- Response body (formatted JSON)
- Error message (if failed)

### 3.3 Actions
- **Resend:** Re-execute the same API call
- **Copy cURL:** Generate and copy cURL command
- **Copy Response:** Copy response body to clipboard
- **Clear:** Clear the log
- **Export:** Download log as JSON

### 3.4 Statistics
- Total request count
- Average response time
- Error count

---

## 4. Component Structure

```javascript
class ApiLogger extends HTMLElement {
    
    static get appId()    { return 'api-logger'; }
    static get navLabel() { return 'API Log'; }
    static get navIcon()  { return '🔌'; }
    
    constructor() {
        super();
        this.state = {
            requests: new Map(),  // id -> { request, response, status }
            filter: '',
            serviceFilter: '',
            expandedIds: new Set()
        };
        this._boundHandlers = {};
    }
    
    setupEventListeners() {
        this._boundHandlers.onApiRequest = this.onApiRequest.bind(this);
        this._boundHandlers.onApiResponse = this.onApiResponse.bind(this);
        this._boundHandlers.onApiError = this.onApiError.bind(this);
        
        this.events.on('api-request', this._boundHandlers.onApiRequest);
        this.events.on('api-response', this._boundHandlers.onApiResponse);
        this.events.on('api-error', this._boundHandlers.onApiError);
    }
    
    cleanup() {
        this.events.off('api-request', this._boundHandlers.onApiRequest);
        this.events.off('api-response', this._boundHandlers.onApiResponse);
        this.events.off('api-error', this._boundHandlers.onApiError);
    }
    
    onApiRequest(detail) {
        this.state.requests.set(detail.id, {
            ...detail,
            status: 'pending',
            timestamp: Date.now()
        });
        this.renderRequestList();
    }
    
    onApiResponse(detail) {
        const request = this.state.requests.get(detail.id);
        if (request) {
            request.response = detail;
            request.status = 'success';
            this.renderRequestList();
        }
    }
    
    onApiError(detail) {
        const request = this.state.requests.get(detail.id);
        if (request) {
            request.error = detail;
            request.status = 'error';
            this.renderRequestList();
        }
    }
}
```

---

## 5. Events to Listen

| Event | Handler | Purpose |
|-------|---------|---------|
| `api-request` | `onApiRequest` | Log new request |
| `api-response` | `onApiResponse` | Update with response |
| `api-error` | `onApiError` | Update with error |

---

## 6. Key Methods

### Generate cURL Command

```javascript
generateCurl(request) {
    const config = this.config.getService(request.service);
    const url = `${config.baseUrl}${request.endpoint}`;
    
    let curl = `curl -X ${request.method}`;
    curl += ` "${url}"`;
    curl += ` -H "Content-Type: application/json"`;
    
    if (config.headerName && config.headerValue) {
        curl += ` -H "${config.headerName}: ${config.headerValue}"`;
    }
    
    if (request.body) {
        curl += ` -d '${JSON.stringify(request.body)}'`;
    }
    
    return curl;
}
```

### Resend Request

```javascript
async resendRequest(requestId) {
    const original = this.state.requests.get(requestId);
    if (!original) return;
    
    await this.api.call(
        original.service,
        original.endpoint,
        original.method,
        original.body
    );
}
```

### Calculate Statistics

```javascript
getStats() {
    const requests = Array.from(this.state.requests.values());
    const completed = requests.filter(r => r.status !== 'pending');
    const errors = requests.filter(r => r.status === 'error');
    
    const totalDuration = completed
        .filter(r => r.response?.duration)
        .reduce((sum, r) => sum + r.response.duration, 0);
    
    const avgDuration = completed.length > 0 
        ? Math.round(totalDuration / completed.length) 
        : 0;
    
    return {
        total: requests.length,
        avgDuration,
        errors: errors.length
    };
}
```

---

## 7. UI Rendering

### Request Item

```javascript
renderRequestItem(request) {
    const isExpanded = this.state.expandedIds.has(request.id);
    const statusIcon = this.getStatusIcon(request.status);
    const statusClass = this.getStatusClass(request.status);
    
    return `
        <div class="al-request ${statusClass}" data-id="${request.id}">
            <div class="al-request-header" onclick="this.closest('api-logger').toggleExpand(${request.id})">
                <span class="al-status">${statusIcon}</span>
                <span class="al-id">#${request.id}</span>
                <span class="al-method">${request.method}</span>
                <span class="al-endpoint">${this.truncateEndpoint(request.endpoint)}</span>
                <span class="al-service">${request.service}</span>
                ${request.response ? `
                    <span class="al-http-status">${request.response.status}</span>
                    <span class="al-duration">${request.response.duration}ms</span>
                ` : ''}
                <span class="al-expand">${isExpanded ? '▼' : '▶'}</span>
            </div>
            ${isExpanded ? this.renderRequestDetail(request) : ''}
        </div>
    `;
}

getStatusIcon(status) {
    switch (status) {
        case 'success': return '●';
        case 'error': return '✗';
        case 'pending': return '○';
        default: return '?';
    }
}
```

### Request Detail

```javascript
renderRequestDetail(request) {
    return `
        <div class="al-detail">
            <div class="al-section">
                <h4>REQUEST</h4>
                <div class="al-headers">
                    <strong>Headers:</strong>
                    <pre>X-API-Key: ••••••••••••
Content-Type: application/json</pre>
                </div>
                <div class="al-body">
                    <strong>Body:</strong>
                    <pre class="al-json">${JSON.stringify(request.body || {}, null, 2)}</pre>
                </div>
            </div>
            
            ${request.response ? `
                <div class="al-section">
                    <h4>RESPONSE</h4>
                    <pre class="al-json">${JSON.stringify(request.response.data, null, 2)}</pre>
                </div>
            ` : ''}
            
            ${request.error ? `
                <div class="al-section al-error">
                    <h4>ERROR</h4>
                    <pre>${request.error.error}</pre>
                </div>
            ` : ''}
            
            <div class="al-actions">
                <button onclick="this.closest('api-logger').resendRequest(${request.id})">🔄 Resend</button>
                <button onclick="this.closest('api-logger').copyCurl(${request.id})">📋 Copy cURL</button>
                ${request.response ? `
                    <button onclick="this.closest('api-logger').copyResponse(${request.id})">📋 Copy Response</button>
                ` : ''}
            </div>
        </div>
    `;
}
```

---

## 8. File Structure

```
v0.1.0/
└── components/
    └── api-logger/
        ├── api-logger.js
        └── api-logger.test.js
```

---

## 9. Acceptance Criteria

- [ ] Appears in nav bar as "API Log"
- [ ] Shows API requests as they're made
- [ ] Status indicator: green (success), red (error), yellow (pending)
- [ ] Shows method, endpoint, service, status code, duration
- [ ] Click request to expand/collapse details
- [ ] Details show headers (masked API key), body, response
- [ ] Resend button makes same API call again
- [ ] Copy cURL generates valid cURL command
- [ ] Copy Response copies response body
- [ ] Filter by text filters displayed requests
- [ ] Dropdown filters by service
- [ ] Clear button empties log
- [ ] Export downloads log as JSON
- [ ] Stats show total, average time, error count

---

## 10. CSS Styling

```css
.api-logger {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: system-ui;
}

.al-toolbar {
    display: flex;
    gap: 10px;
    padding: 10px;
    border-bottom: 1px solid #ddd;
    background: #f9f9f9;
}

.al-stats {
    padding: 8px 10px;
    background: #e8f4fd;
    font-size: 13px;
    border-bottom: 1px solid #cde4f7;
}

.al-list {
    flex: 1;
    overflow-y: auto;
    padding: 10px;
}

.al-request {
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    margin-bottom: 8px;
    background: white;
}

.al-request.success { border-left: 3px solid #4caf50; }
.al-request.error { border-left: 3px solid #f44336; }
.al-request.pending { border-left: 3px solid #ff9800; }

.al-request-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    cursor: pointer;
    background: #fafafa;
}

.al-request-header:hover {
    background: #f0f0f0;
}

.al-status.success { color: #4caf50; }
.al-status.error { color: #f44336; }
.al-status.pending { color: #ff9800; }

.al-id { color: #666; font-size: 12px; }
.al-method { font-weight: bold; color: #1976d2; }
.al-endpoint { flex: 1; font-family: monospace; font-size: 12px; color: #333; }
.al-service { color: #666; font-size: 11px; background: #eee; padding: 2px 6px; border-radius: 3px; }
.al-http-status { font-weight: bold; }
.al-duration { color: #888; font-size: 12px; }
.al-expand { color: #999; }

.al-detail {
    padding: 15px;
    border-top: 1px solid #eee;
    background: #fafafa;
}

.al-section {
    margin-bottom: 15px;
}

.al-section h4 {
    margin: 0 0 8px 0;
    color: #666;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1px;
}

.al-json {
    background: #282c34;
    color: #abb2bf;
    padding: 10px;
    border-radius: 4px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 12px;
    white-space: pre-wrap;
    overflow-x: auto;
}

.al-error pre {
    background: #ffebee;
    color: #c62828;
    padding: 10px;
    border-radius: 4px;
}

.al-actions {
    display: flex;
    gap: 8px;
    margin-top: 10px;
}

.al-actions button {
    padding: 6px 12px;
    font-size: 12px;
    cursor: pointer;
    border: 1px solid #ddd;
    background: white;
    border-radius: 4px;
}

.al-actions button:hover {
    background: #f5f5f5;
}
```

---

*Refer to SHARED_BRIEFING.md for platform context and coding standards.*
