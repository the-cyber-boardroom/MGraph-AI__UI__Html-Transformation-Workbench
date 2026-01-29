# Story M5: Site Browser Mini App

**Story ID:** M5  
**Layer:** Mini Apps  
**Priority:** MEDIUM  
**Parallel With:** M1-M4, M6, M7  
**Dependencies:** F1-F4, B2 (Site Browsing API)

---

## 1. Purpose

Browse cached pages by domain. View all pages stored for a website, select multiple pages for batch operations (view, transform, delete).

---

## 2. UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SITE BROWSER                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  Domain: [example.com_______________________________] [🔍 Browse]               │
│                                                                                  │
│  Recent: example.com | news.site.com | blog.test.org | docs.api.io              │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  example.com — 15 pages found                       [☑ Select All] [☐ Clear]   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │ [x]  /                              Jan 20, 2026 10:45    1.2 KB        │    │
│  │ [x]  /about                         Jan 20, 2026 10:43    2.4 KB        │    │
│  │ [x]  /blog                          Jan 20, 2026 10:42    3.1 KB        │    │
│  │ [x]  /blog/post-1                   Jan 20, 2026 10:40    5.1 KB        │    │
│  │ [ ]  /blog/post-2                   Jan 19, 2026 15:30    4.8 KB        │    │
│  │ [ ]  /blog/post-3                   Jan 19, 2026 14:20    3.9 KB        │    │
│  │ [ ]  /contact                       Jan 18, 2026 09:15    1.1 KB        │    │
│  │ [ ]  /products                      Jan 17, 2026 16:45    8.2 KB        │    │
│  │ [ ]  /products/item-1               Jan 17, 2026 16:40    6.5 KB        │    │
│  │ [ ]  /products/item-2               Jan 17, 2026 16:35    7.1 KB        │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
│  Sort by: [Path ▼]  [Ascending ▼]                                               │
│                                                                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  4 pages selected                                                               │
│                                                                                  │
│  BATCH ACTIONS:                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐    │
│  │                                                                         │    │
│  │  [👁 View First]  Opens first selected page in Workbench               │    │
│  │                                                                         │    │
│  │  Apply Profile: [clean-news ▼]  [▶ Apply to Selected]                  │    │
│  │                                                                         │    │
│  │  [🗑 Delete Selected]   ⚠ This cannot be undone                        │    │
│  │                                                                         │    │
│  └─────────────────────────────────────────────────────────────────────────┘    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Features

### 3.1 Domain Search
- Enter domain to browse
- Recent domains from config
- Click recent to browse

### 3.2 Page List
- Shows all cached pages for domain
- Path, stored date, size
- Checkbox for selection
- Sort by path, date, or size

### 3.3 Selection
- Individual checkboxes
- Select All / Clear All
- Selection count shown

### 3.4 Batch Actions
- View first in Workbench
- Apply profile to all selected
- Delete selected (with confirmation)

---

## 4. Events

### Events to EMIT
| Event | When | Payload |
|-------|------|---------|
| `site-loaded` | After browsing domain | `{ domain, pages, count }` |
| `pages-selected` | Selection changes | `{ domain, cacheKeys }` |
| `batch-apply-request` | Apply profile clicked | `{ profileId, cacheKeys }` |
| `batch-apply-complete` | Batch finished | `{ profileId, results }` |
| `navigate` | View in Workbench | `{ appId: 'html-workbench' }` |

### Events to LISTEN
| Event | Action |
|-------|--------|
| `profile-list-loaded` | Update profile dropdown |

---

## 5. Key Methods

```javascript
async browseDomain(domain) {
    this.setState({ loading: true, domain, pages: [] });
    
    const response = await this.api.htmlGraph.listSitePages(
        this.config.get('defaults.namespace'),
        domain
    );
    
    if (response.success) {
        this.setState({ 
            loading: false, 
            pages: response.pages,
            count: response.count
        });
        this.config.addRecent('domains', domain);
        this.events.emit('site-loaded', { 
            domain, 
            pages: response.pages, 
            count: response.count 
        });
    }
}

selectPage(cacheKey, selected) {
    const selectedPages = new Set(this.state.selectedPages);
    if (selected) {
        selectedPages.add(cacheKey);
    } else {
        selectedPages.delete(cacheKey);
    }
    this.setState({ selectedPages });
    this.events.emit('pages-selected', { 
        domain: this.state.domain, 
        cacheKeys: Array.from(selectedPages) 
    });
}

selectAll() {
    const allKeys = this.state.pages.map(p => p.cache_key);
    this.setState({ selectedPages: new Set(allKeys) });
}

clearSelection() {
    this.setState({ selectedPages: new Set() });
}

viewInWorkbench() {
    const firstSelected = Array.from(this.state.selectedPages)[0];
    if (firstSelected) {
        // Store the cache key to load
        sessionStorage.setItem('workbench-load-key', firstSelected);
        this.router.navigate('html-workbench');
    }
}

async applyProfileToSelected(profileId) {
    const cacheKeys = Array.from(this.state.selectedPages);
    
    this.events.emit('batch-apply-request', { profileId, cacheKeys });
    this.setState({ batchProcessing: true });
    
    const results = [];
    for (const cacheKey of cacheKeys) {
        try {
            const response = await this.api.htmlGraph.applyProfile(
                this.config.get('defaults.namespace'),
                profileId,
                cacheKey
            );
            results.push({ cacheKey, success: true, result: response });
        } catch (error) {
            results.push({ cacheKey, success: false, error: error.message });
        }
    }
    
    this.setState({ batchProcessing: false });
    this.events.emit('batch-apply-complete', { profileId, results });
    
    const successCount = results.filter(r => r.success).length;
    this.showToast(`Applied to ${successCount}/${cacheKeys.length} pages`);
}

async deleteSelected() {
    const cacheKeys = Array.from(this.state.selectedPages);
    
    if (!confirm(`Delete ${cacheKeys.length} pages? This cannot be undone.`)) {
        return;
    }
    
    for (const cacheKey of cacheKeys) {
        await this.api.call(
            'html-graph',
            `/cache-entity/${this.config.get('defaults.namespace')}/entity/key/${cacheKey}`,
            'DELETE'
        );
    }
    
    // Refresh list
    await this.browseDomain(this.state.domain);
    this.clearSelection();
    this.showToast(`Deleted ${cacheKeys.length} pages`);
}

sortPages(field, direction) {
    const sorted = [...this.state.pages].sort((a, b) => {
        let compare;
        switch (field) {
            case 'path':
                compare = a.path.localeCompare(b.path);
                break;
            case 'date':
                compare = a.stored_at - b.stored_at;
                break;
            case 'size':
                compare = a.content_size - b.content_size;
                break;
        }
        return direction === 'asc' ? compare : -compare;
    });
    this.setState({ pages: sorted, sortField: field, sortDirection: direction });
}
```

---

## 6. File Structure

```
v0.1.0/
└── components/
    └── site-browser/
        ├── site-browser.js
        └── site-browser.test.js
```

---

## 7. Acceptance Criteria

- [ ] Domain input with Browse button
- [ ] Recent domains shown and clickable
- [ ] Page list shows path, date, size
- [ ] Checkboxes for page selection
- [ ] Select All / Clear All buttons
- [ ] Selection count displayed
- [ ] Sort by path, date, size
- [ ] View First opens Workbench with page
- [ ] Apply Profile runs batch transform
- [ ] Delete Selected removes pages (with confirmation)
- [ ] Loading indicator during browse
- [ ] Empty state when no pages found

---

*Refer to SHARED_BRIEFING.md for platform context and coding standards.*
