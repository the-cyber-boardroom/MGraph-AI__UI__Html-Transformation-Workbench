# Implementation Brief: Phase 1 UI — Root Selection & Child Issues

**Document:** v0.1.6__issues__ui-brief__phase-1-implementation
**Version:** v1.0
**Date:** 2026-02-02
**Author:** Backend Implementation Session
**Status:** Ready for UI Implementation
**Related:** brief-005 (Backend), v0.2.26 architecture briefs
**Workstream:** UI (Claude Code)

---

## Objective

Implement the UI components for Phase 1 of the recursive issue model. The backend APIs are complete and ready for integration.

### Guiding Principles

1. **Progressive enhancement** — New features available alongside existing UI
2. **Non-breaking** — Existing issue list and detail views continue to work
3. **Contextual** — Root selection clearly indicates current scope
4. **Discoverable** — New features visible but not intrusive

---

## Backend API Summary

All endpoints are implemented and available. Base URL: `/api/`

### Root Selection Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/roots` | List all available root candidates |
| GET | `/api/roots/with-children` | List only roots that have `issues/` folders |
| GET | `/api/roots/current` | Get currently selected root |
| POST | `/api/roots/select` | Select a new root |

### Child Issue Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/issues/children` | Add child issue to a parent |
| GET | `/api/issues/children` | List children of an issue |
| POST | `/api/issues/convert` | Convert issue to new structure (create `issues/` folder) |

---

## UI Tasks Overview

| Task | Priority | Description | Complexity |
|------|----------|-------------|------------|
| **U1** | P1 | Root selector in header | Medium |
| **U2** | P1 | Current root context indicator | Low |
| **U3** | P2 | "Convert to New Structure" button | Low |
| **U4** | P2 | "Add Child Issue" button and form | Medium |
| **U5** | P3 | Tree view for nested issues | High |

---

## Task U1: Root Selector in Header

### Description

Add a dropdown/selector in the application header that allows users to change the current root context. This controls which issues are displayed in the main list.

### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🏠 Issues Workbench                    [📁 Root ▾]              [⚙️] [👤]      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  When dropdown is clicked:                                                       │
│                                                                                  │
│                                         ┌─────────────────────────┐              │
│                                         │ 📦 Issues Root      (0) │ ← Default   │
│                                         ├─────────────────────────┤              │
│                                         │ 🟢 Feature-1        (3) │              │
│                                         │ 🔵 Task-5           (2) │              │
│                                         │ 🟣 Feature-11       (0) │              │
│                                         └─────────────────────────┘              │
│                                           ↑ Icon = type color                    │
│                                           ↑ (n) = child count                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### API Integration

**On component mount / app load:**
```javascript
// Fetch available roots
GET /api/roots

// Response shape:
{
  "success": true,
  "roots": [
    {
      "path": "",                    // Empty = default root
      "label": "Root",
      "title": "Issues Root",
      "issue_type": "root",
      "depth": 0,
      "has_issues": false,
      "has_children": 5              // Count of top-level issues
    },
    {
      "path": "data/feature/Feature-1",
      "label": "Feature-1",
      "title": "User Authentication",
      "issue_type": "feature",
      "depth": 0,
      "has_issues": true,            // Has issues/ folder
      "has_children": 3
    }
  ],
  "total": 2
}
```

**On root selection:**
```javascript
// Select new root
POST /api/roots/select
Content-Type: application/json

{
  "path": "data/feature/Feature-1"   // Use empty string "" for default root
}

// Response shape:
{
  "success": true,
  "path": "data/feature/Feature-1",
  "previous": "",
  "message": ""
}
```

**Get current root (on page load):**
```javascript
GET /api/roots/current

// Response shape:
{
  "success": true,
  "path": "data/feature/Feature-1",
  "label": "Feature-1",
  "issue_type": "feature",
  "message": ""
}
```

### Behavior

1. On app load, fetch current root via `GET /api/roots/current`
2. Display current root in header dropdown button
3. On dropdown open, fetch all roots via `GET /api/roots`
4. Show roots sorted by depth, then alphabetically
5. Indicate current selection with checkmark or highlight
6. On selection, call `POST /api/roots/select` then refresh issue list
7. Show type-colored icon (use existing type color system)
8. Show child count in parentheses

### Component Structure

```
RootSelector/
├── RootSelector.jsx           // Main dropdown component
├── RootSelectorButton.jsx     // Trigger button showing current root
├── RootSelectorList.jsx       // Dropdown list of roots
└── RootSelectorItem.jsx       // Individual root option
```

---

## Task U2: Current Root Context Indicator

### Description

Display a breadcrumb or context bar below the header showing the current root path. This provides persistent context about what scope the user is viewing.

### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🏠 Issues Workbench                    [📁 Feature-1 ▾]         [⚙️] [👤]      │
├─────────────────────────────────────────────────────────────────────────────────┤
│  📍 Root  ›  Feature-1: User Authentication                         [✕ Clear]  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Issues in Feature-1:                                                           │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │ 🔵 Task-1    Implement login form                         [in-progress]  │   │
│  │ 🔵 Task-2    Add password reset                           [backlog]      │   │
│  │ 🔴 Bug-1     Login fails on mobile                        [confirmed]    │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Behavior

1. Only show context bar when NOT at default root
2. Show breadcrumb path: `Root › {Label}: {Title}`
3. "Clear" button resets to default root (calls `POST /api/roots/select` with empty path)
4. Clicking "Root" in breadcrumb also resets to default
5. Style with subtle background to distinguish from content area

### States

| State | Display |
|-------|---------|
| Default root | Context bar hidden |
| Custom root selected | Show breadcrumb with clear button |
| Loading | Show skeleton/spinner |

---

## Task U3: "Convert to New Structure" Button

### Description

Add a button on the issue detail view that converts an existing issue to support the new hierarchical structure by creating an `issues/` folder.

### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Issue Detail: Feature-1                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Title: User Authentication                                                      │
│  Type: feature          Status: [in-progress ▾]                                 │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Description:                                                                    │
│  Implement user authentication system with login, logout, and password reset.   │
│                                                                                  │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Actions:                                                                        │
│                                                                                  │
│  [🔄 Convert to Parent]     ← Only show if has_issues is false                  │
│                                                                                  │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Child Issues: (none yet - convert first)                                       │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**After conversion:**

```
│  Actions:                                                                        │
│                                                                                  │
│  [➕ Add Child Issue]       ← Shows after conversion                            │
│                                                                                  │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Child Issues:                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │  (empty - add your first child issue)                                     │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
```

### API Integration

**Convert issue:**
```javascript
POST /api/issues/convert
Content-Type: application/json

{
  "issue_path": "data/feature/Feature-1"
}

// Response shape:
{
  "success": true,
  "converted": true,              // false if already had issues/ folder
  "issues_path": "data/feature/Feature-1/issues",
  "message": "Created issues/ folder"
}
```

### Behavior

1. Show "Convert to Parent" button only when `has_issues` is `false`
2. On click, show confirmation: "This will enable child issues for Feature-1. Continue?"
3. Call `POST /api/issues/convert`
4. On success, refresh issue detail to show "Add Child Issue" button
5. Show toast/notification: "Feature-1 can now have child issues"

### Button States

| Condition | Display |
|-----------|---------|
| `has_issues: false` | Show "Convert to Parent" button |
| `has_issues: true` | Hide convert button, show "Add Child Issue" |
| Converting... | Show loading spinner, disable button |
| Error | Show error toast, keep button enabled |

---

## Task U4: "Add Child Issue" Button and Form

### Description

Add UI for creating child issues within a parent's `issues/` folder. This includes a button to trigger creation and a form/modal for entering child issue details.

### Wireframe - Button Location

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Issue Detail: Feature-1                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│  ...                                                                            │
│  ─────────────────────────────────────────────────────────────────────────────  │
│  Child Issues:                                        [➕ Add Child Issue]       │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │ 🔵 Task-1    Implement login form                         [in-progress]  │   │
│  │ 🔵 Task-2    Add password reset                           [backlog]      │   │
│  │ 🔴 Bug-1     Login fails on mobile                        [confirmed]    │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Wireframe - Add Child Modal

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                                                                  │
│     ┌─────────────────────────────────────────────────────────────────────┐     │
│     │  Add Child Issue to Feature-1                              [✕]      │     │
│     ├─────────────────────────────────────────────────────────────────────┤     │
│     │                                                                     │     │
│     │  Type:        [task ▾]                                              │     │
│     │               ┌──────────────┐                                      │     │
│     │               │ 🔵 task      │                                      │     │
│     │               │ 🔴 bug       │                                      │     │
│     │               │ 🟢 feature   │                                      │     │
│     │               └──────────────┘                                      │     │
│     │                                                                     │     │
│     │  Title:       [____________________________________]                │     │
│     │                                                                     │     │
│     │  Description: [____________________________________]                │     │
│     │               [____________________________________]                │     │
│     │               [____________________________________]                │     │
│     │                                                                     │     │
│     │  Status:      [backlog ▾]  (optional, defaults to type default)    │     │
│     │                                                                     │     │
│     ├─────────────────────────────────────────────────────────────────────┤     │
│     │                                    [Cancel]  [Create Task-3]        │     │
│     └─────────────────────────────────────────────────────────────────────┘     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### API Integration

**Add child issue:**
```javascript
POST /api/issues/children
Content-Type: application/json

{
  "parent_path": "data/feature/Feature-1",
  "issue_type": "task",
  "title": "Implement login form",
  "description": "Create the login form with email and password fields",  // optional
  "status": "backlog"                                                      // optional
}

// Response shape:
{
  "success": true,
  "path": "data/feature/Feature-1/issues/Task-3",
  "label": "Task-3",
  "issue_type": "task",
  "title": "Implement login form",
  "message": ""
}
```

**List children (for display):**
```javascript
GET /api/issues/children
Content-Type: application/json

{
  "parent_path": "data/feature/Feature-1"
}

// Response shape:
{
  "success": true,
  "children": [
    {
      "path": "data/feature/Feature-1/issues/Task-1",
      "label": "Task-1",
      "title": "Implement login form",
      "node_type": "task",
      "status": "in-progress"
    },
    {
      "path": "data/feature/Feature-1/issues/Task-2",
      "label": "Task-2", 
      "title": "Add password reset",
      "node_type": "task",
      "status": "backlog"
    }
  ],
  "total": 2
}
```

### Behavior

1. "Add Child Issue" button visible when `has_issues: true`
2. Button opens modal with form
3. Type dropdown populated from `/nodes/api/types` (existing endpoint)
4. Title is required, description and status are optional
5. Create button shows predicted label: "Create Task-3"
6. On success:
   - Close modal
   - Show toast: "Created Task-3"
   - Refresh children list
   - Optionally navigate to new issue detail
7. On error: Show error in modal, keep form open

### Form Validation

| Field | Required | Validation |
|-------|----------|------------|
| Type | Yes | Must select from dropdown |
| Title | Yes | Min 3 characters |
| Description | No | Max 2000 characters |
| Status | No | Must be valid for selected type |

### Component Structure

```
ChildIssues/
├── ChildIssuesList.jsx        // List of children in detail view
├── ChildIssueItem.jsx         // Individual child row
├── AddChildButton.jsx         // "+ Add Child Issue" button
├── AddChildModal.jsx          // Modal form for creating child
└── ConvertToParentButton.jsx  // "Convert to Parent" button
```

---

## Task U5: Tree View for Nested Issues (P3)

### Description

Display issues in a tree structure showing parent-child relationships. This is lower priority and can be implemented after U1-U4.

### Wireframe

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Issues                                          [List View] [🌳 Tree View]     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  📦 GitRepo-1: Project Issues                                                   │
│  ├─ 🟢 Feature-1: User Authentication                              [in-progress]│
│  │  ├─ 🔵 Task-1: Implement login form                             [in-progress]│
│  │  ├─ 🔵 Task-2: Add password reset                               [backlog]    │
│  │  └─ 🔴 Bug-1: Login fails on mobile                             [confirmed]  │
│  ├─ 🟢 Feature-2: Dashboard                                        [proposed]   │
│  ├─ 🔵 Task-3: Setup CI/CD                                         [done]       │
│  └─ 🔴 Bug-2: Memory leak in worker                                [backlog]    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Implementation Notes

1. Add toggle between List View and Tree View
2. Tree view fetches root issues, then lazily loads children on expand
3. Use indentation and tree lines (├─, └─, │) for hierarchy
4. Expand/collapse via click on node or arrow icon
5. Clicking issue label navigates to detail view
6. Consider virtualization for large trees

### API Usage

Tree view uses the same endpoints:
- `GET /api/roots/current` - Get current root
- `GET /api/issues/children` - Fetch children for each expanded node
- Existing `/nodes/api/nodes` - Fetch top-level issues

---

## State Management Considerations

### New State Required

```javascript
// Root selection state
{
  currentRoot: {
    path: "data/feature/Feature-1",
    label: "Feature-1",
    issueType: "feature"
  },
  availableRoots: [...],
  rootsLoading: false
}

// Issue detail state additions
{
  hasIssues: true,           // Can have children
  children: [...],           // List of child issues
  childrenLoading: false
}
```

### Actions/Events

| Action | Trigger | Effect |
|--------|---------|--------|
| `FETCH_ROOTS` | App load, dropdown open | Load available roots |
| `SELECT_ROOT` | Dropdown selection | Change root, refresh issues |
| `FETCH_CURRENT_ROOT` | App load | Load current root state |
| `CONVERT_TO_PARENT` | Convert button click | Create issues/ folder |
| `ADD_CHILD` | Add child form submit | Create child, refresh list |
| `FETCH_CHILDREN` | Issue detail load | Load child issues |

---

## Implementation Order

### Phase 1a (P1 Tasks)
1. **U2** - Context indicator (simplest, provides foundation)
2. **U1** - Root selector (depends on U2 for display)

### Phase 1b (P2 Tasks)  
3. **U3** - Convert button (simple, enables U4)
4. **U4** - Add child issue (depends on U3)

### Phase 1c (P3 Tasks)
5. **U5** - Tree view (optional, can be deferred)

---

## Testing Checklist

### U1: Root Selector
- [ ] Dropdown shows all available roots
- [ ] Current root is highlighted
- [ ] Selecting root updates issue list
- [ ] Child count displays correctly
- [ ] Type colors match existing system
- [ ] Works with empty state (no roots with children)

### U2: Context Indicator
- [ ] Hidden when at default root
- [ ] Shows when custom root selected
- [ ] Clear button works
- [ ] Breadcrumb clickable

### U3: Convert Button
- [ ] Only shows when `has_issues: false`
- [ ] Confirmation dialog appears
- [ ] Success updates UI to show add child button
- [ ] Error handling works

### U4: Add Child Issue
- [ ] Modal opens/closes correctly
- [ ] Type dropdown populated
- [ ] Form validation works
- [ ] Success creates child and refreshes list
- [ ] Error stays in modal with message
- [ ] Children list displays correctly

### U5: Tree View
- [ ] Toggle between list and tree works
- [ ] Expand/collapse nodes
- [ ] Lazy loading children
- [ ] Navigation to detail works
- [ ] Performance with many nodes

---

## Design Tokens / Styles

Use existing design system. Key elements:

| Element | Existing Class/Token |
|---------|---------------------|
| Type colors | Use `nodeTypeColors` from theme |
| Dropdown | Use existing `Select` or `Dropdown` component |
| Modal | Use existing `Modal` component |
| Buttons | Use existing `Button` variants |
| Tree lines | `border-left` with theme border color |

---

## Error Handling

| Scenario | User Feedback |
|----------|--------------|
| API failure on root load | Toast: "Failed to load roots. Please refresh." |
| API failure on select | Toast: "Failed to change root. Please try again." |
| API failure on convert | Toast: "Failed to convert. Please try again." |
| API failure on add child | In-modal error: "Failed to create issue: {message}" |
| Invalid form | Inline field errors |

---

## Questions for UI Implementation

1. **Root selector location**: Header right side as shown, or elsewhere?
2. **Context bar**: Should it be dismissible or always visible when root selected?
3. **Tree view priority**: Implement in Phase 1 or defer?
4. **Add child navigation**: After creating child, navigate to it or stay on parent?
5. **Mobile responsiveness**: Any specific mobile considerations for root selector?

---

*UI Implementation Brief: 2026-02-02*
*Version: v0.1.6*
*Status: Ready for implementation*
*Backend APIs: Complete and tested*
