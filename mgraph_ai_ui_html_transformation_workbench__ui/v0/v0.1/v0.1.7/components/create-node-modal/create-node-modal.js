/**
 * Create Node Modal Component
 *
 * Purpose: Modal dialog for creating new nodes (bugs, tasks, features, people)
 * Version: v0.1.7
 *
 * Provides a form to create new nodes with type-specific fields.
 */

class CreateNodeModal extends HTMLElement {

    constructor() {
        super();
        this.state = {
            visible: false,
            nodeType: 'task',
            title: '',
            description: '',
            tags: '',
            status: null,
            creating: false,
            error: null
        };

        this._onShowModal = this._onShowModal.bind(this);
    }

    connectedCallback() {
        this.events.on('show-create-modal', this._onShowModal);
        this.render();
    }

    disconnectedCallback() {
        this.events.off('show-create-modal', this._onShowModal);
    }

    _onShowModal(data) {
        this.state.visible = true;
        this.state.nodeType = data?.defaultType || 'task';
        this.state.title = '';
        this.state.description = '';
        this.state.tags = '';
        this.state.status = null;
        this.state.error = null;
        this.render();

        // Focus on title input
        setTimeout(() => {
            this.querySelector('#cnm-title')?.focus();
        }, 100);
    }

    close() {
        this.state.visible = false;
        this.render();
    }

    async create() {
        if (!this.state.title.trim()) {
            this.state.error = 'Title is required';
            this.render();
            return;
        }

        this.state.creating = true;
        this.state.error = null;
        this.render();

        try {
            // Prepare node data
            const data = {
                node_type: this.state.nodeType,
                title: this.state.title.trim(),
                description: this.state.description.trim() || null
            };

            // Add tags if provided
            if (this.state.tags.trim()) {
                data.tags = this.state.tags.split(',').map(t => t.trim()).filter(t => t);
            }

            // Add status if different from default
            if (this.state.status) {
                data.status = this.state.status;
            }

            const response = await this.graphService.createNode(data);

            if (response.success) {
                // Navigate to the new node
                this.events.emit('navigate-to-node', { label: response.node.label });
                this.close();
                this.router.navigate('node-detail');
            } else {
                this.state.error = response.message || 'Failed to create node';
                this.state.creating = false;
                this.render();
            }
        } catch (error) {
            this.state.error = error.message;
            this.state.creating = false;
            this.render();
        }
    }

    render() {
        if (!this.state.visible) {
            this.innerHTML = '';
            return;
        }

        const nodeTypes = window.workbench.nodeTypes;
        const currentTypeConfig = nodeTypes[this.state.nodeType];
        const statuses = this.graphService.getStatusesForType(this.state.nodeType);
        const defaultStatus = statuses[0];

        this.innerHTML = `
            <style>${this.getStyles()}</style>
            <div class="cnm-overlay" id="cnm-overlay">
                <div class="cnm-modal">
                    <div class="cnm-header">
                        <h3>Create New ${this.capitalize(this.state.nodeType)}</h3>
                        <button class="cnm-close" id="cnm-close">&times;</button>
                    </div>

                    <div class="cnm-body">
                        ${this.state.error ? `
                            <div class="cnm-error">${this.escapeHtml(this.state.error)}</div>
                        ` : ''}

                        <div class="cnm-form-group">
                            <label>Type</label>
                            <div class="cnm-type-selector">
                                ${Object.entries(nodeTypes).map(([type, config]) => `
                                    <button class="cnm-type-btn ${this.state.nodeType === type ? 'active' : ''}"
                                            data-type="${type}"
                                            style="--type-color: ${config.color}">
                                        ${config.icon} ${this.capitalize(type)}
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div class="cnm-form-group">
                            <label>Title <span class="cnm-required">*</span></label>
                            <input type="text" class="cnm-input" id="cnm-title"
                                   placeholder="Enter a title..."
                                   value="${this.escapeHtml(this.state.title)}">
                        </div>

                        <div class="cnm-form-group">
                            <label>Description</label>
                            <textarea class="cnm-textarea" id="cnm-description"
                                      placeholder="Describe the issue... (Markdown supported)"
                                      rows="4">${this.escapeHtml(this.state.description)}</textarea>
                        </div>

                        <div class="cnm-form-row">
                            <div class="cnm-form-group cnm-form-half">
                                <label>Status</label>
                                <select class="cnm-select" id="cnm-status">
                                    ${statuses.map(status => `
                                        <option value="${status}"
                                                ${(this.state.status || defaultStatus) === status ? 'selected' : ''}>
                                            ${this.formatStatus(status)}
                                        </option>
                                    `).join('')}
                                </select>
                            </div>

                            <div class="cnm-form-group cnm-form-half">
                                <label>Tags</label>
                                <input type="text" class="cnm-input" id="cnm-tags"
                                       placeholder="tag1, tag2, ..."
                                       value="${this.escapeHtml(this.state.tags)}">
                            </div>
                        </div>
                    </div>

                    <div class="cnm-footer">
                        <button class="cnm-btn cnm-btn-secondary" id="cnm-cancel">Cancel</button>
                        <button class="cnm-btn cnm-btn-primary" id="cnm-create"
                                ${this.state.creating ? 'disabled' : ''}>
                            ${this.state.creating ? 'Creating...' : `Create ${this.capitalize(this.state.nodeType)}`}
                        </button>
                    </div>
                </div>
            </div>
        `;

        this.attachEventHandlers();
    }

    attachEventHandlers() {
        // Close on overlay click
        this.querySelector('#cnm-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'cnm-overlay') {
                this.close();
            }
        });

        // Close button
        this.querySelector('#cnm-close')?.addEventListener('click', () => {
            this.close();
        });

        // Cancel button
        this.querySelector('#cnm-cancel')?.addEventListener('click', () => {
            this.close();
        });

        // Type selector
        this.querySelectorAll('.cnm-type-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.nodeType = btn.dataset.type;
                this.state.status = null; // Reset status when type changes
                this.render();
            });
        });

        // Input fields
        this.querySelector('#cnm-title')?.addEventListener('input', (e) => {
            this.state.title = e.target.value;
        });

        this.querySelector('#cnm-description')?.addEventListener('input', (e) => {
            this.state.description = e.target.value;
        });

        this.querySelector('#cnm-status')?.addEventListener('change', (e) => {
            this.state.status = e.target.value;
        });

        this.querySelector('#cnm-tags')?.addEventListener('input', (e) => {
            this.state.tags = e.target.value;
        });

        // Create button
        this.querySelector('#cnm-create')?.addEventListener('click', () => {
            this.create();
        });

        // Enter key on title
        this.querySelector('#cnm-title')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.create();
            }
        });

        // Escape key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.state.visible) {
                this.close();
            }
        }, { once: true });
    }

    capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
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
            .cnm-overlay {
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

            .cnm-modal {
                background: #1e2746;
                border-radius: 8px;
                width: 520px;
                max-width: 90vw;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
            }

            .cnm-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 16px 20px;
                border-bottom: 1px solid #2a3f5f;
            }

            .cnm-header h3 {
                margin: 0;
                font-size: 16px;
                color: #fff;
            }

            .cnm-close {
                background: none;
                border: none;
                color: #8a9cc4;
                font-size: 24px;
                cursor: pointer;
                padding: 0;
                line-height: 1;
            }

            .cnm-close:hover {
                color: #e94560;
            }

            .cnm-body {
                padding: 20px;
                overflow-y: auto;
            }

            .cnm-footer {
                padding: 16px 20px;
                border-top: 1px solid #2a3f5f;
                display: flex;
                justify-content: flex-end;
                gap: 10px;
            }

            .cnm-error {
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid #ef4444;
                color: #ef4444;
                padding: 10px 14px;
                border-radius: 4px;
                margin-bottom: 16px;
                font-size: 13px;
            }

            .cnm-form-group {
                margin-bottom: 16px;
            }

            .cnm-form-group label {
                display: block;
                font-size: 12px;
                font-weight: 600;
                color: #8a9cc4;
                margin-bottom: 6px;
            }

            .cnm-required {
                color: #e94560;
            }

            .cnm-form-row {
                display: flex;
                gap: 16px;
            }

            .cnm-form-half {
                flex: 1;
            }

            .cnm-type-selector {
                display: flex;
                gap: 8px;
                flex-wrap: wrap;
            }

            .cnm-type-btn {
                padding: 8px 14px;
                border: 1px solid #3a4f6f;
                border-radius: 4px;
                background: transparent;
                color: #a0b0c0;
                font-size: 13px;
                cursor: pointer;
                transition: all 0.15s;
            }

            .cnm-type-btn:hover {
                background: rgba(255, 255, 255, 0.05);
                border-color: #4a5f7f;
            }

            .cnm-type-btn.active {
                background: var(--type-color, #3a4f6f);
                border-color: var(--type-color, #3a4f6f);
                color: white;
            }

            .cnm-input, .cnm-select, .cnm-textarea {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #3a4f6f;
                border-radius: 4px;
                background: #252836;
                color: #e0e0e0;
                font-size: 13px;
                font-family: inherit;
            }

            .cnm-textarea {
                resize: vertical;
                min-height: 80px;
            }

            .cnm-input:focus, .cnm-select:focus, .cnm-textarea:focus {
                outline: none;
                border-color: #e94560;
            }

            .cnm-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 4px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.15s;
            }

            .cnm-btn-primary {
                background: #e94560;
                color: white;
            }

            .cnm-btn-primary:hover:not(:disabled) {
                background: #d63850;
            }

            .cnm-btn-primary:disabled {
                background: #3a4f6f;
                cursor: not-allowed;
            }

            .cnm-btn-secondary {
                background: #3a4f6f;
                color: #e0e0e0;
            }

            .cnm-btn-secondary:hover {
                background: #4a5f7f;
            }
        `;
    }

    get events() { return window.workbench.events; }
    get router() { return window.workbench.router; }
    get graphService() { return window.workbench.graph; }
}

customElements.define('create-node-modal', CreateNodeModal);
