/**
 * Kanban Board Mini App
 *
 * Purpose: Display issues organized by status columns
 * Version: v0.1.6
 */

const KANBAN_STATUSES = [
    { id: 'backlog', label: 'Backlog', icon: '📋' },
    { id: 'todo', label: 'Todo', icon: '📝' },
    { id: 'in-progress', label: 'In Progress', icon: '🔄' },
    { id: 'review', label: 'Review', icon: '👀' },
    { id: 'done', label: 'Done', icon: '✅' }
];

class KanbanBoard extends HTMLElement {

    static get appId()    { return 'kanban-board'; }
    static get navLabel() { return 'Kanban Board'; }
    static get navIcon()  { return '📋'; }

    constructor() {
        super();
        this.state = {
            issues: {},
            labels: [],
            loading: true,
            error: null,
            filter: ''
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
            const [issues, labels] = await Promise.all([
                this.issueService.getIssuesGroupedByStatus(),
                this.issueService.getLabels()
            ]);

            this.state.issues = issues;
            this.state.labels = labels;
            this.state.loading = false;

        } catch (error) {
            this.state.error = error.message;
            this.state.loading = false;
        }

        this.render();
    }

    render() {
        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="kanban-board">
                <div class="kb-header">
                    <h2>Issue Board</h2>
                    <div class="kb-toolbar">
                        <input type="text" class="kb-search" id="kb-search"
                            placeholder="Filter issues..." value="${this.escapeHtml(this.state.filter)}">
                        <button class="kb-btn kb-btn-secondary" id="kb-refresh">↻ Refresh</button>
                    </div>
                </div>

                ${this.state.loading ? `
                    <div class="kb-loading">Loading issues...</div>
                ` : this.state.error ? `
                    <div class="kb-error">${this.escapeHtml(this.state.error)}</div>
                ` : `
                    <div class="kb-columns">
                        ${KANBAN_STATUSES.map(status => this.renderColumn(status)).join('')}
                    </div>
                `}
            </div>
        `;

        this.attachEventHandlers();
    }

    renderColumn(status) {
        const issues = this.state.issues[status.id] || [];
        const filteredIssues = this.state.filter
            ? issues.filter(i => i.title.toLowerCase().includes(this.state.filter.toLowerCase()))
            : issues;

        return `
            <div class="kb-column" data-status="${status.id}">
                <div class="kb-column-header">
                    <span class="kb-column-icon">${status.icon}</span>
                    <span class="kb-column-title">${status.label}</span>
                    <span class="kb-column-count">${filteredIssues.length}</span>
                </div>
                <div class="kb-column-body">
                    ${filteredIssues.length === 0 ? `
                        <div class="kb-empty">No issues</div>
                    ` : filteredIssues.map(issue => this.renderCard(issue)).join('')}
                </div>
            </div>
        `;
    }

    renderCard(issue) {
        return `
            <div class="kb-card" data-id="${issue.id}">
                <div class="kb-card-id">${issue.id.replace('issue-', 'ISS-')}</div>
                <div class="kb-card-title">${this.escapeHtml(issue.title)}</div>
                <div class="kb-card-footer">
                    <div class="kb-card-labels">
                        <!-- Labels will be loaded when viewing details -->
                    </div>
                </div>
            </div>
        `;
    }

    attachEventHandlers() {
        // Search filter
        this.querySelector('#kb-search')?.addEventListener('input', (e) => {
            this.state.filter = e.target.value;
            this.render();
        });

        // Refresh button
        this.querySelector('#kb-refresh')?.addEventListener('click', () => {
            this.loadData();
        });

        // Card click - navigate to issue detail
        this.querySelectorAll('.kb-card').forEach(card => {
            card.addEventListener('click', () => {
                const issueId = card.dataset.id;
                this.events.emit('navigate-to-issue', { id: issueId });
                // Navigate to issue detail app
                this.router.navigate('issue-detail');
            });
        });
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

            .kb-search {
                padding: 8px 12px;
                border: 1px solid #3a4f6f;
                border-radius: 4px;
                background: #252836;
                color: #e0e0e0;
                font-size: 13px;
                width: 200px;
            }

            .kb-search:focus {
                outline: none;
                border-color: #e94560;
            }

            .kb-btn {
                padding: 8px 14px;
                border: none;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s;
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

            .kb-card-id {
                font-size: 10px;
                color: #8a9cc4;
                margin-bottom: 4px;
                font-weight: 600;
            }

            .kb-card-title {
                font-size: 13px;
                color: #e0e8f0;
                line-height: 1.4;
            }

            .kb-card-footer {
                margin-top: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .kb-card-labels {
                display: flex;
                gap: 4px;
                flex-wrap: wrap;
            }

            .kb-label {
                font-size: 9px;
                padding: 2px 6px;
                border-radius: 3px;
                font-weight: 500;
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

            /* Scrollbar */
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

    get events() { return window.workbench.events; }
    get router() { return window.workbench.router; }
    get issueService() { return window.workbench.issues; }
}

customElements.define('kanban-board', KanbanBoard);
