/**
 * Node Detail Component
 *
 * Purpose: Display full details of a single node with links management
 * Version: v0.1.7
 *
 * Shows node details, allows status changes, and manages relationships.
 */

class NodeDetail extends HTMLElement {

    static get appId()    { return 'node-detail'; }
    static get navLabel() { return 'Node Detail'; }
    static get navIcon()  { return '📄'; }

    constructor() {
        super();
        this.state = {
            label: null,
            node: null,
            links: [],
            loading: false,
            error: null,
            showLinkModal: false,
            linkModalSearch: '',
            linkModalVerb: 'relates-to',
            linkModalResults: []
        };

        this._onNavigateToNode = this._onNavigateToNode.bind(this);
    }

    connectedCallback() {
        this.events.on('navigate-to-node', this._onNavigateToNode);
        this.render();
    }

    disconnectedCallback() {
        this.events.off('navigate-to-node', this._onNavigateToNode);
    }

    _onNavigateToNode(data) {
        if (data.label) {
            this.loadNode(data.label);
        }
    }

    async onActivate() {
        if (this.state.label && !this.state.node) {
            await this.loadNode(this.state.label);
        }
    }

    onDeactivate() {}

    async loadNode(label) {
        this.state.label = label;
        this.state.loading = true;
        this.state.error = null;
        this.render();

        try {
            const [node, linksResponse] = await Promise.all([
                this.graphService.getNode(label),
                this.graphService.listLinks(label)
            ]);

            this.state.node = node;
            this.state.links = linksResponse.links || [];
            this.state.loading = false;
        } catch (error) {
            this.state.error = error.message;
            this.state.loading = false;
        }

        this.render();
    }

    async updateStatus(newStatus) {
        try {
            const response = await this.graphService.updateNode(this.state.label, {
                status: newStatus
            });

            if (response.success) {
                this.state.node = response.node;
                this.render();
            }
        } catch (error) {
            alert('Failed to update status: ' + error.message);
        }
    }

    async deleteLink(targetLabel) {
        if (!confirm(`Remove link to ${targetLabel}?`)) return;

        try {
            const response = await this.graphService.deleteLink(this.state.label, targetLabel);
            if (response.success) {
                // Reload links
                const linksResponse = await this.graphService.listLinks(this.state.label);
                this.state.links = linksResponse.links || [];
                this.render();
            }
        } catch (error) {
            alert('Failed to delete link: ' + error.message);
        }
    }

    async createLink() {
        const verb = this.state.linkModalVerb;
        const targetLabel = this.state.linkModalTarget;

        if (!targetLabel) {
            alert('Please select a target node');
            return;
        }

        try {
            const response = await this.graphService.createLink(this.state.label, verb, targetLabel);
            if (response.success) {
                // Reload links
                const linksResponse = await this.graphService.listLinks(this.state.label);
                this.state.links = linksResponse.links || [];
                this.closeLinkModal();
            }
        } catch (error) {
            alert('Failed to create link: ' + error.message);
        }
    }

    async searchNodes(query) {
        if (!query || query.length < 2) {
            this.state.linkModalResults = [];
            this.render();
            return;
        }

        try {
            const response = await this.graphService.listNodes();
            const nodes = response.nodes || [];

            // Filter by search query and exclude self
            const results = nodes.filter(n =>
                n.label !== this.state.label &&
                (n.title?.toLowerCase().includes(query.toLowerCase()) ||
                 n.label?.toLowerCase().includes(query.toLowerCase()))
            ).slice(0, 10);

            this.state.linkModalResults = results;
            this.render();
        } catch (error) {
            console.error('Search failed:', error);
        }
    }

    showLinkModal() {
        this.state.showLinkModal = true;
        this.state.linkModalSearch = '';
        this.state.linkModalVerb = 'relates-to';
        this.state.linkModalResults = [];
        this.state.linkModalTarget = null;
        this.render();
    }

    closeLinkModal() {
        this.state.showLinkModal = false;
        this.render();
    }

    render() {
        if (this.state.loading) {
            this.innerHTML = `
                <style>${this.getStyles()}</style>
                <div class="node-detail">
                    <div class="nd-loading">Loading node...</div>
                </div>
            `;
            return;
        }

        if (this.state.error) {
            this.innerHTML = `
                <style>${this.getStyles()}</style>
                <div class="node-detail">
                    <div class="nd-error">${this.escapeHtml(this.state.error)}</div>
                </div>
            `;
            return;
        }

        if (!this.state.node) {
            this.innerHTML = `
                <style>${this.getStyles()}</style>
                <div class="node-detail">
                    <div class="nd-empty">
                        <div class="nd-empty-icon">📋</div>
                        <div class="nd-empty-title">No Item Selected</div>
                        <div class="nd-empty-text">Select an item from the list to view details.</div>
                        <button class="nd-btn nd-btn-primary" id="go-to-list">Go to Issues List</button>
                    </div>
                </div>
            `;
            this.querySelector('#go-to-list')?.addEventListener('click', () => {
                this.router.navigate('node-list');
            });
            return;
        }

        const node = this.state.node;
        const nodeType = this.graphService.parseTypeFromLabel(node.label);
        const typeConfig = window.workbench.nodeTypes[nodeType] || {};
        const validStatuses = this.graphService.getStatusesForType(nodeType);
        const linkTypes = window.workbench.linkTypes;

        // Group links by direction
        const outgoingLinks = this.state.links.filter(l => !this.isInverseVerb(l.verb));
        const incomingLinks = this.state.links.filter(l => this.isInverseVerb(l.verb));

        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="node-detail">
                <div class="nd-header">
                    <button class="nd-back" id="nd-back">Back to List</button>
                    <div class="nd-actions">
                        <button class="nd-btn nd-btn-danger" id="nd-delete">Delete</button>
                    </div>
                </div>

                <div class="nd-content">
                    <div class="nd-main">
                        <div class="nd-title-row">
                            <span class="nd-label-badge" style="background: ${typeConfig.color || '#6b7280'}">
                                ${typeConfig.icon || '📄'} ${node.label}
                            </span>
                            <h1 class="nd-title">${this.escapeHtml(node.title || '')}</h1>
                        </div>

                        <div class="nd-meta">
                            <div class="nd-status-section">
                                <label>Status</label>
                                <select class="nd-status-select" id="nd-status">
                                    ${validStatuses.map(status => `
                                        <option value="${status}" ${node.status === status ? 'selected' : ''}>
                                            ${this.formatStatus(status)}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>

                            ${node.tags && node.tags.length > 0 ? `
                                <div class="nd-tags">
                                    ${node.tags.map(tag => `
                                        <span class="nd-tag">${this.escapeHtml(tag)}</span>
                                    `).join('')}
                                </div>
                            ` : ''}
                        </div>

                        <div class="nd-section">
                            <h3>Description</h3>
                            <div class="nd-description">
                                ${this.markdown.parse(node.description || 'No description provided.')}
                            </div>
                        </div>

                        ${node.properties && Object.keys(node.properties).length > 0 ? `
                            <div class="nd-section">
                                <h3>Properties</h3>
                                <div class="nd-properties">
                                    ${Object.entries(node.properties).map(([key, value]) => `
                                        <div class="nd-property">
                                            <span class="nd-property-key">${this.escapeHtml(key)}</span>
                                            <span class="nd-property-value">${this.escapeHtml(String(value))}</span>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                        ` : ''}

                        <div class="nd-section">
                            <h3>
                                Relationships
                                <button class="nd-btn nd-btn-small" id="nd-add-link">+ Add Link</button>
                            </h3>
                            <div class="nd-links">
                                ${outgoingLinks.length > 0 ? `
                                    <div class="nd-link-group">
                                        <div class="nd-link-group-title">Outgoing</div>
                                        ${outgoingLinks.map(link => this.renderLink(link)).join('')}
                                    </div>
                                ` : ''}

                                ${incomingLinks.length > 0 ? `
                                    <div class="nd-link-group">
                                        <div class="nd-link-group-title">Incoming</div>
                                        ${incomingLinks.map(link => this.renderLink(link)).join('')}
                                    </div>
                                ` : ''}

                                ${this.state.links.length === 0 ? `
                                    <div class="nd-no-links">No relationships yet.</div>
                                ` : ''}
                            </div>
                        </div>
                    </div>

                    <div class="nd-sidebar">
                        <div class="nd-sidebar-section">
                            <h4>Details</h4>
                            <div class="nd-detail-row">
                                <span class="nd-detail-label">Type</span>
                                <span class="nd-detail-value">${this.capitalize(nodeType)}</span>
                            </div>
                            <div class="nd-detail-row">
                                <span class="nd-detail-label">Created</span>
                                <span class="nd-detail-value">${this.formatDate(node.created_at)}</span>
                            </div>
                            <div class="nd-detail-row">
                                <span class="nd-detail-label">Updated</span>
                                <span class="nd-detail-value">${this.formatDate(node.updated_at)}</span>
                            </div>
                            <div class="nd-detail-row">
                                <span class="nd-detail-label">ID</span>
                                <span class="nd-detail-value nd-mono">${node.node_id || '-'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            ${this.state.showLinkModal ? this.renderLinkModal() : ''}
        `;

        this.attachEventHandlers();
    }

    renderLink(link) {
        const targetType = this.graphService.parseTypeFromLabel(link.target_label);
        const targetConfig = window.workbench.nodeTypes[targetType] || {};

        return `
            <div class="nd-link" data-target="${link.target_label}">
                <span class="nd-link-verb">${link.verb}</span>
                <span class="nd-link-arrow">&rarr;</span>
                <span class="nd-link-target" style="color: ${targetConfig.color || '#e0e0e0'}">
                    ${targetConfig.icon || ''} ${link.target_label}
                </span>
                <button class="nd-link-delete" data-target="${link.target_label}" title="Remove link">&times;</button>
            </div>
        `;
    }

    renderLinkModal() {
        const linkTypes = window.workbench.linkTypes;
        const verbOptions = Object.keys(linkTypes).filter(v => !this.isInverseVerb(v));

        return `
            <div class="nd-modal-overlay" id="nd-modal-overlay">
                <div class="nd-modal">
                    <div class="nd-modal-header">
                        <h3>Add Relationship</h3>
                        <button class="nd-modal-close" id="nd-modal-close">&times;</button>
                    </div>
                    <div class="nd-modal-body">
                        <div class="nd-form-group">
                            <label>Relationship Type</label>
                            <select class="nd-select" id="nd-link-verb">
                                ${verbOptions.map(verb => `
                                    <option value="${verb}" ${this.state.linkModalVerb === verb ? 'selected' : ''}>
                                        ${verb}
                                    </option>
                                `).join('')}
                            </select>
                            <div class="nd-form-hint">
                                ${linkTypes[this.state.linkModalVerb]?.description || ''}
                            </div>
                        </div>

                        <div class="nd-form-group">
                            <label>Target Node</label>
                            <input type="text" class="nd-input" id="nd-link-search"
                                   placeholder="Search by title or label..."
                                   value="${this.escapeHtml(this.state.linkModalSearch)}">
                        </div>

                        ${this.state.linkModalResults.length > 0 ? `
                            <div class="nd-search-results">
                                ${this.state.linkModalResults.map(node => {
                                    const nodeType = this.graphService.parseTypeFromLabel(node.label);
                                    const typeConfig = window.workbench.nodeTypes[nodeType] || {};
                                    const isSelected = this.state.linkModalTarget === node.label;
                                    return `
                                        <div class="nd-search-result ${isSelected ? 'selected' : ''}"
                                             data-label="${node.label}">
                                            <span class="nd-result-label" style="color: ${typeConfig.color}">
                                                ${typeConfig.icon || ''} ${node.label}
                                            </span>
                                            <span class="nd-result-title">${this.escapeHtml(node.title || '')}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : this.state.linkModalSearch.length >= 2 ? `
                            <div class="nd-no-results">No matching nodes found.</div>
                        ` : ''}
                    </div>
                    <div class="nd-modal-footer">
                        <button class="nd-btn nd-btn-secondary" id="nd-modal-cancel">Cancel</button>
                        <button class="nd-btn nd-btn-primary" id="nd-modal-create"
                                ${!this.state.linkModalTarget ? 'disabled' : ''}>
                            Create Link
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEventHandlers() {
        // Back button
        this.querySelector('#nd-back')?.addEventListener('click', () => {
            this.router.navigate('node-list');
        });

        // Status change
        this.querySelector('#nd-status')?.addEventListener('change', (e) => {
            this.updateStatus(e.target.value);
        });

        // Delete button
        this.querySelector('#nd-delete')?.addEventListener('click', async () => {
            if (!confirm(`Delete ${this.state.node.label}? This cannot be undone.`)) return;

            try {
                const response = await this.graphService.deleteNode(this.state.label);
                if (response.success) {
                    this.router.navigate('node-list');
                }
            } catch (error) {
                alert('Failed to delete: ' + error.message);
            }
        });

        // Add link button
        this.querySelector('#nd-add-link')?.addEventListener('click', () => {
            this.showLinkModal();
        });

        // Delete link buttons
        this.querySelectorAll('.nd-link-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteLink(btn.dataset.target);
            });
        });

        // Link target click - navigate
        this.querySelectorAll('.nd-link').forEach(link => {
            link.addEventListener('click', () => {
                this.loadNode(link.dataset.target);
            });
        });

        // Modal handlers
        this.querySelector('#nd-modal-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'nd-modal-overlay') {
                this.closeLinkModal();
            }
        });

        this.querySelector('#nd-modal-close')?.addEventListener('click', () => {
            this.closeLinkModal();
        });

        this.querySelector('#nd-modal-cancel')?.addEventListener('click', () => {
            this.closeLinkModal();
        });

        this.querySelector('#nd-link-verb')?.addEventListener('change', (e) => {
            this.state.linkModalVerb = e.target.value;
            this.render();
        });

        let searchTimeout;
        this.querySelector('#nd-link-search')?.addEventListener('input', (e) => {
            this.state.linkModalSearch = e.target.value;
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                this.searchNodes(e.target.value);
            }, 300);
        });

        this.querySelectorAll('.nd-search-result').forEach(result => {
            result.addEventListener('click', () => {
                this.state.linkModalTarget = result.dataset.label;
                this.render();
            });
        });

        this.querySelector('#nd-modal-create')?.addEventListener('click', () => {
            this.createLink();
        });
    }

    isInverseVerb(verb) {
        const inverseVerbs = ['blocked-by', 'task-of', 'assignee-of', 'dependency-of'];
        return inverseVerbs.includes(verb);
    }

    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    formatStatus(status) {
        if (!status) return '';
        return status.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    formatDate(dateStr) {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
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
            .node-detail {
                height: 100%;
                background: #1a1a2e;
                color: #e0e0e0;
                display: flex;
                flex-direction: column;
            }

            .nd-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 20px;
                border-bottom: 1px solid #2a3f5f;
                background: #1e2746;
            }

            .nd-back {
                background: none;
                border: none;
                color: #8a9cc4;
                cursor: pointer;
                font-size: 13px;
                padding: 4px 0;
            }

            .nd-back:hover {
                color: #e94560;
            }

            .nd-actions {
                display: flex;
                gap: 8px;
            }

            .nd-btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
            }

            .nd-btn-primary {
                background: #e94560;
                color: white;
            }

            .nd-btn-primary:hover:not(:disabled) {
                background: #d63850;
            }

            .nd-btn-primary:disabled {
                background: #3a4f6f;
                cursor: not-allowed;
            }

            .nd-btn-secondary {
                background: #3a4f6f;
                color: #e0e0e0;
            }

            .nd-btn-secondary:hover {
                background: #4a5f7f;
            }

            .nd-btn-danger {
                background: transparent;
                border: 1px solid #ef4444;
                color: #ef4444;
            }

            .nd-btn-danger:hover {
                background: #ef4444;
                color: white;
            }

            .nd-btn-small {
                padding: 4px 10px;
                font-size: 11px;
                margin-left: 10px;
            }

            .nd-content {
                flex: 1;
                display: flex;
                overflow: hidden;
            }

            .nd-main {
                flex: 1;
                overflow-y: auto;
                padding: 24px;
            }

            .nd-sidebar {
                width: 280px;
                background: #1e2746;
                border-left: 1px solid #2a3f5f;
                padding: 20px;
                overflow-y: auto;
            }

            .nd-title-row {
                margin-bottom: 16px;
            }

            .nd-label-badge {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 4px 10px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
                color: white;
            }

            .nd-title {
                margin: 8px 0 0 0;
                font-size: 24px;
                font-weight: 600;
                color: #fff;
            }

            .nd-meta {
                display: flex;
                gap: 16px;
                align-items: center;
                flex-wrap: wrap;
                margin-bottom: 24px;
            }

            .nd-status-section {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .nd-status-section label {
                font-size: 11px;
                font-weight: 600;
                color: #8a9cc4;
            }

            .nd-status-select {
                padding: 6px 12px;
                border: 1px solid #3a4f6f;
                border-radius: 4px;
                background: #252836;
                color: #e0e0e0;
                font-size: 13px;
                cursor: pointer;
            }

            .nd-tags {
                display: flex;
                gap: 6px;
                flex-wrap: wrap;
            }

            .nd-tag {
                background: #3a4f6f;
                padding: 4px 10px;
                border-radius: 4px;
                font-size: 12px;
            }

            .nd-section {
                margin-bottom: 24px;
            }

            .nd-section h3 {
                font-size: 14px;
                font-weight: 600;
                color: #a0b0c0;
                margin: 0 0 12px 0;
                display: flex;
                align-items: center;
            }

            .nd-description {
                background: #252836;
                padding: 16px;
                border-radius: 6px;
                line-height: 1.6;
            }

            .nd-description p { margin: 0 0 12px 0; }
            .nd-description p:last-child { margin-bottom: 0; }

            .nd-properties {
                background: #252836;
                padding: 12px;
                border-radius: 6px;
            }

            .nd-property {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #2a3f5f;
            }

            .nd-property:last-child {
                border-bottom: none;
            }

            .nd-property-key {
                font-weight: 500;
                color: #8a9cc4;
            }

            .nd-links {
                background: #252836;
                padding: 12px;
                border-radius: 6px;
            }

            .nd-link-group {
                margin-bottom: 12px;
            }

            .nd-link-group:last-child {
                margin-bottom: 0;
            }

            .nd-link-group-title {
                font-size: 11px;
                font-weight: 600;
                color: #6a7a8a;
                text-transform: uppercase;
                margin-bottom: 8px;
            }

            .nd-link {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px;
                border-radius: 4px;
                cursor: pointer;
                margin-bottom: 4px;
            }

            .nd-link:hover {
                background: rgba(255, 255, 255, 0.05);
            }

            .nd-link-verb {
                font-size: 12px;
                color: #8a9cc4;
                min-width: 100px;
            }

            .nd-link-arrow {
                color: #4a5a6a;
            }

            .nd-link-target {
                flex: 1;
                font-weight: 500;
            }

            .nd-link-delete {
                background: none;
                border: none;
                color: #6a7a8a;
                cursor: pointer;
                font-size: 16px;
                padding: 2px 6px;
                border-radius: 3px;
            }

            .nd-link-delete:hover {
                background: #ef4444;
                color: white;
            }

            .nd-no-links {
                text-align: center;
                color: #6a7a8a;
                padding: 12px;
            }

            .nd-sidebar-section {
                margin-bottom: 20px;
            }

            .nd-sidebar-section h4 {
                font-size: 11px;
                font-weight: 600;
                color: #6a7a8a;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin: 0 0 12px 0;
            }

            .nd-detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #2a3f5f;
            }

            .nd-detail-label {
                font-size: 12px;
                color: #8a9cc4;
            }

            .nd-detail-value {
                font-size: 12px;
                color: #e0e0e0;
            }

            .nd-mono {
                font-family: monospace;
                font-size: 10px;
            }

            .nd-loading, .nd-error {
                padding: 60px;
                text-align: center;
            }

            .nd-error { color: #e94560; }

            .nd-empty {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                padding: 40px;
                text-align: center;
            }

            .nd-empty-icon { font-size: 48px; margin-bottom: 16px; }
            .nd-empty-title { font-size: 18px; font-weight: 600; color: #fff; margin-bottom: 8px; }
            .nd-empty-text { color: #8a9cc4; margin-bottom: 20px; }

            /* Modal styles */
            .nd-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
            }

            .nd-modal {
                background: #1e2746;
                border-radius: 8px;
                width: 480px;
                max-width: 90vw;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
            }

            .nd-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #2a3f5f;
            }

            .nd-modal-header h3 {
                margin: 0;
                font-size: 16px;
                color: #fff;
            }

            .nd-modal-close {
                background: none;
                border: none;
                color: #8a9cc4;
                font-size: 24px;
                cursor: pointer;
            }

            .nd-modal-body {
                padding: 20px;
                overflow-y: auto;
            }

            .nd-modal-footer {
                padding: 16px 20px;
                border-top: 1px solid #2a3f5f;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }

            .nd-form-group {
                margin-bottom: 16px;
            }

            .nd-form-group label {
                display: block;
                font-size: 12px;
                font-weight: 600;
                color: #8a9cc4;
                margin-bottom: 6px;
            }

            .nd-form-hint {
                font-size: 11px;
                color: #6a7a8a;
                margin-top: 4px;
            }

            .nd-select, .nd-input {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #3a4f6f;
                border-radius: 4px;
                background: #252836;
                color: #e0e0e0;
                font-size: 13px;
            }

            .nd-select:focus, .nd-input:focus {
                outline: none;
                border-color: #e94560;
            }

            .nd-search-results {
                background: #252836;
                border-radius: 4px;
                max-height: 200px;
                overflow-y: auto;
            }

            .nd-search-result {
                padding: 10px 12px;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                gap: 2px;
                border-bottom: 1px solid #2a3f5f;
            }

            .nd-search-result:last-child {
                border-bottom: none;
            }

            .nd-search-result:hover {
                background: rgba(233, 69, 96, 0.1);
            }

            .nd-search-result.selected {
                background: rgba(233, 69, 96, 0.2);
            }

            .nd-result-label {
                font-weight: 600;
                font-size: 12px;
            }

            .nd-result-title {
                font-size: 12px;
                color: #a0b0c0;
            }

            .nd-no-results {
                text-align: center;
                color: #6a7a8a;
                padding: 20px;
            }
        `;
    }

    get events() { return window.workbench.events; }
    get router() { return window.workbench.router; }
    get graphService() { return window.workbench.graph; }
    get markdown() { return window.workbench.markdown; }
}

customElements.define('node-detail', NodeDetail);
