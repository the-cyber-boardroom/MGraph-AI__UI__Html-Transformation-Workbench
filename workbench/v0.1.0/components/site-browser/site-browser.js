/**
 * Site Browser Mini App
 *
 * Purpose: Browse cached pages by domain, select for batch operations
 * Story: M5
 * Version: v0.1.0
 */

class SiteBrowser extends HTMLElement {

    static get appId()    { return 'site-browser'; }
    static get navLabel() { return 'Site Browser'; }
    static get navIcon()  { return '🌐'; }

    constructor() {
        super();
        this.state = {
            domain: '',
            pages: [],
            loading: false,
            selectedPages: new Set(),
            sortField: 'path',
            sortDirection: 'asc'
        };
    }

    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    disconnectedCallback() {}

    onActivate() {}
    onDeactivate() {}

    render() {
        const recentDomains = this.config.getRecent('domains').slice(0, 5);

        this.innerHTML = `
            <style>
                .site-browser {
                    display: flex;
                    flex-direction: column;
                    height: 100%;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                .sb-toolbar {
                    padding: 16px;
                    border-bottom: 1px solid #e0e0e0;
                    background: #f8f9fa;
                }
                .sb-toolbar-row {
                    display: flex;
                    gap: 8px;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .sb-toolbar-row:last-child {
                    margin-bottom: 0;
                }
                .sb-input {
                    flex: 1;
                    padding: 10px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 14px;
                }
                .sb-input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                .sb-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 500;
                    transition: all 0.15s ease;
                }
                .sb-btn-primary {
                    background: #667eea;
                    color: white;
                }
                .sb-btn-primary:hover {
                    background: #5a6fd6;
                }
                .sb-btn-secondary {
                    background: #f0f0f0;
                    color: #333;
                }
                .sb-btn-secondary:hover {
                    background: #e0e0e0;
                }
                .sb-btn-danger {
                    background: #ffebee;
                    color: #c62828;
                }
                .sb-btn-danger:hover {
                    background: #ffcdd2;
                }
                .sb-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .sb-recent {
                    font-size: 12px;
                    color: #666;
                }
                .sb-recent a {
                    color: #667eea;
                    cursor: pointer;
                    margin-right: 12px;
                }
                .sb-recent a:hover {
                    text-decoration: underline;
                }
                .sb-header {
                    padding: 12px 16px;
                    background: #fff;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .sb-header-left {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                }
                .sb-domain-name {
                    font-weight: 600;
                    color: #333;
                }
                .sb-page-count {
                    font-size: 13px;
                    color: #666;
                }
                .sb-select-actions {
                    display: flex;
                    gap: 8px;
                }
                .sb-list {
                    flex: 1;
                    overflow-y: auto;
                }
                .sb-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                .sb-table th, .sb-table td {
                    padding: 12px 16px;
                    text-align: left;
                    border-bottom: 1px solid #e8e8e8;
                }
                .sb-table th {
                    background: #f5f5f5;
                    font-weight: 600;
                    font-size: 12px;
                    color: #666;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    user-select: none;
                }
                .sb-table th:hover {
                    background: #eee;
                }
                .sb-table th.sortable::after {
                    content: ' ↕';
                    color: #ccc;
                }
                .sb-table th.sorted-asc::after {
                    content: ' ↑';
                    color: #667eea;
                }
                .sb-table th.sorted-desc::after {
                    content: ' ↓';
                    color: #667eea;
                }
                .sb-table tr:hover {
                    background: #f9f9f9;
                }
                .sb-table tr.selected {
                    background: #f0f4ff;
                }
                .sb-checkbox {
                    width: 18px;
                    height: 18px;
                }
                .sb-path {
                    font-family: 'SF Mono', Monaco, monospace;
                    font-size: 13px;
                }
                .sb-date {
                    color: #666;
                    font-size: 13px;
                }
                .sb-size {
                    color: #666;
                    font-size: 13px;
                }
                .sb-batch-panel {
                    padding: 16px;
                    border-top: 1px solid #e0e0e0;
                    background: #f8f9fa;
                }
                .sb-batch-header {
                    font-weight: 500;
                    margin-bottom: 12px;
                    color: #333;
                }
                .sb-batch-actions {
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    flex-wrap: wrap;
                }
                .sb-batch-select {
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 13px;
                }
                .sb-empty {
                    text-align: center;
                    padding: 60px 20px;
                    color: #888;
                }
                .sb-empty-icon {
                    font-size: 48px;
                    margin-bottom: 16px;
                }
                .sb-sort-row {
                    padding: 8px 16px;
                    background: #fff;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    gap: 12px;
                    align-items: center;
                    font-size: 13px;
                }
                .sb-sort-row label {
                    color: #666;
                }
                .sb-toast {
                    position: fixed;
                    bottom: 60px;
                    right: 20px;
                    background: #333;
                    color: white;
                    padding: 12px 20px;
                    border-radius: 6px;
                    font-size: 13px;
                    z-index: 1000;
                }
            </style>
            <div class="site-browser">
                <div class="sb-toolbar">
                    <div class="sb-toolbar-row">
                        <input type="text" class="sb-input" id="sb-domain" placeholder="Enter domain (e.g., example.com)" value="${this.state.domain}">
                        <button class="sb-btn sb-btn-primary" id="sb-browse">🔍 Browse</button>
                    </div>
                    ${recentDomains.length > 0 ? `
                        <div class="sb-recent">
                            Recent: ${recentDomains.map(d => `<a data-domain="${d}">${d}</a>`).join('')}
                        </div>
                    ` : ''}
                </div>

                ${this.state.domain && this.state.pages.length > 0 ? `
                    <div class="sb-header">
                        <div class="sb-header-left">
                            <span class="sb-domain-name">${this.escapeHtml(this.state.domain)}</span>
                            <span class="sb-page-count">${this.state.pages.length} pages</span>
                        </div>
                        <div class="sb-select-actions">
                            <button class="sb-btn sb-btn-secondary" id="sb-select-all">☑ Select All</button>
                            <button class="sb-btn sb-btn-secondary" id="sb-clear-selection">☐ Clear</button>
                        </div>
                    </div>

                    <div class="sb-list">
                        <table class="sb-table">
                            <thead>
                                <tr>
                                    <th style="width: 40px;"></th>
                                    <th class="sortable ${this.getSortClass('path')}" data-sort="path">Path</th>
                                    <th class="sortable ${this.getSortClass('date')}" data-sort="date">Date</th>
                                    <th class="sortable ${this.getSortClass('size')}" data-sort="size">Size</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${this.getSortedPages().map(page => `
                                    <tr class="${this.state.selectedPages.has(page.cache_key) ? 'selected' : ''}" data-key="${page.cache_key}">
                                        <td>
                                            <input type="checkbox" class="sb-checkbox" data-key="${page.cache_key}"
                                                ${this.state.selectedPages.has(page.cache_key) ? 'checked' : ''}>
                                        </td>
                                        <td class="sb-path">${this.escapeHtml(page.path || page.cache_key)}</td>
                                        <td class="sb-date">${this.formatDate(page.stored_at)}</td>
                                        <td class="sb-size">${this.formatSize(page.content_size || 0)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="sb-batch-panel">
                        <div class="sb-batch-header">${this.state.selectedPages.size} pages selected</div>
                        <div class="sb-batch-actions">
                            <button class="sb-btn sb-btn-secondary" id="sb-view-first" ${this.state.selectedPages.size === 0 ? 'disabled' : ''}>
                                👁 View in Workbench
                            </button>
                            <button class="sb-btn sb-btn-danger" id="sb-delete-selected" ${this.state.selectedPages.size === 0 ? 'disabled' : ''}>
                                🗑 Delete Selected
                            </button>
                        </div>
                    </div>
                ` : this.state.loading ? `
                    <div class="sb-empty">
                        <div class="sb-empty-icon">⏳</div>
                        <div>Loading pages...</div>
                    </div>
                ` : this.state.domain ? `
                    <div class="sb-empty">
                        <div class="sb-empty-icon">📭</div>
                        <div>No pages found for ${this.escapeHtml(this.state.domain)}</div>
                    </div>
                ` : `
                    <div class="sb-empty">
                        <div class="sb-empty-icon">🌐</div>
                        <div>Enter a domain to browse cached pages</div>
                    </div>
                `}
            </div>
        `;
        this.bindElements();
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(timestamp) {
        if (!timestamp) return '-';
        const date = new Date(timestamp);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatSize(bytes) {
        if (bytes === 0) return '-';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    getSortClass(field) {
        if (this.state.sortField !== field) return '';
        return this.state.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc';
    }

    getSortedPages() {
        return [...this.state.pages].sort((a, b) => {
            let compare;
            switch (this.state.sortField) {
                case 'path':
                    compare = (a.path || a.cache_key).localeCompare(b.path || b.cache_key);
                    break;
                case 'date':
                    compare = (a.stored_at || 0) - (b.stored_at || 0);
                    break;
                case 'size':
                    compare = (a.content_size || 0) - (b.content_size || 0);
                    break;
                default:
                    compare = 0;
            }
            return this.state.sortDirection === 'asc' ? compare : -compare;
        });
    }

    bindElements() {
        this.$domain = this.querySelector('#sb-domain');
        this.$browseBtn = this.querySelector('#sb-browse');
    }

    setupEventListeners() {
        this.$browseBtn.addEventListener('click', () => this.browseDomain(this.$domain.value.trim()));
        this.$domain.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.browseDomain(this.$domain.value.trim());
        });

        // Recent domains
        this.querySelectorAll('.sb-recent a').forEach(a => {
            a.addEventListener('click', () => {
                const domain = a.dataset.domain;
                this.$domain.value = domain;
                this.browseDomain(domain);
            });
        });

        // Delegated events
        this.addEventListener('click', (e) => {
            if (e.target.id === 'sb-select-all') {
                this.selectAll();
            } else if (e.target.id === 'sb-clear-selection') {
                this.clearSelection();
            } else if (e.target.id === 'sb-view-first') {
                this.viewInWorkbench();
            } else if (e.target.id === 'sb-delete-selected') {
                this.deleteSelected();
            } else if (e.target.dataset.sort) {
                this.toggleSort(e.target.dataset.sort);
            }
        });

        // Checkbox changes
        this.addEventListener('change', (e) => {
            if (e.target.classList.contains('sb-checkbox')) {
                this.togglePage(e.target.dataset.key, e.target.checked);
            }
        });
    }

    async browseDomain(domain) {
        if (!domain) {
            this.showToast('Please enter a domain');
            return;
        }

        this.state.domain = domain;
        this.state.loading = true;
        this.state.pages = [];
        this.state.selectedPages = new Set();
        this.render();

        try {
            const response = await this.api.htmlGraph.listSitePages(
                this.config.get('defaults.namespace'),
                domain
            );

            if (response.success) {
                this.state.pages = response.pages || [];
                this.config.addRecent('domains', domain);
                this.events.emit('site-loaded', {
                    domain,
                    pages: this.state.pages,
                    count: this.state.pages.length
                });
            } else {
                this.state.pages = [];
            }
        } catch (error) {
            console.error('Failed to browse domain:', error);
            this.state.pages = [];
        }

        this.state.loading = false;
        this.render();
        this.setupEventListeners();
    }

    togglePage(cacheKey, selected) {
        if (selected) {
            this.state.selectedPages.add(cacheKey);
        } else {
            this.state.selectedPages.delete(cacheKey);
        }
        this.render();
        this.setupEventListeners();
        this.events.emit('pages-selected', {
            domain: this.state.domain,
            cacheKeys: Array.from(this.state.selectedPages)
        });
    }

    selectAll() {
        this.state.selectedPages = new Set(this.state.pages.map(p => p.cache_key));
        this.render();
        this.setupEventListeners();
    }

    clearSelection() {
        this.state.selectedPages = new Set();
        this.render();
        this.setupEventListeners();
    }

    toggleSort(field) {
        if (this.state.sortField === field) {
            this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.sortField = field;
            this.state.sortDirection = 'asc';
        }
        this.render();
        this.setupEventListeners();
    }

    viewInWorkbench() {
        const firstSelected = Array.from(this.state.selectedPages)[0];
        if (firstSelected) {
            sessionStorage.setItem('workbench-load-key', firstSelected);
            this.router.navigate('html-workbench');
        }
    }

    async deleteSelected() {
        const cacheKeys = Array.from(this.state.selectedPages);
        if (cacheKeys.length === 0) return;

        if (!confirm(`Delete ${cacheKeys.length} pages? This cannot be undone.`)) {
            return;
        }

        let deleted = 0;
        for (const cacheKey of cacheKeys) {
            try {
                await this.api.call(
                    'html-graph',
                    `/cache-entity/${this.config.get('defaults.namespace')}/entity/key/${encodeURIComponent(cacheKey)}`,
                    'DELETE'
                );
                deleted++;
            } catch (error) {
                console.error('Failed to delete:', cacheKey, error);
            }
        }

        this.showToast(`Deleted ${deleted} pages`);
        this.clearSelection();
        await this.browseDomain(this.state.domain);
    }

    showToast(message) {
        const existing = this.querySelector('.sb-toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = 'sb-toast';
        toast.textContent = message;
        this.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    get events() { return window.workbench.events; }
    get api() { return window.workbench.api; }
    get config() { return window.workbench.config; }
    get router() { return window.workbench.router; }
}

customElements.define('site-browser', SiteBrowser);
