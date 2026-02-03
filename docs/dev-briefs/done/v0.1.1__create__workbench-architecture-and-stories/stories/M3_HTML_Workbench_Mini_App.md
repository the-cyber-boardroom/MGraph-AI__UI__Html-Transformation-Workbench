# Story M3: HTML Workbench Mini App

**Story ID:** M3  
**Layer:** Mini Apps  
**Priority:** HIGH (core functionality)  
**Parallel With:** M1, M2, M4-M7  
**Dependencies:** F1-F4, B1 (for profiles, can start without)

---

## 1. Purpose

The main transformation workspace. Load HTML from cache, view before/after comparison, apply transformations (via profiles or individual transforms), save results. This is the primary user-facing feature.

---

## 2. UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              HTML WORKBENCH                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Cache Key: [example.com/about____________________________] [📂 Load] [🔍 Browse]│
│  Recent: example.com/about | news.site.com/article | blog.test.org/post-1       │
│                                                                                  │
├────────────────────────────────────┬────────────────────────────────────────────┤
│         BEFORE (Original)          │          AFTER (Transformed)               │
│  [Raw] [Preview]                   │  [Raw] [Preview]                           │
├────────────────────────────────────┼────────────────────────────────────────────┤
│                                    │                                            │
│  <html>                            │  <html>                                    │
│    <head>                          │    <head>                                  │
│      <title>About Us</title>       │      <title>About Us</title>               │
│    </head>                         │    </head>                                 │
│    <body>                          │    <body>                                  │
│      <div class="ad">              │      <!-- removed: ad -->                  │
│        Advertisement               │                                            │
│      </div>                        │                                            │
│      <main>                        │      <main>                                │
│        <h1>About</h1>              │        <h1>About</h1>                      │
│        <p>Content here...</p>      │        <p>Content here...</p>              │
│      </main>                       │      </main>                               │
│    </body>                         │    </body>                                 │
│  </html>                           │  </html>                                   │
│                                    │                                            │
│  ─────────────────────────────     │  ─────────────────────────────             │
│  1,234 chars | 45 elements         │  987 chars (-20%) | 42 elements            │
├────────────────────────────────────┴────────────────────────────────────────────┤
│                                                                                  │
│  TRANSFORMATIONS                                                                 │
│  ═══════════════                                                                 │
│                                                                                  │
│  Apply Profile: [clean-news ▼]                            [▶ Apply Profile]     │
│                                                                                  │
│  ─── OR select individual transforms: ───                                       │
│                                                                                  │
│  [x] Remove elements by selector    Selector: [.ad, .banner, .sponsored]        │
│  [ ] Remove scripts                                                             │
│  [ ] Remove styles                                                              │
│  [ ] Remove comments                                                            │
│  [ ] Blur images                    Blur amount: [5px]                          │
│  [ ] Simplify structure             Max depth: [10]                             │
│                                                                                  │
│                                                           [▶ Apply Selected]    │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  [💾 Save to Same Key]   [💾 Save as: [example.com/about-clean___] ]  [📤 Export]│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Features

### 3.1 HTML Loading
- Input field for cache key
- Load button fetches from API
- Browse button opens entity picker (emits event)
- Recent cache keys from config

### 3.2 Before/After View
- Split pane layout
- Toggle between raw HTML and rendered preview
- Character count and element count
- Change percentage indicator

### 3.3 Profile Application
- Dropdown of available profiles
- Apply profile button
- Shows transformed result in "After" pane

### 3.4 Individual Transforms (Client-Side)
- Checkbox selection for each transform
- Parameter inputs where needed
- Apply selected transforms

### 3.5 Saving
- Save back to original cache key
- Save to new cache key
- Export as HTML file

---

## 4. Transform Types (Client-Side)

These transforms run in the browser using DOM manipulation:

```javascript
const TRANSFORMS = {
    'remove-elements': {
        name: 'Remove elements by selector',
        params: { selector: { type: 'text', default: '.ad, .banner' } },
        apply: (doc, params) => {
            doc.querySelectorAll(params.selector).forEach(el => {
                el.replaceWith(document.createComment(`removed: ${el.className}`));
            });
        }
    },
    'remove-scripts': {
        name: 'Remove scripts',
        params: {},
        apply: (doc) => {
            doc.querySelectorAll('script').forEach(el => el.remove());
        }
    },
    'remove-styles': {
        name: 'Remove styles',
        params: {},
        apply: (doc) => {
            doc.querySelectorAll('style, link[rel="stylesheet"]').forEach(el => el.remove());
            doc.querySelectorAll('[style]').forEach(el => el.removeAttribute('style'));
        }
    },
    'remove-comments': {
        name: 'Remove comments',
        params: {},
        apply: (doc) => {
            const walker = document.createTreeWalker(doc, NodeFilter.SHOW_COMMENT);
            const comments = [];
            while (walker.nextNode()) comments.push(walker.currentNode);
            comments.forEach(c => c.remove());
        }
    },
    'blur-images': {
        name: 'Blur images',
        params: { amount: { type: 'text', default: '5px' } },
        apply: (doc, params) => {
            doc.querySelectorAll('img').forEach(img => {
                img.style.filter = `blur(${params.amount})`;
            });
        }
    }
};
```

---

## 5. Events

### Events to EMIT
| Event | When | Payload |
|-------|------|---------|
| `html-loaded` | After loading HTML | `{ cacheKey, cacheId, html, charCount }` |
| `html-transformed` | After applying transform | `{ originalCacheId, transformedHtml }` |
| `html-saved` | After saving | `{ cacheKey, cacheId }` |
| `browse-entities-request` | When Browse clicked | `{ namespace }` |

### Events to LISTEN
| Event | Action |
|-------|--------|
| `entity-selected` | Load selected entity's HTML |
| `profile-loaded` | Populate profile dropdown |

---

## 6. Key Methods

```javascript
async loadHtml(cacheKey) {
    this.setState({ loading: true });
    
    const response = await this.api.htmlGraph.loadHtml(
        this.config.get('defaults.namespace'),
        cacheKey
    );
    
    if (response.success && response.found) {
        this.setState({
            loading: false,
            cacheKey,
            cacheId: response.cache_id,
            originalHtml: response.html,
            transformedHtml: response.html,  // Start same as original
            charCount: response.char_count
        });
        
        this.config.addRecent('cacheKeys', cacheKey);
        this.events.emit('html-loaded', { 
            cacheKey, 
            cacheId: response.cache_id, 
            html: response.html 
        });
    } else {
        this.setState({ loading: false, error: 'HTML not found' });
    }
}

applyTransforms() {
    // Parse original HTML into DOM
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.state.originalHtml, 'text/html');
    
    // Apply each selected transform
    for (const [id, enabled] of Object.entries(this.state.selectedTransforms)) {
        if (enabled && TRANSFORMS[id]) {
            const params = this.state.transformParams[id] || {};
            TRANSFORMS[id].apply(doc, params);
        }
    }
    
    // Serialize back to HTML
    const transformedHtml = doc.documentElement.outerHTML;
    
    this.setState({ transformedHtml });
    this.events.emit('html-transformed', {
        originalCacheId: this.state.cacheId,
        transformedHtml
    });
}

async saveHtml(cacheKey, html) {
    const response = await this.api.htmlGraph.saveHtml(
        this.config.get('defaults.namespace'),
        cacheKey,
        html
    );
    
    if (response.success) {
        this.events.emit('html-saved', { 
            cacheKey, 
            cacheId: response.cache_id 
        });
        this.showToast('Saved successfully');
    }
}

renderPreview(html, container) {
    // Use iframe for sandboxed preview
    const iframe = document.createElement('iframe');
    iframe.sandbox = 'allow-same-origin';
    container.innerHTML = '';
    container.appendChild(iframe);
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();
}
```

---

## 7. State Management

```javascript
this.state = {
    loading: false,
    error: null,
    
    // Current HTML
    cacheKey: '',
    cacheId: null,
    originalHtml: '',
    transformedHtml: '',
    
    // View state
    beforeView: 'raw',      // 'raw' or 'preview'
    afterView: 'raw',
    
    // Transforms
    selectedTransforms: {},  // { 'remove-elements': true, ... }
    transformParams: {},     // { 'remove-elements': { selector: '.ad' } }
    selectedProfile: null,
    
    // Stats
    originalCharCount: 0,
    transformedCharCount: 0
};
```

---

## 8. File Structure

```
v0.1.0/
└── components/
    └── html-workbench/
        ├── html-workbench.js
        ├── html-workbench.test.js
        └── transforms.js         # Transform definitions
```

---

## 9. Acceptance Criteria

- [ ] Input field for cache key
- [ ] Load button fetches HTML from API
- [ ] Recent keys shown and clickable
- [ ] Before pane shows original HTML
- [ ] After pane shows transformed HTML
- [ ] Toggle between raw and preview in each pane
- [ ] Character count shown for both
- [ ] Transform checkboxes enable/disable transforms
- [ ] Transform params shown when needed
- [ ] Apply button runs selected transforms
- [ ] Profile dropdown loads from API
- [ ] Apply Profile runs server-side transform
- [ ] Save to same key works
- [ ] Save to new key works
- [ ] Export downloads HTML file

---

## 10. CSS Layout

```css
.html-workbench {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.hw-toolbar {
    padding: 10px;
    border-bottom: 1px solid #ddd;
}

.hw-panes {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.hw-pane {
    flex: 1;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #ddd;
}

.hw-pane:last-child {
    border-right: none;
}

.hw-pane-header {
    padding: 8px;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
}

.hw-pane-content {
    flex: 1;
    overflow: auto;
    padding: 10px;
    font-family: monospace;
    font-size: 12px;
    white-space: pre-wrap;
}

.hw-pane-content.preview {
    font-family: inherit;
    white-space: normal;
}

.hw-transforms {
    padding: 15px;
    border-top: 1px solid #ddd;
    background: #fafafa;
}

.hw-footer {
    padding: 10px;
    border-top: 1px solid #ddd;
    display: flex;
    gap: 10px;
}
```

---

*Refer to SHARED_BRIEFING.md for platform context and coding standards.*
