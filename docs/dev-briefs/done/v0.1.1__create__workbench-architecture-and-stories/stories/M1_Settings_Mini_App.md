# Story M1: Settings Mini App

**Story ID:** M1  
**Layer:** Mini Apps  
**Priority:** HIGH (needed to configure API keys)  
**Parallel With:** D1, D2, M2-M7  
**Dependencies:** F1-F4 (Foundation)

---

## 1. Purpose

Configuration panel for API credentials, default namespace, and connection testing. Users must configure API keys here before other features work.

---

## 2. UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SETTINGS                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  API Configuration                                                               │
│  ═════════════════                                                               │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ HTML Graph API                                                    ✓ OK   │  │
│  │ ─────────────────────────────────────────────────────────────────────────│  │
│  │ Base URL:    [https://html-graph.dev.mgraph.ai                       ]   │  │
│  │ Header Name: [X-API-Key                                              ]   │  │
│  │ Header Value:[••••••••••••••••••••••••••••••••                       ]👁  │  │
│  │                                                                          │  │
│  │                                                        [Test Connection] │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ Text Transform API                                                ⚠ N/A  │  │
│  │ ─────────────────────────────────────────────────────────────────────────│  │
│  │ Base URL:    [https://text-transform.dev.mgraph.ai                   ]   │  │
│  │ Header Name: [X-API-Key                                              ]   │  │
│  │ Header Value:[                                                       ]👁  │  │
│  │                                                                          │  │
│  │                                                        [Test Connection] │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ LLMs API                                                          ✗ Fail │  │
│  │ ─────────────────────────────────────────────────────────────────────────│  │
│  │ Base URL:    [https://llms.dev.mgraph.ai                             ]   │  │
│  │ Header Name: [X-API-Key                                              ]   │  │
│  │ Header Value:[wrong-key                                              ]👁  │  │
│  │                                                                          │  │
│  │ Error: 401 Unauthorized                               [Test Connection] │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
│  Defaults                                                                        │
│  ════════                                                                        │
│                                                                                  │
│  Default Namespace: [html-cache                                             ]   │
│                                                                                  │
│  ────────────────────────────────────────────────────────────────────────────   │
│                                                                                  │
│  [💾 Save All]                                            [🔄 Reset to Defaults] │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Features

- Configure 3 services (HTML Graph, Text Transform, LLMs)
- Password field for API key (with show/hide toggle)
- Test connection button for each service
- Status indicator per service (OK, N/A, Fail)
- Default namespace setting
- Save persists to localStorage
- Reset to defaults option

---

## 4. Events

### Events to EMIT
| Event | When | Payload |
|-------|------|---------|
| `config-changed` | After saving | `{ path, value }` (via config.set) |

### Events to LISTEN
- None (standalone configuration)

---

## 5. Key Methods

```javascript
async testConnection(serviceName) {
    const config = this.config.getService(serviceName);
    this.setServiceStatus(serviceName, 'testing');
    
    try {
        // Simple health check or list entities
        const response = await this.api.call(
            serviceName,
            serviceName === 'html-graph' 
                ? '/cache-entity/test/entities' 
                : '/health',
            'GET'
        );
        
        this.setServiceStatus(serviceName, 'ok');
    } catch (error) {
        this.setServiceStatus(serviceName, 'error', error.message);
    }
}

saveAll() {
    // Collect all form values and save
    ['html-graph', 'text-transform', 'llms'].forEach(service => {
        const baseUrl = this.querySelector(`#${service}-url`).value;
        const headerName = this.querySelector(`#${service}-header`).value;
        const headerValue = this.querySelector(`#${service}-key`).value;
        
        this.config.setService(service, { baseUrl, headerName, headerValue });
    });
    
    this.config.set('defaults.namespace', this.querySelector('#default-namespace').value);
    
    this.showToast('Settings saved');
}

resetToDefaults() {
    if (confirm('Reset all settings to defaults?')) {
        this.config.reset();
        this.render();
        this.showToast('Settings reset');
    }
}
```

---

## 6. File Structure

```
v0.1.0/
└── components/
    └── settings-panel/
        ├── settings-panel.js
        └── settings-panel.test.js
```

---

## 7. Acceptance Criteria

- [ ] Shows config for all 3 services
- [ ] API key fields are password type with show/hide toggle
- [ ] Test connection makes real API call
- [ ] Status shows OK (green), N/A (yellow), Fail (red)
- [ ] Error message displayed on test failure
- [ ] Save persists all values to localStorage
- [ ] Reset restores default values
- [ ] Form populates from existing config on load

---

*Refer to SHARED_BRIEFING.md for platform context and coding standards.*
