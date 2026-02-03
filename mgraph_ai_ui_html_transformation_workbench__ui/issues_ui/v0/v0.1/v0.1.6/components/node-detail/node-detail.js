/**
 * Node Detail Override - v0.1.6
 *
 * Purpose: Add child issue support for recursive issue model (Phase 1)
 *          + Dynamic link types filtering by source type
 * Version: v0.1.6
 *
 * U3: "Convert to Parent" button - enables child issues for an issue
 * U4: "Add Child Issue" button and child issues list
 *
 * Changes:
 * - Add child issues section after description
 * - Show "Convert to Parent" button when has_issues is false
 * - Show child issues list and "Add Child Issue" button when has_issues is true
 * - Modal form for creating child issues
 * - Filter relationship verbs based on source type (uses LinkTypesService)
 */

(function() {
    'use strict';

    // Make sure NodeDetail exists
    if (typeof NodeDetail === 'undefined') {
        console.error('[v0.1.6] NodeDetail class not found!');
        return;
    }

    console.log('[v0.1.6] Initializing NodeDetail override (Child Issues support)...');

    // Store the v0.1.5 render method
    const _v015Render = NodeDetail.prototype.render;
    const _v015GetStyles = NodeDetail.prototype.getStyles;
    const _v015LoadNode = NodeDetail.prototype.loadNode;

    // Add child issues state
    const _originalConstructor = NodeDetail.prototype.constructor;

    // Extend loadNode to also fetch child issues
    NodeDetail.prototype.loadNode = async function(label) {
        // Call original loadNode
        await _v015LoadNode.call(this, label);

        // After loading node, fetch child issues if applicable
        if (this.state.node && !this.state.loading) {
            await this._loadChildIssues();
        }
    };

    // Load child issues for current node
    NodeDetail.prototype._loadChildIssues = async function() {
        if (!this.state.node) return;

        // Initialize child issues state if not present
        if (!this.state.childIssues) {
            this.state.childIssues = [];
        }
        if (this.state.childIssuesLoading === undefined) {
            this.state.childIssuesLoading = false;
        }

        // Get the path for this node (construct from label)
        const nodeType = this.graphService.parseTypeFromLabel(this.state.node.label);
        const nodePath = `data/${nodeType}/${this.state.node.label}`;

        try {
            this.state.childIssuesLoading = true;
            const children = await window.issuesApp.childIssuesService.listChildren(nodePath);
            this.state.childIssues = children || [];
            this.state.childIssuesLoading = false;

            // Check if has_issues by seeing if we got children or if there's an issues folder
            // For now, we'll rely on the API response - if we got a successful response,
            // we assume the issues/ folder exists
            if (children && children.length >= 0) {
                this.state.hasIssuesFolder = true;
            }
        } catch (error) {
            console.warn('[v0.1.6] Failed to load child issues:', error);
            this.state.childIssues = [];
            this.state.childIssuesLoading = false;
            this.state.hasIssuesFolder = false;
        }

        this.render();
    };

    // Override render to add child issues section
    NodeDetail.prototype.render = function() {
        // Call v0.1.5 render first
        _v015Render.call(this);

        // If we have a valid node, inject child issues section
        if (this.state.node && !this.state.loading && !this.state.error) {
            this._injectChildIssuesSection();
        }
    };

    // Inject child issues section after description
    NodeDetail.prototype._injectChildIssuesSection = function() {
        const mainContent = this.querySelector('.nd-main');
        if (!mainContent) return;

        // Check if already injected
        if (mainContent.querySelector('.nd-child-issues-section')) return;

        // Find the description section to insert after it
        const sections = mainContent.querySelectorAll('.nd-section');
        const descriptionSection = sections[0]; // First section is description

        if (!descriptionSection) return;

        // Create the child issues section
        const childIssuesSection = document.createElement('div');
        childIssuesSection.className = 'nd-section nd-child-issues-section';

        const hasIssuesFolder = this.state.hasIssuesFolder;
        const childIssues = this.state.childIssues || [];
        const isLoading = this.state.childIssuesLoading;

        childIssuesSection.innerHTML = `
            <h3>
                Child Issues
                ${hasIssuesFolder ? `
                    <button class="nd-btn nd-btn-small nd-btn-add-child" id="nd-add-child">+ Add Child</button>
                ` : `
                    <button class="nd-btn nd-btn-small nd-btn-convert" id="nd-convert-parent">Convert to Parent</button>
                `}
            </h3>
            <div class="nd-child-issues-content">
                ${isLoading ? `
                    <div class="nd-child-loading">Loading child issues...</div>
                ` : hasIssuesFolder ? `
                    ${childIssues.length > 0 ? `
                        <div class="nd-child-list">
                            ${childIssues.map(child => this._renderChildIssue(child)).join('')}
                        </div>
                    ` : `
                        <div class="nd-no-children">
                            <span class="nd-no-children-text">No child issues yet.</span>
                            <span class="nd-no-children-hint">Click "+ Add Child" to create one.</span>
                        </div>
                    `}
                ` : `
                    <div class="nd-no-issues-folder">
                        <span class="nd-no-issues-text">This issue doesn't support child issues yet.</span>
                        <span class="nd-no-issues-hint">Click "Convert to Parent" to enable nested issues.</span>
                    </div>
                `}
            </div>
        `;

        // Insert after description section
        descriptionSection.insertAdjacentElement('afterend', childIssuesSection);

        // Attach event handlers for child issues
        this._attachChildIssuesHandlers();
    };

    // Render a single child issue item
    NodeDetail.prototype._renderChildIssue = function(child) {
        const nodeType = child.nodeType || this.graphService.parseTypeFromLabel(child.label);
        const typeConfig = window.issuesApp.nodeTypes[nodeType] || {};
        const statusClass = child.status ? `status-${child.status.replace(/\s+/g, '-')}` : '';

        return `
            <div class="nd-child-item" data-path="${child.path}" data-label="${child.label}">
                <span class="nd-child-icon" style="color: ${typeConfig.color || '#6b7280'}">
                    ${typeConfig.icon || '📄'}
                </span>
                <span class="nd-child-label">${child.label}</span>
                <span class="nd-child-title">${this.escapeHtml(child.title || '')}</span>
                <span class="nd-child-status ${statusClass}">${this.formatStatus(child.status || '')}</span>
            </div>
        `;
    };

    // Attach event handlers for child issues
    NodeDetail.prototype._attachChildIssuesHandlers = function() {
        const self = this;

        // Convert to Parent button (U3)
        const convertBtn = this.querySelector('#nd-convert-parent');
        if (convertBtn && !convertBtn._v016Attached) {
            convertBtn._v016Attached = true;
            convertBtn.addEventListener('click', async () => {
                await self._convertToParent();
            });
        }

        // Add Child button (U4)
        const addChildBtn = this.querySelector('#nd-add-child');
        if (addChildBtn && !addChildBtn._v016Attached) {
            addChildBtn._v016Attached = true;
            addChildBtn.addEventListener('click', () => {
                self._showAddChildModal();
            });
        }

        // Child item click to navigate
        this.querySelectorAll('.nd-child-item').forEach(item => {
            if (!item._v016Attached) {
                item._v016Attached = true;
                item.addEventListener('click', () => {
                    const label = item.dataset.label;
                    if (label) {
                        self.loadNode(label);
                    }
                });
            }
        });
    };

    // Convert issue to parent (U3)
    NodeDetail.prototype._convertToParent = async function() {
        if (!this.state.node) return;

        const nodeType = this.graphService.parseTypeFromLabel(this.state.node.label);
        const nodePath = `data/${nodeType}/${this.state.node.label}`;

        // Confirm conversion
        const confirmed = await window.issuesApp.messages.confirm(
            `Enable child issues for ${this.state.node.label}? This will create an issues/ folder.`,
            {
                title: 'Convert to Parent',
                confirmLabel: 'Convert',
                cancelLabel: 'Cancel',
                confirmStyle: 'primary'
            }
        );

        if (!confirmed) return;

        try {
            const result = await window.issuesApp.childIssuesService.convertToParent(nodePath);

            if (result.success) {
                window.issuesApp.messages.success(
                    `${this.state.node.label} can now have child issues`,
                    { duration: 3000 }
                );

                // Update state and re-render
                this.state.hasIssuesFolder = true;
                this.state.childIssues = [];

                // Remove and re-inject the section
                const section = this.querySelector('.nd-child-issues-section');
                if (section) section.remove();
                this._injectChildIssuesSection();
            } else {
                window.issuesApp.messages.error(
                    result.error || 'Failed to convert issue',
                    { duration: 5000 }
                );
            }
        } catch (error) {
            window.issuesApp.messages.error(
                `Failed to convert: ${error.message}`,
                { duration: 5000 }
            );
        }
    };

    // Show add child modal (U4)
    NodeDetail.prototype._showAddChildModal = function() {
        this.state.showAddChildModal = true;
        this.state.addChildForm = {
            issueType: 'task',
            title: '',
            description: '',
            status: ''
        };
        this._renderAddChildModal();
    };

    // Close add child modal
    NodeDetail.prototype._closeAddChildModal = function() {
        this.state.showAddChildModal = false;
        const modal = document.querySelector('.nd-add-child-modal-overlay');
        if (modal) modal.remove();
    };

    // Render add child modal
    NodeDetail.prototype._renderAddChildModal = function() {
        // Remove existing modal if any
        const existing = document.querySelector('.nd-add-child-modal-overlay');
        if (existing) existing.remove();

        // Get available types dynamically from API-loaded types
        const nodeTypes = window.issuesApp.nodeTypes || {};
        // Use all available types (no hardcoded filter)
        const typeOptions = Object.keys(nodeTypes);

        const form = this.state.addChildForm || {};

        // Set default type to first available if current type not in list
        if (!typeOptions.includes(form.issueType) && typeOptions.length > 0) {
            form.issueType = typeOptions[0];
        }

        const modalHtml = `
            <div class="nd-add-child-modal-overlay" id="nd-add-child-overlay">
                <div class="nd-add-child-modal">
                    <div class="nd-modal-header">
                        <h3>Add Child Issue to ${this.state.node.label}</h3>
                        <button class="nd-modal-close" id="nd-add-child-close">&times;</button>
                    </div>
                    <div class="nd-modal-body">
                        <div class="nd-form-group">
                            <label>Type *</label>
                            <select class="nd-select" id="nd-child-type">
                                ${typeOptions.map(type => {
                                    const config = nodeTypes[type] || {};
                                    return `<option value="${type}" ${form.issueType === type ? 'selected' : ''}>
                                        ${config.icon || ''} ${type.charAt(0).toUpperCase() + type.slice(1)}
                                    </option>`;
                                }).join('')}
                            </select>
                        </div>

                        <div class="nd-form-group">
                            <label>Title *</label>
                            <input type="text" class="nd-input" id="nd-child-title"
                                   placeholder="Enter issue title..."
                                   value="${this.escapeHtml(form.title || '')}">
                        </div>

                        <div class="nd-form-group">
                            <label>Description</label>
                            <textarea class="nd-textarea" id="nd-child-description"
                                      placeholder="Enter description (optional)..."
                                      rows="4">${this.escapeHtml(form.description || '')}</textarea>
                        </div>
                    </div>
                    <div class="nd-modal-footer">
                        <button class="nd-btn nd-btn-secondary" id="nd-add-child-cancel">Cancel</button>
                        <button class="nd-btn nd-btn-primary" id="nd-add-child-create">
                            Create Child Issue
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Append to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Attach modal event handlers
        this._attachAddChildModalHandlers();
    };

    // Attach modal event handlers
    NodeDetail.prototype._attachAddChildModalHandlers = function() {
        const self = this;

        // Close handlers
        document.querySelector('#nd-add-child-overlay')?.addEventListener('click', (e) => {
            if (e.target.id === 'nd-add-child-overlay') self._closeAddChildModal();
        });
        document.querySelector('#nd-add-child-close')?.addEventListener('click', () => self._closeAddChildModal());
        document.querySelector('#nd-add-child-cancel')?.addEventListener('click', () => self._closeAddChildModal());

        // Form field handlers
        document.querySelector('#nd-child-type')?.addEventListener('change', (e) => {
            self.state.addChildForm.issueType = e.target.value;
        });
        document.querySelector('#nd-child-title')?.addEventListener('input', (e) => {
            self.state.addChildForm.title = e.target.value;
        });
        document.querySelector('#nd-child-description')?.addEventListener('input', (e) => {
            self.state.addChildForm.description = e.target.value;
        });

        // Create handler
        document.querySelector('#nd-add-child-create')?.addEventListener('click', async () => {
            await self._createChildIssue();
        });

        // Focus title input
        document.querySelector('#nd-child-title')?.focus();
    };

    // Create child issue
    NodeDetail.prototype._createChildIssue = async function() {
        const form = this.state.addChildForm;

        // Validate
        if (!form.title || form.title.trim().length < 3) {
            window.issuesApp.messages.error('Title must be at least 3 characters', { duration: 3000 });
            return;
        }

        const nodeType = this.graphService.parseTypeFromLabel(this.state.node.label);
        const parentPath = `data/${nodeType}/${this.state.node.label}`;

        // Disable create button
        const createBtn = document.querySelector('#nd-add-child-create');
        if (createBtn) {
            createBtn.disabled = true;
            createBtn.textContent = 'Creating...';
        }

        try {
            const result = await window.issuesApp.childIssuesService.addChild(parentPath, {
                issue_type: form.issueType,
                title: form.title.trim(),
                description: form.description.trim()
            });

            if (result.success) {
                window.issuesApp.messages.success(
                    `Created ${result.label}`,
                    { duration: 3000 }
                );

                // Close modal
                this._closeAddChildModal();

                // Refresh child issues
                await this._loadChildIssues();
            } else {
                window.issuesApp.messages.error(
                    result.error || 'Failed to create child issue',
                    { duration: 5000 }
                );

                // Re-enable button
                if (createBtn) {
                    createBtn.disabled = false;
                    createBtn.textContent = 'Create Child Issue';
                }
            }
        } catch (error) {
            window.issuesApp.messages.error(
                `Failed to create: ${error.message}`,
                { duration: 5000 }
            );

            // Re-enable button
            if (createBtn) {
                createBtn.disabled = false;
                createBtn.textContent = 'Create Child Issue';
            }
        }
    };

    // Override getStyles to add child issues styles
    NodeDetail.prototype.getStyles = function() {
        const baseStyles = _v015GetStyles.call(this);

        const v016Styles = `
            /* Child Issues Section (U3, U4) */
            .nd-child-issues-section {
                margin-top: 24px;
            }

            .nd-btn-convert {
                background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
                color: white;
                border: none;
            }
            .nd-btn-convert:hover {
                background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
            }

            .nd-btn-add-child {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                color: white;
                border: none;
            }
            .nd-btn-add-child:hover {
                background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
            }

            .nd-child-issues-content {
                background: #252836;
                padding: 12px;
                border-radius: 6px;
            }

            .nd-child-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .nd-child-item {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 10px 12px;
                background: #1e2746;
                border-radius: 4px;
                cursor: pointer;
                transition: background 0.2s;
            }
            .nd-child-item:hover {
                background: #2a3f5f;
            }

            .nd-child-icon {
                font-size: 14px;
            }

            .nd-child-label {
                font-weight: 600;
                font-size: 12px;
                min-width: 80px;
            }

            .nd-child-title {
                flex: 1;
                font-size: 13px;
                color: #c0c8d0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .nd-child-status {
                font-size: 11px;
                padding: 3px 8px;
                border-radius: 3px;
                background: #3a4f6f;
                color: #a0b0c0;
                text-transform: capitalize;
            }
            .nd-child-status.status-in-progress {
                background: rgba(59, 130, 246, 0.2);
                color: #60a5fa;
            }
            .nd-child-status.status-done {
                background: rgba(34, 197, 94, 0.2);
                color: #4ade80;
            }
            .nd-child-status.status-backlog {
                background: rgba(107, 114, 128, 0.2);
                color: #9ca3af;
            }

            .nd-child-loading {
                text-align: center;
                color: #8a9cc4;
                padding: 20px;
            }

            .nd-no-children, .nd-no-issues-folder {
                text-align: center;
                padding: 24px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .nd-no-children-text, .nd-no-issues-text {
                color: #8a9cc4;
                font-size: 13px;
            }
            .nd-no-children-hint, .nd-no-issues-hint {
                color: #6a7a8a;
                font-size: 12px;
            }

            /* Add Child Modal */
            .nd-add-child-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1100;
            }

            .nd-add-child-modal {
                background: #1e2746;
                border-radius: 8px;
                width: 500px;
                max-width: 90vw;
                max-height: 80vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            }

            .nd-textarea {
                width: 100%;
                padding: 10px 12px;
                border: 1px solid #3a4f6f;
                border-radius: 4px;
                background: #252836;
                color: #e0e0e0;
                font-size: 13px;
                font-family: inherit;
                resize: vertical;
                min-height: 80px;
            }
            .nd-textarea:focus {
                outline: none;
                border-color: #e94560;
            }

            /* Form hints for link modal */
            .nd-form-hint {
                font-size: 11px;
                color: #8a9cc4;
                margin-top: 6px;
            }
            .nd-form-hint-error {
                color: #f87171;
            }
        `;

        return baseStyles + v016Styles;
    };

    // ═══════════════════════════════════════════════════════════════════════════════
    // Link Types Filtering - Filter verbs based on source type
    // ═══════════════════════════════════════════════════════════════════════════════

    // Store original renderLinkModal
    const _originalRenderLinkModal = NodeDetail.prototype.renderLinkModal;

    // Override renderLinkModal to filter verbs by source type
    NodeDetail.prototype.renderLinkModal = function() {
        // Get the source type from the current node
        const sourceType = this.graphService.parseTypeFromLabel(this.state.node?.label || '');

        // Get valid verbs for this source type using the LinkTypesService
        let verbOptions = [];
        if (window.issuesApp.linkTypesService && window.issuesApp.linkTypesService.isInitialized) {
            verbOptions = window.issuesApp.linkTypesService.getVerbsForSourceType(sourceType);
        } else {
            // Fallback to original behavior if service not ready
            const linkTypes = window.issuesApp.linkTypes || {};
            verbOptions = Object.keys(linkTypes).filter(v => !this.isInverseVerb(v));
        }

        // If current verb selection is not valid, reset to first valid option
        if (verbOptions.length > 0 && !verbOptions.includes(this.state.linkModalVerb)) {
            this.state.linkModalVerb = verbOptions[0];
        }

        // Build the modal HTML with filtered verbs
        const linkTypes = window.issuesApp.linkTypes || {};

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
                                ${verbOptions.length > 0 ? verbOptions.map(verb => {
                                    const config = linkTypes[verb] || {};
                                    const description = config.description ? ` - ${config.description}` : '';
                                    return `
                                        <option value="${verb}" ${this.state.linkModalVerb === verb ? 'selected' : ''}>
                                            ${verb}${description}
                                        </option>
                                    `;
                                }).join('') : `
                                    <option value="" disabled>No valid relationships for ${sourceType}</option>
                                `}
                            </select>
                            ${verbOptions.length === 0 ? `
                                <div class="nd-form-hint nd-form-hint-error">
                                    No relationship types are configured for ${sourceType} issues.
                                </div>
                            ` : ''}
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
                                    const typeConfig = window.issuesApp.nodeTypes[nodeType] || {};
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
                                ${!this.state.linkModalTarget || verbOptions.length === 0 ? 'disabled' : ''}>
                            Create Link
                        </button>
                    </div>
                </div>
            </div>
        `;
    };

    // Override showLinkModal to set the first valid verb as default
    const _originalShowLinkModal = NodeDetail.prototype.showLinkModal;
    NodeDetail.prototype.showLinkModal = function() {
        this.state.showLinkModal = true;
        this.state.linkModalSearch = '';
        this.state.linkModalResults = [];
        this.state.linkModalTarget = null;

        // Get valid verbs for current source type
        const sourceType = this.graphService.parseTypeFromLabel(this.state.node?.label || '');
        let verbOptions = [];
        if (window.issuesApp.linkTypesService && window.issuesApp.linkTypesService.isInitialized) {
            verbOptions = window.issuesApp.linkTypesService.getVerbsForSourceType(sourceType);
        }

        // Set default verb to first valid option, or 'relates-to' as fallback
        this.state.linkModalVerb = verbOptions.length > 0 ? verbOptions[0] : 'relates-to';

        this.render();
    };

    console.log('[Issues UI v0.1.6] Node Detail patched: U3 Convert to Parent, U4 Child Issues, Link Type Filtering');

})();
