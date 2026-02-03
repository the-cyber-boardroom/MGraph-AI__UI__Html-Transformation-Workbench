# HTML Transformation Workbench: Architecture & User Stories

**Part 2** (evolution on ideas in v1__LLM_BRIEF__HTML_Transformation_Workbench_UI.md)

## Executive Summary

The HTML Transformation Workbench is a modular, plugin-based web application for loading, transforming, analyzing, and managing cached HTML content. It provides a visual interface for applying transformations to web pages (sentiment filtering, content extraction, style simplification) and analyzing page/site structure.

**Key Design Principles:**

1. **Micro-Frontend Architecture** - Independent mini apps that slot into a common shell
2. **Event-Driven Communication** - Mini apps never talk directly; all communication via events
3. **Parallel Development** - Stories can be worked on simultaneously by multiple agents
4. **Real Backend** - No mocks; all development against live APIs from day one
5. **Observable System** - Built-in tooling to view events and API calls for debugging

---

## Platform Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                        HTML TRANSFORMATION WORKBENCH                                 │
│                                                                                     │
│  "A modular workbench for HTML caching, transformation, and analysis"              │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│   ┌─────────────────────────────────────────────────────────────────────────────┐  │
│   │                         FOUNDATION SHELL                                     │  │
│   │   ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐         │  │
│   │   │  Router  │ │  Events  │ │   API    │ │  Config  │ │   Nav    │         │  │
│   │   │  Service │ │   Bus    │ │  Client  │ │  Manager │ │   Bar    │         │  │
│   │   └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘         │  │
│   └─────────────────────────────────────────────────────────────────────────────┘  │
│                                        │                                            │
│                                        ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────────────────┐  │
│   │                      MINI APP CONTAINER                                      │  │
│   │                                                                              │  │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐  │  │
│   │   │Settings │ │Workbench│ │Profiles │ │  Sites  │ │Page     │ │Site     │  │  │
│   │   │         │ │         │ │         │ │ Browser │ │Analysis │ │Analysis │  │  │
│   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘  │  │
│   │                                                                              │  │
│   │   ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐                           │  │
│   │   │   API   │ │ Events  │ │ Hello   │ │ Hello   │  ◄── Debug & Validation   │  │
│   │   │ Explorer│ │ Viewer  │ │ World 1 │ │ World 2 │      Mini Apps            │  │
│   │   └─────────┘ └─────────┘ └─────────┘ └─────────┘                           │  │
│   └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                              BACKEND SERVICES                                       │
│                                                                                     │
│   ┌──────────────────────┐  ┌──────────────────────┐  ┌──────────────────────┐    │
│   │    HTML Graph API    │  │  Text Transform API  │  │      LLMs API        │    │
│   │  html-graph.dev.     │  │  text-transform.dev. │  │    llms.dev.         │    │
│   │    mgraph.ai         │  │      mgraph.ai       │  │    mgraph.ai         │    │
│   └──────────────────────┘  └──────────────────────┘  └──────────────────────┘    │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Architecture Layers

### Layer 0: Foundation Shell

The foundation provides the "frame" that all mini apps slot into. It must be built first as all other stories depend on it.

**Responsibilities:**
- Navigation bar with dynamic mini app registration
- Router to switch between mini apps
- Event bus for cross-app communication
- API client for backend calls
- Config manager for local storage persistence
- Mini app container with slot mechanism

**Key Contract:** Mini apps register with the shell and receive access to shared services. They communicate exclusively through events.

---

### Layer 1: Shared Services

Services that run within the foundation shell and are available to all mini apps.

```
┌─────────────────────────────────────────────────────────────────┐
│                     window.workbench                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   events: {                     │   api: {                       │
│     emit(name, detail)          │     htmlGraph: { ... }         │
│     on(name, callback)          │     textTransform: { ... }     │
│     off(name, callback)         │     llms: { ... }              │
│     history: [...]              │     call(service, endpoint,    │
│     replay(eventId)             │          method, body)         │
│   }                             │   }                            │
│                                 │                                │
│   config: {                     │   router: {                    │
│     get(key)                    │     navigate(appId)            │
│     set(key, value)             │     current: 'settings'        │
│     services: { ... }           │     register(miniApp)          │
│   }                             │   }                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Layer 2: Mini Apps

Independent web components that implement the mini app contract. Each mini app:

- Registers with the shell on load
- Receives lifecycle callbacks (activate/deactivate)
- Accesses shared services via `window.workbench`
- Communicates only via events

**Mini App Contract:**

```
┌─────────────────────────────────────────────────────────────────┐
│                      Mini App Contract                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Static Properties:                                              │
│  ├── appId      → Unique identifier (e.g., 'settings')          │
│  ├── navLabel   → Display name (e.g., 'Settings')               │
│  └── navIcon    → Icon (e.g., '⚙️')                              │
│                                                                  │
│  Lifecycle Methods:                                              │
│  ├── onActivate()    → Called when app becomes visible          │
│  └── onDeactivate()  → Called when app is hidden                │
│                                                                  │
│  Inherited Access:                                               │
│  ├── this.api        → API client                               │
│  ├── this.events     → Event bus                                │
│  ├── this.config     → Config manager                           │
│  └── this.router     → Router                                   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Layer 3: Backend APIs

New endpoints needed to support the workbench functionality. These are additions to the existing HTML Graph API.

```
┌─────────────────────────────────────────────────────────────────┐
│                    New Backend Endpoints                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Profiles:                                                       │
│  ├── GET/POST/DELETE /profiles/{ns}/{profile_id}                │
│  └── POST /profiles/{ns}/{profile_id}/apply[/site/{domain}]     │
│                                                                  │
│  Site Browsing:                                                  │
│  └── GET /cache-entity/{ns}/entities/site/{domain}              │
│                                                                  │
│  Page Analysis:                                                  │
│  ├── POST /html/analyze/{ns}/structure                          │
│  ├── POST /html/analyze/{ns}/content                            │
│  ├── POST /html/analyze/{ns}/links                              │
│  └── POST /html/graph/{ns}/dom-tree                             │
│                                                                  │
│  Site Analysis:                                                  │
│  ├── POST /site/analyze/{ns}/sitemap/{domain}                   │
│  ├── POST /site/analyze/{ns}/content/{domain}                   │
│  └── POST /site/graph/{ns}/links/{domain}                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

### Layer 4: Shared UI Components

Reusable components used by multiple mini apps.

| Component | Used By | Purpose |
|-----------|---------|---------|
| HTML Editor/Viewer | Workbench, Page Analysis | View/edit raw HTML with syntax highlighting |
| Graph Visualizer | Page Analysis, Site Analysis | D3-based graph rendering |
| Transform Config | Workbench, Profile Manager | Configure transformation parameters |

---

## Event Catalog

All cross-app communication happens through events. Here is the complete event catalog:

### Navigation Events
| Event | Payload | Description |
|-------|---------|-------------|
| `navigate` | `{ appId }` | Request navigation to mini app |
| `navigated` | `{ appId, previousAppId }` | Navigation completed |

### HTML Events
| Event | Payload | Description |
|-------|---------|-------------|
| `html-load-request` | `{ cacheKey }` | Request to load HTML |
| `html-loaded` | `{ cacheKey, cacheId, html }` | HTML loaded from cache |
| `html-save-request` | `{ cacheKey, html }` | Request to save HTML |
| `html-saved` | `{ cacheKey, cacheId }` | HTML saved to cache |

### Profile Events
| Event | Payload | Description |
|-------|---------|-------------|
| `profile-load-request` | `{ profileId }` | Request to load profile |
| `profile-loaded` | `{ profileId, profile }` | Profile loaded |
| `profile-saved` | `{ profileId }` | Profile saved |
| `profile-apply-request` | `{ profileId, cacheId }` | Apply profile to page |
| `profile-applied` | `{ profileId, cacheId, resultCacheId }` | Profile applied |

### Site Events
| Event | Payload | Description |
|-------|---------|-------------|
| `site-browse-request` | `{ domain }` | Request pages for domain |
| `site-loaded` | `{ domain, pages }` | Pages loaded |
| `batch-apply-request` | `{ profileId, domain, cacheKeys }` | Batch transform |
| `batch-apply-complete` | `{ profileId, results }` | Batch complete |

### Analysis Events
| Event | Payload | Description |
|-------|---------|-------------|
| `analysis-request` | `{ type, cacheId }` | Request analysis |
| `analysis-complete` | `{ type, cacheId, analysis }` | Analysis done |
| `graph-request` | `{ type, cacheId/domain }` | Request graph |
| `graph-complete` | `{ type, graph }` | Graph generated |

### Config Events
| Event | Payload | Description |
|-------|---------|-------------|
| `config-changed` | `{ key, value }` | Config updated |
| `config-loaded` | `{ config }` | Config loaded from storage |

### API Events (for logging)
| Event | Payload | Description |
|-------|---------|-------------|
| `api-request` | `{ id, service, endpoint, method, body }` | API call started |
| `api-response` | `{ id, status, data, duration }` | API call completed |
| `api-error` | `{ id, error }` | API call failed |

---

## User Stories Catalog

### Story Dependency Graph

```
                                FOUNDATION
                                    │
            ┌───────────┬───────────┼───────────┬───────────┐
            ▼           ▼           ▼           ▼           ▼
          ┌───┐       ┌───┐       ┌───┐       ┌───┐       ┌───┐
          │F1 │       │F2 │       │F3 │       │F4 │       │F5 │
          │Shl│       │Evt│       │API│       │Cfg│       │Nav│
          └─┬─┘       └─┬─┘       └─┬─┘       └─┬─┘       └─┬─┘
            └───────────┴───────────┼───────────┴───────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
          ▼                         ▼                         ▼
    ┌───────────┐           ┌───────────┐           ┌───────────┐
    │ MINI APPS │           │  BACKEND  │           │  SHARED   │
    │           │           │   APIs    │           │COMPONENTS │
    │ M1-M9     │           │ B1-B5     │           │ S1-S3     │
    │ (parallel)│           │ (parallel)│           │ (parallel)│
    └───────────┘           └───────────┘           └───────────┘
```

---

## FOUNDATION STORIES (F1-F5)

These must be completed first. They can be worked on in parallel with each other.

---

### F1: Foundation Shell & Router

**Description:**
Create the main application shell that provides the frame for all mini apps. Includes the layout structure, mini app container with slots, and routing logic to switch between apps.

**Inputs:**
- None (this is the base)

**Outputs:**
- `workbench-shell` web component
- `window.workbench.router` service
- CSS layout framework

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│ workbench-shell                                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Header: Logo + Title                                      │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Nav Bar: [App 1] [App 2] [App 3] ...    (dynamic)        │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │                   Mini App Container                      │  │
│  │                                                           │  │
│  │              <slot name="active-app">                     │  │
│  │                  <!-- active mini app here -->            │  │
│  │              </slot>                                      │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Footer: Status bar                                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Router API:**

```
router.register(MiniAppClass)     → Register a mini app
router.navigate(appId)            → Switch to app
router.current                    → Current app ID
router.apps                       → List of registered apps
```

**Acceptance Criteria:**
- [ ] Shell renders with header, nav, container, footer
- [ ] Can register mini apps dynamically
- [ ] Nav bar updates when apps register
- [ ] Clicking nav item switches active app
- [ ] Only one app visible at a time
- [ ] Active app receives onActivate(), previous receives onDeactivate()

---

### F2: Event Bus Service

**Description:**
Create a centralized event bus for cross-component communication. All mini apps communicate exclusively through this bus. Includes event history for debugging and replay capability.

**Inputs:**
- None

**Outputs:**
- `window.workbench.events` service
- Event history storage
- Replay functionality

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                         Event Bus                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   emit(eventName, detail)                                       │
│       │                                                          │
│       ├──► Add to history with timestamp + ID                   │
│       │                                                          │
│       └──► Dispatch to all subscribers                          │
│                                                                  │
│   on(eventName, callback)  → Subscribe                          │
│   off(eventName, callback) → Unsubscribe                        │
│                                                                  │
│   history: [                                                     │
│     { id: 1, name: 'html-loaded', detail: {...}, ts: ... },    │
│     { id: 2, name: 'navigate', detail: {...}, ts: ... },       │
│   ]                                                              │
│                                                                  │
│   replay(eventId) → Re-emit event from history                  │
│   clear()         → Clear history                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Event Structure:**

```
{
  id: 42,                        // Auto-incrementing ID
  name: 'html-loaded',           // Event name
  detail: { cacheKey: '...' },   // Payload
  timestamp: 1768970000000,      // When emitted
  source: 'html-workbench'       // Which app emitted (optional)
}
```

**Acceptance Criteria:**
- [ ] Can emit events with payload
- [ ] Can subscribe/unsubscribe to events
- [ ] Events stored in history with ID and timestamp
- [ ] Can replay any event from history
- [ ] History accessible for debugging

---

### F3: API Client Service

**Description:**
Create a unified API client that handles calls to all backend services (HTML Graph, Text Transform, LLMs). Includes authentication header injection and emits events for all API calls (for logging/debugging).

**Inputs:**
- Config manager (for API keys)
- Event bus (for logging)

**Outputs:**
- `window.workbench.api` service
- API call logging via events

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                         API Client                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Services:                                                      │
│   ├── htmlGraph:     https://html-graph.dev.mgraph.ai           │
│   ├── textTransform: https://text-transform.dev.mgraph.ai       │
│   └── llms:          https://llms.dev.mgraph.ai                 │
│                                                                  │
│   call(service, endpoint, method, body)                         │
│       │                                                          │
│       ├──► Get config for service (baseUrl, header, key)        │
│       ├──► Emit 'api-request' event                             │
│       ├──► Make fetch() call with auth header                   │
│       ├──► Emit 'api-response' or 'api-error' event             │
│       └──► Return response                                       │
│                                                                  │
│   Convenience methods:                                           │
│   ├── htmlGraph.loadHtml(cacheKey)                              │
│   ├── htmlGraph.saveHtml(cacheKey, html)                        │
│   ├── htmlGraph.listEntities(namespace)                         │
│   └── ...                                                        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Can call any configured service
- [ ] Auth headers injected automatically
- [ ] All calls emit api-request event before call
- [ ] All calls emit api-response/api-error after call
- [ ] Convenience methods for common operations
- [ ] Handles errors gracefully

---

### F4: Config Manager Service

**Description:**
Create a configuration manager that persists settings to localStorage. Stores API credentials, default namespace, and user preferences.

**Inputs:**
- None

**Outputs:**
- `window.workbench.config` service
- localStorage persistence

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│                       Config Manager                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Storage Key: 'workbench-config'                               │
│                                                                  │
│   Schema:                                                        │
│   {                                                              │
│     version: 1,                                                  │
│     services: {                                                  │
│       'html-graph': {                                           │
│         baseUrl: 'https://html-graph.dev.mgraph.ai',           │
│         headerName: 'X-API-Key',                                │
│         headerValue: '...'                                      │
│       },                                                         │
│       'text-transform': { ... },                                │
│       'llms': { ... }                                           │
│     },                                                           │
│     defaults: {                                                  │
│       namespace: 'html-cache'                                   │
│     },                                                           │
│     recent: {                                                    │
│       cacheKeys: [...],                                         │
│       domains: [...]                                            │
│     }                                                            │
│   }                                                              │
│                                                                  │
│   Methods:                                                       │
│   ├── get(path)           → Get value by path                   │
│   ├── set(path, value)    → Set value, persist, emit event     │
│   ├── getService(name)    → Get service config                  │
│   └── load() / save()     → Manual persistence                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Config loads from localStorage on startup
- [ ] Config saves to localStorage on change
- [ ] Emits 'config-changed' event on updates
- [ ] Provides typed access to service configs
- [ ] Handles missing/corrupted config gracefully

---

### F5: Hello World Validation Apps

**Description:**
Create two minimal "Hello World" mini apps to validate the slot mechanism and mini app contract. These serve as templates for future mini app development and prove the architecture works.

**Inputs:**
- Foundation shell (F1)
- Event bus (F2)

**Outputs:**
- `hello-world-1` mini app
- `hello-world-2` mini app
- Mini app template/documentation

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│ hello-world-1                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                    Hello World 1                          │ │
│   │                                                           │ │
│   │   This app demonstrates:                                  │ │
│   │   • Mini app registration                                 │ │
│   │   • Lifecycle callbacks                                   │ │
│   │   • Event emission                                        │ │
│   │                                                           │ │
│   │   Status: [Active/Inactive]                               │ │
│   │   Activated: 5 times                                      │ │
│   │                                                           │ │
│   │   [Send Test Event]  [Navigate to Hello 2]               │ │
│   │                                                           │ │
│   └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ hello-world-2                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌───────────────────────────────────────────────────────────┐ │
│   │                    Hello World 2                          │ │
│   │                                                           │ │
│   │   This app demonstrates:                                  │ │
│   │   • Receiving events                                      │ │
│   │   • Using API client                                      │ │
│   │   • Using config                                          │ │
│   │                                                           │ │
│   │   Last event received: html-loaded                        │ │
│   │   API calls made: 3                                       │ │
│   │                                                           │ │
│   │   [Make Test API Call]  [Navigate to Hello 1]            │ │
│   │                                                           │ │
│   └───────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Both apps register with shell
- [ ] Both appear in nav bar
- [ ] Can navigate between them
- [ ] onActivate/onDeactivate called correctly
- [ ] Can emit and receive events between apps
- [ ] Can access API client and config
- [ ] Serve as templates for other mini apps

---

## DEBUG TOOL STORIES (D1-D2)

Essential debugging tools built as mini apps.

---

### D1: Events Viewer Mini App

**Description:**
A mini app that displays all events flowing through the event bus in real-time. Shows event history, allows filtering by event type, and provides replay functionality to re-emit past events.

**Inputs:**
- Event bus (F2)

**Outputs:**
- `events-viewer` mini app

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│ events-viewer                                                    │
├─────────────────────────────────────────────────────────────────┤
│  Filter: [_______________] [All ▼]  [Clear] [Pause] [Export]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ #42  html-loaded                           10:45:23.456   │  │
│  │      source: html-workbench                               │  │
│  │      ┌─────────────────────────────────────────────────┐  │  │
│  │      │ {                                               │  │  │
│  │      │   "cacheKey": "example.com/about",              │  │  │
│  │      │   "cacheId": "aa27fb2a-..."                     │  │  │
│  │      │ }                                               │  │  │
│  │      └─────────────────────────────────────────────────┘  │  │
│  │      [Replay] [Copy]                                      │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ #41  navigate                              10:45:20.123   │  │
│  │      source: nav-bar                                      │  │
│  │      { "appId": "html-workbench" }                        │  │
│  │      [Replay] [Copy]                                      │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ #40  config-changed                        10:45:15.789   │  │
│  │      ...                                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Showing 42 events (3 filtered)          [Load More]            │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time event stream (newest first)
- Filter by event name (text search or dropdown)
- Expandable event detail (JSON payload)
- Replay button re-emits event
- Copy event as JSON
- Pause/resume stream
- Export history as JSON
- Clear history

**Acceptance Criteria:**
- [ ] Shows all events in real-time
- [ ] Can filter by event name
- [ ] Can expand to see full payload
- [ ] Replay button re-emits the event
- [ ] Can pause stream while investigating
- [ ] Can export history for sharing

---

### D2: API Logger Mini App

**Description:**
A mini app that displays all API calls made through the API client. Shows request/response details, timing, status codes, and allows re-sending requests.

**Inputs:**
- API client (F3) via api-request/api-response events

**Outputs:**
- `api-logger` mini app

**Architecture:**

```
┌─────────────────────────────────────────────────────────────────┐
│ api-logger                                                       │
├─────────────────────────────────────────────────────────────────┤
│  Filter: [_______________] [All Services ▼]  [Clear] [Export]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ● #15  POST  /flet-html-domain/html/load/.../key/...      │  │
│  │        html-graph | 200 OK | 145ms                        │  │
│  │                                                           │  │
│  │   Request:                                                │  │
│  │   ┌─────────────────────────────────────────────────────┐ │  │
│  │   │ Headers:                                            │ │  │
│  │   │   X-API-Key: ••••••••                               │ │  │
│  │   │   Content-Type: application/json                    │ │  │
│  │   │ Body: {}                                            │ │  │
│  │   └─────────────────────────────────────────────────────┘ │  │
│  │                                                           │  │
│  │   Response:                                               │  │
│  │   ┌─────────────────────────────────────────────────────┐ │  │
│  │   │ {                                                   │ │  │
│  │   │   "success": true,                                  │ │  │
│  │   │   "found": true,                                    │ │  │
│  │   │   "html": "<html>..."                               │ │  │
│  │   │ }                                                   │ │  │
│  │   └─────────────────────────────────────────────────────┘ │  │
│  │   [Resend] [Copy cURL] [Copy Response]                    │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ ● #14  GET  /cache-entity/html-cache/entities             │  │
│  │        html-graph | 200 OK | 89ms                         │  │
│  │        ...                                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  15 requests | Avg: 112ms | Errors: 0                           │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Real-time API call stream
- Status indicator (green=success, red=error, yellow=pending)
- Filter by service or endpoint
- Expandable request/response details
- Timing information
- Resend request button
- Copy as cURL command
- Copy response JSON
- Statistics (count, avg time, errors)

**Acceptance Criteria:**
- [ ] Shows all API calls in real-time
- [ ] Status indicator shows success/error
- [ ] Timing displayed for each call
- [ ] Can expand to see request/response
- [ ] Resend button repeats the call
- [ ] Copy as cURL for debugging
- [ ] Stats summary at bottom

---

## MINI APP STORIES (M1-M7)

Feature mini apps that provide the workbench functionality.

---

### M1: Settings Mini App

**Description:**
Configuration panel for API credentials, default namespace, and user preferences. Includes connection testing for each service.

**Inputs:**
- Config manager (F4)
- API client (F3) for testing

**Outputs:**
- `settings-panel` mini app

**UI:**

```
┌─────────────────────────────────────────────────────────────────┐
│ settings-panel                                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  API Configuration                                               │
│  ═════════════════                                               │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ HTML Graph API                                    ✓ OK    │  │
│  │ Base URL:    [https://html-graph.dev.mgraph.ai       ]   │  │
│  │ Header Name: [X-API-Key                              ]   │  │
│  │ Header Value:[••••••••••••••••••••••                 ]👁  │  │
│  │                                         [Test Connection] │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Text Transform API                                ⚠ N/A   │  │
│  │ Base URL:    [https://text-transform.dev.mgraph.ai   ]   │  │
│  │ Header Name: [X-API-Key                              ]   │  │
│  │ Header Value:[                                       ]👁  │  │
│  │                                         [Test Connection] │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ LLMs API                                          ✗ Fail  │  │
│  │ ...                                                       │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Defaults                                                        │
│  ════════                                                        │
│  Default Namespace: [html-cache                              ]  │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│  [Save All]                               [Reset to Defaults]   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- [ ] Configure all 3 services
- [ ] Password field for API key (with show/hide)
- [ ] Test connection button for each service
- [ ] Status indicator per service
- [ ] Default namespace setting
- [ ] Save persists to localStorage
- [ ] Reset to defaults option

---

### M2: API Explorer Mini App

**Description:**
Postman-style interface for testing and debugging API calls. Build requests, send them, view responses.

**Inputs:**
- API client (F3)
- Config manager (F4)

**Outputs:**
- `api-explorer` mini app

**UI:**

```
┌─────────────────────────────────────────────────────────────────┐
│ api-explorer                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Service: [HTML Graph ▼]   Endpoint: [/html/load/{ns}/key/... ▼]│
│  Method:  [POST ▼]                                              │
│                                                                  │
│  ┌─────────────────────────┐  ┌─────────────────────────────┐   │
│  │ Path Parameters         │  │ Headers                     │   │
│  │                         │  │                             │   │
│  │ namespace: [html-cache] │  │ X-API-Key: [from config]   │   │
│  │ cache_key: [example.com]│  │ Content-Type: app/json     │   │
│  │                         │  │ + [Add Header]             │   │
│  └─────────────────────────┘  └─────────────────────────────┘   │
│                                                                  │
│  Request Body:                                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ {                                                         │  │
│  │   "html": "<html>...</html>"                              │  │
│  │ }                                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  [Send Request]                                                  │
│                                                                  │
│  ═══════════════════════════════════════════════════════════════│
│  Response: 200 OK                                    145ms      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ {                                                         │  │
│  │   "success": true,                                        │  │
│  │   "cache_id": "aa27fb2a-f8d2-44aa-adca-5dc1736fdddd",    │  │
│  │   ...                                                     │  │
│  │ }                                                         │  │
│  └───────────────────────────────────────────────────────────┘  │
│  [Copy Response]  [Copy cURL]                                   │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Service selector (from config)
- Endpoint selector (predefined list)
- Path parameter inputs (dynamic based on endpoint)
- Headers editor
- JSON body editor
- Response display with status, timing
- Copy response / Copy as cURL

**Acceptance Criteria:**
- [ ] Select service from dropdown
- [ ] Select or type endpoint
- [ ] Fill path parameters
- [ ] Edit request body
- [ ] Send request and see response
- [ ] Status code and timing displayed
- [ ] Copy response as JSON

---

### M3: HTML Workbench Mini App

**Description:**
The main transformation workspace. Load HTML, view before/after, apply transformations (via profiles), save results.

**Inputs:**
- API client (F3)
- Profile service (B1)
- Event bus (F2)

**Outputs:**
- `html-workbench` mini app

**UI:**

```
┌─────────────────────────────────────────────────────────────────┐
│ html-workbench                                                   │
├─────────────────────────────────────────────────────────────────┤
│  Cache Key: [example.com/about________________] [Load] [Browse] │
├───────────────────────────────┬─────────────────────────────────┤
│       BEFORE (Original)       │       AFTER (Transformed)       │
│  [Raw] [Preview]              │  [Raw] [Preview]                │
├───────────────────────────────┼─────────────────────────────────┤
│                               │                                  │
│  <html>                       │  <html>                          │
│    <head>...</head>           │    <head>...</head>              │
│    <body>                     │    <body>                        │
│      <div class="ad">         │      <!-- removed -->            │
│        Ad content             │                                  │
│      </div>                   │                                  │
│      <p>Article text...</p>   │      <p>Article text...</p>     │
│    </body>                    │    </body>                       │
│  </html>                      │  </html>                         │
│                               │                                  │
│  1,234 chars                  │  987 chars (-20%)                │
├───────────────────────────────┴─────────────────────────────────┤
│                                                                  │
│  Apply Profile: [clean-news ▼]        [Apply]                   │
│                                                                  │
│  ─── OR apply individual transforms: ───                        │
│  [x] Remove .ad elements                                        │
│  [ ] Blur images                                                │
│  [ ] Remove scripts                                             │
│  [Apply Selected]                                               │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  [Save to Original Key]  [Save as New Key: ____________]        │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Load HTML by cache key
- Before/after split view
- Raw HTML / rendered preview toggle
- Apply profile (from profile manager)
- Apply individual transforms
- Character count / size comparison
- Save transformed HTML

**Acceptance Criteria:**
- [ ] Load HTML by cache key
- [ ] Display in before panel
- [ ] Apply profile transforms
- [ ] Show result in after panel
- [ ] Toggle raw/preview
- [ ] Save transformed HTML
- [ ] Emits events for all actions

---

### M4: Profile Manager Mini App

**Description:**
Create, edit, delete, and manage transformation profiles. Profiles are reusable transformation configurations identified by ID.

**Inputs:**
- API client (F3)
- Profile API (B1)

**Outputs:**
- `profile-manager` mini app

**UI:**

```
┌─────────────────────────────────────────────────────────────────┐
│ profile-manager                                                  │
├─────────────────────────────────────────────────────────────────┤
│  [+ New Profile]                        Search: [____________]  │
├───────────────────────────────┬─────────────────────────────────┤
│                               │                                  │
│  Profiles                     │  Edit: clean-news               │
│  ─────────                    │  ═══════════════                │
│                               │                                  │
│  ► clean-news          ✎ 🗑  │  ID:   [clean-news          ]   │
│    news, readability         │  Name: [Clean News Articles  ]   │
│                               │  Tags: [news, readability    ]   │
│  ► minimal-view        ✎ 🗑  │                                  │
│    minimal, fast             │  Transforms:                     │
│                               │  ┌─────────────────────────────┐ │
│  ► focus-mode          ✎ 🗑  │  │ 1. remove-elements         │ │
│    reading                   │  │    selectors: .ad, .banner  │ │
│                               │  │    [Edit] [Remove] [▲] [▼] │ │
│                               │  ├─────────────────────────────┤ │
│                               │  │ 2. sentiment-filter        │ │
│                               │  │    threshold: 0.4          │ │
│                               │  │    [Edit] [Remove] [▲] [▼] │ │
│                               │  └─────────────────────────────┘ │
│                               │  [+ Add Transform]              │
│                               │                                  │
│                               │  [Save]  [Duplicate]  [Delete]  │
│                               │                                  │
└───────────────────────────────┴─────────────────────────────────┘
```

**Features:**
- List all profiles
- Create new profile
- Edit profile (ID, name, tags, transforms)
- Add/remove/reorder transforms
- Configure transform parameters
- Delete profile
- Duplicate profile
- Search/filter profiles

**Acceptance Criteria:**
- [ ] List all profiles in namespace
- [ ] Create new profile with ID
- [ ] Edit profile transforms
- [ ] Configure transform parameters
- [ ] Save profile to backend
- [ ] Delete profile
- [ ] Search by name/tag

---

### M5: Site Browser Mini App

**Description:**
Browse cached pages by domain. Select multiple pages for batch operations (view, transform, delete).

**Inputs:**
- API client (F3)
- Site browsing API (B2)

**Outputs:**
- `site-browser` mini app

**UI:**

```
┌─────────────────────────────────────────────────────────────────┐
│ site-browser                                                     │
├─────────────────────────────────────────────────────────────────┤
│  Domain: [example.com____________] [Browse]                     │
│                                                                  │
│  Recent: example.com | news.site.com | blog.test.org            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  example.com - 15 pages                 [Select All] [Clear]    │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  [x] /                        Jan 20, 2026    1.2 KB            │
│  [x] /about                   Jan 20, 2026    2.4 KB            │
│  [x] /blog                    Jan 20, 2026    3.1 KB            │
│  [x] /blog/post-1             Jan 20, 2026    5.1 KB            │
│  [ ] /blog/post-2             Jan 19, 2026    4.8 KB            │
│  [ ] /contact                 Jan 18, 2026    1.1 KB            │
│  ...                                                            │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  4 selected                                                      │
│                                                                  │
│  Batch Actions:                                                  │
│  [View in Workbench]  [Apply Profile: clean-news ▼]  [Delete]  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Enter domain to browse
- Recent domains list
- Page list with metadata (path, date, size)
- Multi-select pages
- Batch view (opens in workbench)
- Batch apply profile
- Batch delete
- Sort by path/date/size

**Acceptance Criteria:**
- [ ] Enter domain and browse pages
- [ ] Display page list with metadata
- [ ] Multi-select pages
- [ ] View selected in workbench
- [ ] Apply profile to selected
- [ ] Delete selected pages
- [ ] Remember recent domains

---

### M6: Page Analysis Mini App

**Description:**
Analyze individual page structure, content, and links. Generate and display graphs.

**Inputs:**
- API client (F3)
- Analysis APIs (B3)
- Graph APIs (B5)
- Graph visualizer (S2)

**Outputs:**
- `page-analysis` mini app

**UI:**

```
┌─────────────────────────────────────────────────────────────────┐
│ page-analysis                                                    │
├─────────────────────────────────────────────────────────────────┤
│  Cache Key: [example.com/about________________] [Load] [Analyze]│
├─────────────────────────────────────────────────────────────────┤
│  [Structure]  [Content]  [Links]  [DOM Graph]                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Structure Analysis                        Analyzed: Jan 20     │
│  ══════════════════                                             │
│                                                                  │
│  Elements: 245                                                   │
│  Max Depth: 12                                                   │
│                                                                  │
│  Element Distribution:                                           │
│  ├── div:  45 (18%)  ████████░░░░░░░░                          │
│  ├── span: 67 (27%)  ████████████░░░░                          │
│  ├── p:    23 (9%)   ███░░░░░░░░░░░░░                          │
│  ├── a:    34 (14%)  █████░░░░░░░░░░░                          │
│  └── img:  12 (5%)   ██░░░░░░░░░░░░░░                          │
│                                                                  │
│  Structure Detection:                                            │
│  ✓ Has <header>                                                 │
│  ✓ Has <nav>                                                    │
│  ✓ Has <main> or <article>                                      │
│  ✓ Has <footer>                                                 │
│                                                                  │
│  Main Content Selector: article.content                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Tabs:**
- **Structure** - Element counts, depth, semantic structure
- **Content** - Word count, topics, sentiment, readability (LLM)
- **Links** - Internal/external link list
- **DOM Graph** - Interactive DOM tree visualization

**Acceptance Criteria:**
- [ ] Load page by cache key
- [ ] Run structure analysis
- [ ] Run content analysis (LLM)
- [ ] Run link analysis
- [ ] Generate and display DOM graph
- [ ] Save analysis to entity data files

---

### M7: Site Analysis Mini App

**Description:**
Analyze entire site structure, content distribution, and generate site-wide graphs.

**Inputs:**
- API client (F3)
- Site analysis APIs (B4)
- Graph APIs (B5)
- Graph visualizer (S2)

**Outputs:**
- `site-analysis` mini app

**UI:**

```
┌─────────────────────────────────────────────────────────────────┐
│ site-analysis                                                    │
├─────────────────────────────────────────────────────────────────┤
│  Domain: [example.com________________] [Analyze Site]           │
├─────────────────────────────────────────────────────────────────┤
│  [Site Map]  [Content Overview]  [Link Graph]                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Site Link Graph                                                │
│  ═══════════════                                                │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                                                           │  │
│  │                    ┌──────┐                               │  │
│  │           ┌────────│ Home │────────┐                      │  │
│  │           │        └──────┘        │                      │  │
│  │           ▼            │           ▼                      │  │
│  │      ┌───────┐         │      ┌─────────┐                │  │
│  │      │ About │         │      │ Contact │                │  │
│  │      └───────┘         │      └─────────┘                │  │
│  │                        ▼                                  │  │
│  │                   ┌────────┐                              │  │
│  │                   │  Blog  │                              │  │
│  │                   └───┬────┘                              │  │
│  │              ┌────────┼────────┐                          │  │
│  │              ▼        ▼        ▼                          │  │
│  │          ┌──────┐ ┌──────┐ ┌──────┐                      │  │
│  │          │Post 1│ │Post 2│ │Post 3│                      │  │
│  │          └──────┘ └──────┘ └──────┘                      │  │
│  │                                                           │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Stats: 15 pages | Max depth: 3 | Orphans: 1                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Tabs:**
- **Site Map** - Hierarchical page structure
- **Content Overview** - Aggregated content analysis
- **Link Graph** - Interactive site navigation graph

**Acceptance Criteria:**
- [ ] Enter domain and analyze
- [ ] Generate site map
- [ ] Generate content overview
- [ ] Generate and display link graph
- [ ] Save analysis to _site-analysis entity

---

## BACKEND API STORIES (B1-B5)

New endpoints to add to the HTML Graph API.

---

### B1: Profile CRUD APIs

**Description:**
Endpoints for creating, reading, updating, and deleting transformation profiles.

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/flet-html-domain/profiles/{ns}` | List all profiles |
| GET | `/flet-html-domain/profiles/{ns}/{profile_id}` | Get profile |
| POST | `/flet-html-domain/profiles/{ns}/{profile_id}` | Create/update profile |
| DELETE | `/flet-html-domain/profiles/{ns}/{profile_id}` | Delete profile |
| POST | `/flet-html-domain/profiles/{ns}/{profile_id}/apply` | Apply to page |
| POST | `/flet-html-domain/profiles/{ns}/{profile_id}/apply/site/{domain}` | Apply to site |

**Storage:**
Profiles stored as data files on `_profiles/transforms` entity:
- `profiles/{profile_id}.json`

**Acceptance Criteria:**
- [ ] List profiles returns all profiles in namespace
- [ ] Create profile saves with ID
- [ ] Get profile returns full profile
- [ ] Update profile overwrites existing
- [ ] Delete profile removes from storage
- [ ] Apply profile transforms HTML and returns new cache_id

---

### B2: Site Browsing API

**Description:**
Endpoint to list all cached pages for a given domain.

**Endpoint:**

```
GET /cache-entity/{ns}/entities/site/{domain}
```

**Implementation:**
Filter entities where `cache_key` starts with `{domain}/`

**Response:**

```json
{
    "success": true,
    "namespace": "html-cache",
    "domain": "example.com",
    "count": 15,
    "pages": [
        {
            "cache_id": "...",
            "cache_key": "example.com/about",
            "path": "/about",
            "stored_at": 1768955158133,
            "content_size": 2400
        }
    ]
}
```

**Acceptance Criteria:**
- [ ] Returns all pages matching domain
- [ ] Includes path, stored_at, size
- [ ] Handles domains with no pages
- [ ] Sorted by path

---

### B3: Page Analysis APIs

**Description:**
Endpoints for analyzing individual page structure, content, and links.

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/flet-html-domain/html/analyze/{ns}/structure` | DOM structure analysis |
| POST | `/flet-html-domain/html/analyze/{ns}/content` | Content analysis (LLM) |
| POST | `/flet-html-domain/html/analyze/{ns}/links` | Link extraction |

**Analysis saved to entity data files:**
- `analysis/structure.json`
- `analysis/content.json`
- `analysis/links.json`

**Acceptance Criteria:**
- [ ] Structure analysis returns element counts, depth
- [ ] Content analysis returns topics, sentiment (via LLM)
- [ ] Link analysis returns internal/external links
- [ ] All analysis saved to entity data files

---

### B4: Site Analysis APIs

**Description:**
Endpoints for site-wide analysis.

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/flet-html-domain/site/analyze/{ns}/sitemap/{domain}` | Generate site map |
| POST | `/flet-html-domain/site/analyze/{ns}/content/{domain}` | Aggregated content |

**Analysis saved to `{domain}/_site-analysis` entity.**

**Acceptance Criteria:**
- [ ] Sitemap shows page hierarchy
- [ ] Content overview aggregates page analysis
- [ ] Saved to special _site-analysis entity

---

### B5: Graph Generation APIs

**Description:**
Endpoints for generating visualization-ready graph data.

**Endpoints:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/flet-html-domain/html/graph/{ns}/dom-tree` | DOM tree graph |
| POST | `/flet-html-domain/site/graph/{ns}/links/{domain}` | Site link graph |

**Graph format:**

```json
{
    "format": "d3",
    "nodes": [
        {"id": "1", "label": "html", "type": "element"}
    ],
    "edges": [
        {"source": "1", "target": "2", "type": "child"}
    ]
}
```

**Acceptance Criteria:**
- [ ] DOM tree graph returns hierarchical structure
- [ ] Link graph returns page connections
- [ ] Format compatible with D3.js

---

## SHARED COMPONENT STORIES (S1-S3)

Reusable components used by multiple mini apps.

---

### S1: HTML Editor/Viewer Component

**Description:**
A component for viewing and editing raw HTML with syntax highlighting.

**Features:**
- Syntax highlighting
- Line numbers
- Read-only / editable modes
- Search within content
- Copy to clipboard

**Used by:** HTML Workbench (M3), Page Analysis (M6)

**Acceptance Criteria:**
- [ ] Renders HTML with syntax highlighting
- [ ] Line numbers displayed
- [ ] Toggle read-only/editable
- [ ] Search functionality
- [ ] Copy button

---

### S2: Graph Visualizer Component

**Description:**
D3-based interactive graph visualization component.

**Features:**
- Render node-edge graphs
- Pan and zoom
- Node click events
- Tooltips on hover
- Force-directed and hierarchical layouts

**Used by:** Page Analysis (M6), Site Analysis (M7)

**Acceptance Criteria:**
- [ ] Renders graph from nodes/edges data
- [ ] Pan and zoom controls
- [ ] Click node emits event
- [ ] Supports multiple layouts

---

### S3: Transform Config Component

**Description:**
Component for configuring individual transform parameters.

**Features:**
- Dynamic form based on transform type
- Validation
- Preview of transform description

**Used by:** HTML Workbench (M3), Profile Manager (M4)

**Acceptance Criteria:**
- [ ] Renders form for each transform type
- [ ] Validates input
- [ ] Returns configured transform object

---

## Story Summary

| Layer | ID | Story | Parallel? | Dependencies |
|-------|-----|-------|-----------|--------------|
| Foundation | F1 | Shell & Router | Yes | - |
| Foundation | F2 | Event Bus | Yes | - |
| Foundation | F3 | API Client | Yes | - |
| Foundation | F4 | Config Manager | Yes | - |
| Foundation | F5 | Hello World Apps | Yes | F1-F4 |
| Debug | D1 | Events Viewer | Yes | F1, F2 |
| Debug | D2 | API Logger | Yes | F1, F2, F3 |
| Mini App | M1 | Settings | Yes | F1-F4 |
| Mini App | M2 | API Explorer | Yes | F1-F4 |
| Mini App | M3 | HTML Workbench | Yes | F1-F4, B1 |
| Mini App | M4 | Profile Manager | Yes | F1-F4, B1 |
| Mini App | M5 | Site Browser | Yes | F1-F4, B2 |
| Mini App | M6 | Page Analysis | Yes | F1-F4, B3, B5, S2 |
| Mini App | M7 | Site Analysis | Yes | F1-F4, B4, B5, S2 |
| Backend | B1 | Profile APIs | Yes | - |
| Backend | B2 | Site Browsing API | Yes | - |
| Backend | B3 | Page Analysis APIs | Yes | - |
| Backend | B4 | Site Analysis APIs | Yes | B2, B3 |
| Backend | B5 | Graph Generation APIs | Yes | - |
| Shared | S1 | HTML Editor | Yes | - |
| Shared | S2 | Graph Visualizer | Yes | - |
| Shared | S3 | Transform Config | Yes | - |

**Total: 21 stories**

---

## Development Phases

### Phase 1: Foundation (Week 1)
- F1, F2, F3, F4 (parallel)
- F5 (after F1-F4)
- Result: Working shell with hello world apps

### Phase 2: Debug Tools + Settings (Week 2)
- D1, D2, M1 (parallel)
- Result: Can configure APIs and debug events/calls

### Phase 3: Core Functionality (Week 3-4)
- B1, B2 (backend)
- M3, M4, M5 (frontend, after B1/B2)
- S1 (shared)
- Result: Can browse, transform, manage profiles

### Phase 4: Analysis (Week 5-6)
- B3, B4, B5 (backend)
- M6, M7 (frontend)
- S2, S3 (shared)
- Result: Full analysis capabilities

---

## Next Steps

1. **Finalize this document** - Any missing stories?
2. **Create individual story briefs** - Detailed spec per story
3. **Assign to agents** - Parallel development
4. **Integration testing** - Verify slot mechanism
5. **Polish & deploy** - Final touches
