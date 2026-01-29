/**
 * HTML Workbench Mini App
 *
 * Purpose: Main transformation workspace - load HTML, view before/after, apply transforms
 * Story: M3
 * Version: v0.1.0
 */

const TRANSFORMS = {
    'remove-elements': {
        name: 'Remove elements by selector',
        params: { selector: { type: 'text', default: '.ad, .banner, .sponsored' } },
        apply: (doc, params) => {
            doc.querySelectorAll(params.selector).forEach(el => {
                const comment = doc.createComment(`removed: ${el.tagName.toLowerCase()}`);
                el.replaceWith(comment);
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
            const walker = document.createTreeWalker(doc.documentElement, NodeFilter.SHOW_COMMENT);
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

class HtmlWorkbench extends HTMLElement {

    static get appId()    { return 'html-workbench'; }
    static get navLabel() { return 'Workbench'; }
    static get navIcon()  { return '🔬'; }

    constructor() {
        super();
        this.state = {
            loading: false,
            error: null,
            cacheKey: '',
            cacheId: null,
            originalHtml: '',
            transformedHtml: '',
            beforeView: 'raw',
            afterView: 'raw',
            selectedTransforms: {},
            transformParams: {},
            selectedProfile: null
        };
        this._boundHandlers = {};
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback() {
        this.cleanup();
    }

    onActivate() {
        // Check if we need to load a page from site browser
        const loadKey = sessionStorage.getItem('workbench-load-key');
        if (loadKey) {
            sessionStorage.removeItem('workbench-load-key');
            this.querySelector('#cache-key-input').value = loadKey;
            this.loadHtml(loadKey);
        }
    }

    onDeactivate() {}

    render() {
        const recentKeys = this.config.getRecent('cacheKeys').slice(0, 5);

        this.innerHTML = `
            <style>
                .html-workbench {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .hw-toolbar {
                    padding: 12px 16px;
                    border-bottom: 1px solid #e0e0e0;
                    background: #f8f9fa;
                }
                .hw-toolbar-row {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .hw-toolbar-row:last-child {
                    margin-bottom: 0;
                }
                .hw-input {
                    flex: 1;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 13px;
                }
                .hw-input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                .hw-btn {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 13px;
                    font-weight: 500;
                    transition: all 0.15s ease;
                }
                .hw-btn-primary {
                    background: #667eea;
                    color: white;
                }
                .hw-btn-primary:hover {
                    background: #5a6fd6;
                }
                .hw-btn-secondary {
                    background: #f0f0f0;
                    color: #333;
                }
                .hw-btn-secondary:hover {
                    background: #e0e0e0;
                }
                .hw-recent {
                    font-size: 12px;
                    color: #666;
                }
                .hw-recent a {
                    color: #667eea;
                    cursor: pointer;
                    margin-right: 8px;
                }
                .hw-recent a:hover {
                    text-decoration: underline;
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
                    border-right: 1px solid #e0e0e0;
                    overflow: hidden;
                }
                .hw-pane:last-child {
                    border-right: none;
                }
                .hw-pane-header {
                    padding: 8px 12px;
                    background: #f5f5f5;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .hw-pane-title {
                    font-weight: 600;
                    font-size: 13px;
                    color: #333;
                }
                .hw-pane-tabs {
                    display: flex;
                    gap: 4px;
                }
                .hw-pane-tab {
                    padding: 4px 10px;
                    font-size: 11px;
                    border: none;
                    background: transparent;
                    cursor: pointer;
                    border-radius: 4px;
                }
                .hw-pane-tab.active {
                    background: #667eea;
                    color: white;
                }
                .hw-pane-content {
                    flex: 1;
                    overflow: auto;
                    padding: 12px;
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 12px;
                    white-space: pre-wrap;
                    word-break: break-all;
                    background: #fafafa;
                }
                .hw-pane-content.preview {
                    font-family: inherit;
                    white-space: normal;
                    word-break: normal;
                }
                .hw-pane-content iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                .hw-pane-stats {
                    padding: 8px 12px;
                    background: #f5f5f5;
                    border-top: 1px solid #e0e0e0;
                    font-size: 11px;
                    color: #666;
                }
                .hw-transforms {
                    padding: 16px;
                    border-top: 1px solid #e0e0e0;
                    background: #fff;
                    max-height: 250px;
                    overflow-y: auto;
                }
                .hw-transforms-title {
                    font-weight: 600;
                    font-size: 14px;
                    margin-bottom: 12px;
                    color: #333;
                }
                .hw-transform-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 8px 0;
                    border-bottom: 1px solid #eee;
                }
                .hw-transform-row:last-child {
                    border-bottom: none;
                }
                .hw-transform-checkbox {
                    width: 18px;
                    height: 18px;
                }
                .hw-transform-label {
                    flex: 1;
                    font-size: 13px;
                }
                .hw-transform-param {
                    width: 200px;
                    padding: 6px 10px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-size: 12px;
                }
                .hw-footer {
                    padding: 12px 16px;
                    border-top: 1px solid #e0e0e0;
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    background: #f8f9fa;
                }
                .hw-save-input {
                    width: 250px;
                }
                .hw-loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
                .hw-error {
                    text-align: center;
                    padding: 20px;
                    color: #dc3545;
                    background: #ffebee;
                    border-radius: 6px;
                    margin: 12px;
                }
                .hw-empty {
                    text-align: center;
                    padding: 40px;
                    color: #888;
                }
                .hw-toast {
                    position: fixed;
                    bottom: 60px;
                    right: 20px;
                    background: #333;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-size: 13px;
                    animation: fadeIn 0.2s ease;
                    z-index: 1000;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            </style>
            <div class="html-workbench">
                <div class="hw-toolbar">
                    <div class="hw-toolbar-row">
                        <input type="text" class="hw-input" id="cache-key-input" placeholder="Enter cache key (e.g., example.com/about)">
                        <button class="hw-btn hw-btn-primary" id="load-btn">📂 Load</button>
                    </div>
                    ${recentKeys.length > 0 ? `
                        <div class="hw-recent">
                            Recent: ${recentKeys.map(k => `<a data-key="${k}">${this.truncateKey(k)}</a>`).join('')}
                        </div>
                    ` : ''}
                </div>

                <div class="hw-panes" id="panes-container">
                    <div class="hw-pane">
                        <div class="hw-pane-header">
                            <span class="hw-pane-title">Before (Original)</span>
                            <div class="hw-pane-tabs">
                                <button class="hw-pane-tab active" data-view="raw" data-pane="before">Raw</button>
                                <button class="hw-pane-tab" data-view="preview" data-pane="before">Preview</button>
                            </div>
                        </div>
                        <div class="hw-pane-content" id="before-content">
                            <div class="hw-empty">Load an HTML document to get started.</div>
                        </div>
                        <div class="hw-pane-stats" id="before-stats"></div>
                    </div>
                    <div class="hw-pane">
                        <div class="hw-pane-header">
                            <span class="hw-pane-title">After (Transformed)</span>
                            <div class="hw-pane-tabs">
                                <button class="hw-pane-tab active" data-view="raw" data-pane="after">Raw</button>
                                <button class="hw-pane-tab" data-view="preview" data-pane="after">Preview</button>
                            </div>
                        </div>
                        <div class="hw-pane-content" id="after-content">
                            <div class="hw-empty">Apply transforms to see the result.</div>
                        </div>
                        <div class="hw-pane-stats" id="after-stats"></div>
                    </div>
                </div>

                <div class="hw-transforms">
                    <div class="hw-transforms-title">Transformations</div>
                    ${Object.entries(TRANSFORMS).map(([id, transform]) => `
                        <div class="hw-transform-row">
                            <input type="checkbox" class="hw-transform-checkbox" data-transform="${id}" id="transform-${id}">
                            <label class="hw-transform-label" for="transform-${id}">${transform.name}</label>
                            ${Object.entries(transform.params).map(([paramName, paramDef]) => `
                                <input type="text" class="hw-transform-param"
                                    data-transform="${id}" data-param="${paramName}"
                                    placeholder="${paramName}" value="${paramDef.default || ''}">
                            `).join('')}
                        </div>
                    `).join('')}
                    <div style="margin-top: 12px; text-align: right;">
                        <button class="hw-btn hw-btn-primary" id="apply-transforms-btn">▶ Apply Transforms</button>
                    </div>
                </div>

                <div class="hw-footer">
                    <button class="hw-btn hw-btn-secondary" id="save-same-btn">💾 Save to Same Key</button>
                    <input type="text" class="hw-input hw-save-input" id="save-as-input" placeholder="Save as new key...">
                    <button class="hw-btn hw-btn-secondary" id="save-as-btn">💾 Save As</button>
                    <button class="hw-btn hw-btn-secondary" id="export-btn">📤 Export HTML</button>
                </div>
            </div>
        `;
        this.bindElements();
    }

    truncateKey(key) {
        return key.length > 30 ? '...' + key.slice(-27) : key;
    }

    bindElements() {
        this.$cacheKeyInput = this.querySelector('#cache-key-input');
        this.$loadBtn = this.querySelector('#load-btn');
        this.$beforeContent = this.querySelector('#before-content');
        this.$afterContent = this.querySelector('#after-content');
        this.$beforeStats = this.querySelector('#before-stats');
        this.$afterStats = this.querySelector('#after-stats');
        this.$applyBtn = this.querySelector('#apply-transforms-btn');
        this.$saveSameBtn = this.querySelector('#save-same-btn');
        this.$saveAsInput = this.querySelector('#save-as-input');
        this.$saveAsBtn = this.querySelector('#save-as-btn');
        this.$exportBtn = this.querySelector('#export-btn');
    }

    setupEventListeners() {
        this.$loadBtn.addEventListener('click', () => this.loadHtml(this.$cacheKeyInput.value.trim()));
        this.$cacheKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.loadHtml(this.$cacheKeyInput.value.trim());
        });

        // Recent keys
        this.querySelectorAll('.hw-recent a').forEach(a => {
            a.addEventListener('click', () => {
                const key = a.dataset.key;
                this.$cacheKeyInput.value = key;
                this.loadHtml(key);
            });
        });

        // View tabs
        this.querySelectorAll('.hw-pane-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchView(tab.dataset.pane, tab.dataset.view));
        });

        // Transforms
        this.$applyBtn.addEventListener('click', () => this.applyTransforms());

        // Save/Export
        this.$saveSameBtn.addEventListener('click', () => this.saveHtml(this.state.cacheKey, this.state.transformedHtml));
        this.$saveAsBtn.addEventListener('click', () => this.saveHtml(this.$saveAsInput.value.trim(), this.state.transformedHtml));
        this.$exportBtn.addEventListener('click', () => this.exportHtml());
    }

    cleanup() {}

    async loadHtml(cacheKey) {
        if (!cacheKey) {
            this.showToast('Please enter a cache key');
            return;
        }

        this.state.loading = true;
        this.$beforeContent.innerHTML = '<div class="hw-loading">Loading...</div>';

        try {
            const response = await this.api.htmlGraph.loadHtml(
                this.config.get('defaults.namespace'),
                cacheKey
            );

            if (response.success && response.found) {
                this.state = {
                    ...this.state,
                    loading: false,
                    error: null,
                    cacheKey,
                    cacheId: response.cache_id,
                    originalHtml: response.html,
                    transformedHtml: response.html
                };

                this.config.addRecent('cacheKeys', cacheKey);
                this.renderContent();
                this.$saveAsInput.value = cacheKey + '-transformed';

                this.events.emit('html-loaded', {
                    cacheKey,
                    cacheId: response.cache_id,
                    html: response.html,
                    charCount: response.char_count
                });
            } else {
                this.state.loading = false;
                this.state.error = 'HTML not found for this cache key';
                this.$beforeContent.innerHTML = `<div class="hw-error">${this.state.error}</div>`;
            }
        } catch (error) {
            this.state.loading = false;
            this.state.error = error.message;
            this.$beforeContent.innerHTML = `<div class="hw-error">Error: ${error.message}</div>`;
        }
    }

    renderContent() {
        if (this.state.beforeView === 'raw') {
            this.$beforeContent.textContent = this.state.originalHtml;
            this.$beforeContent.classList.remove('preview');
        } else {
            this.renderPreview(this.state.originalHtml, this.$beforeContent);
            this.$beforeContent.classList.add('preview');
        }

        if (this.state.afterView === 'raw') {
            this.$afterContent.textContent = this.state.transformedHtml;
            this.$afterContent.classList.remove('preview');
        } else {
            this.renderPreview(this.state.transformedHtml, this.$afterContent);
            this.$afterContent.classList.add('preview');
        }

        this.updateStats();
    }

    renderPreview(html, container) {
        const iframe = document.createElement('iframe');
        iframe.sandbox = 'allow-same-origin';
        container.innerHTML = '';
        container.appendChild(iframe);
        iframe.contentDocument.write(html);
        iframe.contentDocument.close();
    }

    updateStats() {
        const origChars = this.state.originalHtml.length;
        const transChars = this.state.transformedHtml.length;
        const diff = transChars - origChars;
        const pct = origChars > 0 ? Math.round((diff / origChars) * 100) : 0;
        const pctStr = pct >= 0 ? `+${pct}%` : `${pct}%`;

        this.$beforeStats.textContent = `${origChars.toLocaleString()} chars`;
        this.$afterStats.textContent = `${transChars.toLocaleString()} chars (${pctStr})`;
    }

    switchView(pane, view) {
        if (pane === 'before') {
            this.state.beforeView = view;
        } else {
            this.state.afterView = view;
        }

        // Update tab states
        const tabs = this.querySelectorAll(`.hw-pane-tab[data-pane="${pane}"]`);
        tabs.forEach(t => t.classList.toggle('active', t.dataset.view === view));

        this.renderContent();
    }

    applyTransforms() {
        if (!this.state.originalHtml) {
            this.showToast('Load HTML first');
            return;
        }

        // Get selected transforms and params
        const selectedTransforms = {};
        const transformParams = {};

        this.querySelectorAll('.hw-transform-checkbox:checked').forEach(cb => {
            const id = cb.dataset.transform;
            selectedTransforms[id] = true;
            transformParams[id] = {};

            this.querySelectorAll(`.hw-transform-param[data-transform="${id}"]`).forEach(input => {
                transformParams[id][input.dataset.param] = input.value;
            });
        });

        if (Object.keys(selectedTransforms).length === 0) {
            this.showToast('Select at least one transform');
            return;
        }

        // Parse original HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.state.originalHtml, 'text/html');

        // Apply each selected transform
        for (const [id, enabled] of Object.entries(selectedTransforms)) {
            if (enabled && TRANSFORMS[id]) {
                const params = transformParams[id] || {};
                try {
                    TRANSFORMS[id].apply(doc, params);
                } catch (e) {
                    console.error(`Transform ${id} failed:`, e);
                }
            }
        }

        // Serialize back
        const transformedHtml = '<!DOCTYPE html>\n' + doc.documentElement.outerHTML;
        this.state.transformedHtml = transformedHtml;
        this.state.selectedTransforms = selectedTransforms;
        this.state.transformParams = transformParams;

        this.renderContent();
        this.showToast('Transforms applied');

        this.events.emit('html-transformed', {
            originalCacheId: this.state.cacheId,
            transformedHtml
        });
    }

    async saveHtml(cacheKey, html) {
        if (!cacheKey) {
            this.showToast('Please enter a cache key');
            return;
        }
        if (!html) {
            this.showToast('No HTML to save');
            return;
        }

        try {
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
            } else {
                this.showToast('Save failed: ' + (response.error || 'Unknown error'));
            }
        } catch (error) {
            this.showToast('Save failed: ' + error.message);
        }
    }

    exportHtml() {
        if (!this.state.transformedHtml) {
            this.showToast('No HTML to export');
            return;
        }

        const blob = new Blob([this.state.transformedHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (this.state.cacheKey || 'exported').replace(/[/\\]/g, '_') + '.html';
        a.click();
        URL.revokeObjectURL(url);
        this.showToast('HTML exported');
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'hw-toast';
        toast.textContent = message;
        this.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    get events() { return window.workbench.events; }
    get api() { return window.workbench.api; }
    get config() { return window.workbench.config; }
    get router() { return window.workbench.router; }
}

customElements.define('html-workbench', HtmlWorkbench);
