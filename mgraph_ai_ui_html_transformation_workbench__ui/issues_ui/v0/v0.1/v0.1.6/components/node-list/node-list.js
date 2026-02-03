/**
 * Node List Override - v0.1.6
 *
 * Purpose: Add tree view for nested issues (U5)
 * Version: v0.1.6
 *
 * U5: Tree view for nested issues (P3)
 * - Toggle between List View and Tree View
 * - Tree view with expand/collapse functionality
 * - Lazy loading of children
 * - Tree lines showing hierarchy (├─, └─, │)
 */

(function() {
    'use strict';

    // Make sure NodeList exists
    if (typeof NodeList === 'undefined') {
        console.error('[v0.1.6] NodeList class not found!');
        return;
    }

    console.log('[v0.1.6] Initializing NodeList override (Tree View)...');

    // Store original methods
    const _originalRender = NodeList.prototype.render;
    const _originalGetStyles = NodeList.prototype.getStyles;

    // Add tree view state to constructor behavior
    const _ensureTreeState = function(instance) {
        if (instance.state.viewMode === undefined) {
            instance.state.viewMode = 'list'; // 'list' or 'tree'
        }
        if (instance.state.expandedNodes === undefined) {
            instance.state.expandedNodes = new Set();
        }
        if (instance.state.childrenCache === undefined) {
            instance.state.childrenCache = new Map();
        }
        if (instance.state.loadingChildren === undefined) {
            instance.state.loadingChildren = new Set();
        }
    };

    // Override render to add view mode toggle and tree view
    NodeList.prototype.render = function() {
        _ensureTreeState(this);

        // Call original render first
        _originalRender.call(this);

        // Add view mode toggle to toolbar
        this._injectViewModeToggle();

        // If in tree view mode, replace table with tree
        if (this.state.viewMode === 'tree' && !this.state.loading && !this.state.error) {
            this._renderTreeView();
        }
    };

    // Inject view mode toggle button
    NodeList.prototype._injectViewModeToggle = function() {
        const toolbar = this.querySelector('.nl-toolbar');
        if (!toolbar) return;

        // Check if already injected
        if (toolbar.querySelector('.nl-view-toggle')) return;

        const toggleHtml = `
            <div class="nl-view-toggle">
                <button class="nl-view-btn ${this.state.viewMode === 'list' ? 'active' : ''}"
                        data-view="list" title="List View">
                    <span class="nl-view-icon">☰</span>
                </button>
                <button class="nl-view-btn ${this.state.viewMode === 'tree' ? 'active' : ''}"
                        data-view="tree" title="Tree View">
                    <span class="nl-view-icon">🌳</span>
                </button>
            </div>
        `;

        // Insert before the "+ New" button
        const createBtn = toolbar.querySelector('#nl-create');
        if (createBtn) {
            createBtn.insertAdjacentHTML('beforebegin', toggleHtml);
        } else {
            toolbar.insertAdjacentHTML('beforeend', toggleHtml);
        }

        // Attach toggle handlers
        toolbar.querySelectorAll('.nl-view-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const newMode = btn.dataset.view;
                if (newMode !== this.state.viewMode) {
                    this.state.viewMode = newMode;
                    this.render();
                }
            });
        });
    };

    // Render tree view
    NodeList.prototype._renderTreeView = function() {
        const content = this.querySelector('.nl-content');
        if (!content) return;

        const filteredNodes = this.getFilteredNodes();

        // Build tree HTML
        const treeHtml = `
            <div class="nl-tree">
                ${filteredNodes.length === 0 ? `
                    <div class="nl-empty">
                        <div class="nl-empty-icon">📭</div>
                        <div class="nl-empty-title">No items found</div>
                        <div class="nl-empty-text">Try adjusting your filters or create a new item.</div>
                    </div>
                ` : `
                    <div class="nl-tree-container">
                        ${filteredNodes.map((node, index) =>
                            this._renderTreeNode(node, 0, index === filteredNodes.length - 1)
                        ).join('')}
                    </div>
                    <div class="nl-footer">
                        Showing ${filteredNodes.length} root items
                    </div>
                `}
            </div>
        `;

        content.innerHTML = treeHtml;

        // Attach tree event handlers
        this._attachTreeHandlers();
    };

    // Render a single tree node
    NodeList.prototype._renderTreeNode = function(node, depth, isLast, parentPath = '') {
        const nodeType = this.graphService.parseTypeFromLabel(node.label);
        const typeConfig = window.issuesApp.nodeTypes[nodeType] || {};
        const nodePath = node.path || `data/${nodeType}/${node.label}`;

        const isExpanded = this.state.expandedNodes.has(node.label);
        const isLoading = this.state.loadingChildren.has(node.label);
        const children = this.state.childrenCache.get(node.label) || [];
        const hasChildren = node.has_issues || node.hasIssues || children.length > 0;

        // Build tree line prefix
        const prefix = this._buildTreePrefix(depth, isLast);

        // Determine expand/collapse icon
        let expandIcon = '';
        if (hasChildren || isLoading) {
            if (isLoading) {
                expandIcon = '<span class="nl-tree-spinner">◌</span>';
            } else if (isExpanded) {
                expandIcon = '<span class="nl-tree-toggle" data-action="collapse">▼</span>';
            } else {
                expandIcon = '<span class="nl-tree-toggle" data-action="expand">▶</span>';
            }
        } else {
            expandIcon = '<span class="nl-tree-toggle-placeholder"></span>';
        }

        const html = `
            <div class="nl-tree-node" data-label="${node.label}" data-path="${nodePath}" data-depth="${depth}">
                <div class="nl-tree-row">
                    <span class="nl-tree-prefix">${prefix}</span>
                    ${expandIcon}
                    <span class="nl-tree-icon" style="color: ${typeConfig.color || '#6b7280'}">
                        ${typeConfig.icon || '📄'}
                    </span>
                    <span class="nl-tree-label" style="color: ${typeConfig.color || '#e0e0e0'}">
                        ${node.label}
                    </span>
                    <span class="nl-tree-title">${this.escapeHtml(node.title || '')}</span>
                    <span class="nl-tree-status nl-status-${node.status || 'backlog'}">
                        ${this.formatStatus(node.status || '')}
                    </span>
                </div>
                ${isExpanded && children.length > 0 ? `
                    <div class="nl-tree-children">
                        ${children.map((child, idx) =>
                            this._renderTreeNode(child, depth + 1, idx === children.length - 1, nodePath)
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        return html;
    };

    // Build tree prefix (│, ├─, └─)
    NodeList.prototype._buildTreePrefix = function(depth, isLast) {
        if (depth === 0) return '';

        let prefix = '';
        for (let i = 0; i < depth - 1; i++) {
            prefix += '<span class="nl-tree-line">│</span>';
        }
        prefix += isLast ? '<span class="nl-tree-branch">└─</span>' : '<span class="nl-tree-branch">├─</span>';
        return prefix;
    };

    // Attach tree event handlers
    NodeList.prototype._attachTreeHandlers = function() {
        const self = this;

        // Toggle expand/collapse
        this.querySelectorAll('.nl-tree-toggle').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                const node = toggle.closest('.nl-tree-node');
                const label = node?.dataset.label;
                const path = node?.dataset.path;
                const action = toggle.dataset.action;

                if (!label) return;

                if (action === 'expand') {
                    self._expandNode(label, path);
                } else {
                    self._collapseNode(label);
                }
            });
        });

        // Click on row to navigate
        this.querySelectorAll('.nl-tree-row').forEach(row => {
            row.addEventListener('click', (e) => {
                // Don't navigate if clicking the toggle
                if (e.target.closest('.nl-tree-toggle')) return;

                const node = row.closest('.nl-tree-node');
                const label = node?.dataset.label;
                if (label) {
                    self.events.emit('navigate-to-node', { label });
                    self.router.navigate('node-detail');
                }
            });
        });
    };

    // Expand a node and load children
    NodeList.prototype._expandNode = async function(label, path) {
        // Mark as expanded
        this.state.expandedNodes.add(label);

        // Check if children already cached
        if (this.state.childrenCache.has(label)) {
            this.render();
            return;
        }

        // Load children
        this.state.loadingChildren.add(label);
        this.render();

        try {
            const children = await window.issuesApp.childIssuesService.listChildren(path);
            this.state.childrenCache.set(label, children || []);
        } catch (error) {
            console.warn('[v0.1.6] Failed to load children for', label, error);
            this.state.childrenCache.set(label, []);
        } finally {
            this.state.loadingChildren.delete(label);
        }

        this.render();
    };

    // Collapse a node
    NodeList.prototype._collapseNode = function(label) {
        this.state.expandedNodes.delete(label);
        this.render();
    };

    // Override getStyles to add tree view styles
    NodeList.prototype.getStyles = function() {
        const baseStyles = _originalGetStyles.call(this);

        const treeStyles = `
            /* View Mode Toggle */
            .nl-view-toggle {
                display: flex;
                border: 1px solid #3a4f6f;
                border-radius: 4px;
                overflow: hidden;
                margin-right: 10px;
            }

            .nl-view-btn {
                background: transparent;
                border: none;
                padding: 6px 12px;
                color: #8a9cc4;
                cursor: pointer;
                font-size: 14px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .nl-view-btn:not(:last-child) {
                border-right: 1px solid #3a4f6f;
            }

            .nl-view-btn:hover {
                background: rgba(255, 255, 255, 0.05);
            }

            .nl-view-btn.active {
                background: #3a4f6f;
                color: #fff;
            }

            .nl-view-icon {
                font-size: 14px;
            }

            /* Tree View */
            .nl-tree {
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .nl-tree-container {
                flex: 1;
                overflow-y: auto;
                padding: 12px 0;
            }

            .nl-tree-node {
                user-select: none;
            }

            .nl-tree-row {
                display: flex;
                align-items: center;
                padding: 8px 16px;
                cursor: pointer;
                gap: 6px;
                min-height: 36px;
            }

            .nl-tree-row:hover {
                background: rgba(233, 69, 96, 0.1);
            }

            .nl-tree-prefix {
                display: flex;
                color: #4a5f7f;
                font-family: monospace;
                font-size: 14px;
            }

            .nl-tree-line {
                width: 20px;
                text-align: center;
            }

            .nl-tree-branch {
                width: 20px;
                text-align: center;
                margin-right: 2px;
            }

            .nl-tree-toggle {
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 10px;
                color: #8a9cc4;
                cursor: pointer;
                border-radius: 3px;
                flex-shrink: 0;
            }

            .nl-tree-toggle:hover {
                background: rgba(255, 255, 255, 0.1);
                color: #fff;
            }

            .nl-tree-toggle-placeholder {
                width: 16px;
                flex-shrink: 0;
            }

            .nl-tree-spinner {
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: #8a9cc4;
                animation: nl-spin 1s linear infinite;
                flex-shrink: 0;
            }

            @keyframes nl-spin {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
            }

            .nl-tree-icon {
                font-size: 14px;
                flex-shrink: 0;
            }

            .nl-tree-label {
                font-weight: 600;
                font-size: 12px;
                min-width: 80px;
                flex-shrink: 0;
            }

            .nl-tree-title {
                flex: 1;
                font-size: 13px;
                color: #c0c8d0;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
            }

            .nl-tree-status {
                font-size: 10px;
                padding: 2px 8px;
                border-radius: 3px;
                text-transform: capitalize;
                flex-shrink: 0;
            }

            .nl-tree-children {
                margin-left: 0;
            }

            /* Tree depth indentation through prefix spans */
            .nl-tree-node[data-depth="1"] .nl-tree-row { padding-left: 16px; }
            .nl-tree-node[data-depth="2"] .nl-tree-row { padding-left: 16px; }
            .nl-tree-node[data-depth="3"] .nl-tree-row { padding-left: 16px; }
            .nl-tree-node[data-depth="4"] .nl-tree-row { padding-left: 16px; }
        `;

        return baseStyles + treeStyles;
    };

    // Listen for types-loaded event to re-render type filter buttons
    const _originalConnectedCallback = NodeList.prototype.connectedCallback;
    NodeList.prototype.connectedCallback = function() {
        if (_originalConnectedCallback) {
            _originalConnectedCallback.call(this);
        }

        // Add types-loaded listener
        if (window.issuesApp.events && !this._v016TypesListener) {
            this._v016TypesListener = () => {
                console.log('[v0.1.6] Types loaded, re-rendering Node List');
                this.render();
            };
            window.issuesApp.events.on('types-loaded', this._v016TypesListener);
        }
    };

    const _originalDisconnectedCallback = NodeList.prototype.disconnectedCallback;
    NodeList.prototype.disconnectedCallback = function() {
        if (window.issuesApp.events && this._v016TypesListener) {
            window.issuesApp.events.off('types-loaded', this._v016TypesListener);
            this._v016TypesListener = null;
        }

        if (_originalDisconnectedCallback) {
            _originalDisconnectedCallback.call(this);
        }
    };

    console.log('[Issues UI v0.1.6] Node List patched: U5 Tree View, Dynamic Types');

})();
