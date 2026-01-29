/**
 * HTML Editor Component
 *
 * Purpose: Reusable HTML editor/viewer with syntax highlighting
 * Story: S1
 * Version: v0.1.0
 *
 * Used by: HTML Workbench (M3), Page Analysis (M6)
 */

class HtmlEditor extends HTMLElement {

    static get observedAttributes() {
        return ['readonly', 'show-line-numbers', 'theme', 'wrap'];
    }

    constructor() {
        super();
        this._content = '';
        this._searchQuery = '';
        this._searchMatches = [];
        this._currentMatch = 0;
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback() {}

    attributeChangedCallback(name, oldVal, newVal) {
        if (oldVal !== newVal) {
            this.render();
        }
    }

    get value() { return this._content; }
    set value(html) {
        this._content = html || '';
        this.render();
    }

    get readonly() { return this.hasAttribute('readonly'); }
    set readonly(val) {
        if (val) this.setAttribute('readonly', '');
        else this.removeAttribute('readonly');
    }

    setContent(html) { this.value = html; }
    getContent() { return this.value; }

    render() {
        const showLineNumbers = this.hasAttribute('show-line-numbers');

        this.innerHTML = `
            <style>
                .html-editor {
                    display: flex;
                    flex-direction: column;
                    font-family: 'SF Mono', 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
                    font-size: 13px;
                    background: #282c34;
                    color: #abb2bf;
                    border: 1px solid #3e4451;
                    border-radius: 6px;
                    overflow: hidden;
                    height: 100%;
                }
                .he-toolbar {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px 12px;
                    background: #21252b;
                    border-bottom: 1px solid #3e4451;
                    gap: 8px;
                }
                .he-toolbar-left {
                    display: flex;
                    gap: 8px;
                }
                .he-toolbar-right {
                    display: flex;
                    gap: 8px;
                }
                .he-tab {
                    padding: 4px 12px;
                    border: none;
                    background: transparent;
                    color: #888;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .he-tab.active {
                    background: #3e4451;
                    color: #fff;
                }
                .he-btn {
                    padding: 4px 10px;
                    border: 1px solid #3e4451;
                    background: transparent;
                    color: #abb2bf;
                    cursor: pointer;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .he-btn:hover {
                    background: #3e4451;
                }
                .he-search-box {
                    display: none;
                    padding: 8px 12px;
                    background: #21252b;
                    border-bottom: 1px solid #3e4451;
                    gap: 8px;
                    align-items: center;
                }
                .he-search-box.visible {
                    display: flex;
                }
                .he-search-input {
                    flex: 1;
                    padding: 6px 10px;
                    border: 1px solid #3e4451;
                    background: #282c34;
                    color: #abb2bf;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .he-search-input:focus {
                    outline: none;
                    border-color: #528bff;
                }
                .he-search-info {
                    font-size: 11px;
                    color: #888;
                    min-width: 100px;
                }
                .he-content {
                    flex: 1;
                    overflow: auto;
                    padding: 12px 0;
                }
                .he-preview {
                    flex: 1;
                    overflow: auto;
                    background: #fff;
                }
                .he-preview iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                .he-line {
                    display: flex;
                    min-height: 20px;
                    line-height: 20px;
                }
                .he-line-number {
                    min-width: 50px;
                    padding: 0 12px;
                    text-align: right;
                    color: #636d83;
                    user-select: none;
                    background: #282c34;
                    border-right: 1px solid #3e4451;
                }
                .he-line-content {
                    flex: 1;
                    padding: 0 12px;
                    white-space: pre;
                }
                .he-footer {
                    display: flex;
                    justify-content: space-between;
                    padding: 6px 12px;
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
                .hl-text { color: #abb2bf; }
                .hl-entity { color: #56b6c2; }
                /* Search highlighting */
                .search-match {
                    background: #3e4451;
                    border-radius: 2px;
                    padding: 1px 0;
                }
                .search-match.current {
                    background: #e5c07b;
                    color: #282c34;
                }
            </style>
            <div class="html-editor">
                <div class="he-toolbar">
                    <div class="he-toolbar-left">
                        <button class="he-tab active" data-view="html">HTML</button>
                        <button class="he-tab" data-view="preview">Preview</button>
                    </div>
                    <div class="he-toolbar-right">
                        <button class="he-btn" id="he-search-btn">🔍 Search</button>
                        <button class="he-btn" id="he-copy-btn">📋 Copy</button>
                    </div>
                </div>
                <div class="he-search-box" id="he-search-box">
                    <input type="text" class="he-search-input" id="he-search-input" placeholder="Search...">
                    <button class="he-btn" id="he-prev-btn">↑</button>
                    <button class="he-btn" id="he-next-btn">↓</button>
                    <button class="he-btn" id="he-close-search-btn">✕</button>
                    <span class="he-search-info" id="he-search-info"></span>
                </div>
                <div class="he-content" id="he-content">
                    ${this.renderContent(showLineNumbers)}
                </div>
                <div class="he-preview" id="he-preview" style="display: none;"></div>
                <div class="he-footer">
                    <span>Lines: ${this.getLineCount()} | Characters: ${this._content.length.toLocaleString()}</span>
                    <span>Mode: ${this.readonly ? 'Read-only' : 'Editable'}</span>
                </div>
            </div>
        `;

        this.$content = this.querySelector('#he-content');
        this.$preview = this.querySelector('#he-preview');
        this.$searchBox = this.querySelector('#he-search-box');
        this.$searchInput = this.querySelector('#he-search-input');
        this.$searchInfo = this.querySelector('#he-search-info');
    }

    renderContent(showLineNumbers) {
        if (!this._content) {
            return '<div class="he-line"><span class="he-line-content" style="color: #636d83;">No content</span></div>';
        }

        const lines = this._content.split('\n');
        const gutterWidth = String(lines.length).length;

        return lines.map((line, i) => {
            const lineNum = String(i + 1).padStart(gutterWidth, ' ');
            const highlighted = this.highlightLine(line);

            return `<div class="he-line">
                ${showLineNumbers ? `<span class="he-line-number">${lineNum}</span>` : ''}
                <span class="he-line-content">${highlighted}</span>
            </div>`;
        }).join('');
    }

    highlightLine(line) {
        // Escape HTML entities
        let escaped = this.escapeHtml(line);

        // Apply syntax highlighting
        // Comments
        escaped = escaped.replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="hl-comment">$1</span>');

        // DOCTYPE
        escaped = escaped.replace(/(&lt;!DOCTYPE[^&]*&gt;)/gi, '<span class="hl-doctype">$1</span>');

        // Opening and closing tags
        escaped = escaped.replace(/(&lt;\/?)([\w-]+)/g, '$1<span class="hl-tag">$2</span>');

        // Attributes with values
        escaped = escaped.replace(/([\w-]+)(=)(&quot;[^&]*&quot;)/g,
            '<span class="hl-attr">$1</span>$2<span class="hl-value">$3</span>');

        // Self-closing tags
        escaped = escaped.replace(/(\/)(&gt;)/g, '$1$2');

        // Apply search highlights
        if (this._searchQuery && this._searchMatches.length > 0) {
            const query = this.escapeHtml(this._searchQuery);
            const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
            escaped = escaped.replace(regex, '<span class="search-match">$1</span>');
        }

        return escaped || '&nbsp;';
    }

    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    getLineCount() {
        return this._content ? this._content.split('\n').length : 0;
    }

    setupEventListeners() {
        // View tabs
        this.querySelectorAll('.he-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchView(tab.dataset.view));
        });

        // Search
        this.querySelector('#he-search-btn').addEventListener('click', () => this.toggleSearch());
        this.querySelector('#he-close-search-btn').addEventListener('click', () => this.closeSearch());
        this.querySelector('#he-search-input').addEventListener('input', (e) => this.search(e.target.value));
        this.querySelector('#he-prev-btn').addEventListener('click', () => this.prevMatch());
        this.querySelector('#he-next-btn').addEventListener('click', () => this.nextMatch());

        // Copy
        this.querySelector('#he-copy-btn').addEventListener('click', () => this.copyToClipboard());

        // Keyboard shortcuts
        this.$searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.shiftKey ? this.prevMatch() : this.nextMatch();
            } else if (e.key === 'Escape') {
                this.closeSearch();
            }
        });
    }

    switchView(view) {
        this.querySelectorAll('.he-tab').forEach(t => t.classList.remove('active'));
        this.querySelector(`[data-view="${view}"]`).classList.add('active');

        if (view === 'preview') {
            this.$content.style.display = 'none';
            this.$preview.style.display = 'block';
            this.renderPreview();
        } else {
            this.$content.style.display = 'block';
            this.$preview.style.display = 'none';
        }
    }

    renderPreview() {
        const iframe = document.createElement('iframe');
        iframe.sandbox = 'allow-same-origin';
        this.$preview.innerHTML = '';
        this.$preview.appendChild(iframe);
        iframe.contentDocument.write(this._content);
        iframe.contentDocument.close();
    }

    toggleSearch() {
        this.$searchBox.classList.toggle('visible');
        if (this.$searchBox.classList.contains('visible')) {
            this.$searchInput.focus();
        }
    }

    closeSearch() {
        this.$searchBox.classList.remove('visible');
        this.clearSearch();
    }

    search(query) {
        this._searchQuery = query;
        this._searchMatches = [];
        this._currentMatch = 0;

        if (!query) {
            this.$searchInfo.textContent = '';
            this.render();
            this.setupEventListeners();
            return;
        }

        // Find all matches
        const content = this._content.toLowerCase();
        const queryLower = query.toLowerCase();
        let pos = 0;

        while ((pos = content.indexOf(queryLower, pos)) !== -1) {
            this._searchMatches.push(pos);
            pos += query.length;
        }

        this.$searchInfo.textContent = this._searchMatches.length > 0
            ? `${this._currentMatch + 1} of ${this._searchMatches.length}`
            : 'No matches';

        this.render();
        this.setupEventListeners();
        this.$searchBox.classList.add('visible');
        this.$searchInput.value = query;
        this.$searchInput.focus();

        this.dispatchEvent(new CustomEvent('search-results', {
            detail: { count: this._searchMatches.length, current: this._currentMatch + 1 }
        }));
    }

    nextMatch() {
        if (this._searchMatches.length === 0) return;
        this._currentMatch = (this._currentMatch + 1) % this._searchMatches.length;
        this.$searchInfo.textContent = `${this._currentMatch + 1} of ${this._searchMatches.length}`;
        this.scrollToMatch();
    }

    prevMatch() {
        if (this._searchMatches.length === 0) return;
        this._currentMatch = (this._currentMatch - 1 + this._searchMatches.length) % this._searchMatches.length;
        this.$searchInfo.textContent = `${this._currentMatch + 1} of ${this._searchMatches.length}`;
        this.scrollToMatch();
    }

    scrollToMatch() {
        const matches = this.$content.querySelectorAll('.search-match');
        if (matches[this._currentMatch]) {
            matches.forEach(m => m.classList.remove('current'));
            matches[this._currentMatch].classList.add('current');
            matches[this._currentMatch].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    clearSearch() {
        this._searchQuery = '';
        this._searchMatches = [];
        this._currentMatch = 0;
        this.$searchInfo.textContent = '';
        this.render();
        this.setupEventListeners();
    }

    goToLine(lineNumber) {
        const lines = this.$content.querySelectorAll('.he-line');
        if (lines[lineNumber - 1]) {
            lines[lineNumber - 1].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    copyToClipboard() {
        navigator.clipboard.writeText(this._content).then(() => {
            const btn = this.querySelector('#he-copy-btn');
            const original = btn.textContent;
            btn.textContent = '✓ Copied';
            setTimeout(() => btn.textContent = original, 1500);
        });
    }
}

customElements.define('html-editor', HtmlEditor);
