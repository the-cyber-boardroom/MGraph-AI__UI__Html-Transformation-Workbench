/**
 * Kanban Board Mini App
 *
 * Purpose: Display nodes organized by status columns
 * Version: v0.1.0 (Issues UI)
 *
 * Namespace: window.issuesApp
 */

class KanbanBoard extends HTMLElement {

    static get appId()    { return 'kanban-board'; }
    static get navLabel() { return 'Kanban Board'; }
    static get navIcon()  { return '📊'; }

    constructor() {
        super();
        this.state = {
            nodes: {},
            loading: true,
            error: null,
            filter: '',
            typeFilter: 'all'
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

            // Group nodes by status
            const nodes = response.nodes || [];
            const grouped = this.groupByStatus(nodes);

            this.state.nodes = grouped;
            this.state.loading = false;

        } catch (error) {
            this.state.error = error.message;
            this.state.loading = false;
        }

        this.render();
    }

    groupByStatus(nodes) {
        const grouped = {};
        const nodeTypes = window.issuesApp.nodeTypes;

        // Collect all unique statuses
        const allStatuses = new Set();
        Object.values(nodeTypes).forEach(type => {
            type.statuses.forEach(s => allStatuses.add(s));
        });

        // Initialize groups
        allStatuses.forEach(status => {
            grouped[status] = [];
        });

        // Group nodes
        nodes.forEach(node => {
            if (grouped[node.status]) {
                grouped[node.status].push(node);
            }
        });

        return grouped;
    }

    getStatusColumns() {
        const nodeTypes = window.issuesApp.nodeTypes;
        if (this.state.typeFilter === 'all') {
            // Show common statuses
            return [
                { id: 'backlog', label: 'Backlog', icon: '📋' },
                { id: 'todo', label: 'Todo', icon: '📝' },
                { id: 'in-progress', label: 'In Progress', icon: '🔄' },
                { id: 'review', label: 'Review', icon: '👀' },
                { id: 'done', label: 'Done', icon: '✅' }
            ];
        }

        const typeConfig = nodeTypes[this.state.typeFilter];
        return typeConfig.statuses.map(status => ({
            id: status,
            label: this.formatStatus(status),
            icon: this.getStatusIcon(status)
        }));
    }

    getStatusIcon(status) {
        const icons = {
            'backlog': '📋', 'todo': '📝', 'in-progress': '🔄',
            'review': '👀', 'done': '✅', 'confirmed': '🔍',
            'testing': '🧪', 'resolved': '✔️', 'closed': '🔒',
            'proposed': '💡', 'approved': '👍', 'released': '🚀',
            'active': '🟢', 'inactive': '⚫'
        };
        return icons[status] || '📌';
    }

    render() {
        const nodeTypes = window.issuesApp.nodeTypes;
        const statusColumns = this.getStatusColumns();

        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="kanban-board">
                <div class="kb-header">
                    <h2>Issue Board</h2>
                    <div class="kb-toolbar">
                        <div class="kb-type-filter">
                            <button class="kb-type-btn ${this.state.typeFilter === 'all' ? 'active' : ''}"
                                    data-type="all">All</button>
                            ${Object.entries(nodeTypes).map(([type, config]) => `
                                <button class="kb-type-btn ${this.state.typeFilter === type ? 'active' : ''}"
                                        data-type="${type}"
                                        style="--type-color: ${config.color}">
                                    ${config.icon}
                                </button>
                            `).join('')}
                        </div>
                        <input type="text" class="kb-search" id="kb-search"
                            placeholder="Filter..." value="${this.escapeHtml(this.state.filter)}">
                        <button class="kb-btn kb-btn-secondary" id="kb-refresh">↻</button>
                    </div>
                </div>

                ${this.state.loading ? `
                    <div class="kb-loading">Loading nodes...</div>
                ` : this.state.error ? `
                    <div class="kb-error">${this.escapeHtml(this.state.error)}</div>
                ` : `
                    <div class="kb-columns">
                        ${statusColumns.map(status => this.renderColumn(status)).join('')}
                    </div>
                `}
            </div>
        `;

        this.attachEventHandlers();
    }

    renderColumn(status) {
        const nodes = this.state.nodes[status.id] || [];
        const filteredNodes = this.state.filter
            ? nodes.filter(n =>
                n.title?.toLowerCase().includes(this.state.filter.toLowerCase()) ||
                n.label?.toLowerCase().includes(this.state.filter.toLowerCase()))
            : nodes;

        return `
            <div class="kb-column" data-status="${status.id}">
                <div class="kb-column-header">
                    <span class="kb-column-icon">${status.icon}</span>
                    <span class="kb-column-title">${status.label}</span>
                    <span class="kb-column-count">${filteredNodes.length}</span>
                </div>
                <div class="kb-column-body">
                    ${filteredNodes.length === 0 ? `
                        <div class="kb-empty">No items</div>
                    ` : filteredNodes.map(node => this.renderCard(node)).join('')}
                </div>
            </div>
        `;
    }

    renderCard(node) {
        const nodeType = this.graphService.parseTypeFromLabel(node.label);
        const typeConfig = window.issuesApp.nodeTypes[nodeType] || {};

        return `
            <div class="kb-card" data-label="${node.label}">
                <div class="kb-card-header">
                    <span class="kb-card-type" style="background: ${typeConfig.color || '#6b7280'}">
                        ${typeConfig.icon || '📄'}
                    </span>
                    <span class="kb-card-label">${node.label}</span>
                </div>
                <div class="kb-card-title">${this.escapeHtml(node.title || '')}</div>
                ${node.tags && node.tags.length > 0 ? `
                    <div class="kb-card-tags">
                        ${node.tags.slice(0, 3).map(tag =>
                            `<span class="kb-card-tag">${this.escapeHtml(tag)}</span>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    attachEventHandlers() {
        // Type filter
        this.querySelectorAll('.kb-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.typeFilter = btn.dataset.type;
                this.loadData();
            });
        });

        // Search filter
        this.querySelector('#kb-search')?.addEventListener('input', (e) => {
            this.state.filter = e.target.value;
            this.render();
        });

        // Refresh button
        this.querySelector('#kb-refresh')?.addEventListener('click', () => {
            this.graphService.clearCache();
            this.loadData();
        });

        // Card click - navigate to node detail
        this.querySelectorAll('.kb-card').forEach(card => {
            card.addEventListener('click', () => {
                const label = card.dataset.label;
                this.events.emit('navigate-to-node', { label });
                this.router.navigate('node-detail');
            });
        });
    }

    formatStatus(status) {
        if (!status) return '';
        return status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getStyles() {
        return `
            .kanban-board {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: #1a1a2e;
                color: #e0e0e0;
            }

            .kb-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                border-bottom: 1px solid #2a3f5f;
                background: #1e2746;
            }

            .kb-header h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #fff;
            }

            .kb-toolbar {
                display: flex;
                gap: 12px;
                align-items: center;
            }

            .kb-type-filter {
                display: flex;
                gap: 4px;
            }

            .kb-type-btn {
                padding: 6px 10px;
                border: 1px solid #3a4f6f;
                border-radius: 4px;
                background: transparent;
                color: #a0b0c0;
                font-size: 12px;
                cursor: pointer;
            }

            .kb-type-btn:hover {
                background: rgba(255, 255, 255, 0.05);
            }

            .kb-type-btn.active {
                background: var(--type-color, #3a4f6f);
                border-color: var(--type-color, #3a4f6f);
                color: white;
            }

            .kb-search {
                padding: 8px 12px;
                border: 1px solid #3a4f6f;
                border-radius: 4px;
                background: #252836;
                color: #e0e0e0;
                font-size: 13px;
                width: 150px;
            }

            .kb-search:focus {
                outline: none;
                border-color: #e94560;
            }

            .kb-btn {
                padding: 8px 12px;
                border: none;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
            }

            .kb-btn-secondary {
                background: #3a4f6f;
                color: #e0e0e0;
            }

            .kb-btn-secondary:hover {
                background: #4a5f7f;
            }

            .kb-columns {
                display: flex;
                flex: 1;
                overflow-x: auto;
                padding: 16px;
                gap: 12px;
            }

            .kb-column {
                flex: 0 0 260px;
                background: #1e2746;
                border-radius: 8px;
                display: flex;
                flex-direction: column;
                max-height: calc(100vh - 180px);
            }

            .kb-column-header {
                display: flex;
                align-items: center;
                padding: 12px 14px;
                border-bottom: 1px solid #2a3f5f;
                gap: 8px;
            }

            .kb-column-icon {
                font-size: 14px;
            }

            .kb-column-title {
                font-weight: 600;
                font-size: 13px;
                color: #fff;
                flex: 1;
            }

            .kb-column-count {
                background: #3a4f6f;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 11px;
                color: #a0b0c0;
            }

            .kb-column-body {
                flex: 1;
                overflow-y: auto;
                padding: 8px;
            }

            .kb-card {
                background: #252836;
                border-radius: 6px;
                padding: 12px;
                margin-bottom: 8px;
                cursor: pointer;
                transition: all 0.15s;
                border: 1px solid transparent;
            }

            .kb-card:hover {
                background: #2a2f42;
                border-color: #3a4f6f;
                transform: translateY(-1px);
            }

            .kb-card-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 6px;
            }

            .kb-card-type {
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 10px;
                color: white;
            }

            .kb-card-label {
                font-size: 10px;
                color: #8a9cc4;
                font-weight: 600;
            }

            .kb-card-title {
                font-size: 13px;
                color: #e0e8f0;
                line-height: 1.4;
            }

            .kb-card-tags {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
                margin-top: 8px;
            }

            .kb-card-tag {
                font-size: 9px;
                padding: 2px 6px;
                background: #3a4f6f;
                border-radius: 3px;
                color: #a0b0c0;
            }

            .kb-loading, .kb-error, .kb-empty {
                padding: 40px;
                text-align: center;
                color: #8a9cc4;
            }

            .kb-error {
                color: #e94560;
            }

            .kb-empty {
                padding: 20px;
                font-size: 12px;
            }

            .kb-column-body::-webkit-scrollbar {
                width: 4px;
            }

            .kb-column-body::-webkit-scrollbar-track {
                background: transparent;
            }

            .kb-column-body::-webkit-scrollbar-thumb {
                background: #3a4f6f;
                border-radius: 2px;
            }
        `;
    }

    get events() { return window.issuesApp.events; }
    get router() { return window.issuesApp.router; }
    get graphService() { return window.issuesApp.graph; }
}

customElements.define('kanban-board', KanbanBoard);
