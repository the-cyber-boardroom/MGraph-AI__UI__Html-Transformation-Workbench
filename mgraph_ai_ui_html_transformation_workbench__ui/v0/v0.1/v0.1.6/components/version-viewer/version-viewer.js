/**
 * Version Viewer Mini App
 *
 * Purpose: Display version information, README, and related issues
 * Version: v0.1.6
 */

const VERSIONS = [
    { id: 'v0.1.6', label: 'v0.1.6 - Issue Tracking', date: '2026-01-29' },
    { id: 'v0.1.5', label: 'v0.1.5 - Automation', date: '2026-01-29' },
    { id: 'v0.1.4', label: 'v0.1.4 - Bug Fixes', date: '2026-01-29' },
    { id: 'v0.1.3', label: 'v0.1.3 - Docs Viewer', date: '2026-01-29' },
    { id: 'v0.1.2', label: 'v0.1.2 - UI Improvements', date: '2026-01-29' },
    { id: 'v0.1.1', label: 'v0.1.1 - Analysis Components', date: '2026-01-29' },
    { id: 'v0.1.0', label: 'v0.1.0 - Base Implementation', date: '2026-01-28' }
];

class VersionViewer extends HTMLElement {

    static get appId()    { return 'version-viewer'; }
    static get navLabel() { return 'Version Info'; }
    static get navIcon()  { return '📦'; }

    constructor() {
        super();
        this.state = {
            selectedVersion: 'v0.1.6',
            issues: [],
            loading: false,
            error: null
        };
    }

    connectedCallback() {
        this.render();
    }

    disconnectedCallback() {}

    async onActivate() {
        await this.loadVersionIssues();
    }

    onDeactivate() {}

    async loadVersionIssues() {
        this.state.loading = true;
        this.state.error = null;
        this.render();

        try {
            const issues = await this.issueService.getIssuesByVersion(this.state.selectedVersion);
            this.state.issues = issues;
            this.state.loading = false;
        } catch (error) {
            this.state.error = error.message;
            this.state.loading = false;
        }

        this.render();
    }

    render() {
        const version = VERSIONS.find(v => v.id === this.state.selectedVersion) || VERSIONS[0];

        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="version-viewer">
                <div class="vv-header">
                    <h2>Version Information</h2>
                    <select class="vv-select" id="vv-version-select">
                        ${VERSIONS.map(v => `
                            <option value="${v.id}" ${v.id === this.state.selectedVersion ? 'selected' : ''}>
                                ${v.label}
                            </option>
                        `).join('')}
                    </select>
                </div>

                <div class="vv-content">
                    <div class="vv-main">
                        <div class="vv-version-card">
                            <div class="vv-version-header">
                                <span class="vv-version-id">${version.id}</span>
                                <span class="vv-version-date">${version.date}</span>
                            </div>
                            <div class="vv-version-title">${version.label.split(' - ')[1] || 'Release'}</div>
                        </div>

                        ${this.renderReleaseNotes()}

                        <div class="vv-section">
                            <h3>Issues in this Release</h3>
                            ${this.state.loading ? `
                                <div class="vv-loading">Loading issues...</div>
                            ` : this.state.issues.length === 0 ? `
                                <div class="vv-empty">No issues targeted for this version.</div>
                            ` : `
                                <div class="vv-issues">
                                    ${this.state.issues.map(issue => `
                                        <div class="vv-issue" data-id="${issue.id}">
                                            <span class="vv-issue-status vv-status-${issue.status}">
                                                ${this.getStatusIcon(issue.status)}
                                            </span>
                                            <span class="vv-issue-id">${issue.id.replace('issue-', 'ISS-')}</span>
                                            <span class="vv-issue-title">${this.escapeHtml(issue.title)}</span>
                                            <span class="vv-issue-status-label">${issue.status}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            `}
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.attachEventHandlers();
    }

    renderReleaseNotes() {
        const notes = {
            'v0.1.6': `
## v0.1.6 - Issue Tracking System

### Features
- **Kanban Board**: Visual issue management with status columns
- **Issue Detail View**: Full issue information with checklist and comments
- **Left Navigation**: Reorganized navigation with collapsible sections
- **Markdown Parser**: Shared service for rendering markdown content
- **Issue Service**: Load and manage issues from JSON files

### Changes
- Replaced top navigation with left sidebar
- Added resizable panels
- New Admin section for issue management
            `,
            'v0.1.5': `
## v0.1.5 - Automation Runner

### Features
- **Automation Runner**: Run predefined UI test scenarios
- New sidebar tab for automation controls
- Built-in scenarios for common workflows
- Support for custom JSON scenarios
            `,
            'v0.1.4': `
## v0.1.4 - Bug Fixes

### Fixes
- Docs Viewer now fetches from files.json
- Site Browser uses correct API endpoint
- API Explorer includes credentials
- Hide request body for GET requests
            `,
            'v0.1.3': `
## v0.1.3 - Documentation Viewer

### Features
- Hardcoded file tree for documentation
- Browse dev-briefs and stories
            `,
            'v0.1.2': `
## v0.1.2 - UI Improvements

### Features
- Darker theme
- Resizable debug sidebar
- Documentation viewer mini app
- Version switcher
            `,
            'v0.1.1': `
## v0.1.1 - Analysis Components

### Features
- Page Analysis mini app
- Site Analysis mini app
- Shared components: HTML Editor, Graph Visualizer, Transform Config
            `,
            'v0.1.0': `
## v0.1.0 - Base Implementation

### Features
- Core shell and routing
- Event bus service
- API client service
- Basic mini apps: HTML Workbench, Site Browser, Profile Manager, API Explorer
            `
        };

        const markdown = notes[this.state.selectedVersion] || '## Release Notes\n\nNo release notes available.';

        return `
            <div class="vv-section">
                <h3>Release Notes</h3>
                <div class="vv-release-notes">
                    ${this.markdown.parse(markdown)}
                </div>
            </div>
        `;
    }

    getStatusIcon(status) {
        const icons = {
            'backlog': '📋',
            'todo': '📝',
            'in-progress': '🔄',
            'review': '👀',
            'done': '✅'
        };
        return icons[status] || '📋';
    }

    attachEventHandlers() {
        this.querySelector('#vv-version-select')?.addEventListener('change', (e) => {
            this.state.selectedVersion = e.target.value;
            this.loadVersionIssues();
        });

        this.querySelectorAll('.vv-issue').forEach(issue => {
            issue.addEventListener('click', () => {
                const issueId = issue.dataset.id;
                this.events.emit('navigate-to-issue', { id: issueId });
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
            .version-viewer {
                height: 100%;
                background: #1a1a2e;
                color: #e0e0e0;
                display: flex;
                flex-direction: column;
            }

            .vv-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 16px 20px;
                border-bottom: 1px solid #2a3f5f;
                background: #1e2746;
            }

            .vv-header h2 {
                margin: 0;
                font-size: 18px;
                font-weight: 600;
                color: #fff;
            }

            .vv-select {
                padding: 8px 12px;
                border: 1px solid #3a4f6f;
                border-radius: 4px;
                background: #252836;
                color: #e0e0e0;
                font-size: 13px;
                cursor: pointer;
            }

            .vv-content {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
            }

            .vv-version-card {
                background: linear-gradient(135deg, #e94560 0%, #c73e54 100%);
                border-radius: 8px;
                padding: 20px;
                margin-bottom: 24px;
            }

            .vv-version-header {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .vv-version-id {
                font-size: 14px;
                font-weight: 600;
                color: rgba(255, 255, 255, 0.9);
            }

            .vv-version-date {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
            }

            .vv-version-title {
                font-size: 24px;
                font-weight: 600;
                color: #fff;
            }

            .vv-section {
                margin-bottom: 24px;
            }

            .vv-section h3 {
                font-size: 14px;
                font-weight: 600;
                color: #a0b0c0;
                margin: 0 0 12px 0;
            }

            .vv-release-notes {
                background: #1e2746;
                border-radius: 8px;
                padding: 20px;
                line-height: 1.6;
            }

            .vv-release-notes h2 {
                font-size: 18px;
                color: #fff;
                margin: 0 0 16px 0;
            }

            .vv-release-notes h3 {
                font-size: 14px;
                color: #e94560;
                margin: 16px 0 8px 0;
            }

            .vv-release-notes ul {
                margin: 0;
                padding-left: 20px;
            }

            .vv-release-notes li {
                margin-bottom: 4px;
            }

            .vv-release-notes strong {
                color: #fff;
            }

            .vv-issues {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .vv-issue {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px;
                background: #1e2746;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.15s;
            }

            .vv-issue:hover {
                background: #252e4a;
            }

            .vv-issue-status {
                font-size: 14px;
            }

            .vv-issue-id {
                font-size: 11px;
                color: #8a9cc4;
                font-weight: 600;
                width: 60px;
            }

            .vv-issue-title {
                flex: 1;
                font-size: 13px;
            }

            .vv-issue-status-label {
                font-size: 11px;
                padding: 2px 8px;
                border-radius: 3px;
                background: #3a4f6f;
                color: #a0b0c0;
            }

            .vv-loading, .vv-empty {
                padding: 20px;
                text-align: center;
                color: #8a9cc4;
                background: #1e2746;
                border-radius: 6px;
            }
        `;
    }

    get events() { return window.workbench.events; }
    get router() { return window.workbench.router; }
    get issueService() { return window.workbench.issues; }
    get markdown() { return window.workbench.markdown; }
}

customElements.define('version-viewer', VersionViewer);
