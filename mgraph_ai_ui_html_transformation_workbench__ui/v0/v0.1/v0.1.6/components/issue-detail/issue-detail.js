/**
 * Issue Detail Mini App
 *
 * Purpose: Display full details of a single issue
 * Version: v0.1.6
 */

class IssueDetail extends HTMLElement {

    static get appId()    { return 'issue-detail'; }
    static get navLabel() { return 'Issue Detail'; }
    static get navIcon()  { return '📄'; }

    constructor() {
        super();
        this.state = {
            issueId: null,
            issue: null,
            labels: [],
            loading: false,
            error: null
        };

        // Listen for navigation events
        this._onNavigateToIssue = this._onNavigateToIssue.bind(this);
    }

    connectedCallback() {
        this.events.on('navigate-to-issue', this._onNavigateToIssue);
        this.render();
    }

    disconnectedCallback() {
        this.events.off('navigate-to-issue', this._onNavigateToIssue);
    }

    _onNavigateToIssue(data) {
        if (data.id) {
            this.loadIssue(data.id);
        }
    }

    async onActivate() {
        // If we have an issue ID, load it
        if (this.state.issueId && !this.state.issue) {
            await this.loadIssue(this.state.issueId);
        }
    }

    onDeactivate() {}

    async loadIssue(issueId) {
        this.state.issueId = issueId;
        this.state.loading = true;
        this.state.error = null;
        this.render();

        try {
            const [issue, labels] = await Promise.all([
                this.issueService.getIssue(issueId),
                this.issueService.getLabels()
            ]);

            this.state.issue = issue;
            this.state.labels = labels;
            this.state.loading = false;

        } catch (error) {
            this.state.error = error.message;
            this.state.loading = false;
        }

        this.render();
    }

    render() {
        if (this.state.loading) {
            this.innerHTML = `
                <style>${this.getStyles()}</style>
                <div class="issue-detail">
                    <div class="id-loading">Loading issue...</div>
                </div>
            `;
            return;
        }

        if (this.state.error) {
            this.innerHTML = `
                <style>${this.getStyles()}</style>
                <div class="issue-detail">
                    <div class="id-error">${this.escapeHtml(this.state.error)}</div>
                </div>
            `;
            return;
        }

        if (!this.state.issue) {
            this.innerHTML = `
                <style>${this.getStyles()}</style>
                <div class="issue-detail">
                    <div class="id-empty">
                        <div class="id-empty-icon">📋</div>
                        <div class="id-empty-title">No Issue Selected</div>
                        <div class="id-empty-text">Select an issue from the Kanban board to view details.</div>
                        <button class="id-btn id-btn-primary" id="go-to-kanban">Go to Kanban Board</button>
                    </div>
                </div>
            `;
            this.querySelector('#go-to-kanban')?.addEventListener('click', () => {
                this.router.navigate('kanban-board');
            });
            return;
        }

        const issue = this.state.issue;
        const checklistDone = issue.checklist?.filter(c => c.done).length || 0;
        const checklistTotal = issue.checklist?.length || 0;

        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="issue-detail">
                <div class="id-header">
                    <button class="id-back" id="id-back">← Back to Board</button>
                </div>

                <div class="id-content">
                    <div class="id-main">
                        <div class="id-title-row">
                            <span class="id-issue-id">${issue.id.replace('issue-', 'ISS-')}</span>
                            <h1 class="id-title">${this.escapeHtml(issue.title)}</h1>
                        </div>

                        <div class="id-meta">
                            <span class="id-status id-status-${issue.status}">${this.formatStatus(issue.status)}</span>
                            ${issue.labels?.map(label => {
                                const labelDef = this.state.labels.find(l => l.name === label);
                                const color = labelDef?.color || '#6b7280';
                                return `<span class="id-label" style="background: ${color}">${label}</span>`;
                            }).join('') || ''}
                            ${issue.targetVersion ? `
                                <span class="id-version">🎯 ${issue.targetVersion}</span>
                            ` : ''}
                        </div>

                        <div class="id-section">
                            <h3>Description</h3>
                            <div class="id-description">
                                ${this.markdown.parse(issue.description || 'No description provided.')}
                            </div>
                        </div>

                        ${issue.checklist && issue.checklist.length > 0 ? `
                            <div class="id-section">
                                <h3>Checklist <span class="id-checklist-count">${checklistDone}/${checklistTotal}</span></h3>
                                <div class="id-checklist">
                                    ${issue.checklist.map(item => `
                                        <div class="id-checklist-item ${item.done ? 'done' : ''}">
                                            <span class="id-checkbox">${item.done ? '☑' : '☐'}</span>
                                            <span class="id-checklist-text">${this.escapeHtml(item.item)}</span>
                                        </div>
                                    `).join('')}
                                </div>
                                <div class="id-progress">
                                    <div class="id-progress-bar" style="width: ${checklistTotal > 0 ? (checklistDone / checklistTotal * 100) : 0}%"></div>
                                </div>
                            </div>
                        ` : ''}

                        ${issue.comments && issue.comments.length > 0 ? `
                            <div class="id-section">
                                <h3>Comments</h3>
                                <div class="id-comments">
                                    ${issue.comments.map(comment => `
                                        <div class="id-comment">
                                            <div class="id-comment-header">
                                                <span class="id-comment-author ${comment.author}">${comment.author}</span>
                                                <span class="id-comment-time">${this.formatTime(comment.timestamp)}</span>
                                            </div>
                                            <div class="id-comment-text">${this.escapeHtml(comment.text)}</div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}
                    </div>

                    <div class="id-sidebar">
                        <div class="id-sidebar-section">
                            <h4>Details</h4>
                            <div class="id-detail-row">
                                <span class="id-detail-label">Created</span>
                                <span class="id-detail-value">${this.formatDate(issue.created)}</span>
                            </div>
                            <div class="id-detail-row">
                                <span class="id-detail-label">Updated</span>
                                <span class="id-detail-value">${this.formatDate(issue.updated)}</span>
                            </div>
                            <div class="id-detail-row">
                                <span class="id-detail-label">Target</span>
                                <span class="id-detail-value">${issue.targetVersion || 'None'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.querySelector('#id-back')?.addEventListener('click', () => {
            this.router.navigate('kanban-board');
        });
    }

    formatStatus(status) {
        return status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    formatDate(dateStr) {
        if (!dateStr) return 'Unknown';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    formatTime(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    }

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getStyles() {
        return `
            .issue-detail {
                height: 100%;
                background: #1a1a2e;
                color: #e0e0e0;
                display: flex;
                flex-direction: column;
            }

            .id-header {
                padding: 12px 20px;
                border-bottom: 1px solid #2a3f5f;
                background: #1e2746;
            }

            .id-back {
                background: none;
                border: none;
                color: #8a9cc4;
                cursor: pointer;
                font-size: 13px;
                padding: 4px 0;
            }

            .id-back:hover {
                color: #e94560;
            }

            .id-content {
                flex: 1;
                display: flex;
                overflow: hidden;
            }

            .id-main {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
            }

            .id-sidebar {
                width: 280px;
                background: #1e2746;
                border-left: 1px solid #2a3f5f;
                padding: 20px;
                overflow-y: auto;
            }

            .id-title-row {
                margin-bottom: 16px;
            }

            .id-issue-id {
                font-size: 12px;
                color: #8a9cc4;
                font-weight: 600;
            }

            .id-title {
                margin: 4px 0 0 0;
                font-size: 24px;
                font-weight: 600;
                color: #fff;
            }

            .id-meta {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
                align-items: center;
                margin-bottom: 24px;
            }

            .id-status {
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
            }

            .id-status-backlog { background: #3a4f6f; color: #a0b0c0; }
            .id-status-todo { background: #1e3a5f; color: #64b5f6; }
            .id-status-in-progress { background: #4a148c; color: #ce93d8; }
            .id-status-review { background: #e65100; color: #ffcc80; }
            .id-status-done { background: #1b5e20; color: #81c784; }

            .id-label {
                padding: 3px 8px;
                border-radius: 3px;
                font-size: 11px;
                font-weight: 500;
                color: #fff;
            }

            .id-version {
                font-size: 12px;
                color: #8a9cc4;
            }

            .id-section {
                margin-bottom: 24px;
            }

            .id-section h3 {
                font-size: 14px;
                font-weight: 600;
                color: #a0b0c0;
                margin: 0 0 12px 0;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            .id-description {
                background: #252836;
                padding: 16px;
                border-radius: 6px;
                line-height: 1.6;
            }

            .id-description p {
                margin: 0 0 12px 0;
            }

            .id-description p:last-child {
                margin-bottom: 0;
            }

            .id-checklist-count {
                font-size: 12px;
                color: #6a7a8a;
                font-weight: normal;
            }

            .id-checklist {
                background: #252836;
                border-radius: 6px;
                padding: 8px;
            }

            .id-checklist-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 8px;
                border-radius: 4px;
            }

            .id-checklist-item:hover {
                background: rgba(255, 255, 255, 0.05);
            }

            .id-checklist-item.done .id-checklist-text {
                text-decoration: line-through;
                color: #6a7a8a;
            }

            .id-checkbox {
                font-size: 16px;
                color: #8a9cc4;
            }

            .id-checklist-item.done .id-checkbox {
                color: #22c55e;
            }

            .id-progress {
                height: 4px;
                background: #3a4f6f;
                border-radius: 2px;
                margin-top: 12px;
                overflow: hidden;
            }

            .id-progress-bar {
                height: 100%;
                background: #22c55e;
                transition: width 0.3s;
            }

            .id-comments {
                display: flex;
                flex-direction: column;
                gap: 12px;
            }

            .id-comment {
                background: #252836;
                padding: 12px;
                border-radius: 6px;
            }

            .id-comment-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .id-comment-author {
                font-weight: 600;
                font-size: 12px;
            }

            .id-comment-author.human {
                color: #64b5f6;
            }

            .id-comment-author.claude-code {
                color: #ce93d8;
            }

            .id-comment-time {
                font-size: 11px;
                color: #6a7a8a;
            }

            .id-comment-text {
                font-size: 13px;
                line-height: 1.5;
            }

            .id-sidebar-section {
                margin-bottom: 20px;
            }

            .id-sidebar-section h4 {
                font-size: 11px;
                font-weight: 600;
                color: #6a7a8a;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 0 0 12px 0;
            }

            .id-detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #2a3f5f;
            }

            .id-detail-label {
                font-size: 12px;
                color: #8a9cc4;
            }

            .id-detail-value {
                font-size: 12px;
                color: #e0e0e0;
            }

            .id-loading, .id-error {
                padding: 40px;
                text-align: center;
            }

            .id-error {
                color: #e94560;
            }

            .id-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                padding: 40px;
                text-align: center;
            }

            .id-empty-icon {
                font-size: 48px;
                margin-bottom: 16px;
            }

            .id-empty-title {
                font-size: 18px;
                font-weight: 600;
                color: #fff;
                margin-bottom: 8px;
            }

            .id-empty-text {
                color: #8a9cc4;
                margin-bottom: 20px;
            }

            .id-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
            }

            .id-btn-primary {
                background: #e94560;
                color: white;
            }

            .id-btn-primary:hover {
                background: #d63850;
            }
        `;
    }

    get events() { return window.workbench.events; }
    get router() { return window.workbench.router; }
    get issueService() { return window.workbench.issues; }
    get markdown() { return window.workbench.markdown; }
}

customElements.define('issue-detail', IssueDetail);
