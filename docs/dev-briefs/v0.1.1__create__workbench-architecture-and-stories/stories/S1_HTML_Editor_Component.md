# Story S1: HTML Editor Component

**Story ID:** S1  
**Layer:** Shared Components  
**Priority:** MEDIUM  
**Parallel With:** S2, S3  
**Dependencies:** None

---

## 1. Purpose

Create a reusable HTML editor/viewer component with syntax highlighting. This component is used by multiple mini apps for displaying and editing HTML content.

**You are building:**
- HTML syntax highlighting
- Line numbers
- Read-only and editable modes
- Search within content
- Copy to clipboard

**Used by:** HTML Workbench (M3), Page Analysis (M6)

---

## 2. UI Mockup

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  [HTML] [Preview]                              [🔍 Search] [📋 Copy] [↕ Expand] │
├────┬────────────────────────────────────────────────────────────────────────────┤
│  1 │ <!DOCTYPE html>                                                            │
│  2 │ <html lang="en">                                                           │
│  3 │   <head>                                                                   │
│  4 │     <meta charset="UTF-8">                                                 │
│  5 │     <title>Page Title</title>                                              │
│  6 │   </head>                                                                  │
│  7 │   <body>                                                                   │
│  8 │     <header>                                                               │
│  9 │       <h1>Welcome</h1>                                                     │
│ 10 │     </header>                                                              │
│ 11 │     <main>                                                                 │
│ 12 │       <p>Content goes here...</p>                                          │
│ 13 │     </main>                                                                │
│ 14 │   </body>                                                                  │
│ 15 │ </html>                                                                    │
├────┴────────────────────────────────────────────────────────────────────────────┤
│  Lines: 15 | Characters: 342 | Mode: Read-only                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Search Mode

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Search: [title_____________] [↑ Prev] [↓ Next] [✕]    Found: 2 of 3 matches   │
├────┬────────────────────────────────────────────────────────────────────────────┤
│  4 │     <meta charset="UTF-8">                                                 │
│  5 │     <███████>Page Title</███████>  ◄── highlighted match                   │
│  6 │   </head>                                                                  │
```

---

## 3. Component Interface

```javascript
class HtmlEditor extends HTMLElement {
    // ═══════════════════════════════════════════════════════════════════
    // Attributes (can be set via HTML or JS)
    // ═══════════════════════════════════════════════════════════════════
    
    static get observedAttributes() {
        return ['readonly', 'show-line-numbers', 'theme', 'wrap'];
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // Properties
    // ═══════════════════════════════════════════════════════════════════
    
    get value() { return this._content; }
    set value(html) { this._content = html; this.render(); }
    
    get readonly() { return this.hasAttribute('readonly'); }
    set readonly(val) { 
        if (val) this.setAttribute('readonly', '');
        else this.removeAttribute('readonly');
    }
    
    // ═══════════════════════════════════════════════════════════════════
    // Methods
    // ═══════════════════════════════════════════════════════════════════
    
    // Set content
    setContent(html) { this.value = html; }
    
    // Get content
    getContent() { return this.value; }
    
    // Search within content
    search(query) { /* highlight matches */ }
    
    // Clear search
    clearSearch() { /* remove highlights */ }
    
    // Go to line
    goToLine(lineNumber) { /* scroll to line */ }
    
    // Copy content to clipboard
    copyToClipboard() { /* copy this.value */ }
    
    // ═══════════════════════════════════════════════════════════════════
    // Events Emitted
    // ═══════════════════════════════════════════════════════════════════
    
    // When content changes (editable mode)
    // this.dispatchEvent(new CustomEvent('change', { detail: { value } }))
    
    // When search finds matches
    // this.dispatchEvent(new CustomEvent('search-results', { detail: { count, current } }))
}

customElements.define('html-editor', HtmlEditor);
```

---

## 4. Usage Examples

### Basic Read-only Viewer

```html
<html-editor readonly show-line-numbers>
</html-editor>

<script>
const editor = document.querySelector('html-editor');
editor.value = '<html><body>Hello World</body></html>';
</script>
```

### Editable Editor

```html
<html-editor show-line-numbers>
</html-editor>

<script>
const editor = document.querySelector('html-editor');
editor.value = '<html>...</html>';

editor.addEventListener('change', (e) => {
    console.log('Content changed:', e.detail.value);
});
</script>
```

### With Search

```javascript
const editor = document.querySelector('html-editor');
editor.search('div');  // Highlights all 'div' matches

editor.addEventListener('search-results', (e) => {
    console.log(`Found ${e.detail.count} matches`);
});
```

---

## 5. Syntax Highlighting

### Token Types

| Token | Example | Color |
|-------|---------|-------|
| Tag | `<div>`, `</div>` | #e06c75 (red) |
| Attribute Name | `class=`, `id=` | #d19a66 (orange) |
| Attribute Value | `"container"` | #98c379 (green) |
| Comment | `<!-- comment -->` | #5c6370 (gray) |
| DOCTYPE | `<!DOCTYPE html>` | #c678dd (purple) |
| Text | `Hello World` | #abb2bf (light gray) |

### Highlighting Implementation

```javascript
highlightHtml(html) {
    // Escape HTML entities first
    let escaped = this.escapeHtml(html);
    
    // Apply syntax highlighting with regex
    const patterns = [
        // Comments
        { regex: /(&lt;!--[\s\S]*?--&gt;)/g, class: 'hl-comment' },
        // DOCTYPE
        { regex: /(&lt;!DOCTYPE[^&]*&gt;)/gi, class: 'hl-doctype' },
        // Tags
        { regex: /(&lt;\/?)([\w-]+)/g, replace: '$1<span class="hl-tag">$2</span>' },
        // Attributes
        { regex: /([\w-]+)(=)(&quot;[^&]*&quot;)/g, 
          replace: '<span class="hl-attr">$1</span>$2<span class="hl-value">$3</span>' },
        // Closing bracket
        { regex: /(&gt;)/g, class: 'hl-bracket' }
    ];
    
    patterns.forEach(p => {
        if (p.replace) {
            escaped = escaped.replace(p.regex, p.replace);
        } else {
            escaped = escaped.replace(p.regex, `<span class="${p.class}">$1</span>`);
        }
    });
    
    return escaped;
}
```

---

## 6. Line Numbers

```javascript
renderWithLineNumbers(html) {
    const lines = html.split('\n');
    const lineCount = lines.length;
    const gutterWidth = String(lineCount).length;
    
    return lines.map((line, i) => {
        const lineNum = String(i + 1).padStart(gutterWidth, ' ');
        return `<div class="line">
            <span class="line-number">${lineNum}</span>
            <span class="line-content">${this.highlightHtml(line)}</span>
        </div>`;
    }).join('');
}
```

---

## 7. Search Implementation

```javascript
search(query) {
    if (!query) {
        this.clearSearch();
        return;
    }
    
    this._searchQuery = query;
    this._searchMatches = [];
    this._currentMatch = 0;
    
    // Find all matches
    const content = this._content.toLowerCase();
    const queryLower = query.toLowerCase();
    let pos = 0;
    
    while ((pos = content.indexOf(queryLower, pos)) !== -1) {
        this._searchMatches.push(pos);
        pos += query.length;
    }
    
    // Render with highlights
    this.renderWithSearchHighlights();
    
    // Emit results
    this.dispatchEvent(new CustomEvent('search-results', {
        detail: {
            count: this._searchMatches.length,
            current: this._currentMatch + 1
        }
    }));
    
    // Scroll to first match
    if (this._searchMatches.length > 0) {
        this.scrollToMatch(0);
    }
}

nextMatch() {
    if (this._searchMatches.length === 0) return;
    this._currentMatch = (this._currentMatch + 1) % this._searchMatches.length;
    this.scrollToMatch(this._currentMatch);
}

prevMatch() {
    if (this._searchMatches.length === 0) return;
    this._currentMatch = (this._currentMatch - 1 + this._searchMatches.length) % this._searchMatches.length;
    this.scrollToMatch(this._currentMatch);
}
```

---

## 8. File Structure

```
v0.1.0/
└── components/
    └── shared/
        └── html-editor/
            ├── html-editor.js
            ├── html-editor.css
            └── html-editor.test.js
```

---

## 9. CSS

```css
html-editor {
    display: flex;
    flex-direction: column;
    font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
    font-size: 13px;
    background: #282c34;
    color: #abb2bf;
    border: 1px solid #3e4451;
    border-radius: 4px;
    overflow: hidden;
}

.editor-toolbar {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    background: #21252b;
    border-bottom: 1px solid #3e4451;
}

.editor-content {
    flex: 1;
    overflow: auto;
    padding: 10px 0;
}

.line {
    display: flex;
    min-height: 20px;
    line-height: 20px;
}

.line-number {
    min-width: 40px;
    padding: 0 10px;
    text-align: right;
    color: #636d83;
    user-select: none;
    background: #282c34;
    border-right: 1px solid #3e4451;
}

.line-content {
    flex: 1;
    padding: 0 10px;
    white-space: pre;
}

.editor-footer {
    display: flex;
    justify-content: space-between;
    padding: 4px 10px;
    background: #21252b;
    border-top: 1px solid #3e4451;
    font-size: 11px;
    color: #636d83;
}

/* Syntax highlighting */
.hl-tag { color: #e06c75; }
.hl-attr { color: #d19a66; }
.hl-value { color: #98c379; }
.hl-comment { color: #5c6370; font-style: italic; }
.hl-doctype { color: #c678dd; }
.hl-bracket { color: #abb2bf; }

/* Search highlighting */
.search-match {
    background: #3e4451;
    border-radius: 2px;
}

.search-match.current {
    background: #e5c07b;
    color: #282c34;
}

/* Editable mode */
html-editor:not([readonly]) .line-content {
    cursor: text;
}

html-editor:not([readonly]) .line-content:focus {
    outline: none;
    background: rgba(255, 255, 255, 0.05);
}
```

---

## 10. Acceptance Criteria

- [ ] Displays HTML with syntax highlighting
- [ ] Shows line numbers (toggleable)
- [ ] Read-only mode prevents editing
- [ ] Editable mode allows changes
- [ ] `change` event fires on edit
- [ ] Search highlights matches
- [ ] Can navigate between search matches
- [ ] Copy button copies content
- [ ] Scrolls to specific line via `goToLine()`
- [ ] Shows line/character count in footer
- [ ] Handles large documents (virtualization if needed)
- [ ] Dark theme by default

---

## 11. Events

### Events Emitted

| Event | When | Detail |
|-------|------|--------|
| `change` | Content modified (edit mode) | `{ value }` |
| `search-results` | After search | `{ count, current }` |

### Events Listened

None (this is a passive UI component)

---

*Refer to SHARED_BRIEFING.md for platform context and coding standards.*
