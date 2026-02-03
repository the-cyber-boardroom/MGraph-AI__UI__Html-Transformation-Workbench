# HTML Transformation Workbench — Story Index

**Version:** 0.1.1  
**Total Stories:** 21  
**Document:** This index lists all stories with dependencies and execution order

---

## Story Overview

```
PHASE 1: FOUNDATION (Week 1)
═══════════════════════════════════════════════════════════════════════════════════
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  F1  │  F2  │  F3  │  F4   ◄── All parallel (no dependencies)          │
    │ Shell│Events│ API  │Config │                                           │
    └──┬───┴──┬───┴──┬───┴──┬────┘                                           │
       └──────┴──────┴──────┘                                                │
                  │                                                           │
                  ▼                                                           │
            ┌──────────┐                                                      │
            │    F5    │  Hello World Validation                             │
            └──────────┘                                                      │
═══════════════════════════════════════════════════════════════════════════════════

PHASE 2: DEBUG TOOLS + SETTINGS (Week 2)
═══════════════════════════════════════════════════════════════════════════════════
    ┌─────────────────────────────────────────────────────────────────────────┐
    │  D1  │  D2  │  M1   ◄── All parallel after Phase 1                     │
    │Events│ API  │Settings                                                   │
    │Viewer│Logger│ Panel │                                                   │
    └──────┴──────┴───────┘                                                   │
═══════════════════════════════════════════════════════════════════════════════════

PHASE 3: CORE MINI APPS + BACKEND (Week 3-4)
═══════════════════════════════════════════════════════════════════════════════════
    FRONTEND                          BACKEND
    ┌──────────────────────────┐      ┌──────────────────────────┐
    │  M2  │  M3  │  M4  │  M5 │      │  B1  │  B2              │
    │ API  │ Work │Profile│Site │      │Profile│ Site             │
    │Explor│bench │ Mgr  │Browsr│      │ API  │ API              │
    └──────┴──────┴──────┴─────┘      └──────┴──────────────────┘
═══════════════════════════════════════════════════════════════════════════════════

PHASE 4: ANALYSIS + SHARED (Week 5-6)
═══════════════════════════════════════════════════════════════════════════════════
    FRONTEND                          BACKEND              SHARED
    ┌──────────────────────────┐      ┌──────────────┐    ┌──────────────┐
    │  M6  │  M7               │      │  B3  │  B4  │    │  S1  │  S2  │
    │ Page │ Site              │      │ Page │ Site │    │ HTML │Graph │
    │Analys│Analysis           │      │Analys│Analys│    │Editor│Visual│
    └──────┴──────────────────┘      │  B5         │    │  S3         │
                                      │Graph        │    │Transform    │
                                      └─────────────┘    └─────────────┘
═══════════════════════════════════════════════════════════════════════════════════
```

---

## All Stories by Layer

### Foundation (F) — BLOCKING

| ID | Story | Brief | Dependencies | Parallel With |
|----|-------|-------|--------------|---------------|
| F1 | Shell & Router | [F1_Foundation_Shell_Router.md](stories/F1_Foundation_Shell_Router.md) | None | F2, F3, F4 |
| F2 | Event Bus | [F2_Event_Bus_Service.md](stories/F2_Event_Bus_Service.md) | None | F1, F3, F4 |
| F3 | API Client | [F3_API_Client_Service.md](stories/F3_API_Client_Service.md) | F2 (events) | F1, F4 |
| F4 | Config Manager | [F4_Config_Manager_Service.md](stories/F4_Config_Manager_Service.md) | F2 (events) | F1, F3 |
| F5 | Hello World Apps | [F5_Hello_World_Validation_Apps.md](stories/F5_Hello_World_Validation_Apps.md) | F1, F2, F3, F4 | None |

### Debug Tools (D)

| ID | Story | Brief | Dependencies | Parallel With |
|----|-------|-------|--------------|---------------|
| D1 | Events Viewer | [D1_Events_Viewer_Mini_App.md](stories/D1_Events_Viewer_Mini_App.md) | F1, F2 | D2, M1-M7 |
| D2 | API Logger | [D2_API_Logger_Mini_App.md](stories/D2_API_Logger_Mini_App.md) | F1, F2, F3 | D1, M1-M7 |

### Mini Apps (M)

| ID | Story | Brief | Dependencies | Parallel With |
|----|-------|-------|--------------|---------------|
| M1 | Settings | [M1_Settings_Mini_App.md](stories/M1_Settings_Mini_App.md) | F1-F4 | D1, D2, M2-M7 |
| M2 | API Explorer | M2_API_Explorer_Mini_App.md | F1-F4 | M1, M3-M7 |
| M3 | HTML Workbench | M3_HTML_Workbench_Mini_App.md | F1-F4, B1* | M1, M2, M4-M7 |
| M4 | Profile Manager | M4_Profile_Manager_Mini_App.md | F1-F4, B1 | M1-M3, M5-M7 |
| M5 | Site Browser | M5_Site_Browser_Mini_App.md | F1-F4, B2 | M1-M4, M6, M7 |
| M6 | Page Analysis | M6_Page_Analysis_Mini_App.md | F1-F4, B3, B5, S2 | M1-M5, M7 |
| M7 | Site Analysis | M7_Site_Analysis_Mini_App.md | F1-F4, B4, B5, S2 | M1-M6 |

*M3 can start without B1 for basic load/save, needs B1 for profile features

### Backend APIs (B)

| ID | Story | Brief | Dependencies | Parallel With |
|----|-------|-------|--------------|---------------|
| B1 | Profile APIs | B1_Profile_CRUD_APIs.md | None | B2-B5 |
| B2 | Site Browsing API | B2_Site_Browsing_API.md | None | B1, B3-B5 |
| B3 | Page Analysis APIs | B3_Page_Analysis_APIs.md | None | B1, B2, B4, B5 |
| B4 | Site Analysis APIs | B4_Site_Analysis_APIs.md | B2, B3 | B1, B5 |
| B5 | Graph Generation APIs | B5_Graph_Generation_APIs.md | None | B1-B4 |

### Shared Components (S)

| ID | Story | Brief | Dependencies | Parallel With |
|----|-------|-------|--------------|---------------|
| S1 | HTML Editor | S1_HTML_Editor_Component.md | None | S2, S3 |
| S2 | Graph Visualizer | S2_Graph_Visualizer_Component.md | None | S1, S3 |
| S3 | Transform Config | S3_Transform_Config_Component.md | None | S1, S2 |

---

## Story Briefs Status

| ID | Status | File |
|----|--------|------|
| F1 | ✅ Complete | [F1_Foundation_Shell_Router.md](stories/F1_Foundation_Shell_Router.md) |
| F2 | ✅ Complete | [F2_Event_Bus_Service.md](stories/F2_Event_Bus_Service.md) |
| F3 | ✅ Complete | [F3_API_Client_Service.md](stories/F3_API_Client_Service.md) |
| F4 | ✅ Complete | [F4_Config_Manager_Service.md](stories/F4_Config_Manager_Service.md) |
| F5 | ✅ Complete | [F5_Hello_World_Validation_Apps.md](stories/F5_Hello_World_Validation_Apps.md) |
| D1 | ✅ Complete | [D1_Events_Viewer_Mini_App.md](stories/D1_Events_Viewer_Mini_App.md) |
| D2 | ✅ Complete | [D2_API_Logger_Mini_App.md](stories/D2_API_Logger_Mini_App.md) |
| M1 | ✅ Complete | [M1_Settings_Mini_App.md](stories/M1_Settings_Mini_App.md) |
| M2 | ✅ Complete | [M2_API_Explorer_Mini_App.md](stories/M2_API_Explorer_Mini_App.md) |
| M3 | ✅ Complete | [M3_HTML_Workbench_Mini_App.md](stories/M3_HTML_Workbench_Mini_App.md) |
| M4 | ✅ Complete | [M4_Profile_Manager_Mini_App.md](stories/M4_Profile_Manager_Mini_App.md) |
| M5 | ✅ Complete | [M5_Site_Browser_Mini_App.md](stories/M5_Site_Browser_Mini_App.md) |
| M6 | ✅ Complete | [M6_Page_Analysis_Mini_App.md](stories/M6_Page_Analysis_Mini_App.md) |
| M7 | ✅ Complete | [M7_Site_Analysis_Mini_App.md](stories/M7_Site_Analysis_Mini_App.md) |
| B1 | ✅ Complete | [B1_Profile_CRUD_APIs.md](stories/B1_Profile_CRUD_APIs.md) |
| B2 | ✅ Complete | [B2_Site_Browsing_API.md](stories/B2_Site_Browsing_API.md) |
| B3 | ✅ Complete | [B3_Page_Analysis_APIs.md](stories/B3_Page_Analysis_APIs.md) |
| B4 | ✅ Complete | [B4_Site_Analysis_APIs.md](stories/B4_Site_Analysis_APIs.md) |
| B5 | ✅ Complete | [B5_Graph_Generation_APIs.md](stories/B5_Graph_Generation_APIs.md) |
| S1 | ✅ Complete | [S1_HTML_Editor_Component.md](stories/S1_HTML_Editor_Component.md) |
| S2 | ✅ Complete | [S2_Graph_Visualizer_Component.md](stories/S2_Graph_Visualizer_Component.md) |
| S3 | ✅ Complete | [S3_Transform_Config_Component.md](stories/S3_Transform_Config_Component.md) |

---

## Agent Assignment Guide

### Phase 1 (Foundation) — 5 Agents

| Agent | Story | Deliverable |
|-------|-------|-------------|
| Agent 1 | F1 | workbench-shell.js, nav-bar.js |
| Agent 2 | F2 | event-bus.js |
| Agent 3 | F3 | api-client.js |
| Agent 4 | F4 | config-manager.js |
| Agent 5 | F5 | hello-world-1.js, hello-world-2.js |

**Note:** Agent 5 waits for Agents 1-4 to complete.

### Phase 2 (Debug + Settings) — 3 Agents

| Agent | Story | Deliverable |
|-------|-------|-------------|
| Agent 1 | D1 | events-viewer.js |
| Agent 2 | D2 | api-logger.js |
| Agent 3 | M1 | settings-panel.js |

### Phase 3 (Core) — 6+ Agents

| Agent | Story | Deliverable |
|-------|-------|-------------|
| Agent 1 | M2 | api-explorer.js |
| Agent 2 | M3 | html-workbench.js |
| Agent 3 | M4 | profile-manager.js |
| Agent 4 | M5 | site-browser.js |
| Agent 5 | B1 | Profile API endpoints |
| Agent 6 | B2 | Site browsing endpoint |

### Phase 4 (Analysis) — 8 Agents

| Agent | Story | Deliverable |
|-------|-------|-------------|
| Agent 1 | M6 | page-analysis.js |
| Agent 2 | M7 | site-analysis.js |
| Agent 3 | B3 | Page analysis endpoints |
| Agent 4 | B4 | Site analysis endpoints |
| Agent 5 | B5 | Graph generation endpoints |
| Agent 6 | S1 | html-editor.js |
| Agent 7 | S2 | graph-visualizer.js |
| Agent 8 | S3 | transform-config.js |

---

## Documents Per Agent

Each agent receives exactly 3 documents:

1. **SHARED_BRIEFING.md** — Platform overview, contracts, standards
2. **IFD Methodology** — v1_2_1__ifd__intro-and-how-to-use.md
3. **Story Brief** — Specific story file (e.g., F1_Foundation_Shell_Router.md)

---

## Integration Checkpoints

### After Phase 1
- [ ] Shell renders and displays nav bar
- [ ] Event bus works (emit/on/off/replay)
- [ ] API client makes calls with auth headers
- [ ] Config persists to localStorage
- [ ] Hello World apps register and navigate

### After Phase 2
- [ ] Settings can configure API keys
- [ ] Events Viewer shows all events
- [ ] API Logger shows all API calls
- [ ] Test connections work

### After Phase 3
- [ ] Can load/save HTML via Workbench
- [ ] Can create/edit profiles
- [ ] Can browse sites and pages
- [ ] API Explorer can test endpoints

### After Phase 4
- [ ] Can analyze page structure/content
- [ ] Can analyze site structure
- [ ] Can visualize graphs
- [ ] All mini apps work together

---

## Quick Reference

### Start Here
1. Read SHARED_BRIEFING.md
2. Read IFD methodology
3. Read your assigned story brief
4. Build the component

### Deliver
- Web component file(s)
- Test file(s)
- Follow IFD v0.1.0 folder structure

### Communicate Via Events Only
- No direct method calls between components
- Emit events through `window.workbench.events`
- Clean up listeners in `disconnectedCallback`

---

*This index is the master reference for story organization and execution.*
