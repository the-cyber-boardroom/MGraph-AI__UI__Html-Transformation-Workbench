/**
 * Node List Component
 *
 * Purpose: Display all nodes with type and status filters
 * Version: v0.1.7
 *
 * Shows bugs, tasks, features, and people in a filterable list view.
 */

class NodeList extends HTMLElement {

    static get appId()    { return 'node-list'; }
    static get navLabel() { return 'Issues'; }
    static get navIcon()  { return '📋'; }

    constructor() {
        super();
        this.state = {
            nodes: [],
            loading: true,
            error: null,
            typeFilter: 'all',
            statusFilter: 'all',
            search: ''
        };
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {}

    async onActivate() {
        await this.loadData();
    }

    onDeactivate() {}

    async loadData() {
        this.state.loading = true;
        this.state.error = null;
        this.render();

        try {
            let response;
            if (this.state.typeFilter === 'all') {
                response = await this.graphService.listNodes();
            } else {
                response = await this.graphService.listNodesByType(this.state.typeFilter);
            }

            this.state.nodes = response.nodes || [];
            this.state.loading = false;
        } catch (error) {
            this.state.error = error.message;
            this.state.loading = false;
        }

        this.render();
    }

    getFilteredNodes() {
        let nodes = this.state.nodes;

        // Filter by status
        if (this.state.statusFilter !== 'all') {
            nodes = nodes.filter(n => n.status === this.state.statusFilter);
        }

        // Filter by search
        if (this.state.search) {
            const search = this.state.search.toLowerCase();
            nodes = nodes.filter(n =>
                n.title?.toLowerCase().includes(search) ||
                n.label?.toLowerCase().includes(search)
            );
        }

        return nodes;
    }

    getAvailableStatuses() {
        if (this.state.typeFilter === 'all') {
            // Combine all statuses
            const allStatuses = new Set();
            Object.values(window.workbench.nodeTypes).forEach(type => {
                type.statuses.forEach(s => allStatuses.add(s));
            });
            return Array.from(allStatuses);
        }
        return this.graphService.getStatusesForType(this.state.typeFilter);
    }

    render() {
        const nodeTypes = window.workbench.nodeTypes;
        const filteredNodes = this.state.loading ? [] : this.getFilteredNodes();
        const availableStatuses = this.getAvailableStatuses();

        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="node-list">
                <div class="nl-header">
                    <h2>Issues</h2>
                    <div class="nl-toolbar">
                        <button class="nl-btn nl-btn-primary" id="nl-create">+ New</button>
                    </div>
                </div>

                <div class="nl-filters">
                    <div class="nl-filter-group">
                        <label>Type</label>
                        <div class="nl-type-filter">
                            <button class="nl-type-btn ${this.state.typeFilter === 'all' ? 'active' : ''}"
                                    data-type="all">All</button>
                            ${Object.entries(nodeTypes).map(([type, config]) => `
                                <button class="nl-type-btn ${this.state.typeFilter === type ? 'active' : ''}"
                                        data-type="${type}"
                                        style="--type-color: ${config.color}">
                                    ${config.icon} ${this.capitalize(type)}s
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <div class="nl-filter-row">
                        <div class="nl-filter-group">
                            <label>Status</label>
                            <select class="nl-select" id="nl-status-filter">
                                <option value="all">All Statuses</option>
                                ${availableStatuses.map(status => `
                                    <option value="${status}" ${this.state.statusFilter === status ? 'selected' : ''}>
                                        ${this.formatStatus(status)}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <div class="nl-filter-group nl-search-group">
                            <label>Search</label>
                            <input type="text" class="nl-input" id="nl-search"
                                   placeholder="Search by title or label..."
                                   value="${this.escapeHtml(this.state.search)}">
                        </div>

                        <button class="nl-btn nl-btn-secondary" id="nl-refresh">Refresh</button>
                    </div>
                </div>

                <div class="nl-content">
                    ${this.state.loading ? `
                        <div class="nl-loading">Loading nodes...</div>
                    ` : this.state.error ? `
                        <div class="nl-error">${this.escapeHtml(this.state.error)}</div>
                    ` : filteredNodes.length === 0 ? `
                        <div class="nl-empty">
                            <div class="nl-empty-icon">📭</div>
                            <div class="nl-empty-title">No items found</div>
                            <div class="nl-empty-text">Try adjusting your filters or create a new item.</div>
                        </div>
                    ` : `
                        <table class="nl-table">
                            <thead>
                                <tr>
                                    <th class="nl-th-label">Label</th>
                                    <th class="nl-th-title">Title</th>
                                    <th class="nl-th-status">Status</th>
                                    <th class="nl-th-links">Links</th>
                                    <th class="nl-th-updated">Updated</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredNodes.map(node => this.renderRow(node)).join('')}
                            </tbody>
                        </table>
                        <div class="nl-footer">
                            Showing ${filteredNodes.length} of ${this.state.nodes.length} items
                        </div>
                    `}
                </div>
            </div>
        `;

        this.attachEventHandlers();
    }

    renderRow(node) {
        const nodeType = this.graphService.parseTypeFromLabel(node.label);
        const typeConfig = window.workbench.nodeTypes[nodeType] || {};
        const linkCount = node.links?.length || 0;

        return `
            <tr class="nl-row" data-label="${node.label}">
                <td class="nl-cell-label">
                    <span class="nl-label-badge" style="background: ${typeConfig.color || '#6b7280'}">
                        ${typeConfig.icon || '📄'} ${node.label}
                    </span>
                </td>
                <td class="nl-cell-title">${this.escapeHtml(node.title || '')}</td>
                <td class="nl-cell-status">
                    <span class="nl-status-badge nl-status-${node.status}">
                        ${this.formatStatus(node.status)}
                    </span>
                </td>
                <td class="nl-cell-links">
                    ${linkCount > 0 ? `<span class="nl-link-count">${linkCount}</span>` : '-'}
                </td>
                <td class="nl-cell-updated">${this.formatDate(node.updated_at)}</td>
            </tr>
        `;
    }

    attachEventHandlers() {
        // Type filter buttons
        this.querySelectorAll('.nl-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.typeFilter = btn.dataset.type;
                this.state.statusFilter = 'all'; // Reset status filter when type changes
                this.loadData();
            });
        });

        // Status filter
        this.querySelector('#nl-status-filter')?.addEventListener('change', (e) => {
            this.state.statusFilter = e.target.value;
            this.render();
        });

        // Search input
        this.querySelector('#nl-search')?.addEventListener('input', (e) => {
            this.state.search = e.target.value;
            this.render();
        });

        // Refresh button
        this.querySelector('#nl-refresh')?.addEventListener('click', () => {
            this.graphService.clearCache();
            this.loadData();
        });

        // Create button
        this.querySelector('#nl-create')?.addEventListener('click', () => {
            this.events.emit('show-create-modal', {
                defaultType: this.state.typeFilter !== 'all' ? this.state.typeFilter : 'task'
            });
        });

        // Row click - navigate to detail
        this.querySelectorAll('.nl-row').forEach(row => {
            row.addEventListener('click', () => {
                const label = row.dataset.label;
                this.events.emit('navigate-to-node', { label });
                this.router.navigate('node-detail');
            });
        });
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    formatStatus(status) {
        if (!status) return '';
        return status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getStyles() {
        return `
            .node-list {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: #1a1a2e;
                color: #e0e0e0;
            }

            .nl-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                border-bottom: 1px solid #2a3f5f;
                background: #1e2746;
            }

            .nl-header h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #fff;
            }

            .nl-toolbar {
                display: flex;
                gap: 10px;
            }

            .nl-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s;
            }

            .nl-btn-primary {
                background: #e94560;
                color: white;
            }

            .nl-btn-primary:hover {
                background: #d63850;
            }

            .nl-btn-secondary {
                background: #3a4f6f;
                color: #e0e0e0;
            }

            .nl-btn-secondary:hover {
                background: #4a5f7f;
            }

            .nl-filters {
                padding: 16px 20px;
                background: #1e2746;
                border-bottom: 1px solid #2a3f5f;
            }

            .nl-filter-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }

            .nl-filter-group label {
                font-size: 11px;
                font-weight: 600;
                color: #8a9cc4;
                text-transform: uppercase;
            }

            .nl-type-filter {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .nl-type-btn {
                padding: 6px 12px;
                border: 1px solid #3a4f6f;
                border-radius: 4px;
                background: transparent;
                color: #a0b0c0;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.15s;
            }

            .nl-type-btn:hover {
                background: rgba(255, 255, 255, 0.05);
                border-color: #4a5f7f;
            }

            .nl-type-btn.active {
                background: var(--type-color, #3a4f6f);
                border-color: var(--type-color, #3a4f6f);
                color: white;
            }

            .nl-filter-row {
                display: flex;
                gap: 16px;
                align-items: flex-end;
                margin-top: 12px;
            }

            .nl-search-group {
                flex: 1;
            }

            .nl-select, .nl-input {
                padding: 8px 12px;
                border: 1px solid #3a4f6f;
                border-radius: 4px;
                background: #252836;
                color: #e0e0e0;
                font-size: 13px;
                width: 100%;
            }

            .nl-select:focus, .nl-input:focus {
                outline: none;
                border-color: #e94560;
            }

            .nl-content {
                flex: 1;
                overflow-y: auto;
                padding: 0;
            }

            .nl-table {
                width: 100%;
                border-collapse: collapse;
            }

            .nl-table thead {
                background: #1e2746;
                position: sticky;
                top: 0;
            }

            .nl-table th {
                padding: 12px 16px;
                text-align: left;
                font-size: 11px;
                font-weight: 600;
                color: #8a9cc4;
                text-transform: uppercase;
                border-bottom: 1px solid #2a3f5f;
            }

            .nl-th-label { width: 140px; }
            .nl-th-status { width: 120px; }
            .nl-th-links { width: 60px; text-align: center; }
            .nl-th-updated { width: 100px; }

            .nl-row {
                cursor: pointer;
                transition: background 0.15s;
            }

            .nl-row:hover {
                background: rgba(233, 69, 96, 0.1);
            }

            .nl-row td {
                padding: 12px 16px;
                border-bottom: 1px solid #2a3f5f;
                font-size: 13px;
            }

            .nl-label-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                font-weight: 600;
                color: white;
            }

            .nl-status-badge {
                display: inline-block;
                padding: 3px 8px;
                border-radius: 3px;
                font-size: 11px;
                font-weight: 500;
            }

            .nl-status-backlog { background: #3a4f6f; color: #a0b0c0; }
            .nl-status-todo { background: #1e3a5f; color: #64b5f6; }
            .nl-status-in-progress { background: #4a148c; color: #ce93d8; }
            .nl-status-review { background: #e65100; color: #ffcc80; }
            .nl-status-done { background: #1b5e20; color: #81c784; }
            .nl-status-confirmed { background: #b71c1c; color: #ef9a9a; }
            .nl-status-testing { background: #f57c00; color: #ffe0b2; }
            .nl-status-resolved { background: #2e7d32; color: #a5d6a7; }
            .nl-status-closed { background: #424242; color: #bdbdbd; }
            .nl-status-proposed { background: #1565c0; color: #90caf9; }
            .nl-status-approved { background: #00838f; color: #80deea; }
            .nl-status-released { background: #2e7d32; color: #a5d6a7; }
            .nl-status-active { background: #7b1fa2; color: #e1bee7; }
            .nl-status-inactive { background: #424242; color: #bdbdbd; }

            .nl-cell-links {
                text-align: center;
            }

            .nl-link-count {
                display: inline-block;
                background: #3a4f6f;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 11px;
            }

            .nl-cell-updated {
                color: #8a9cc4;
                font-size: 12px;
            }

            .nl-footer {
                padding: 12px 20px;
                text-align: center;
                font-size: 12px;
                color: #8a9cc4;
                border-top: 1px solid #2a3f5f;
            }

            .nl-loading, .nl-error {
                padding: 60px;
                text-align: center;
                color: #8a9cc4;
            }

            .nl-error {
                color: #e94560;
            }

            .nl-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 60px;
                text-align: center;
            }

            .nl-empty-icon {
                font-size: 48px;
                margin-bottom: 16px;
            }

            .nl-empty-title {
                font-size: 18px;
                font-weight: 600;
                color: #fff;
                margin-bottom: 8px;
            }

            .nl-empty-text {
                color: #8a9cc4;
            }
        `;
    }

    get events() { return window.workbench.events; }
    get router() { return window.workbench.router; }
    get graphService() { return window.workbench.graph; }
}

customElements.define('node-list', NodeList);
